@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo   ZhiYuanBang frontend launcher
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js 18 or later first.
  echo         Download: https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not found. Please reinstall Node.js.
  pause
  exit /b 1
)

echo [1/2] Installing dependencies (npm install) ...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed. Check your network and try again.
  pause
  exit /b 1
)

echo.
echo [2/2] Starting dev server (npm run dev) ...
echo       Open http://localhost:3000 in your browser. Press Ctrl+C to stop.
echo.
call npm run dev
if errorlevel 1 (
  echo [ERROR] Dev server exited with an error.
  pause
  exit /b 1
)

endlocal
