@echo off
echo ================================
echo API Tester Startup
echo ================================

echo.
echo Cleaning up ports...
netstat -ano | findstr :3001 | findstr LISTENING
netstat -ano | findstr :5173 | findstr LISTENING

echo.
echo Killing existing processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Waiting for ports to be released...
timeout /t 2 /nobreak

echo.
echo Starting server...
cd /d "%~dp0"
start cmd /k "npm run dev"

exit
