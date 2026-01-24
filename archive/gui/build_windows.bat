@echo off
echo ========================================
echo   Building Avaia GUI for Windows
echo ========================================
echo.

REM Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found! Please install Python 3.10+
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt
pip install pyinstaller

REM Clean previous builds
echo Cleaning previous builds...
rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul

REM Extract version from package.json and write to version.txt
echo Writing version file...
python -c "import json; print(json.load(open('../package.json'))['version'])" > version.txt
for /f %%i in (version.txt) do echo App version: %%i

REM Build with PyInstaller
echo Building application...
pyinstaller avaia_webview.spec --noconfirm

echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
echo EXE location: dist\Avaia\Avaia.exe
echo.
echo To distribute, zip the entire dist\Avaia folder.
pause
