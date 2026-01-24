# -*- mode: python ; coding: utf-8 -*-
"""
Avaia GUI PyInstaller Spec File
Creates macOS .app bundle with Flask-SocketIO support

Usage: pyinstaller avaia.spec
"""

import os
import sys

# Get the directory containing this spec file
SPEC_DIR = os.path.dirname(os.path.abspath(SPECPATH)) if 'SPECPATH' in dir() else os.getcwd()

a = Analysis(
    ['server.py'],
    pathex=[SPEC_DIR],
    binaries=[],
    datas=[
        ('templates', 'templates'),
        ('static', 'static'),
        ('icon.icns', '.'),
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
    target_arch=None,  # Build for current architecture
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
        'CFBundleVersion': '1.2.0',
        'CFBundleShortVersionString': '1.2.0',
        'LSMinimumSystemVersion': '10.15',
        'NSHighResolutionCapable': True,
        'LSBackgroundOnly': False,
        'NSRequiresAquaSystemAppearance': False,  # Support Dark Mode
    },
)
