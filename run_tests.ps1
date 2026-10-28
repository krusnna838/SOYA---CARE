Write-Host "===================================================" -ForegroundColor Magenta
Write-Host "Running SoybeanCare AI Pytest Suite" -ForegroundColor Magenta
Write-Host "===================================================" -ForegroundColor Magenta

Set-Location -Path $PSScriptRoot

$pythonPath = if (Test-Path ".\.venv\Scripts\python.exe") {
    ".\.venv\Scripts\python.exe"
} elseif (Test-Path ".\SOYA_CARE\.venv\Scripts\python.exe") {
    ".\SOYA_CARE\.venv\Scripts\python.exe"
} else {
    "python"
}

& $pythonPath -m pytest backend\tests -v
