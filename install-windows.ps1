# NeuralMesh Windows Installer
# PowerShell script for automated installation on Windows

param(
    [string]$InstallDir = "$env:USERPROFILE\neuralmesh"
)

$ErrorActionPreference = "Stop"

# Colors for output
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
|_| \_|\___|\__,_|_|  \__,_|_|_  |_|\___||___/_| |_|
"@
Write-Host ""
Write-ColorOutput Green "NeuralMesh v1.0.0 - Windows Installer"
Write-Host ""

# Check for Administrator privileges
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-ColorOutput Yellow "Warning: Running without Administrator privileges."
    Write-ColorOutput Yellow "Some features may require elevation."
    Write-Host ""
}

# Check prerequisites
Write-ColorOutput Yellow "Checking prerequisites..."
Write-Host ""

# Check for Git
try {
    $gitVersion = git --version 2>$null
    Write-ColorOutput Green "✓ Git installed: $gitVersion"
} catch {
    Write-ColorOutput Red "✗ Git not found"
    Write-Host "Please install Git from: https://git-scm.com/download/win"
    exit 1
}

# Check for Node.js
try {
    $nodeVersion = node --version 2>$null
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -ge 18) {
        Write-ColorOutput Green "✓ Node.js installed: $nodeVersion"
    } else {
        Write-ColorOutput Yellow "⚠ Node.js version $nodeVersion is too old (need v18+)"
        Write-Host "Please upgrade from: https://nodejs.org/"
        exit 1
    }
} catch {
    Write-ColorOutput Red "✗ Node.js not found"
    Write-Host "Please install Node.js v18+ from: https://nodejs.org/"
    exit 1
}

# Check for Docker (optional)
try {
    $dockerVersion = docker --version 2>$null
    Write-ColorOutput Green "✓ Docker installed: $dockerVersion"
    $hasDocker = $true
} catch {
    Write-ColorOutput Yellow "⚠ Docker not found (optional)"
    $hasDocker = $false
}

# Ask installation method
Write-Host ""
Write-Host "Choose installation method:"
Write-Host "1. Docker Compose (Recommended if Docker is available)"
Write-Host "2. Manual installation"
Write-Host ""

if ($hasDocker) {
    $choice = Read-Host "Enter choice (1 or 2) [1]"
    if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }
} else {
    Write-ColorOutput Yellow "Docker not available, using manual installation"
    $choice = "2"
}

# Clone repository
Write-Host ""
Write-ColorOutput Yellow "Installing to: $InstallDir"
Write-Host ""

$confirm = Read-Host "Continue? (Y/n)"
if ($confirm -eq "n" -or $confirm -eq "N") {
    Write-Host "Installation cancelled"
    exit 0
}

Write-ColorOutput Yellow "Cloning NeuralMesh repository..."

if (Test-Path $InstallDir) {
    Write-ColorOutput Yellow "Directory exists. Updating..."
    Set-Location $InstallDir
    git pull
} else {
    git clone https://github.com/MrNova420/NeuralMesh.git $InstallDir
    Set-Location $InstallDir
}

Write-ColorOutput Green "✓ Repository cloned"

if ($choice -eq "1") {
    # Docker installation
    Write-Host ""
    Write-ColorOutput Yellow "Setting up Docker environment..."
    
    # Copy .env.example if .env doesn't exist
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        Write-ColorOutput Green "✓ Created .env file"
        Write-ColorOutput Yellow "⚠ Please edit .env and set secure secrets!"
    }
    
    # Start Docker Compose
    Write-ColorOutput Yellow "Starting Docker services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    Write-Host ""
    Write-ColorOutput Green "======================================"
    Write-ColorOutput Green "   Installation Complete!"
    Write-ColorOutput Green "======================================"
    Write-Host ""
    Write-Host "Access NeuralMesh at:"
    Write-ColorOutput Cyan "  Frontend: http://localhost"
    Write-ColorOutput Cyan "  Backend:  http://localhost:3000"
    Write-Host ""
    Write-Host "Useful commands:"
    Write-Host "  View logs:   docker-compose -f docker-compose.prod.yml logs -f"
    Write-Host "  Stop:        docker-compose -f docker-compose.prod.yml down"
    Write-Host "  Restart:     docker-compose -f docker-compose.prod.yml restart"
    
} else {
    # Manual installation
    Write-Host ""
    Write-ColorOutput Yellow "Running manual setup..."
    Write-Host ""
    
    # Check for PostgreSQL
    Write-ColorOutput Yellow "PostgreSQL and Redis are required."
    Write-ColorOutput Yellow "You can install them from:"
    Write-Host "  PostgreSQL: https://www.postgresql.org/download/windows/"
    Write-Host "  Redis: https://github.com/tporadowski/redis/releases"
    Write-Host ""
    
    $continue = Read-Host "Have you installed PostgreSQL and Redis? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-ColorOutput Yellow "Please install PostgreSQL and Redis first, then run this script again."
        exit 0
    }
    
    # Backend setup
    Write-ColorOutput Yellow "Installing backend dependencies..."
    Set-Location backend
    npm install
    Write-ColorOutput Green "✓ Backend dependencies installed"
    
    # Create .env if it doesn't exist
    if (-not (Test-Path ".env")) {
        Write-ColorOutput Yellow "Creating backend .env file..."
        
        # Generate secrets
        $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
        $refreshSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
        
        # Prompt for database password
        $dbPassword = Read-Host "Enter PostgreSQL password"
        
        @"
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://postgres:$dbPassword@localhost:5432/neuralmesh

# Authentication
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$refreshSecret

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Features
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
ENABLE_MONITORING=true
"@ | Out-File -FilePath ".env" -Encoding UTF8
        
        Write-ColorOutput Green "✓ Backend .env created"
    }
    
    # Run database migrations
    Write-ColorOutput Yellow "Setting up database..."
    npm run db:push
    Write-ColorOutput Green "✓ Database setup complete"
    
    Set-Location ..
    
    # Frontend setup
    Write-ColorOutput Yellow "Installing frontend dependencies..."
    Set-Location frontend
    npm install
    Write-ColorOutput Green "✓ Frontend dependencies installed"
    
    # Build frontend
    Write-ColorOutput Yellow "Building frontend..."
    npm run build
    Write-ColorOutput Green "✓ Frontend built"
    
    Set-Location ..
    
    Write-Host ""
    Write-ColorOutput Green "======================================"
    Write-ColorOutput Green "   Installation Complete!"
    Write-ColorOutput Green "======================================"
    Write-Host ""
    Write-Host "To start NeuralMesh:"
    Write-ColorOutput Cyan "  cd $InstallDir"
    Write-ColorOutput Cyan "  .\start-windows.ps1"
    Write-Host ""
    Write-Host "Or start manually:"
    Write-Host "  Terminal 1: cd backend && npm start"
    Write-Host "  Terminal 2: cd frontend && npm run dev"
}

Write-Host ""
Write-ColorOutput Green "Thank you for installing NeuralMesh!"
Write-Host ""
Write-ColorOutput Yellow "⚠ Important: Update your .env file with secure secrets for production!"
Write-Host ""
