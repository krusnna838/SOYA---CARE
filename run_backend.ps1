Write-Host "===================================================" -ForegroundColor Green
Write-Host "Starting SoybeanCare AI Backend on http://127.0.0.1:5000" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

Set-Location -Path $PSScriptRoot

$pythonPath = if (Test-Path ".\.venv\Scripts\python.exe") {
    ".\.venv\Scripts\python.exe"
} elseif (Test-Path ".\SOYA_CARE\.venv\Scripts\python.exe") {
    ".\SOYA_CARE\.venv\Scripts\python.exe"
} else {
    "python"
}

& $pythonPath backend\app.py
