"""
Avaia Setup Wizard
Handles preflight checks, dependency installation, and authentication.

Architecture designed for scale:
- Modular check functions (add new deps easily)
- Async-ready installation (can parallelize)
- Multiple auth providers (Claude login, BYOK, future: Bedrock/Vertex)

Latest Claude CLI docs (Jan 2026):
- Native install: curl -fsSL https://claude.ai/install.sh | bash
- npm install is DEPRECATED
- Auth: claude.ai account login OR API Console
- MCP add: claude mcp add --transport stdio [name] -- [command]
"""

import json
import os
import shutil
import sqlite3
import subprocess
import sys
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Optional


class AuthMethod(Enum):
    NONE = "none"
    CLAUDE_LOGIN = "claude_login"  # Pro/Max subscription
    API_KEY = "api_key"            # BYOK via Console
    BEDROCK = "bedrock"            # Future: AWS
    VERTEX = "vertex"              # Future: Google Cloud


@dataclass
class DependencyStatus:
    name: str
    installed: bool
    version: Optional[str] = None
    path: Optional[str] = None
    error: Optional[str] = None


@dataclass
class AuthStatus:
    authenticated: bool
    method: AuthMethod
    email: Optional[str] = None
    error: Optional[str] = None


@dataclass
class PreflightResult:
    claude_cli: DependencyStatus
    auth: AuthStatus
    avaia_mcp: DependencyStatus
    database: DependencyStatus
    
    @property
    def minimum_ready(self) -> bool:
        """Minimum requirements to use the app (auth is optional)."""
        # Claude CLI no longer required - we use direct API
        return (
            self.avaia_mcp.installed and
            self.database.installed
        )

    @property
    def all_ready(self) -> bool:
        """All requirements including auth."""
        # Claude CLI no longer required - we use direct API with API key
        return (
            self.auth.authenticated and
            self.avaia_mcp.installed and
            self.database.installed
        )
    
    def to_dict(self) -> dict:
        return {
            "all_ready": self.all_ready,
            "claude_cli": {
                "installed": self.claude_cli.installed,
                "version": self.claude_cli.version,
                "path": self.claude_cli.path,
                "error": self.claude_cli.error,
            },
            "auth": {
                "authenticated": self.auth.authenticated,
                "method": self.auth.method.value,
                "email": self.auth.email,
                "error": self.auth.error,
            },
            "avaia_mcp": {
                "installed": self.avaia_mcp.installed,
                "error": self.avaia_mcp.error,
            },
            "database": {
                "installed": self.database.installed,
                "path": self.database.path,
                "error": self.database.error,
            },
        }


# =============================================================================
# DEPENDENCY CHECKS
# =============================================================================

def find_claude_cli() -> Optional[str]:
    """
    Find Claude CLI, checking PATH and common installation locations.

    The Claude installer places the binary at ~/.local/bin/claude which
    may not be in PATH in fresh environments (Docker, new shells, etc).
    """
    # Check PATH first (fast path)
    claude_path = shutil.which("claude")
    if claude_path:
        return claude_path

    # Check common installation locations
    common_paths = [
        Path.home() / ".local" / "bin" / "claude",
        Path.home() / ".claude" / "local" / "claude",
        Path("/usr/local/bin/claude"),
    ]

    for path in common_paths:
        if path.exists() and os.access(path, os.X_OK):
            return str(path)

    return None


def check_claude_cli() -> DependencyStatus:
    """Check if Claude CLI is installed and accessible."""
    claude_path = find_claude_cli()

    if not claude_path:
        return DependencyStatus(
            name="claude_cli",
            installed=False,
            error="Claude CLI not found in PATH"
        )
    
    try:
        result = subprocess.run(
            [claude_path, "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        version = result.stdout.strip() if result.returncode == 0 else None
        
        return DependencyStatus(
            name="claude_cli",
            installed=True,
            version=version,
            path=claude_path
        )
    except subprocess.TimeoutExpired:
        return DependencyStatus(
            name="claude_cli",
            installed=True,
            path=claude_path,
            error="Version check timed out"
        )
    except Exception as e:
        return DependencyStatus(
            name="claude_cli",
            installed=False,
            error=str(e)
        )


def check_claude_auth() -> AuthStatus:
    """Check if user has API key configured for direct Anthropic API access."""
    # Priority 1: Check ~/.avaia/api_key (our direct API approach)
    api_key_path = Path.home() / ".avaia" / "api_key"
    if api_key_path.exists():
        try:
            api_key = api_key_path.read_text().strip()
            if api_key and api_key.startswith("sk-ant-"):
                return AuthStatus(
                    authenticated=True,
                    method=AuthMethod.API_KEY
                )
        except Exception:
            pass

    # Priority 2: Check environment variable
    if os.environ.get("ANTHROPIC_API_KEY"):
        return AuthStatus(
            authenticated=True,
            method=AuthMethod.API_KEY
        )

    # Priority 3: Check Claude CLI auth (for backwards compatibility)
    claude_path = find_claude_cli()
    if claude_path:
        try:
            result = subprocess.run(
                [claude_path, "auth", "status"],
                capture_output=True,
                text=True,
                timeout=15
            )

            output = result.stdout + result.stderr

            if "Logged in" in output or "authenticated" in output.lower():
                email = None
                for line in output.split("\n"):
                    if "@" in line:
                        parts = line.split()
                        for part in parts:
                            if "@" in part and "." in part:
                                email = part.strip("()[]<>")
                                break

                return AuthStatus(
                    authenticated=True,
                    method=AuthMethod.CLAUDE_LOGIN,
                    email=email
                )
        except (subprocess.TimeoutExpired, Exception):
            pass

    return AuthStatus(
        authenticated=False,
        method=AuthMethod.NONE,
        error="Not authenticated. Enter your Anthropic API key to continue."
    )


def check_avaia_mcp() -> DependencyStatus:
    """Check if Avaia tools are available (now built into the app, always ready)."""
    # With direct API mode, tools are implemented in Python and always available
    # No external MCP server needed
    try:
        # Verify the tools module exists and can be imported
        import importlib.util
        tools_path = Path(__file__).parent / "avaia_tools.py"

        if tools_path.exists():
            return DependencyStatus(
                name="avaia_mcp",
                installed=True,
                path=str(tools_path)
            )

        # Fallback: check if tools can be imported
        spec = importlib.util.find_spec("avaia_tools")
        if spec:
            return DependencyStatus(
                name="avaia_mcp",
                installed=True
            )

        return DependencyStatus(
            name="avaia_mcp",
            installed=False,
            error="Avaia tools module not found"
        )
    except Exception as e:
        return DependencyStatus(
            name="avaia_mcp",
            installed=False,
            error=str(e)
        )


def check_database() -> DependencyStatus:
    """Check if Avaia database exists and has correct schema."""
    db_path = Path.home() / ".avaia" / "avaia.db"
    
    if not db_path.exists():
        return DependencyStatus(
            name="database",
            installed=False,
            path=str(db_path),
            error="Database not found. Will be created on first run."
        )
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check for essential tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cursor.fetchall()}
        
        required_tables = {
            "learner", "session", "project", "concept",
            "learner_concept", "learning_track"
        }
        
        missing = required_tables - tables
        conn.close()
        
        if missing:
            return DependencyStatus(
                name="database",
                installed=False,
                path=str(db_path),
                error=f"Missing tables: {', '.join(missing)}"
            )
        
        return DependencyStatus(
            name="database",
            installed=True,
            path=str(db_path)
        )
        
    except Exception as e:
        return DependencyStatus(
            name="database",
            installed=False,
            path=str(db_path),
            error=str(e)
        )


# =============================================================================
# CACHED PREFLIGHT CHECK (Performance optimization)
# =============================================================================

_cached_preflight_result: Optional[PreflightResult] = None
_preflight_cache_time: float = 0
PREFLIGHT_CACHE_TTL = 300  # 5 minutes - refresh after this time


def preflight_check(force_refresh: bool = False) -> PreflightResult:
    """
    Run all dependency checks and return combined status.

    Results are cached for PREFLIGHT_CACHE_TTL seconds to avoid
    slow subprocess calls on every page load.

    Args:
        force_refresh: If True, bypass cache and run fresh checks
    """
    global _cached_preflight_result, _preflight_cache_time

    import time
    current_time = time.time()

    # Return cached result if still valid
    if (not force_refresh and
        _cached_preflight_result is not None and
        (current_time - _preflight_cache_time) < PREFLIGHT_CACHE_TTL):
        return _cached_preflight_result

    # Run checks and cache result
    _cached_preflight_result = PreflightResult(
        claude_cli=check_claude_cli(),
        auth=check_claude_auth(),
        avaia_mcp=check_avaia_mcp(),
        database=check_database()
    )
    _preflight_cache_time = current_time

    return _cached_preflight_result


def invalidate_preflight_cache():
    """Invalidate the preflight cache so next check runs fresh."""
    global _cached_preflight_result, _preflight_cache_time
    _cached_preflight_result = None
    _preflight_cache_time = 0


# =============================================================================
# INSTALLERS (require user permission)
# =============================================================================

def install_claude_cli(callback=None) -> tuple[bool, str]:
    """
    Install Claude CLI using official native installer.
    
    Args:
        callback: Optional function to report progress
    
    Returns:
        (success, message)
    """
    if callback:
        callback("Downloading Claude CLI installer...")
    
    try:
        # Use the official native install script (Jan 2026)
        # npm is deprecated per docs
        result = subprocess.run(
            ["curl", "-fsSL", "https://claude.ai/install.sh"],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode != 0:
            return False, f"Failed to download installer: {result.stderr}"
        
        installer_script = result.stdout
        
        if callback:
            callback("Running installer...")
        
        # Run the installer
        result = subprocess.run(
            ["bash", "-c", installer_script],
            capture_output=True,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            return True, "Claude CLI installed successfully"
        else:
            return False, f"Installation failed: {result.stderr}"
            
    except subprocess.TimeoutExpired:
        return False, "Installation timed out"
    except Exception as e:
        return False, str(e)


def configure_avaia_mcp(callback=None) -> tuple[bool, str]:
    """
    Configure Avaia MCP server in Claude.

    Uses: claude mcp add --transport stdio avaia -- npx @newdara/avaia
    """
    claude_path = find_claude_cli()
    
    if not claude_path:
        return False, "Claude CLI not installed"
    
    if callback:
        callback("Configuring Avaia MCP server...")
    
    try:
        result = subprocess.run(
            [
                claude_path, "mcp", "add",
                "--transport", "stdio",
                "avaia",
                "--",
                "npx", "@newdara/avaia"
            ],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            return True, "Avaia MCP configured successfully"
        else:
            # Check if already exists
            if "already exists" in result.stderr.lower():
                return True, "Avaia MCP already configured"
            return False, f"Configuration failed: {result.stderr}"
            
    except Exception as e:
        return False, str(e)


def initialize_database(callback=None) -> tuple[bool, str]:
    """
    Initialize Avaia database with full schema.
    Runs SQL migrations which include both schema and seed data.
    """
    db_dir = Path.home() / ".avaia"
    db_path = db_dir / "avaia.db"
    
    if callback:
        callback("Creating database directory...")
    
    try:
        db_dir.mkdir(parents=True, exist_ok=True)
        
        if callback:
            callback("Initializing database schema...")
        
        # Find migrations directory
        # Check multiple possible locations
        migration_paths = [
            Path(__file__).parent.parent / "src" / "server" / "db" / "migrations",
            Path.home() / ".avaia" / "migrations",
            Path("/usr/local/share/avaia/migrations"),
        ]
        
        migrations_dir = None
        for path in migration_paths:
            if path.exists():
                migrations_dir = path
                break
        
        conn = sqlite3.connect(str(db_path))
        
        if migrations_dir:
            # Run all SQL migrations in order
            migration_files = sorted(migrations_dir.glob("*.sql"))
            
            for mig_file in migration_files:
                if callback:
                    callback(f"Running migration: {mig_file.name}")
                
                sql = mig_file.read_text()
                conn.executescript(sql)
        else:
            # Fallback: create minimal schema
            if callback:
                callback("Creating minimal schema (migrations not found)...")
            
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS learner (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    onboarding_complete BOOLEAN DEFAULT FALSE,
                    current_track_id TEXT
                );
                
                CREATE TABLE IF NOT EXISTS session (
                    id TEXT PRIMARY KEY,
                    learner_id TEXT NOT NULL,
                    start_time DATETIME NOT NULL,
                    end_time DATETIME,
                    FOREIGN KEY (learner_id) REFERENCES learner(id)
                );
                
                CREATE TABLE IF NOT EXISTS learning_track (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    difficulty TEXT DEFAULT 'beginner'
                );
            """)
        
        conn.commit()
        conn.close()

        # Seed learning tracks automatically
        if callback:
            callback("Seeding learning tracks...")

        try:
            # Call npm run db:seed-all to populate curriculum
            import subprocess
            project_root = Path(__file__).parent.parent
            result = subprocess.run(
                ["npm", "run", "db:seed-all"],
                cwd=str(project_root),
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                print(f"Warning: Track seeding failed: {result.stderr}", file=sys.stderr)
                # Don't fail the whole setup - database is still functional
        except Exception as seed_err:
            print(f"Warning: Could not seed tracks: {seed_err}", file=sys.stderr)
            # Don't fail the whole setup

        return True, f"Database initialized at {db_path}"

    except Exception as e:
        return False, str(e)


# =============================================================================
# AUTHENTICATION
# =============================================================================

def login_claude(callback=None) -> tuple[bool, str]:
    """
    Initiate Claude login flow.
    Opens browser for OAuth authentication.
    """
    claude_path = find_claude_cli()
    
    if not claude_path:
        return False, "Claude CLI not installed"
    
    if callback:
        callback("Opening browser for Claude login...")
    
    try:
        # The login command opens browser automatically
        result = subprocess.run(
            [claude_path, "login"],
            timeout=120,  # 2 min for user to complete login
            text=True
        )
        
        if result.returncode == 0:
            return True, "Login successful"
        else:
            return False, "Login cancelled or failed"
            
    except subprocess.TimeoutExpired:
        return False, "Login timed out"
    except Exception as e:
        return False, str(e)


def set_api_key(api_key: str, callback=None) -> tuple[bool, str]:
    """
    Set ANTHROPIC_API_KEY for BYOK authentication.
    Validates the key before saving.
    """
    if not api_key or not api_key.startswith("sk-"):
        return False, "Invalid API key format"
    
    if callback:
        callback("Validating API key...")
    
    try:
        # Validate key by making a simple API call
        import urllib.request
        import urllib.error
        
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            method="POST",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            data=json.dumps({
                "model": "claude-3-haiku-20240307",
                "max_tokens": 1,
                "messages": [{"role": "user", "content": "hi"}]
            }).encode()
        )
        
        try:
            urllib.request.urlopen(req, timeout=10)
            # Key is valid
        except urllib.error.HTTPError as e:
            if e.code == 401:
                return False, "Invalid API key"
            # Other errors (rate limit, etc) mean key is valid
        
        if callback:
            callback("Saving API key...")
        
        # Save to shell profile
        shell_rc = Path.home() / ".zshrc"
        if not shell_rc.exists():
            shell_rc = Path.home() / ".bashrc"
        
        # Also set in current environment
        os.environ["ANTHROPIC_API_KEY"] = api_key
        
        # Append to shell config
        with open(shell_rc, "a") as f:
            f.write(f'\nexport ANTHROPIC_API_KEY="{api_key}"\n')
        
        return True, "API key saved successfully"
        
    except Exception as e:
        return False, str(e)


# =============================================================================
# UTILITY
# =============================================================================

def get_system_info() -> dict:
    """Get system information for diagnostics."""
    import platform
    
    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "machine": platform.machine(),
        "python": platform.python_version(),
        "home": str(Path.home()),
        "cwd": os.getcwd(),
    }


if __name__ == "__main__":
    # CLI mode for testing
    print("Running preflight checks...")
    result = preflight_check()
    print(json.dumps(result.to_dict(), indent=2))
