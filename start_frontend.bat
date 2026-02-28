@echo off
echo ============================================
echo  Meridian PE Analytics - Frontend Server
echo ============================================
echo.

cd /d "%~dp0frontend"

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
)

echo.
echo Starting Vite dev server on http://localhost:5173
echo.

npm run dev

pause
