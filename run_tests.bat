@echo off
echo ===================================================
echo Running SoybeanCare AI Backend Pytest Suite
echo ===================================================
cd /d "%~dp0"
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe -m pytest backend\tests -v
) else if exist "SOYA_CARE\.venv\Scripts\python.exe" (
    SOYA_CARE\.venv\Scripts\python.exe -m pytest backend\tests -v
) else (
    python -m pytest backend\tests -v
)
pause
