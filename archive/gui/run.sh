#!/bin/bash
#
# Run Avaia GUI in development mode
# For testing before building the .app bundle
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create venv if needed
if [ ! -d "venv" ]; then
    echo "Setting up virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo "Starting Avaia GUI..."
echo "Opening http://127.0.0.1:5050 in your browser..."
echo "Press Ctrl+C to stop"
echo ""

python3 server.py
