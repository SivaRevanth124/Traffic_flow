# TrafficFlow: City Traffic Intelligence Platform - Startup Script (PowerShell)
$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "      TrafficFlow: City Traffic Intelligence Platform" -ForegroundColor White
Write-Host "      Connecting cameras. Tracking vehicles. Discovering patterns." -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

$nodePortable = "$env:LOCALAPPDATA\Programs\nodejs"
if (Test-Path $nodePortable) {
    $env:Path = "$nodePortable;" + $env:Path
}

Write-Host "[1/3] Checking environment dependencies..." -ForegroundColor Yellow
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
    Write-Host "[ERROR] Python 3.10+ is required." -ForegroundColor Red
    exit 1
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "[ERROR] Node.js is required." -ForegroundColor Red
    exit 1
}

Write-Host "[2/3] Launching FastAPI Backend Core on http://127.0.0.1:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 2

Write-Host "[3/3] Launching Vite React Console on http://127.0.0.1:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:Path = '$nodePortable;' + `$env:Path; Set-Location '$projectRoot\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:5173" -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if ($ready) {
    Start-Process "http://127.0.0.1:5173"
} else {
    Write-Host "[WARN] Frontend did not become ready within 20 seconds." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Green
Write-Host "  Platform services successfully initiated!" -ForegroundColor White
Write-Host "  - Web Console: http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host "  - API Swagger Docs: http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Green
