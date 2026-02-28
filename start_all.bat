@echo off
echo ============================================
echo  Meridian PE Analytics Platform
echo ============================================
echo.
echo Starting both servers...
echo.

start "PE Analytics - Backend" cmd /k "cd /d "%~dp0backend" && (if not exist venv python -m venv venv) && call venv\Scripts\activate.bat && pip install -r requirements.txt -q && echo Backend ready at http://localhost:8000 && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 5 /nobreak > nul

start "PE Analytics - Frontend" cmd /k "cd /d "%~dp0frontend" && (if not exist node_modules npm install) && echo Frontend ready at http://localhost:5173 && npm run dev"

echo.
echo Both servers are starting...
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Open http://localhost:5173 in your browser.
echo.
pause
