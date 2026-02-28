@echo off
echo ============================================
echo  Meridian PE Analytics - Backend Server
echo ============================================
echo.

cd /d "%~dp0backend"

@REM :: Check if virtual environment exists
@REM if not exist "venv" (
@REM     echo Creating Python virtual environment...
@REM     python -m venv venv
@REM )

@REM :: Activate virtual environment
@REM call venv\Scripts\activate.bat

:: Install dependencies
echo Installing dependencies...
@REM pip install -r requirements.txt -q

echo.
echo Starting FastAPI server on http://localhost:8000
echo API docs available at http://localhost:8000/docs
echo.

uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
