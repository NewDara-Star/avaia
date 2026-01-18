"""
Avaia GUI Server
Uses Claude Code's --print mode with stream-json for clean output
With auto-logging of all messages to chat_message table
"""

import json
import os
import sqlite3
import subprocess
import sys
import signal
import threading
import time
import uuid
import webbrowser
from datetime import datetime

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'avaia-gui-secret'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Session state
session_id = None
current_process = None
lock = threading.Lock()

# Database path (same as MCP server uses)
DB_PATH = os.path.expanduser('~/.avaia/avaia.db')

# Current MCP session ID (set by start_session tool)
current_mcp_session_id = None


def get_db():
    """Get database connection"""
    return sqlite3.connect(DB_PATH)


def auto_log_message(role: str, content: str, tool_calls=None, tool_results=None):
    """
    Automatically log a chat message to the database.
    Zero AI overhead - happens at GUI level.
    """
    global current_mcp_session_id
    
    # Try to get the current MCP session from the database
    if not current_mcp_session_id:
        try:
            db = get_db()
            cursor = db.execute(
                "SELECT id FROM session ORDER BY start_time DESC LIMIT 1"
            )
            row = cursor.fetchone()
            if row:
                current_mcp_session_id = row[0]
            db.close()
        except Exception as e:
            print(f"Warning: Could not get session ID: {e}")
            return
    
    if not current_mcp_session_id:
        return  # No active session, skip logging
    
    try:
        db = get_db()
        msg_id = f"chat_{uuid.uuid4().hex[:16]}"
        timestamp = datetime.utcnow().isoformat() + 'Z'
        
        db.execute(
            """
            INSERT INTO chat_message (
                id, session_id, timestamp, role, content, tool_calls, tool_results
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                msg_id,
                current_mcp_session_id,
                timestamp,
                role,
                content,
                json.dumps(tool_calls) if tool_calls else None,
                json.dumps(tool_results) if tool_results else None,
            )
        )
        db.commit()
        db.close()
        print(f"[AUTO-LOG] {role}: {len(content)} chars")
    except Exception as e:
        print(f"Warning: Failed to log message: {e}")


def find_claude_code():
    """Find the claude executable"""
    try:
        result = subprocess.run(['which', 'claude'], capture_output=True, text=True)
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    return 'claude'


def stream_response(process, client_sid):
    """Stream Claude's response to the client"""
    full_response = ""
    tool_calls_collected = []

    try:
        for line in iter(process.stdout.readline, ''):
            if not line:
                break

            line = line.strip()
            if not line:
                continue

            try:
                data = json.loads(line)
                msg_type = data.get('type', '')

                if msg_type == 'assistant':
                    # Assistant message with content
                    message = data.get('message', {})
                    content_blocks = message.get('content', [])

                    for block in content_blocks:
                        if block.get('type') == 'text':
                            text = block.get('text', '')
                            full_response += text
                            socketio.emit('output', {'data': text}, room=client_sid)
                        elif block.get('type') == 'tool_use':
                            # Collect tool calls
                            tool_calls_collected.append({
                                'tool': block.get('name'),
                                'args': block.get('input', {})
                            })

                elif msg_type == 'content_block_delta':
                    # Streaming delta
                    delta = data.get('delta', {})
                    if delta.get('type') == 'text_delta':
                        text = delta.get('text', '')
                        full_response += text
                        socketio.emit('output', {'data': text}, room=client_sid)

                elif msg_type == 'result':
                    # Final result
                    result_text = data.get('result', '')
                    if result_text and result_text != full_response:
                        # Only emit if different from streamed content
                        remaining = result_text[len(full_response):]
                        if remaining:
                            socketio.emit('output', {'data': remaining}, room=client_sid)

                elif msg_type == 'error':
                    error = data.get('error', {})
                    error_msg = error.get('message', 'Unknown error')
                    socketio.emit('output', {'data': f"\n\nError: {error_msg}"}, room=client_sid)

            except json.JSONDecodeError:
                # Plain text output, just send it
                socketio.emit('output', {'data': line + '\n'}, room=client_sid)

    except Exception as e:
        socketio.emit('output', {'data': f"\n\nStream error: {e}"}, room=client_sid)

    finally:
        process.wait()
        
        # AUTO-LOG: Assistant response (after stream completes)
        if full_response:
            auto_log_message(
                role='assistant',
                content=full_response,
                tool_calls=tool_calls_collected if tool_calls_collected else None
            )
        
        socketio.emit('response_complete', {}, room=client_sid)


def send_message(message, client_sid, learner_id=None, model=None):
    """Send a message to Claude and stream the response"""
    global session_id, current_process

    claude_path = find_claude_code()

    # Map model names to Claude Code model flags
    model_map = {
        'sonnet': 'sonnet',
        'opus': 'opus',
        'haiku': 'haiku'
    }
    selected_model = model_map.get(model, 'sonnet')

    # Load Avaia system prompt from ~/.avaia/system-prompt.md
    prompt_file = os.path.expanduser('~/.avaia/system-prompt.md')
    try:
        with open(prompt_file, 'r') as f:
            avaia_prompt = f.read()
    except:
        avaia_prompt = "You are Avaia, an AI programming tutor. Use the Avaia MCP tools for session management and learning tracking."

    # Inject learner ID into the system prompt if provided
    if learner_id:
        learner_context = f"\n\n## Current Learner\n\nThe current learner's ID is: `{learner_id}`\n\nUse this ID when calling any MCP tools that require a learner_id parameter (start_session, get_project_state, get_hint, etc.).\n"
        avaia_prompt = avaia_prompt + learner_context

    # Build command
    cmd = [
        claude_path,
        '--print',
        '--output-format', 'stream-json',
        '--verbose',
        '--model', selected_model,
        '--permission-mode', 'bypassPermissions',
        '--append-system-prompt', avaia_prompt,
    ]

    # Continue existing session if we have one
    if session_id:
        cmd.extend(['--resume', session_id])
    else:
        # Generate new session ID
        session_id = str(uuid.uuid4())
        cmd.extend(['--session-id', session_id])

    # Add the message
    cmd.append(message)

    try:
        # Start Claude process
        env = os.environ.copy()
        env['TERM'] = 'xterm-256color'

        with lock:
            current_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                env=env,
                cwd=os.path.expanduser('~')
            )

        # Stream response in background thread
        thread = threading.Thread(
            target=stream_response,
            args=(current_process, client_sid),
            daemon=True
        )
        thread.start()

    except Exception as e:
        socketio.emit('output', {'data': f"Error starting Claude: {e}"}, room=client_sid)
        socketio.emit('response_complete', {}, room=client_sid)


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid if 'request' in dir() else 'unknown'}")
    emit('status', {'connected': True})
    # Don't emit output here - let the welcome screen show instead


@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")


@socketio.on('input')
def handle_input(data):
    from flask import request
    message = data.get('message', '').strip()
    learner_id = data.get('learner_id', '').strip()
    model = data.get('model', 'sonnet').strip()
    if message:
        # AUTO-LOG: User message
        auto_log_message(role='user', content=message)
        
        send_message(
            message,
            request.sid,
            learner_id=learner_id if learner_id else None,
            model=model
        )


@socketio.on('end_session')
def handle_end_session(data):
    """Handle ending a session - calls the MCP end_session tool"""
    from flask import request

    learner_id = data.get('learner_id', '').strip()
    session_summary = data.get('session_summary', '')

    if learner_id and session_id:
        # Send a message to Claude to call end_session
        end_message = f"Please call the end_session MCP tool now with learner_id '{learner_id}' and include these session notes: {session_summary}"
        send_message(end_message, request.sid, learner_id=learner_id, model='haiku')

    print(f"Session ended for learner: {learner_id}")


@socketio.on('restart')
def handle_restart():
    global session_id, current_process, current_mcp_session_id

    # Kill current process if running
    with lock:
        if current_process:
            try:
                current_process.terminate()
            except:
                pass
            current_process = None

    # Reset session
    session_id = None
    current_mcp_session_id = None  # Reset so next message picks up new session

    emit('status', {'connected': True, 'restarted': True})


def open_browser():
    time.sleep(1.5)
    webbrowser.open('http://127.0.0.1:5050')


def signal_handler(sig, frame):
    print("\nShutting down...")
    with lock:
        if current_process:
            current_process.terminate()
    sys.exit(0)


if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    threading.Thread(target=open_browser, daemon=True).start()

    print("Starting Avaia GUI on http://127.0.0.1:5050")
    socketio.run(app, host='127.0.0.1', port=5050, debug=False, allow_unsafe_werkzeug=True)
