#!/bin/bash
# Avaia GUI Launcher
# Double-click this file to start Avaia

cd "$(dirname "$0")"

# Activate venv and run
source venv/bin/activate
python3 server.py
