# NeuralMesh Agent Installer for Windows
# PowerShell script to install and configure the NeuralMesh agent

param(
    [Parameter(Mandatory=$false)]
    [string]$Server,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = "C:\Program Files\NeuralMesh\Agent"
)

# Requires running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "This script must be run as Administrator"
    exit 1
}

Write-Host "=======================================" -ForegroundColor Green
Write-Host "  NeuralMesh Agent Installer v1.0.0" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Prompt for server if not provided
if (-not $Server) {
    $Server = Read-Host "Enter NeuralMesh server URL"
}

# Prompt for API key if not provided
if (-not $ApiKey) {
    $ApiKey = Read-Host "Enter API key"
}

# Validate inputs
if (-not $Server -or -not $ApiKey) {
    Write-Error "Server URL and API key are required"
    exit 1
}

Write-Host "[OK] Configuration validated" -ForegroundColor Green

# Create installation directory
Write-Host ""
Write-Host "Creating installation directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null

# Create agent script
$agentScript = @"
`$server = "$Server"
`$apiKey = "$ApiKey"

while (`$true) {
    try {
        `$hostname = `$env:COMPUTERNAME
        `$cpu = (Get-Counter '\Processor(_Total)\% Processor Time').CounterSamples.CookedValue
        `$memory = (Get-Counter '\Memory\% Committed Bytes In Use').CounterSamples.CookedValue
        `$disk = (Get-PSDrive C).Used / (Get-PSDrive C).Used + (Get-PSDrive C).Free * 100
        
        `$body = @{
            hostname = `$hostname
            cpu = `$cpu
            memory = `$memory
            disk = `$disk
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "`$server/api/nodes/heartbeat" `
            -Method POST `
            -Headers @{Authorization = "Bearer `$apiKey"} `
            -Body `$body `
            -ContentType "application/json" | Out-Null
    } catch {
        Write-Host "Error sending heartbeat: `$_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 30
}
"@

Set-Content -Path "$InstallPath\agent.ps1" -Value $agentScript

# Create configuration file
$config = @{
    serverUrl = $Server
    apiKey = $ApiKey
    hostname = $env:COMPUTERNAME
    updateInterval = 30
} | ConvertTo-Json

Set-Content -Path "$InstallPath\config.json" -Value $config

Write-Host "[OK] Agent installed" -ForegroundColor Green

# Create Windows Service
Write-Host "Setting up Windows service..." -ForegroundColor Yellow

$serviceName = "NeuralMeshAgent"
$serviceDisplayName = "NeuralMesh Agent"
$serviceDescription = "NeuralMesh monitoring and management agent"

# Create service wrapper
$serviceWrapper = @"
`$scriptPath = "$InstallPath\agent.ps1"
powershell.exe -ExecutionPolicy Bypass -NoProfile -File `$scriptPath
"@

Set-Content -Path "$InstallPath\service.ps1" -Value $serviceWrapper

# Install service using NSSM (if available) or sc.exe
if (Get-Command nssm -ErrorAction SilentlyContinue) {
    nssm install $serviceName powershell.exe -ExecutionPolicy Bypass -NoProfile -File "$InstallPath\agent.ps1"
    nssm set $serviceName Description $serviceDescription
    nssm set $serviceName Start SERVICE_AUTO_START
} else {
    # Create scheduled task as fallback
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$InstallPath\agent.ps1`""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
    
    Register-ScheduledTask -TaskName $serviceName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $serviceDescription
    
    Write-Host "[OK] Service configured (Scheduled Task)" -ForegroundColor Green
}

# Start service
try {
    Start-Service $serviceName -ErrorAction SilentlyContinue
    if (-not $?) {
        Start-ScheduledTask -TaskName $serviceName
    }
    Write-Host "[OK] Service started" -ForegroundColor Green
} catch {
    Write-Warning "Could not start service automatically. Please start it manually."
}

# Configure firewall
Write-Host "Configuring Windows Firewall..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "NeuralMesh Agent" -Direction Outbound -Action Allow -Protocol TCP -RemoteAddress Any -ErrorAction SilentlyContinue | Out-Null
Write-Host "[OK] Firewall configured" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "   Installation Complete!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Agent installed to: " -NoNewline
Write-Host $InstallPath -ForegroundColor Green
Write-Host "Server: " -NoNewline
Write-Host $Server -ForegroundColor Green
Write-Host ""
Write-Host "Service name: " -NoNewline
Write-Host $serviceName -ForegroundColor Green
Write-Host ""
Write-Host "To check service status:" -ForegroundColor Yellow
Write-Host "  Get-Service $serviceName" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the service:" -ForegroundColor Yellow
Write-Host "  Stop-Service $serviceName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration saved to:" -ForegroundColor Yellow
Write-Host "  $InstallPath\config.json" -ForegroundColor Cyan
Write-Host ""
