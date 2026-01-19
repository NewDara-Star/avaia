"""
Avaia GUI - Native macOS App with Embedded WebView
Uses pywebview for native WebKit integration
Flask runs in background, pywebview displays the UI

Usage:
  Development: python server_webview.py
  Package: pyinstaller avaia_webview.spec
"""

import json
import os
import random
import socket
import sqlite3
import subprocess
import sys
import signal
import threading
import time
import uuid
from datetime import datetime, date, timedelta

import anthropic

# Handle PyInstaller paths - MUST be before any local imports
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Add BASE_DIR to path for local module imports in frozen app
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import webview
from flask import Flask, render_template, redirect, request, jsonify
from flask_socketio import SocketIO, emit

# Now import local modules (after path is set)
from setup_wizard import (
    preflight_check, invalidate_preflight_cache, install_claude_cli, configure_avaia_mcp,
    initialize_database, login_claude, set_api_key
)

app = Flask(__name__, 
            template_folder=os.path.join(BASE_DIR, 'templates'),
            static_folder=os.path.join(BASE_DIR, 'static'))
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

# Dynamic port - will be set at startup
SERVER_PORT = None
server_ready = threading.Event()


def find_free_port():
    """Find an available port dynamically"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port


def get_db():
    """Get database connection with optimizations"""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    # Enable WAL mode for better concurrent read performance
    conn.execute("PRAGMA journal_mode=WAL")
    # Increase cache size for better query performance
    conn.execute("PRAGMA cache_size=-64000")  # 64MB cache
    # Reduce synchronous for speed (safe with WAL)
    conn.execute("PRAGMA synchronous=NORMAL")
    return conn


def run_migrations():
    """Run any pending database migrations."""
    import glob as glob_module

    # Find migration files
    migration_paths = [
        os.path.join(BASE_DIR, 'migrations'),  # Bundled migrations (PyInstaller)
        os.path.join(BASE_DIR, '..', 'src', 'server', 'db', 'migrations'),  # Development
        os.path.join(BASE_DIR, '..', 'dist', 'server', 'db', 'migrations'),  # Built package
        os.path.expanduser('~/.avaia/migrations'),  # User-installed migrations
    ]

    # Collect migrations, deduplicate by name (first path wins)
    seen_names = set()
    all_migrations = []
    for mig_path in migration_paths:
        if os.path.exists(mig_path):
            for f in sorted(os.listdir(mig_path)):
                if f.endswith('.sql') and f not in seen_names:
                    seen_names.add(f)
                    all_migrations.append({
                        'name': f,
                        'path': os.path.join(mig_path, f)
                    })

    # Sort by name to ensure correct order
    all_migrations.sort(key=lambda x: x['name'])

    if not all_migrations:
        print("No migration files found")
        return

    try:
        db = get_db()

        # Create migrations table if it doesn't exist
        db.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                name TEXT PRIMARY KEY,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        db.commit()

        # Get applied migrations
        applied = set(row[0] for row in db.execute("SELECT name FROM _migrations").fetchall())

        # Apply pending migrations
        for migration in all_migrations:
            if migration['name'] not in applied:
                print(f"Applying migration: {migration['name']}")
                try:
                    with open(migration['path'], 'r') as f:
                        sql = f.read()

                    # Execute each statement individually to handle partial failures
                    # Split on semicolons but preserve string content
                    statements = sql.split(';')
                    for stmt in statements:
                        stmt = stmt.strip()
                        if stmt and not stmt.startswith('--'):
                            try:
                                db.execute(stmt)
                            except Exception as stmt_err:
                                # Ignore "duplicate column" or "already exists" errors
                                err_msg = str(stmt_err).lower()
                                if 'duplicate' in err_msg or 'already exists' in err_msg:
                                    pass  # Ignore idempotent errors
                                else:
                                    print(f"    Warning in {migration['name']}: {stmt_err}")
                    db.commit()

                    # Mark as applied
                    db.execute("INSERT INTO _migrations (name) VALUES (?)", (migration['name'],))
                    db.commit()
                    print(f"  ✓ Applied {migration['name']}")
                except Exception as e:
                    print(f"  ✗ Failed to apply {migration['name']}: {e}")
                    # Continue with other migrations

        db.close()
        print("Migrations complete")

    except Exception as e:
        print(f"Migration error: {e}")


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
            result = db.execute("""
                SELECT id FROM session 
                WHERE end_time IS NULL 
                ORDER BY start_time DESC LIMIT 1
            """).fetchone()
            if result:
                current_mcp_session_id = result[0]
            db.close()
        except Exception:
            pass
    
    if not current_mcp_session_id:
        return  # No active session, skip logging
    
    try:
        db = get_db()
        msg_id = f"chat_{uuid.uuid4().hex[:16]}"
        timestamp = datetime.now(datetime.UTC).isoformat().replace('+00:00', 'Z')
        
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
                json.dumps(tool_results) if tool_results else None
            )
        )
        db.commit()
        db.close()
    except Exception as e:
        print(f"Auto-log warning: {e}", file=sys.stderr)


# Cached system prompt (loaded once at startup)
_cached_system_prompt = None
_cached_prompt_mtime = 0

def get_avaia_prompt():
    """Get the Avaia system prompt from file or embedded (cached)"""
    global _cached_system_prompt, _cached_prompt_mtime

    prompt_paths = [
        os.path.join(BASE_DIR, 'avaia_prompt.txt'),
        os.path.expanduser('~/.avaia/system_prompt.md'),
        os.path.join(os.path.dirname(os.path.dirname(BASE_DIR)), 'src', 'prompts', 'system.md'),
    ]

    # Find the prompt file
    prompt_path = None
    for path in prompt_paths:
        if os.path.exists(path):
            prompt_path = path
            break

    if not prompt_path:
        return """You are Avaia, an AI programming teacher. You teach through the Socratic method, asking guiding questions rather than giving direct answers."""

    # Check if cache is valid
    current_mtime = os.path.getmtime(prompt_path)
    if _cached_system_prompt and current_mtime == _cached_prompt_mtime:
        return _cached_system_prompt

    # Read and cache
    with open(prompt_path, 'r') as f:
        _cached_system_prompt = f.read()
        _cached_prompt_mtime = current_mtime

    return _cached_system_prompt


# Cached Claude CLI path (kept for fallback/setup)
_cached_claude_path = None

def get_cached_claude_path():
    """Get Claude CLI path (cached after first lookup)"""
    global _cached_claude_path
    if _cached_claude_path:
        return _cached_claude_path

    from setup_wizard import find_claude_cli
    _cached_claude_path = find_claude_cli()
    return _cached_claude_path


# =============================================================================
# Direct Anthropic API Client
# =============================================================================

# Conversation history for multi-turn (per session)
_conversation_history = []
_anthropic_client = None
_current_api_key = None

# Model mapping
MODEL_MAP = {
    'haiku': 'claude-3-5-haiku-latest',
    'sonnet': 'claude-sonnet-4-20250514',
    'opus': 'claude-opus-4-20250514'
}


def set_api_key_direct(api_key: str):
    """Set the API key for direct API access."""
    global _anthropic_client, _current_api_key
    _current_api_key = api_key
    _anthropic_client = None  # Force re-creation with new key


def get_anthropic_client():
    """Get or create Anthropic client."""
    global _anthropic_client, _current_api_key
    if _anthropic_client:
        return _anthropic_client

    # Priority 1: Use explicitly set key
    api_key = _current_api_key

    # Priority 2: Try environment variable
    if not api_key:
        api_key = os.environ.get('ANTHROPIC_API_KEY')

    # Priority 3: Try ~/.avaia/api_key
    if not api_key:
        key_path = os.path.expanduser('~/.avaia/api_key')
        if os.path.exists(key_path):
            try:
                with open(key_path, 'r') as f:
                    api_key = f.read().strip()
            except:
                pass

    # Priority 4: Try BYOK credentials
    if not api_key:
        credentials_path = os.path.expanduser('~/.config/claude/credentials.json')
        if os.path.exists(credentials_path):
            try:
                with open(credentials_path, 'r') as f:
                    creds = json.load(f)
                    api_key = creds.get('apiKey')
            except:
                pass

    if api_key:
        _anthropic_client = anthropic.Anthropic(api_key=api_key)
    else:
        raise ValueError("No API key found. Please set ANTHROPIC_API_KEY or provide a key.")

    return _anthropic_client


def reset_conversation():
    """Reset conversation history for a new session."""
    global _conversation_history
    _conversation_history = []


def stream_anthropic_response(message: str, model: str, learner_id: str, emit_fn):
    """Stream a response from Anthropic API with tool calling support."""
    global _conversation_history

    # Import tools
    from avaia_tools import TOOL_DEFINITIONS, execute_tool

    client = get_anthropic_client()
    system_prompt = get_avaia_prompt()

    # Add learner context to system prompt
    if learner_id:
        system_prompt += f"\n\n## Current Learner\nThe current learner's ID is: `{learner_id}`\nUse this ID when calling any tools that require a learner_id parameter."

    # PREPEND system prompt to message for compliance (prevents drift)
    reinforced_message = f"""[SYSTEM INSTRUCTIONS - FOLLOW EXACTLY]
{system_prompt}

[USER MESSAGE]
{message}"""

    # Add user message to history
    _conversation_history.append({
        "role": "user",
        "content": reinforced_message
    })

    # Keep conversation history manageable (last 40 messages)
    if len(_conversation_history) > 40:
        _conversation_history = _conversation_history[-40:]

    model_id = MODEL_MAP.get(model, MODEL_MAP['sonnet'])

    full_response = []
    tool_calls_made = []
    tool_results = []

    try:
        # Initial API call with tools
        response = client.messages.create(
            model=model_id,
            max_tokens=4096,
            system=system_prompt,
            tools=TOOL_DEFINITIONS,
            messages=_conversation_history
        )

        # Process response - may involve multiple tool calls
        while response.stop_reason == 'tool_use':
            # Collect text and tool uses from response
            assistant_content = []
            for block in response.content:
                if block.type == 'text':
                    full_response.append(block.text)
                    emit_fn('output', {'data': block.text})
                    assistant_content.append({"type": "text", "text": block.text})
                elif block.type == 'tool_use':
                    tool_name = block.name
                    tool_input = block.input
                    tool_use_id = block.id

                    # Execute the tool
                    emit_fn('tool_use', {'name': tool_name, 'input': tool_input})
                    result = execute_tool(tool_name, tool_input)
                    tool_calls_made.append({'name': tool_name, 'input': tool_input})
                    tool_results.append({'name': tool_name, 'result': result})
                    emit_fn('tool_result', {'name': tool_name, 'result': result})

                    assistant_content.append({
                        "type": "tool_use",
                        "id": tool_use_id,
                        "name": tool_name,
                        "input": tool_input
                    })

            # Add assistant message with tool uses to history
            _conversation_history.append({
                "role": "assistant",
                "content": assistant_content
            })

            # Add tool results to history
            tool_result_content = []
            for block in response.content:
                if block.type == 'tool_use':
                    result = execute_tool(block.name, block.input)
                    tool_result_content.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result)
                    })

            _conversation_history.append({
                "role": "user",
                "content": tool_result_content
            })

            # Continue the conversation
            response = client.messages.create(
                model=model_id,
                max_tokens=4096,
                system=system_prompt,
                tools=TOOL_DEFINITIONS,
                messages=_conversation_history
            )

        # Final response (no more tool calls)
        for block in response.content:
            if block.type == 'text':
                full_response.append(block.text)
                emit_fn('output', {'data': block.text})

        # Add final assistant response to history
        assistant_message = ''.join(full_response)
        _conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })

        return assistant_message

    except anthropic.APIError as e:
        error_msg = f"API Error: {str(e)}"
        emit_fn('output', {'data': f"\n\n{error_msg}"})
        return error_msg
    except Exception as e:
        import traceback
        error_msg = f"Error: {str(e)}\n{traceback.format_exc()}"
        emit_fn('output', {'data': f"\n\n{error_msg}"})
        return error_msg


@app.route('/')
def index():
    """Main chat interface - requires full setup including auth."""
    status = preflight_check()
    if not status.all_ready:
        return redirect('/setup')
    return render_template('index.html')


@app.route('/setup')
def setup():
    """Setup wizard for first-time users."""
    return render_template('setup.html')


@app.route('/setup/status')
def setup_status():
    """Get current setup status."""
    # Force refresh on setup page to show accurate status
    force_refresh = request.args.get('refresh', '').lower() == 'true'
    status = preflight_check(force_refresh=force_refresh)
    return jsonify(status.to_dict())


@app.route('/setup/install/<component>', methods=['POST'])
def install_component(component):
    """Install a missing component."""
    if component == 'claude_cli':
        success, msg = install_claude_cli()
    elif component == 'avaia_mcp':
        success, msg = configure_avaia_mcp()
    elif component == 'database':
        success, msg = initialize_database()
    else:
        return jsonify({"success": False, "error": f"Unknown component: {component}"})

    # Invalidate cache so next check reflects the installation
    if success:
        invalidate_preflight_cache()

    return jsonify({"success": success, "message": msg if success else None, "error": msg if not success else None})


@app.route('/setup/auth/login', methods=['POST'])
def auth_login():
    """Initiate Claude login flow."""
    success, msg = login_claude()
    if success:
        invalidate_preflight_cache()
    return jsonify({"success": success, "message": msg if success else None, "error": msg if not success else None})


@app.route('/setup/auth/byok', methods=['POST'])
def auth_byok():
    """Set API key (BYOK)."""
    data = request.get_json()
    api_key = data.get('api_key', '')
    success, msg = set_api_key(api_key)
    if success:
        invalidate_preflight_cache()
    return jsonify({"success": success, "message": msg if success else None, "error": msg if not success else None})


# =============================================================================
# Dashboard Pages
# =============================================================================

@app.route('/dashboard')
def dashboard():
    """Dashboard page with learner stats."""
    status = preflight_check()
    if not status.all_ready:
        return redirect('/setup')
    return render_template('dashboard.html')


@app.route('/learning')
def learning():
    """My Learning page with concepts and vocabulary."""
    status = preflight_check()
    if not status.all_ready:
        return redirect('/setup')
    return render_template('learning.html')


@app.route('/projects')
def projects():
    """Projects page with track progress."""
    status = preflight_check()
    if not status.all_ready:
        return redirect('/setup')
    return render_template('projects.html')


@app.route('/reviews')
def reviews():
    """Reviews page with SRS queue."""
    status = preflight_check()
    if not status.all_ready:
        return redirect('/setup')
    return render_template('reviews.html')


# =============================================================================
# Helper Functions
# =============================================================================

def calculate_streak(db, learner_id):
    """Calculate consecutive days of learning activity."""
    try:
        # Get distinct dates with activity (sessions or reviews)
        result = db.execute("""
            SELECT DISTINCT date(start_time) as activity_date
            FROM session WHERE learner_id = ?
            UNION
            SELECT DISTINCT date(timestamp) as activity_date
            FROM review_log WHERE learner_id = ?
            ORDER BY activity_date DESC
        """, (learner_id, learner_id)).fetchall()

        if not result:
            return 0

        today = date.today()
        streak = 0

        # Check if there's activity today or yesterday (to allow for timezone)
        activity_dates = set(r[0] for r in result if r[0])

        current_date = today
        # Check today first
        if str(current_date) in activity_dates:
            streak = 1
            current_date -= timedelta(days=1)
        elif str(current_date - timedelta(days=1)) in activity_dates:
            # Started streak from yesterday
            streak = 1
            current_date = today - timedelta(days=2)
        else:
            return 0

        # Count consecutive days backwards
        while str(current_date) in activity_dates:
            streak += 1
            current_date -= timedelta(days=1)

        return streak
    except Exception:
        return 0


def calculate_health_metrics(db, learner_id):
    """Calculate real learning health metrics from database."""
    try:
        # Independence score: average from learner_concept
        independence_result = db.execute("""
            SELECT AVG(COALESCE(independence_score, 0))
            FROM learner_concept WHERE learner_id = ?
        """, (learner_id,)).fetchone()
        independence = int(independence_result[0]) if independence_result and independence_result[0] else 0

        # Verification pass rate: correct / total attempts
        verification_result = db.execute("""
            SELECT
                SUM(correct_attempts) as correct,
                SUM(total_attempts) as total
            FROM learner_concept WHERE learner_id = ?
        """, (learner_id,)).fetchone()

        if verification_result and verification_result[1] and verification_result[1] > 0:
            verification_rate = int((verification_result[0] or 0) / verification_result[1] * 100)
        else:
            # Fall back to review_log data
            review_result = db.execute("""
                SELECT
                    SUM(CASE WHEN outcome = 'correct' THEN 1 ELSE 0 END) as correct,
                    COUNT(*) as total
                FROM review_log WHERE learner_id = ?
            """, (learner_id,)).fetchone()
            if review_result and review_result[1] and review_result[1] > 0:
                verification_rate = int(review_result[0] / review_result[1] * 100)
            else:
                verification_rate = 0

        return {
            "independence_score": independence,
            "verification_pass_rate": verification_rate
        }
    except Exception:
        return {"independence_score": 0, "verification_pass_rate": 0}


# =============================================================================
# API Endpoints
# =============================================================================

@app.route('/api/dashboard')
def api_dashboard():
    """Get dashboard data for a learner."""
    learner_id = request.args.get('learner_id', '')
    if not learner_id:
        return jsonify({"error": "learner_id required"}), 400

    try:
        db = get_db()

        # Time metrics
        time_result = db.execute("""
            SELECT
                COUNT(*) as total_sessions,
                COALESCE(SUM(
                    CASE WHEN end_time IS NOT NULL
                    THEN (julianday(end_time) - julianday(start_time)) * 24 * 60
                    ELSE 0 END
                ), 0) as total_minutes
            FROM session WHERE learner_id = ?
        """, (learner_id,)).fetchone()

        # Concept metrics
        concept_result = db.execute("""
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as mastered,
                SUM(CASE WHEN verified = 0 OR verified IS NULL THEN 1 ELSE 0 END) as learning
            FROM learner_concept WHERE learner_id = ?
        """, (learner_id,)).fetchone()

        # Due reviews
        due_reviews = db.execute("""
            SELECT lc.concept_id, c.name as concept_name, lc.code_snippet, lc.snippet_context as context
            FROM learner_concept lc
            LEFT JOIN concept c ON lc.concept_id = c.id
            WHERE lc.learner_id = ? AND lc.next_review <= datetime('now')
            ORDER BY lc.next_review
            LIMIT 5
        """, (learner_id,)).fetchall()

        # Stubborn bugs
        stubborn_bugs = db.execute("""
            SELECT concept_id, misconception_id
            FROM stubborn_bug
            WHERE learner_id = ? AND resolved = 0
        """, (learner_id,)).fetchall()

        # Current project - try learner.current_project_id or most recent active project
        project_result = db.execute("""
            SELECT p.id, p.name, p.current_milestone, pt.milestones
            FROM project p
            LEFT JOIN project_template pt ON p.template_id = pt.id
            WHERE p.learner_id = ? AND p.status = 'in_progress'
            ORDER BY p.started_at DESC
            LIMIT 1
        """, (learner_id,)).fetchone()

        # Calculate streak
        streak = calculate_streak(db, learner_id)

        # Calculate health metrics
        health = calculate_health_metrics(db, learner_id)

        db.close()

        # Parse milestones to get total count
        total_milestones = 0
        if project_result and project_result[3]:
            try:
                milestones = json.loads(project_result[3])
                total_milestones = len(milestones)
            except:
                pass

        return jsonify({
            "time_metrics": {
                "total_sessions": time_result[0] if time_result else 0,
                "total_time_minutes": int(time_result[1]) if time_result else 0,
                "streak_days": streak
            },
            "concept_metrics": {
                "concepts_introduced": concept_result[0] if concept_result else 0,
                "concepts_mastered": concept_result[1] if concept_result else 0,
                "concepts_learning": concept_result[2] if concept_result else 0
            },
            "due_reviews": [
                {"concept_id": r[0], "concept_name": r[1], "code_snippet": r[2], "context": r[3]}
                for r in due_reviews
            ],
            "stubborn_bugs": [
                {"concept_id": b[0], "misconception_id": b[1]}
                for b in stubborn_bugs
            ],
            "current_project": {
                "id": project_result[0],
                "name": project_result[1],
                "current_milestone": project_result[2] or 1,
                "progress": int(((project_result[2] or 1) / total_milestones) * 100) if total_milestones > 0 else 0
            } if project_result else None,
            "learning_health": health
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/learning')
def api_learning():
    """Get learning data (concepts and vocabulary) for a learner."""
    learner_id = request.args.get('learner_id', '')
    if not learner_id:
        return jsonify({"error": "learner_id required"}), 400

    try:
        db = get_db()

        # Mastered concepts
        mastered = db.execute("""
            SELECT lc.concept_id, c.name, lc.snippet_context as context
            FROM learner_concept lc
            LEFT JOIN concept c ON lc.concept_id = c.id
            WHERE lc.learner_id = ? AND lc.verified = 1
        """, (learner_id,)).fetchall()

        # Learning concepts
        learning = db.execute("""
            SELECT lc.concept_id, c.name, lc.snippet_context as context, lc.independence_score
            FROM learner_concept lc
            LEFT JOIN concept c ON lc.concept_id = c.id
            WHERE lc.learner_id = ? AND (lc.verified = 0 OR lc.verified IS NULL)
        """, (learner_id,)).fetchall()

        # Vocabulary
        terms = db.execute("""
            SELECT term, definition FROM learner_term WHERE learner_id = ?
        """, (learner_id,)).fetchall()

        db.close()

        return jsonify({
            "mastered": [
                {"concept_id": m[0], "name": m[1], "context": m[2]}
                for m in mastered
            ],
            "learning": [
                {"concept_id": l[0], "name": l[1], "context": l[2], "independence_score": l[3]}
                for l in learning
            ],
            "terms": [
                {"term": t[0], "definition": t[1]}
                for t in terms
            ]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/projects')
def api_projects():
    """Get projects and track data for a learner."""
    learner_id = request.args.get('learner_id', '')
    if not learner_id:
        return jsonify({"error": "learner_id required"}), 400

    try:
        db = get_db()

        # Current track
        track = db.execute("""
            SELECT lt.id, lt.name, lt.description
            FROM learning_track lt
            JOIN learner l ON l.current_track_id = lt.id
            WHERE l.id = ?
        """, (learner_id,)).fetchone()

        # Projects for this learner with template milestones
        projects_data = []
        if track:
            # Get project templates in this track
            templates = db.execute("""
                SELECT pt.id, pt.name, pt.description, pt.milestones, pt.sequence_order
                FROM project_template pt
                WHERE pt.track_id = ?
                ORDER BY pt.sequence_order
            """, (track[0],)).fetchall()

            for t in templates:
                template_id, name, description, milestones_json, seq = t

                # Check if learner has started this project
                learner_project = db.execute("""
                    SELECT id, current_milestone, status, completed_at, time_spent_minutes
                    FROM project
                    WHERE learner_id = ? AND template_id = ?
                """, (learner_id, template_id)).fetchone()

                # Parse milestones from template
                milestones = []
                try:
                    if milestones_json:
                        milestones = json.loads(milestones_json)
                except:
                    pass

                current_milestone = learner_project[1] if learner_project else 0
                status = learner_project[2] if learner_project else "not_started"
                time_spent = learner_project[4] if learner_project else 0

                # Mark milestone completion status
                for i, m in enumerate(milestones):
                    m['completed'] = (i + 1) < current_milestone if current_milestone else False
                    m['current'] = (i + 1) == current_milestone if current_milestone else False

                projects_data.append({
                    "id": learner_project[0] if learner_project else template_id,
                    "template_id": template_id,
                    "name": name,
                    "description": description or "",
                    "current_milestone": current_milestone,
                    "status": status,
                    "time_spent": time_spent,
                    "milestones": milestones
                })

        # Calculate track progress
        completed_projects = sum(1 for p in projects_data if p['status'] == 'completed')
        total_projects = len(projects_data)
        track_progress = int((completed_projects / total_projects) * 100) if total_projects > 0 else 0

        db.close()

        return jsonify({
            "current_track": {
                "id": track[0],
                "name": track[1],
                "description": track[2],
                "progress": track_progress
            } if track else None,
            "projects": projects_data
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/learner/exists')
def api_learner_exists():
    """Check if a learner exists."""
    learner_id = request.args.get('learner_id', '')
    if not learner_id:
        return jsonify({"exists": False})

    try:
        db = get_db()
        result = db.execute("SELECT id, name FROM learner WHERE id = ?", (learner_id,)).fetchone()
        db.close()

        if result:
            return jsonify({"exists": True, "id": result[0], "name": result[1]})
        return jsonify({"exists": False})
    except Exception as e:
        return jsonify({"exists": False, "error": str(e)})


@app.route('/api/learner/create', methods=['POST'])
def api_learner_create():
    """Create a new learner."""
    data = request.get_json()
    name = data.get('name', '').strip()
    preferred_method = data.get('preferred_teaching_method', 'example_first')

    if not name:
        return jsonify({"success": False, "error": "Name is required"}), 400

    try:
        db = get_db()

        # Generate a unique learner ID
        learner_id = f"learner_{uuid.uuid4().hex[:12]}"

        # Create the learner
        db.execute("""
            INSERT INTO learner (id, name, preferred_teaching_method, onboarding_complete, current_track_id)
            VALUES (?, ?, ?, ?, ?)
        """, (learner_id, name, preferred_method, False, 'js-web'))

        db.commit()
        db.close()

        return jsonify({
            "success": True,
            "learner_id": learner_id,
            "name": name
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/learner/profile')
def api_learner_profile():
    """Get learner profile."""
    learner_id = request.args.get('learner_id', '')
    if not learner_id:
        return jsonify({"error": "learner_id required"}), 400

    try:
        db = get_db()
        result = db.execute("""
            SELECT id, name, started_at, preferred_teaching_method, onboarding_complete, current_track_id
            FROM learner WHERE id = ?
        """, (learner_id,)).fetchone()
        db.close()

        if not result:
            return jsonify({"error": "Learner not found"}), 404

        return jsonify({
            "id": result[0],
            "name": result[1],
            "started_at": result[2],
            "preferred_teaching_method": result[3],
            "onboarding_complete": bool(result[4]),
            "current_track_id": result[5]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/tracks')
def api_tracks():
    """Get available learning tracks."""
    try:
        db = get_db()
        tracks = db.execute("""
            SELECT id, name, description, difficulty,
                   (SELECT COUNT(*) FROM project WHERE track_id = learning_track.id) as project_count
            FROM learning_track
        """).fetchall()
        db.close()

        return jsonify({
            "tracks": [
                {
                    "id": t[0],
                    "name": t[1],
                    "description": t[2],
                    "difficulty": t[3],
                    "project_count": t[4]
                }
                for t in tracks
            ]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =============================================================================
# Update System (App + Curriculum)
# =============================================================================

# Cached version info
_curriculum_version_cache = None
_curriculum_cache_time = 0
CURRICULUM_CACHE_TTL = 300  # 5 minutes

# Current app version (read from package.json at startup)
_app_version = None


def get_installed_app_version():
    """Get the currently installed @newdara/avaia version."""
    global _app_version
    if _app_version:
        return _app_version

    try:
        # Priority 1: Read from bundled version.txt (for PyInstaller builds)
        version_file = os.path.join(BASE_DIR, 'version.txt')
        if os.path.exists(version_file):
            with open(version_file, 'r') as f:
                _app_version = f.read().strip()
                if _app_version:
                    return _app_version

        # Priority 2: Read from package.json (for development)
        pkg_paths = [
            os.path.join(BASE_DIR, '..', 'package.json'),
            os.path.expanduser('~/.npm/_npx/**/node_modules/@newdara/avaia/package.json'),
        ]

        import glob as glob_module
        for pattern in pkg_paths:
            matches = glob_module.glob(pattern)
            for pkg_path in matches:
                if os.path.exists(pkg_path):
                    with open(pkg_path, 'r') as f:
                        pkg = json.load(f)
                        _app_version = pkg.get('version', 'unknown')
                        return _app_version

        # Priority 3: Fallback to npm list (for global installs)
        result = subprocess.run(
            ['npm', 'list', '@newdara/avaia', '--json', '-g'],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            deps = data.get('dependencies', {})
            if '@newdara/avaia' in deps:
                _app_version = deps['@newdara/avaia'].get('version', 'unknown')
                return _app_version

        return 'unknown'
    except Exception as e:
        print(f"Failed to get app version: {e}", file=sys.stderr)
        return 'unknown'


def get_latest_npm_version():
    """Check npm registry for latest @newdara/avaia version."""
    try:
        result = subprocess.run(
            ['npm', 'view', '@newdara/avaia', 'version'],
            capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            return result.stdout.strip()
        return None
    except Exception as e:
        print(f"Failed to check npm version: {e}", file=sys.stderr)
        return None


def update_npm_package():
    """Run npm update to get latest @newdara/avaia."""
    try:
        # Update the package globally
        result = subprocess.run(
            ['npm', 'update', '-g', '@newdara/avaia'],
            capture_output=True, text=True, timeout=120
        )

        if result.returncode == 0:
            # Invalidate cached version
            global _app_version
            _app_version = None
            return {"success": True, "output": result.stdout}
        else:
            return {"success": False, "error": result.stderr or "npm update failed"}
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Update timed out"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def get_installed_curriculum_version():
    """Get the version of currently installed curriculum from database."""
    try:
        db = get_db()
        # Count tracks and check for version metadata
        result = db.execute("""
            SELECT COUNT(*) as track_count,
                   MAX(created_at) as last_update
            FROM learning_track
            WHERE is_preseeded = 1
        """).fetchone()

        # Also count concepts and projects
        concepts = db.execute("SELECT COUNT(*) FROM concept").fetchone()[0]
        projects = db.execute("SELECT COUNT(*) FROM project_template").fetchone()[0]

        # Get applied migrations
        migrations = db.execute("""
            SELECT name FROM _migrations ORDER BY name
        """).fetchall()

        db.close()

        return {
            "tracks": result[0] if result else 0,
            "last_update": result[1] if result else None,
            "concepts": concepts,
            "projects": projects,
            "migrations": [m[0] for m in migrations]
        }
    except Exception as e:
        return {"error": str(e)}


def get_available_curriculum_updates():
    """Check for curriculum migration files not yet applied."""
    global _curriculum_version_cache, _curriculum_cache_time

    import time
    current_time = time.time()

    # Return cached result if fresh
    if (_curriculum_version_cache is not None and
        (current_time - _curriculum_cache_time) < CURRICULUM_CACHE_TTL):
        return _curriculum_version_cache

    try:
        # Get installed curriculum info
        installed = get_installed_curriculum_version()
        if "error" in installed:
            return {"error": installed["error"], "updates_available": False}

        applied_migrations = set(installed.get("migrations", []))

        # Find migration files in the package
        # Look in multiple locations for migrations
        migration_paths = [
            os.path.join(BASE_DIR, '..', 'src', 'server', 'db', 'migrations'),
            os.path.join(BASE_DIR, '..', 'dist', 'server', 'db', 'migrations'),
            os.path.expanduser('~/.avaia/migrations'),  # User-installed migrations
        ]

        pending_migrations = []
        for mig_path in migration_paths:
            if os.path.exists(mig_path):
                for f in os.listdir(mig_path):
                    if f.endswith('.sql') and f not in applied_migrations:
                        pending_migrations.append({
                            "name": f,
                            "path": os.path.join(mig_path, f)
                        })

        # Sort by name (which includes the numeric prefix)
        pending_migrations.sort(key=lambda x: x['name'])

        # Check for app updates too
        installed_version = get_installed_app_version()
        latest_version = get_latest_npm_version()

        app_update_available = False
        if installed_version and latest_version and installed_version != 'unknown':
            # Simple version comparison (works for semver)
            app_update_available = installed_version != latest_version

        result = {
            "installed": installed,
            "updates_available": len(pending_migrations) > 0 or app_update_available,
            "pending_count": len(pending_migrations),
            "pending_migrations": pending_migrations,
            "app_version": {
                "installed": installed_version,
                "latest": latest_version,
                "update_available": app_update_available
            }
        }

        _curriculum_version_cache = result
        _curriculum_cache_time = current_time

        return result

    except Exception as e:
        return {"error": str(e), "updates_available": False}


def apply_all_updates():
    """Apply all updates: npm package first, then curriculum migrations."""
    global _curriculum_version_cache

    updates = get_available_curriculum_updates()
    if not updates.get("updates_available"):
        return {"success": True, "applied": 0, "message": "No updates to apply"}

    result = {
        "success": True,
        "npm_updated": False,
        "npm_version": None,
        "migrations_applied": 0,
        "applied_migrations": [],
        "errors": []
    }

    # Step 1: Update npm package if needed
    app_version = updates.get("app_version", {})
    if app_version.get("update_available"):
        print(f"Updating npm package: {app_version.get('installed')} -> {app_version.get('latest')}")
        npm_result = update_npm_package()

        if npm_result.get("success"):
            result["npm_updated"] = True
            result["npm_version"] = app_version.get("latest")
            # Invalidate cache since new migrations might be available
            _curriculum_version_cache = None
            # Re-check for pending migrations (new version may have more)
            updates = get_available_curriculum_updates()
        else:
            result["errors"].append({
                "type": "npm",
                "error": npm_result.get("error", "npm update failed")
            })
            # Continue with curriculum updates even if npm failed

    # Step 2: Apply curriculum migrations
    pending = updates.get("pending_migrations", [])
    if pending:
        try:
            db = get_db()

            for migration in pending:
                try:
                    with open(migration["path"], 'r') as f:
                        sql = f.read()

                    db.execute("BEGIN")
                    db.executescript(sql)
                    db.execute(
                        "INSERT INTO _migrations (name) VALUES (?)",
                        (migration["name"],)
                    )
                    db.execute("COMMIT")

                    result["applied_migrations"].append(migration["name"])
                    print(f"Applied curriculum update: {migration['name']}")

                except Exception as e:
                    db.execute("ROLLBACK")
                    result["errors"].append({
                        "type": "migration",
                        "migration": migration["name"],
                        "error": str(e)
                    })
                    print(f"Failed to apply {migration['name']}: {e}")

            db.close()
            result["migrations_applied"] = len(result["applied_migrations"])

        except Exception as e:
            result["errors"].append({"type": "database", "error": str(e)})

    # Invalidate cache
    _curriculum_version_cache = None

    # Calculate overall success
    result["success"] = len(result["errors"]) == 0
    result["applied"] = result["migrations_applied"] + (1 if result["npm_updated"] else 0)

    return result


@app.route('/api/curriculum/status')
def api_curriculum_status():
    """Get current curriculum and app version status."""
    return jsonify(get_available_curriculum_updates())


@app.route('/api/curriculum/update', methods=['POST'])
def api_curriculum_update():
    """Apply all pending updates (npm + curriculum)."""
    result = apply_all_updates()
    return jsonify(result)


@app.route('/api/set-api-key', methods=['POST'])
def api_set_api_key():
    """Set API key for direct Anthropic access."""
    data = request.get_json()
    api_key = data.get('api_key', '')

    if not api_key or not api_key.startswith('sk-ant-'):
        return jsonify({"success": False, "error": "Invalid API key format"}), 400

    # Save to ~/.avaia/api_key for persistence
    try:
        avaia_dir = os.path.expanduser('~/.avaia')
        os.makedirs(avaia_dir, exist_ok=True)
        key_path = os.path.join(avaia_dir, 'api_key')
        with open(key_path, 'w') as f:
            f.write(api_key)
        os.chmod(key_path, 0o600)  # Secure permissions

        # Set in memory
        set_api_key_direct(api_key)

        # Invalidate cache so next check reflects the new API key
        invalidate_preflight_cache()

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/select-track', methods=['POST'])
def api_select_track():
    """Select a learning track for a learner."""
    data = request.get_json()
    learner_id = data.get('learner_id', '')
    track_id = data.get('track_id', '')

    if not learner_id or not track_id:
        return jsonify({"error": "learner_id and track_id required"}), 400

    try:
        db = get_db()
        db.execute("UPDATE learner SET current_track_id = ? WHERE id = ?", (track_id, learner_id))
        db.commit()
        db.close()

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/reviews')
def api_reviews():
    """Get due reviews for a learner."""
    learner_id = request.args.get('learner_id', '')
    if not learner_id:
        return jsonify({"error": "learner_id required"}), 400

    try:
        db = get_db()

        # Due reviews with code snippets
        due_concepts = db.execute("""
            SELECT lc.concept_id, c.name as concept_name, lc.code_snippet,
                   lc.snippet_context as context, lc.next_review
            FROM learner_concept lc
            LEFT JOIN concept c ON lc.concept_id = c.id
            WHERE lc.learner_id = ? AND lc.next_review <= datetime('now')
            ORDER BY lc.next_review
        """, (learner_id,)).fetchall()

        # Count completed today
        completed_today = db.execute("""
            SELECT COUNT(*) FROM review_log
            WHERE learner_id = ? AND date(timestamp) = date('now')
        """, (learner_id,)).fetchone()[0]

        # Calculate streak
        streak = calculate_streak(db, learner_id)

        # Build review items with real diagnostic questions
        reviews = []
        for r in due_concepts:
            concept_id = r[0]
            concept_name = r[1]
            code_snippet = r[2]
            context = r[3]

            # Try to get a diagnostic question for this concept
            diag = db.execute("""
                SELECT id, code_snippet, prompt, correct_answer, distractors
                FROM diagnostic_question
                WHERE concept_id = ?
                ORDER BY RANDOM()
                LIMIT 1
            """, (concept_id,)).fetchone()

            if diag:
                # Use the diagnostic question
                diag_id, diag_code, prompt, correct, distractors_json = diag

                # Parse distractors
                try:
                    distractors = json.loads(distractors_json)
                except:
                    distractors = []

                # Build options array with correct answer at random position
                options = [d['answer'] for d in distractors if 'answer' in d]
                correct_index = random.randint(0, len(options))
                options.insert(correct_index, correct)

                reviews.append({
                    "concept_id": concept_id,
                    "concept_name": concept_name,
                    "code_snippet": diag_code or code_snippet or "// No code snippet",
                    "context": context or "",
                    "question": prompt,
                    "options": options,
                    "correct_index": correct_index,
                    "diagnostic_id": diag_id,
                    "distractors": distractors  # Include for misconception tracking
                })
            else:
                # No diagnostic question - create a basic recall question
                reviews.append({
                    "concept_id": concept_id,
                    "concept_name": concept_name,
                    "code_snippet": code_snippet or "// No code snippet",
                    "context": context or "",
                    "question": f"What concept does this code demonstrate?",
                    "options": [
                        concept_name or concept_id,
                        "Something else",
                        "I'm not sure",
                        "None of the above"
                    ],
                    "correct_index": 0,
                    "diagnostic_id": None,
                    "distractors": []
                })

        db.close()

        return jsonify({
            "due_count": len(reviews),
            "completed_today": completed_today,
            "streak_days": streak,
            "due_reviews": reviews
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/log-review', methods=['POST'])
def api_log_review():
    """Log a review result."""
    data = request.get_json()
    learner_id = data.get('learner_id', '')
    concept_id = data.get('concept_id', '')
    outcome = data.get('outcome', '')
    confidence = data.get('confidence', 3)
    response_time_ms = data.get('response_time_ms', 0)

    if not learner_id or not concept_id or not outcome:
        return jsonify({"error": "learner_id, concept_id, and outcome required"}), 400

    try:
        db = get_db()
        timestamp = datetime.now(datetime.UTC).isoformat().replace('+00:00', 'Z')

        # Log the review
        db.execute("""
            INSERT INTO review_log (learner_id, concept_id, outcome, confidence, response_time_ms, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (learner_id, concept_id, outcome, confidence, response_time_ms, timestamp))

        # Update next review date (simple FSRS-like logic)
        if outcome == 'correct':
            # Increase interval
            db.execute("""
                UPDATE learner_concept
                SET next_review = datetime('now', '+' || (COALESCE(review_count, 0) + 1) || ' days'),
                    review_count = COALESCE(review_count, 0) + 1
                WHERE learner_id = ? AND concept_id = ?
            """, (learner_id, concept_id))
        else:
            # Reset to tomorrow
            db.execute("""
                UPDATE learner_concept
                SET next_review = datetime('now', '+1 day')
                WHERE learner_id = ? AND concept_id = ?
            """, (learner_id, concept_id))

        db.commit()
        db.close()

        return jsonify({"success": True})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@socketio.on('connect')
def handle_connect():
    emit('status', {'connected': True})
    print(f"Client connected: {session_id or 'unknown'}")


@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")


@socketio.on('input')
def handle_input(data):
    """Handle incoming chat messages - uses direct Anthropic API for speed."""
    from flask import request

    message = data.get('message', '')
    learner_id = data.get('learner_id', '')
    model = data.get('model', 'sonnet')

    if not message.strip():
        return

    # Auto-log user message
    auto_log_message('user', message)

    def emit_to_client(event, data):
        """Helper to emit to the current client."""
        socketio.emit(event, data, room=request.sid)

    # Run API call in background thread to not block
    def run_api_call():
        try:
            response = stream_anthropic_response(
                message=message,
                model=model,
                learner_id=learner_id,
                emit_fn=emit_to_client
            )

            # Auto-log assistant response
            if response:
                auto_log_message('assistant', response)

            emit_to_client('response_complete', {})

        except Exception as e:
            emit_to_client('error', {'error': str(e)})
            emit_to_client('response_complete', {})

    thread = threading.Thread(target=run_api_call, daemon=True)
    thread.start()


@socketio.on('stop')
def handle_stop():
    global current_process
    with lock:
        if current_process:
            current_process.terminate()
            try:
                current_process.wait(timeout=2)
            except:
                current_process.kill()
            current_process = None
    emit('stopped', {})


@socketio.on('end_session')
def handle_end_session(data):
    """Handle end_session event from frontend."""
    global current_mcp_session_id

    learner_id = data.get('learner_id', '')
    session_summary = data.get('session_summary', '')

    # Log the session end to database if we have a session
    if current_mcp_session_id:
        try:
            db = get_db()
            timestamp = datetime.now(datetime.UTC).isoformat().replace('+00:00', 'Z')
            db.execute(
                "UPDATE session SET end_time = ?, session_notes = ? WHERE id = ?",
                (timestamp, session_summary, current_mcp_session_id)
            )
            db.commit()
            db.close()
            print(f"Session {current_mcp_session_id} ended")
        except Exception as e:
            print(f"Failed to end session: {e}", file=sys.stderr)

    current_mcp_session_id = None
    emit('status', {'connected': True, 'session_ended': True})


@socketio.on('restart')
def handle_restart():
    global session_id, current_process, current_mcp_session_id

    with lock:
        if current_process:
            current_process.terminate()
            try:
                current_process.wait(timeout=2)
            except:
                current_process.kill()
            current_process = None

    session_id = None
    current_mcp_session_id = None

    # Reset conversation history for direct API mode
    reset_conversation()

    emit('status', {'connected': True, 'restarted': True})


def start_flask(port):
    """Start Flask server in background thread"""
    global SERVER_PORT
    SERVER_PORT = port
    print(f"Starting Avaia server on http://127.0.0.1:{port}")
    
    # Signal that server is starting
    def on_startup():
        server_ready.set()
    
    # Run with werkzeug (threading mode)
    socketio.run(
        app, 
        host='127.0.0.1', 
        port=port, 
        debug=False, 
        allow_unsafe_werkzeug=True, 
        use_reloader=False
    )


def wait_for_server(port, timeout=10):
    """Wait for server to be ready"""
    start = time.time()
    while time.time() - start < timeout:
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                result = s.connect_ex(('127.0.0.1', port))
                if result == 0:
                    return True
        except:
            pass
        time.sleep(0.1)
    return False


def signal_handler(sig, frame):
    print("\nShutting down...")
    with lock:
        if current_process:
            current_process.terminate()
    sys.exit(0)


def main():
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Database migrations are handled by setup wizard
    # Don't run migrations automatically to avoid bypassing setup flow

    # Find a free port
    port = find_free_port()
    print(f"Found free port: {port}")

    # Start Flask in background thread
    flask_thread = threading.Thread(target=start_flask, args=(port,), daemon=True)
    flask_thread.start()
    
    # Wait for server to be ready
    print("Waiting for server to start...")
    if not wait_for_server(port, timeout=10):
        print("ERROR: Server failed to start within 10 seconds!")
        sys.exit(1)
    
    print(f"Server ready on port {port}")
    
    # Run preflight check
    from setup_wizard import preflight_check
    status = preflight_check()
    
    if status.all_ready:
        initial_url = f'http://127.0.0.1:{port}'
        print("All dependencies ready - starting chat")
    else:
        initial_url = f'http://127.0.0.1:{port}/setup'
        print("Setup required - starting wizard")
    
    # Create native webview window
    window = webview.create_window(
        'Avaia - AI Programming Teacher',
        initial_url,
        width=1200,
        height=800,
        min_size=(800, 600),
        resizable=True,
        frameless=False,
        easy_drag=True,
        text_select=True,
    )
    
    # Start the native event loop (blocking)
    webview.start(debug=False)


if __name__ == '__main__':
    # Required for PyInstaller on macOS to prevent infinite spawn loop
    import multiprocessing
    multiprocessing.freeze_support()
    main()
