# NeuralMesh Startup Script for Windows
# Starts backend and frontend services

param(
    [switch]$Production
)

$ErrorActionPreference = "Continue"

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host ""
Write-ColorOutput Cyan "🧠 Starting NeuralMesh..."
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if backend port is in use
$backendPort = 3000
$backendRunning = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue

if ($backendRunning) {
    Write-ColorOutput Yellow "⚠️  Backend already running on port $backendPort"
} else {
    Write-ColorOutput Green "🔥 Starting Backend..."
    $backendPath = Join-Path $scriptDir "backend"
    
    if ($Production) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start" -WindowStyle Normal
    } else {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal
    }
    
    Write-ColorOutput Green "✓ Backend started"
    Start-Sleep -Seconds 3
}

# Check if frontend port is in use
$frontendPort = 5173
$frontendRunning = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue

if ($frontendRunning) {
    Write-ColorOutput Yellow "⚠️  Frontend already running on port $frontendPort"
} else {
    Write-ColorOutput Green "⚡ Starting Frontend..."
    $frontendPath = Join-Path $scriptDir "frontend"
    
    if ($Production) {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run preview" -WindowStyle Normal
    } else {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal
    }
    
    Write-ColorOutput Green "✓ Frontend started"
    Start-Sleep -Seconds 3
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-ColorOutput Green "✅ NeuralMesh is running!"
Write-Host ""
Write-ColorOutput Cyan "🌐 Frontend:  http://localhost:$frontendPort"
Write-ColorOutput Cyan "🔌 Backend:   http://localhost:$backendPort"
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Host "🛑 To stop: Close the terminal windows or run .\stop-windows.ps1"
Write-Host ""
