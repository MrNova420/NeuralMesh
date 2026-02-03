# NeuralMesh Stop Script for Windows
# Stops backend and frontend services

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
Write-ColorOutput Yellow "🛑 Stopping NeuralMesh..."
Write-Host ""

# Stop processes on backend port
$backendPort = 3000
$backendProcesses = Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue
if ($backendProcesses) {
    $backendProcesses | ForEach-Object {
        $processId = $_.OwningProcess
        Stop-Process -Id $processId -Force
        Write-ColorOutput Green "✓ Stopped backend process (PID: $processId)"
    }
} else {
    Write-ColorOutput Yellow "⚠️  No backend process found on port $backendPort"
}

# Stop processes on frontend port
$frontendPort = 5173
$frontendProcesses = Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue
if ($frontendProcesses) {
    $frontendProcesses | ForEach-Object {
        $processId = $_.OwningProcess
        Stop-Process -Id $processId -Force
        Write-ColorOutput Green "✓ Stopped frontend process (PID: $processId)"
    }
} else {
    Write-ColorOutput Yellow "⚠️  No frontend process found on port $frontendPort"
}

Write-Host ""
Write-ColorOutput Green "✅ NeuralMesh stopped"
Write-Host ""
