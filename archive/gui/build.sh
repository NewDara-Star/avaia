#!/bin/bash
#
# Avaia GUI Build Script
# Creates a macOS .app bundle
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo "  Building Avaia GUI"
echo "========================================"
echo ""

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
pip install py2app -q
pip install pillow -q  # For icon generation

# Create icon if it doesn't exist
if [ ! -f "icon.icns" ]; then
    echo "Creating app icon..."
    python3 create_icon.py
fi

# Clean previous build
echo "Cleaning previous build..."
rm -rf build dist

# Build the app
echo "Building application..."
python3 setup.py py2app

# Check if build succeeded
if [ -d "dist/Avaia.app" ]; then
    echo ""
    echo "========================================"
    echo "  Build Successful!"
    echo "========================================"
    echo ""
    echo "App location: $SCRIPT_DIR/dist/Avaia.app"
    echo ""
    echo "To install, drag Avaia.app to your Applications folder."
    echo "Or run it directly: open dist/Avaia.app"
    echo ""

    # Optionally open the dist folder
    open dist/
else
    echo ""
    echo "Build failed. Check the error messages above."
    exit 1
fi
