# NeuralMesh Agent Installer for Windows
# PowerShell script to install and configure the NeuralMesh agent

param(
    [Parameter(Mandatory=$false)]
    [string]$ServerUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$PairingCode,
    
    [Parameter(Mandatory=$false)]
    [string]$NodeName = $env:COMPUTERNAME,
    
    [Parameter(Mandatory=$false)]
    [int]$UpdateInterval = 2,
    
    [Parameter(Mandatory=$false)]
    [string]$InstallPath = "$env:USERPROFILE\neuralmesh-agent"
)

function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Banner
Write-Host ""
Write-ColorOutput Cyan @"
 _   _                      _ __  __           _     
| \ | | ___ _   _ _ __ __ _| |  \/  | ___  ___| |__  
|  \| |/ _ \ | | | '__/ _` | | |\/| |/ _ \/ __| '_ \ 
| |\  |  __/ |_| | | | (_| | | |  | |  __/\__ \ | | |
|_| \_|\___|\__,_|_|  \__,_|_|_|  |_|\___||___/_| |_|
"@
Write-Host ""
Write-ColorOutput Green "NeuralMesh Agent Installer v1.0.0"
Write-Host ""

# Check for Administrator privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-ColorOutput Yellow "Warning: Not running as Administrator. Service installation may be limited."
    Write-Host ""
}

# Prompt for server if not provided
if (-not $ServerUrl) {
    Write-ColorOutput Yellow "Enter NeuralMesh server details:"
    Write-Host ""
    $ServerIP = Read-Host "Server IP or hostname (e.g., 192.168.1.100 or localhost)"
    if ([string]::IsNullOrWhiteSpace($ServerIP)) {
        $ServerIP = "localhost"
    }
    $ServerUrl = "ws://${ServerIP}:3001/agent"
}

# Prompt for pairing code if not provided (OPTIONAL - for future use)
if (-not $PairingCode) {
    Write-Host ""
    Write-ColorOutput Blue "Pairing Code (Optional):"
    Write-Host "  Note: Pairing code is 6 characters (e.g., ABC123)"
    Write-Host "  Get from: Dashboard → Devices → Add Device"
    Write-Host "  Press Enter to skip (direct connection mode)"
    Write-Host ""
    $PairingCode = Read-Host "Enter pairing code or press Enter to skip"
}

# Validate server URL is provided
if ([string]::IsNullOrWhiteSpace($ServerUrl)) {
    Write-ColorOutput Red "Error: Server URL is required"
    exit 1
}

Write-Host ""
Write-ColorOutput Green "✓ Configuration validated"
Write-Host "  Server: $ServerUrl"
Write-Host "  Device: $NodeName"
Write-Host "  Interval: ${UpdateInterval}s"

# Create installation directory
Write-Host ""
Write-ColorOutput Blue "Setting up installation..."
New-Item -ItemType Directory -Force -Path $InstallPath | Out-Null
Write-ColorOutput Green "✓ Created directory: $InstallPath"

# Download agent binary
Write-Host ""
Write-ColorOutput Blue "Downloading NeuralMesh agent..."

$agentUrl = "https://github.com/MrNova420/NeuralMesh/releases/latest/download/neuralmesh-agent-windows-amd64.exe"
$agentPath = "$InstallPath\neuralmesh-agent.exe"

try {
    Invoke-WebRequest -Uri $agentUrl -OutFile $agentPath -ErrorAction Stop
    Write-ColorOutput Green "✓ Downloaded agent from GitHub releases"
} catch {
    Write-ColorOutput Yellow "⚠ Could not download from GitHub, attempting alternate source..."
    
    # Try alternate download or compile from source
    Write-ColorOutput Red "✗ Cannot download agent binary"
    Write-Host "Please download manually from: https://github.com/MrNova420/NeuralMesh/releases"
    exit 1
}

# Create configuration file
Write-Host ""
Write-ColorOutput Blue "Creating configuration..."

$config = @"
# NeuralMesh Agent Configuration
SERVER_URL=$ServerUrl
PAIRING_CODE=$PairingCode
NODE_NAME=$NodeName
UPDATE_INTERVAL=$UpdateInterval
LOG_LEVEL=info
"@

Set-Content -Path "$InstallPath\config.env" -Value $config
Write-ColorOutput Green "✓ Configuration saved"

# Test agent
Write-Host ""
Write-ColorOutput Blue "Testing agent binary..."
try {
    $version = & "$agentPath" --version 2>&1
    Write-ColorOutput Green "✓ Agent binary is working"
} catch {
    Write-ColorOutput Yellow "⚠ Could not verify agent binary"
}

# Setup service
Write-Host ""
Write-ColorOutput Blue "Setting up service..."

$serviceName = "NeuralMeshAgent"
$serviceDisplayName = "NeuralMesh Agent"
$serviceDescription = "NeuralMesh monitoring and management agent"

# Create start script
$startScript = @"
`$serverUrl = "$ServerUrl"
`$nodeName = "$NodeName"
`$interval = $UpdateInterval

cd "$InstallPath"
.\neuralmesh-agent.exe --server `$serverUrl --name `"`$nodeName`" --interval `$interval
"@

Set-Content -Path "$InstallPath\start-agent.ps1" -Value $startScript

# Create stop script
$stopScript = @"
Stop-Process -Name "neuralmesh-agent" -Force -ErrorAction SilentlyContinue
if (`$?) {
    Write-Host "Agent stopped"
} else {
    Write-Host "Agent not running"
}
"@

Set-Content -Path "$InstallPath\stop-agent.ps1" -Value $stopScript

if ($isAdmin) {
    # Try to create scheduled task
    try {
        $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -NoProfile -File `"$InstallPath\start-agent.ps1`""
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
        
        # Unregister if exists
        Unregister-ScheduledTask -TaskName $serviceName -Confirm:$false -ErrorAction SilentlyContinue
        
        Register-ScheduledTask -TaskName $serviceName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description $serviceDescription | Out-Null
        
        # Start the task
        Start-ScheduledTask -TaskName $serviceName
        
        Write-ColorOutput Green "✓ Service configured and started (Scheduled Task)"
        Write-Host ""
        Write-ColorOutput Blue "Service commands:"
        Write-Host "  Status:  Get-ScheduledTask -TaskName '$serviceName'"
        Write-Host "  Stop:    Stop-ScheduledTask -TaskName '$serviceName'"
        Write-Host "  Start:   Start-ScheduledTask -TaskName '$serviceName'"
        Write-Host "  Remove:  Unregister-ScheduledTask -TaskName '$serviceName'"
        
    } catch {
        Write-ColorOutput Yellow "⚠ Could not create scheduled task: $_"
        Write-ColorOutput Yellow "Agent must be started manually"
    }
} else {
    Write-ColorOutput Yellow "⚠ Not running as Administrator - service not installed"
    Write-ColorOutput Yellow "Starting agent manually..."
    
    # Start agent in background
    Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -NoProfile -File `"$InstallPath\start-agent.ps1`"" -WindowStyle Hidden
    
    Write-ColorOutput Green "✓ Agent started"
    Write-Host ""
    Write-ColorOutput Blue "Agent commands:"
    Write-Host "  Start:  powershell -File '$InstallPath\start-agent.ps1'"
    Write-Host "  Stop:   powershell -File '$InstallPath\stop-agent.ps1'"
}

# Configure Windows Firewall
if ($isAdmin) {
    Write-Host ""
    Write-ColorOutput Blue "Configuring Windows Firewall..."
    try {
        New-NetFirewallRule -DisplayName "NeuralMesh Agent" -Direction Outbound -Action Allow -Protocol TCP -RemoteAddress Any -ErrorAction SilentlyContinue | Out-Null
        Write-ColorOutput Green "✓ Firewall configured"
    } catch {
        Write-ColorOutput Yellow "⚠ Could not configure firewall"
    }
}

# Summary
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-ColorOutput Green "     NeuralMesh Agent Installation Complete!"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-ColorOutput Blue "📁 Installation Details:"
Write-Host "   Location:  $InstallPath"
Write-Host "   Server:    $ServerUrl"
Write-Host "   Device:    $NodeName"
Write-Host ""
Write-ColorOutput Blue "🔗 Connection:"
Write-Host "   Your device should appear in the NeuralMesh dashboard within seconds!"
$dashboardUrl = $ServerUrl -replace ":3001/agent", ":5173"
$dashboardUrl = $dashboardUrl -replace "ws://", "http://"
$dashboardUrl = $dashboardUrl -replace "wss://", "https://"
Write-Host "   Dashboard: $dashboardUrl"
Write-Host ""
Write-ColorOutput Blue "📝 Files:"
Write-Host "   Config:     $InstallPath\config.env"
Write-Host "   Start:      $InstallPath\start-agent.ps1"
Write-Host "   Stop:       $InstallPath\stop-agent.ps1"
Write-Host ""
Write-ColorOutput Green "✨ Agent is now running and connected to your NeuralMesh! ✨"
Write-Host ""
