Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Starting SoybeanCare AI Frontend on http://localhost:5173" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

Set-Location -Path (Join-Path $PSScriptRoot "frontend")
npm run dev
