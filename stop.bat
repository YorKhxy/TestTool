@echo off
echo Killing API Tester servers...

echo Killing all node.exe processes...
taskkill /F /IM node.exe 2>nul

echo Killing all cmd.exe processes (including started windows)...
taskkill /F /IM cmd.exe 2>nul

echo Done
pause
