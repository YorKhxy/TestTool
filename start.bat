@echo off
echo ================================
echo API Tester Startup
echo ================================

echo.
echo Cleaning up ports...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo Killing process on port 3001: %%a
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Killing process on port 5173: %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo Waiting for ports to be released...
timeout /t 2 /nobreak

echo.
echo Starting server...
cd /d "%~dp0"
start cmd /k "npm run dev"

exit
