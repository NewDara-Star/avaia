"""
Avaia GUI Server
Uses Claude Code's --print mode with stream-json for clean output
"""

import json
import os
import subprocess
import sys
import signal
import threading
import time
import uuid
import webbrowser

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'avaia-gui-secret'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Session state
session_id = None
current_process = None
lock = threading.Lock()


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
        socketio.emit('response_complete', {}, room=client_sid)


def send_message(message, client_sid):
    """Send a message to Claude and stream the response"""
    global session_id, current_process

    claude_path = find_claude_code()

    # Load Avaia system prompt from ~/.avaia/system-prompt.md
    prompt_file = os.path.expanduser('~/.avaia/system-prompt.md')
    try:
        with open(prompt_file, 'r') as f:
            avaia_prompt = f.read()
    except:
        avaia_prompt = "You are Avaia, an AI programming tutor. Use the Avaia MCP tools for session management and learning tracking."

    # Build command
    cmd = [
        claude_path,
        '--print',
        '--output-format', 'stream-json',
        '--verbose',
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
    emit('output', {'data': 'Welcome to Avaia! Type a message to start learning.\n\n'})


@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")


@socketio.on('input')
def handle_input(data):
    from flask import request
    message = data.get('message', '').strip()
    if message:
        send_message(message, request.sid)


@socketio.on('restart')
def handle_restart():
    global session_id, current_process

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

    emit('status', {'connected': True, 'restarted': True})
    emit('output', {'data': 'Session restarted. Type a message to begin.\n\n'})


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
