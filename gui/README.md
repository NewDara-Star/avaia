# Avaia GUI

A native macOS app interface for Avaia, your AI programming tutor.

## Quick Start

### Option 1: Run in development mode
```bash
./run.sh
```
This starts the server and opens your browser to `http://127.0.0.1:5050`.

### Option 2: Build the macOS app
```bash
./build.sh
```
This creates `dist/Avaia.app` which you can drag to your Applications folder.

## Requirements

- macOS 10.15 or later
- Python 3.9+
- Claude Code CLI installed and accessible in PATH

## How It Works

The GUI is a web-based interface that:
1. Spawns Claude Code as a subprocess
2. Captures your input from the chat interface
3. Sends it to Claude Code
4. Displays the response with nice formatting

All the actual tutoring happens through Claude Code + Avaia MCP - the GUI is just a prettier way to interact with it.

## Files

- `server.py` - Flask server with WebSocket for real-time communication
- `templates/index.html` - Chat interface
- `static/style.css` - Styling
- `setup.py` - py2app configuration for building .app
- `create_icon.py` - Generates the app icon
- `build.sh` - One-click build script
- `run.sh` - Development mode runner

## Troubleshooting

### "Failed to start Claude Code"
Make sure `claude` is in your PATH. Test by running `which claude` in Terminal.

### Build fails
1. Make sure you have Xcode Command Line Tools: `xcode-select --install`
2. Try running in development mode first: `./run.sh`

### App won't open (macOS security)
Right-click the app and select "Open" to bypass Gatekeeper on first run.
