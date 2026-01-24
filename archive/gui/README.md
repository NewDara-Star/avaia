# Avaia GUI

A native macOS app interface for Avaia, your AI programming tutor.

## Quick Start

### Option 1: Native App with Embedded WebView (Recommended)
```bash
./build_webview.sh
open dist/Avaia.app
```
This creates a **native macOS app** with the web interface embedded directly in the window — no external browser needed!

### Option 2: Browser-based (Development Mode)
```bash
./run.sh
```
This starts the server and opens your browser to `http://127.0.0.1:5050`.

### Option 3: Build Browser-launcher App
```bash
./build_pyinstaller.sh
```
Creates an app that launches the system browser (simpler, smaller).

## Requirements

- macOS 10.15 (Catalina) or later
- Python 3.9+
- Claude Code CLI installed and accessible in PATH (`which claude` should work)

## How It Works

The GUI is a Flask-based interface that:
1. Spawns Claude Code as a subprocess
2. Captures your input from the chat interface
3. Sends it to Claude Code with the Avaia MCP
4. Displays the response with nice formatting
5. Auto-logs all messages to the database (zero AI overhead)

All tutoring happens through Claude Code + Avaia MCP — the GUI provides the conversation interface.

## Files

| File | Purpose |
|------|---------|
| `server_webview.py` | Native app with pywebview (embedded WebKit) |
| `server.py` | Browser-based version |
| `avaia_webview.spec` | PyInstaller config for native webview |
| `avaia.spec` | PyInstaller config for browser version |
| `build_webview.sh` | Build native webview app |
| `build_pyinstaller.sh` | Build browser-launcher app |
| `templates/index.html` | Chat interface |
| `static/style.css` | Styling |
| `create_icon.py` | Generates the app icon |
| `run.sh` | Development mode runner |

## Troubleshooting

### "Failed to start Claude Code"
Make sure `claude` is in your PATH:
```bash
which claude
# Should return something like /usr/local/bin/claude
```

### Build fails
1. Install Xcode Command Line Tools: `xcode-select --install`
2. Try development mode first: `./run.sh`

### App won't open (macOS security)
Right-click the app and select **"Open"** to bypass Gatekeeper on first run.

### Native webview is blank
1. Check Flask server is running: `curl http://127.0.0.1:5050`
2. Try the browser version first: `./run.sh`

## Architecture

```
┌──────────────────────────────────────┐
│  Avaia.app                           │
│  ┌────────────────────────────────┐  │
│  │  pywebview (WebKit)            │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │  Flask UI (HTML/CSS/JS)  │  │  │
│  │  │  localhost:5050          │  │  │
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
│              ↓ subprocess            │
│  ┌────────────────────────────────┐  │
│  │  Claude Code CLI               │  │
│  │  + Avaia MCP Server            │  │
│  └────────────────────────────────┘  │
│              ↓ database              │
│  ~/.avaia/avaia.db                   │
└──────────────────────────────────────┘
```
