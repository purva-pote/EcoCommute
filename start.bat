@echo off
REM EcoCommute launcher: installs packages (first time), starts the server, opens Google Chrome
cd /d "%~dp0"
title EcoCommute server
if not exist node_modules (
  echo Installing packages, please wait...
  call npm install
)
REM Open Chrome 3 seconds after the server starts (falls back to the default browser)
start "" /min powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep 3; try { Start-Process chrome http://localhost:3000 -ErrorAction Stop } catch { Start-Process http://localhost:3000 }"
call npm start
pause
