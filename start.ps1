# ==========================================
# DDE Pipeline Generator - Startup Script
# ==========================================
# This script starts all three services in separate PowerShell windows

param(
    [switch]$Help
)

if ($Help) {
    Write-Host @"

DDE Pipeline Generator - Startup Script
========================================

This script starts all three services required for the DDE Pipeline Generator:
  1. Validator Service (Python/Flask on port 5051)
  2. Backend API (Node.js/Express on port 5050)  
  3. Frontend UI (React/Vite on port 5173)

Usage:
  .\start.ps1              Start all services
  .\start.ps1 -Help        Show this help message

Requirements:
  - Node.js 20.x or higher
  - Python 3.9 or higher
  - UPB AI Gateway API key configured in .env file

Configuration:
  Edit the .env file in the root directory to configure your API key.

After starting:
  - Frontend will be available at: http://localhost:5173
  - Backend API at: http://localhost:5050
  - API docs at: http://localhost:5050/api-docs
  - Health check: http://localhost:5050/api/health

To stop all services:
  - Close all PowerShell windows, or press Ctrl+C in each window

"@
    exit 0
}

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
$ProjectRoot = $ScriptDir

# Colors
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"
$Blue = "Blue"

Write-Host "
?????????????????????????????????????????????
  DDE Pipeline Generator - Starting Services
?????????????????????????????????????????????
" -ForegroundColor $Cyan

# Check if .env exists
if (-not (Test-Path "$ProjectRoot\.env")) {
    Write-Host "[!] Warning: .env file not found!" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "Creating .env from template..." -ForegroundColor $Yellow
    
    if (Test-Path "$ProjectRoot\.env.example") {
        Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
        Write-Host "[OK] Created .env file" -ForegroundColor $Green
        Write-Host ""
        Write-Host "[!] IMPORTANT: Edit .env and add your UPB_API_KEY!" -ForegroundColor $Yellow
        Write-Host "   Get your API key from: https://ai-gateway.uni-paderborn.de/" -ForegroundColor $Cyan
        Write-Host ""
        
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "Aborted. Please configure .env first." -ForegroundColor $Red
            exit 1
        }
    } else {
        Write-Host "[X] .env.example not found!" -ForegroundColor $Red
        exit 1
    }
} else {
    # Check if API key is configured
    $envContent = Get-Content "$ProjectRoot\.env" -Raw
    if ($envContent -match "UPB_API_KEY=your_api_key_here" -or $envContent -match "UPB_API_KEY=your_actual_api_key_here" -or $envContent -notmatch "UPB_API_KEY=\w+") {
        Write-Host "[!] Warning: UPB_API_KEY not configured in .env!" -ForegroundColor $Yellow
        Write-Host "   The application will not work without a valid API key." -ForegroundColor $Yellow
        Write-Host "   Get your API key from: https://ai-gateway.uni-paderborn.de/" -ForegroundColor $Cyan
        Write-Host ""
        
        $continue = Read-Host "Continue anyway? (y/N)"
        if ($continue -ne "y" -and $continue -ne "Y") {
            Write-Host "Aborted. Please configure UPB_API_KEY in .env first." -ForegroundColor $Red
            exit 1
        }
    } else {
        Write-Host "[OK] Configuration file found" -ForegroundColor $Green
    }
}

# Check for running services on ports
Write-Host ""
Write-Host "Checking for port conflicts..." -ForegroundColor $Cyan

$portsInUse = @()
$portsToCheck = @{
    "5051" = "Validator"
    "5050" = "Backend"
    "5173" = "Frontend"
}

foreach ($port in $portsToCheck.Keys) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $service = $portsToCheck[$port]
        $portsInUse += "Port $port ($service)"
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "[!] Warning: The following ports are already in use:" -ForegroundColor $Yellow
    foreach ($port in $portsInUse) {
        Write-Host "   - $port" -ForegroundColor $Yellow
    }
    Write-Host ""
    $continue = Read-Host "Kill existing processes and continue? (Y/n)"
    if ($continue -ne "n" -and $continue -ne "N") {
        foreach ($port in $portsToCheck.Keys) {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            foreach ($conn in $connections) {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "[OK] Killed existing processes" -ForegroundColor $Green
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor $Cyan
Write-Host ""

# Function to start service in new window
function Start-Service {
    param(
        [string]$Name,
        [string]$WorkingDir,
        [string]$Command,
        [string]$Color
    )
    
    Write-Host "  Starting $Name..." -ForegroundColor $Color -NoNewline
    
    $fullPath = Join-Path $ProjectRoot $WorkingDir
    if (-not (Test-Path $fullPath)) {
        Write-Host " [X]" -ForegroundColor $Red
        Write-Host "    Error: Directory not found: $fullPath" -ForegroundColor $Red
        return $false
    }
    
    try {
        $cmd = "cd '$fullPath'; Write-Host '`n$Name Service`n' -ForegroundColor $Color; $Command"
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Normal
        Write-Host " [OK]" -ForegroundColor $Green
        return $true
    } catch {
        Write-Host " [X]" -ForegroundColor $Red
        Write-Host "    Error: $_" -ForegroundColor $Red
        return $false
    }
}

# Start services
$services = @(
    @{Name="Validator"; Dir="dde-validator"; Command="python app.py"; Color=$Yellow},
    @{Name="Backend"; Dir="dde-server"; Command="npm run dev"; Color=$Blue},
    @{Name="Frontend"; Dir="dde-ui"; Command="npm run dev"; Color=$Green}
)

$successCount = 0
foreach ($svc in $services) {
    if (Start-Service -Name $svc.Name -WorkingDir $svc.Dir -Command $svc.Command -Color $svc.Color) {
        $successCount++
    }
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "?????????????????????????????????????????????" -ForegroundColor $Cyan

if ($successCount -eq 3) {
    Write-Host ""
    Write-Host "[OK] All services started successfully!" -ForegroundColor $Green
    Write-Host ""
    Write-Host "  Please wait 10-15 seconds for services to initialize..." -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "  Frontend:  " -NoNewline -ForegroundColor $Cyan
    Write-Host "http://localhost:5173" -ForegroundColor $Blue
    Write-Host "  Backend:   " -NoNewline -ForegroundColor $Cyan
    Write-Host "http://localhost:5050/api/health" -ForegroundColor $Blue
    Write-Host "  API Docs:  " -NoNewline -ForegroundColor $Cyan
    Write-Host "http://localhost:5050/api-docs" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "  To stop: Close all PowerShell windows or press Ctrl+C in each" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "?????????????????????????????????????????????" -ForegroundColor $Cyan
    Write-Host ""
    
    # Wait a bit then check health
    Write-Host "Waiting for services to start..." -ForegroundColor $Cyan
    Start-Sleep -Seconds 12
    
    Write-Host ""
    Write-Host "Service Status:" -ForegroundColor $Cyan
    
    # Check validator
    Write-Host "  Validator (5051): " -NoNewline
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:5051/health" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[OK] Running" -ForegroundColor $Green
    } catch {
        Write-Host "[...] Starting..." -ForegroundColor $Yellow
    }
    
    # Check backend
    Write-Host "  Backend   (5050): " -NoNewline
    try {
        $null = Invoke-RestMethod -Uri "http://localhost:5050/api/health" -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[OK] Running" -ForegroundColor $Green
    } catch {
        Write-Host "[...] Starting..." -ForegroundColor $Yellow
    }
    
    # Check frontend
    Write-Host "  Frontend  (5173): " -NoNewline
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[OK] Running" -ForegroundColor $Green
    } catch {
        # Check port 5174 (Vite fallback)
        try {
            $null = Invoke-WebRequest -Uri "http://localhost:5174" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            Write-Host "[OK] Running on port 5174" -ForegroundColor $Green
        } catch {
            Write-Host "[...] Starting..." -ForegroundColor $Yellow
        }
    }
    
    Write-Host ""
    Write-Host "If services show 'Starting...', wait a few more seconds and refresh." -ForegroundColor $Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[!] Some services failed to start" -ForegroundColor $Yellow
    Write-Host "   Check the error messages above" -ForegroundColor $Yellow
    Write-Host ""
}

Write-Host "Press any key to close this window..." -ForegroundColor $Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
