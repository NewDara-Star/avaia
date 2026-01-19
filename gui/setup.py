"""
py2app build script for Avaia GUI
Run: python setup.py py2app
"""

from setuptools import setup

APP = ['server.py']
DATA_FILES = [
    ('templates', ['templates/index.html', 'templates/setup.html', 'templates/dashboard.html']),
    ('static', ['static/style.css', 'static/setup.css', 'static/shared.js', 'static/socket.io.min.js']),
    ('migrations', [
        '../src/server/db/migrations/001_initial.sql',
        '../src/server/db/migrations/002_session_notes.sql',
        '../src/server/db/migrations/003_learner_terms.sql',
        '../src/server/db/migrations/004_chat_history.sql',
        '../src/server/db/migrations/005_learning_profiles.sql',
        '../src/server/db/migrations/006_learning_tracks.sql',
        '../src/server/db/migrations/008_seed_curriculum.sql',
    ]),
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
