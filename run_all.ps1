Write-Host "===================================================" -ForegroundColor Yellow
Write-Host "Launching SoybeanCare AI Premium (Backend + Frontend)" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Yellow

$scriptDir = $PSScriptRoot

Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $scriptDir "run_backend.ps1")
Start-Sleep -Seconds 3
Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $scriptDir "run_frontend.ps1")

Write-Host "`nBoth services started!" -ForegroundColor Green
Write-Host "Backend API: http://127.0.0.1:5000" -ForegroundColor Cyan
Write-Host "Frontend UI: http://localhost:5173`n" -ForegroundColor Cyan
