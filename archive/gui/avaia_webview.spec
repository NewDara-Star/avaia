# -*- mode: python ; coding: utf-8 -*-
"""
Avaia GUI PyInstaller Spec File - With Native WebView
Creates macOS .app bundle with embedded WebKit view

Usage: pyinstaller avaia_webview.spec
"""

import os
import sys

SPEC_DIR = os.path.dirname(os.path.abspath(SPECPATH)) if 'SPECPATH' in dir() else os.getcwd()

# Read version from version.txt (created by build script)
VERSION = '1.0.0'  # Default fallback
version_file = os.path.join(SPEC_DIR, 'version.txt')
if os.path.exists(version_file):
    with open(version_file, 'r') as f:
        VERSION = f.read().strip()
print(f"Building Avaia version: {VERSION}")

a = Analysis(
    ['server_webview.py'],
    pathex=[SPEC_DIR],
    binaries=[],
    datas=[
        ('templates', 'templates'),
        ('static', 'static'),
        ('icon.icns', '.'),
        ('avaia_prompt.txt', '.'),
        ('setup_wizard.py', '.'),  # Setup wizard module
        ('version.txt', '.'),  # App version (created by build script)
        ('../src/server/db/migrations', 'migrations'),  # Database migrations
    ],
    hiddenimports=[
        # Flask-SocketIO threading mode requirement
        'engineio.async_drivers.threading',
        # Flask dependencies
        'jinja2',
        'markupsafe',
        'werkzeug',
        'click',
        'itsdangerous',
        # SocketIO dependencies
        'flask_socketio',
        'socketio',
        'engineio',
        'simple_websocket',
        'wsproto',
        # pexpect for MCP interaction
        'pexpect',
        'ptyprocess',
        # Database
        'sqlite3',
        # pywebview macOS (Cocoa/WebKit)
        'webview',
        'webview.platforms.cocoa',
        'objc',
        'AppKit',
        'Foundation',
        'WebKit',
        # MCP Tools module
        'avaia_tools',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'matplotlib',
        'numpy',
        'pandas',
        'scipy',
        'PIL',
        'cv2',
        'tensorflow',
        'torch',
        'pytest',
        'unittest',
        # Exclude other pywebview platforms
        'webview.platforms.gtk',
        'webview.platforms.qt',
        'webview.platforms.winforms',
        'webview.platforms.cef',
        'webview.platforms.edgechromium',
    ],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='Avaia',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # No console window
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.icns',
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='Avaia',
)

# macOS App Bundle
app = BUNDLE(
    coll,
    name='Avaia.app',
    icon='icon.icns',
    bundle_identifier='com.newdara.avaia',
    info_plist={
        'CFBundleName': 'Avaia',
        'CFBundleDisplayName': 'Avaia',
        'CFBundleGetInfoString': 'AI Programming Teacher',
        'CFBundleIdentifier': 'com.newdara.avaia',
        'CFBundleVersion': VERSION,
        'CFBundleShortVersionString': VERSION,
        'LSMinimumSystemVersion': '10.15',
        'NSHighResolutionCapable': True,
        'LSBackgroundOnly': False,
        'NSRequiresAquaSystemAppearance': False,  # Support Dark Mode
        # Required for WebView
        'NSAppTransportSecurity': {
            'NSAllowsLocalNetworking': True,
        },
    },
)
