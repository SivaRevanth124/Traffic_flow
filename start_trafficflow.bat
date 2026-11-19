@echo off
title TrafficFlow - City Traffic Intelligence Platform
color 0b

cd /d "%~dp0"

echo =====================================================================
echo       TrafficFlow: City Traffic Intelligence Platform
echo       Connecting cameras. Tracking vehicles. Discovering patterns.
echo =====================================================================
echo.

:: Add portable nodejs to PATH if present
if exist "%LOCALAPPDATA%\Programs\nodejs" (
    set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
)

echo [1/3] Verifying Python and Node.js runtimes...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH. Please install Python 3.10+.
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found in PATH.
    pause
    exit /b 1
)

echo [2/3] Launching FastAPI Backend on http://127.0.0.1:8000...
start "TrafficFlow Backend Core (FastAPI :8000)" cmd /k "cd /d "%~dp0" && python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo [3/3] Launching React Console on http://127.0.0.1:5173...
start "TrafficFlow Console (Vite :5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:5173"

echo.
echo =====================================================================
echo  Platform services successfully initiated!
echo  - Console: http://127.0.0.1:5173
echo  - API Docs: http://127.0.0.1:8000/docs
echo =====================================================================
echo.
