@echo off
title CreditScore AI – Stopping...
color 0C

echo.
echo  =========================================
echo    CreditScore AI ^| Stopping Server...
echo  =========================================
echo.

:: Kill process on port 5000
set FOUND=0
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
    set FOUND=1
)

if "%FOUND%"=="1" (
    echo  Server stopped successfully.
) else (
    echo  No server was running on port 5000.
)

:: Clean up log
if exist "%~dp0server.log" del "%~dp0server.log" >nul 2>&1

echo.
echo  Done. Press any key to close...
pause >nul
