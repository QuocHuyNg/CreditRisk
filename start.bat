@echo off
title CreditScore AI – Starting...
color 0A

echo.
echo  =========================================
echo    CreditScore AI ^| Starting Server...
echo  =========================================
echo.

:: Kill any existing instance on port 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Start Flask in background
cd /d "%~dp0"
start "" /B python backend\app.py > server.log 2>&1

:: Wait for server to be ready
echo  Waiting for server to start...
:WAIT
timeout /t 1 /nobreak >nul
findstr /c:"Running on" server.log >nul 2>&1
if errorlevel 1 goto WAIT

:: Open browser
echo  Server is ready! Opening browser...
start "" "http://localhost:5000"

echo.
echo  =========================================
echo    Server running at: http://localhost:5000
echo    Log file: server.log
echo    To stop: run stop.bat
echo  =========================================
echo.
echo  Press any key to close this window (server keeps running)...
pause >nul
