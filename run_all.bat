@echo off
echo ===================================================
echo Launching SoybeanCare AI Premium (Backend + Frontend)
echo ===================================================
cd /d "%~dp0"
start "SoybeanCare Backend (Flask API:5000)" cmd /k "run_backend.bat"
timeout /t 3 /nobreak >nul
start "SoybeanCare Frontend (Vite:5173)" cmd /k "run_frontend.bat"
echo Services launched! Backend: http://127.0.0.1:5000 | Frontend: http://localhost:5173
