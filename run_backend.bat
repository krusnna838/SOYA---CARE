@echo off
echo ===================================================
echo Starting SoybeanCare AI Backend (Flask + SQLite)
echo ===================================================
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe backend\app.py
) else if exist "SOYA_CARE\.venv\Scripts\python.exe" (
    SOYA_CARE\.venv\Scripts\python.exe backend\app.py
) else (
    python backend\app.py
)
pause
