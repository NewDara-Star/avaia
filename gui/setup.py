"""
py2app build script for Avaia GUI
Run: python setup.py py2app
"""

from setuptools import setup

APP = ['server.py']
DATA_FILES = [
    ('templates', ['templates/index.html']),
    ('static', ['static/style.css']),
]

OPTIONS = {
    'argv_emulation': False,
    'iconfile': 'icon.icns',
    'plist': {
        'CFBundleName': 'Avaia',
        'CFBundleDisplayName': 'Avaia',
        'CFBundleIdentifier': 'com.avaia.gui',
        'CFBundleVersion': '1.0.0',
        'CFBundleShortVersionString': '1.0.0',
        'LSMinimumSystemVersion': '10.15',
        'NSHighResolutionCapable': True,
        'LSBackgroundOnly': False,
    },
    'packages': [
        'flask',
        'flask_socketio',
        'socketio',
        'engineio',
        'simple_websocket',
    ],
    'includes': [
        'jinja2',
        'markupsafe',
        'werkzeug',
        'click',
    ],
}

setup(
    name='Avaia',
    app=APP,
    data_files=DATA_FILES,
    options={'py2app': OPTIONS},
    setup_requires=['py2app'],
)
