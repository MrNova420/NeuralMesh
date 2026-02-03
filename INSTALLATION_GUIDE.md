# NeuralMesh Installation Guide

Complete guide to installing and setting up NeuralMesh - The FREE, self-hosted infrastructure orchestration platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Install (Recommended)](#quick-install-recommended)
- [Installation Methods](#installation-methods)
  - [Method 1: One-Click Installer](#method-1-one-click-installer)
  - [Method 2: Docker Compose](#method-2-docker-compose)
  - [Method 3: Manual Installation](#method-3-manual-installation)
  - [Method 4: From Source](#method-4-from-source)
- [Platform-Specific Instructions](#platform-specific-instructions)
- [Post-Installation](#post-installation)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 20 GB free space
- OS: Linux (Ubuntu 20.04+, Debian 11+), macOS 12+, or Windows 10/11

**Recommended:**
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 50+ GB free space
- SSD storage

### Software Requirements

- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **Redis** 6.x or higher
- **Docker** (optional, for containerized deployment)
- **Git**

---

## Quick Install (Recommended)

The fastest way to get NeuralMesh running:

```bash
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash
```

This will:
- ✅ Check system requirements
- ✅ Install dependencies
- ✅ Setup database
- ✅ Configure services
- ✅ Generate secure secrets
- ✅ Start the platform

**Time:** ~5-10 minutes

---

## Installation Methods

### Method 1: One-Click Installer

**For Linux/macOS:**

```bash
# Download installer
curl -O https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh

# Make executable
chmod +x install.sh

# Run installer
./install.sh
```

**For Windows (PowerShell as Administrator):**

```powershell
# Download and run
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install-windows.ps1" -OutFile "install.ps1"
Set-ExecutionPolicy Bypass -Scope Process
.\install.ps1
```

---

### Method 2: Docker Compose

Perfect for development and testing.

**Prerequisites:**
- Docker 20.10+
- Docker Compose 2.0+

**Steps:**

1. **Clone repository:**
```bash
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh
```

2. **Start services:**
```bash
docker-compose up -d
```

3. **Access platform:**
- Frontend: http://localhost:5173
- API: http://localhost:3000

**Production deployment:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

### Method 3: Manual Installation

For complete control over the installation.

#### Step 1: Install Dependencies

**Ubuntu/Debian:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Git
sudo apt install -y git
```

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node postgresql@16 redis git
brew services start postgresql@16
brew services start redis
```

**Windows:**
- Download and install Node.js from https://nodejs.org
- Download and install PostgreSQL from https://www.postgresql.org/download/windows/
- Download and install Redis from https://github.com/microsoftarchive/redis/releases

#### Step 2: Clone Repository

```bash
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh
```

#### Step 3: Setup Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE neuralmesh;
CREATE USER neuralmesh WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE neuralmesh TO neuralmesh;
EOF
```

#### Step 4: Configure Environment

```bash
cd backend

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://neuralmesh:your_secure_password@localhost:5432/neuralmesh
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=production
EOF
```

#### Step 5: Install Dependencies

```bash
# Backend
cd backend
npm install
npm run db:push

# Frontend
cd ../frontend
npm install
npm run build
```

#### Step 6: Start Services

**Option A: Using start script (recommended)**
```bash
cd ..
./start.sh
```

**Option B: Manual start**
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm run dev
```

---

### Method 4: From Source

For developers who want to build from source.

```bash
# Clone repository
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh

# Run setup
./setup.sh

# Start in development mode
npm run dev
```

---

## Platform-Specific Instructions

### Ubuntu 22.04 LTS

```bash
# Install dependencies
sudo apt update
sudo apt install -y curl git

# Run quick installer
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash

# Start service
sudo systemctl start neuralmesh
sudo systemctl enable neuralmesh
```

### Debian 11

```bash
# Install dependencies
sudo apt update
sudo apt install -y curl git

# Run quick installer
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash
```

### CentOS/RHEL 8+

```bash
# Install dependencies
sudo dnf install -y curl git

# Run quick installer
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash
```

### macOS 12+ (Monterey)

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Run quick installer
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash
```

### Windows 10/11

**PowerShell (as Administrator):**
```powershell
# Download installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install-windows.ps1" -OutFile "install.ps1"

# Run installer
Set-ExecutionPolicy Bypass -Scope Process
.\install.ps1
```

---

## Post-Installation

### 1. Create Admin Account

Open your browser and navigate to:
```
http://localhost:5173
```

Click "Register" and create your admin account.

### 2. Configure First Node

After registration:
1. Go to "Nodes" page
2. Click "Add Node"
3. Follow the onboarding wizard

### 3. Deploy First Template

1. Navigate to "Templates"
2. Choose a template (e.g., "WordPress Site")
3. Click "Deploy"
4. Configure settings
5. Click "Create"

---

## Verification

### Check Services

**Linux (systemd):**
```bash
sudo systemctl status neuralmesh
sudo systemctl status postgresql
sudo systemctl status redis
```

**macOS:**
```bash
brew services list
```

**Windows:**
```powershell
Get-Service NeuralMesh
```

### Check API

```bash
curl http://localhost:3000/
```

Expected response:
```json
{
  "name": "NeuralMesh API",
  "version": "1.0.0",
  "status": "operational"
}
```

### Check Frontend

Open browser:
```
http://localhost:5173
```

You should see the NeuralMesh login page.

### Check Database

```bash
psql -U neuralmesh -d neuralmesh -c "SELECT version();"
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process using port
sudo lsof -i :3000

# Kill process (replace PID)
kill -9 PID

# Or change port in .env
PORT=3001
```

### Database Connection Failed

**Error:** `Could not connect to database`

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start if not running
sudo systemctl start postgresql

# Check connection
psql -U neuralmesh -d neuralmesh
```

### Redis Connection Failed

**Error:** `Redis connection refused`

**Solution:**
```bash
# Check Redis is running
sudo systemctl status redis

# Start if not running
sudo systemctl start redis

# Test connection
redis-cli ping
```

### Permission Denied

**Error:** `EACCES: permission denied`

**Solution:**
```bash
# Fix ownership
sudo chown -R $USER:$USER ~/neuralmesh

# Fix permissions
chmod -R 755 ~/neuralmesh
```

### Node.js Version Issues

**Error:** `Node version too old`

**Solution:**
```bash
# Update Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify version
node --version  # Should be 18.x or higher
```

---

## Advanced Configuration

### SSL/TLS Setup

For production deployments, enable HTTPS:

1. **Generate certificates:**
```bash
sudo certbot certonly --standalone -d your-domain.com
```

2. **Update nginx configuration:**
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:5173;
    }
}
```

### Firewall Configuration

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow API port
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

### Auto-Start on Boot

**Linux (systemd):**
```bash
sudo systemctl enable neuralmesh
sudo systemctl enable postgresql
sudo systemctl enable redis
```

**macOS:**
```bash
brew services start postgresql@16
brew services start redis
```

---

## Next Steps

1. **Read the Documentation:**
   - [Quick Start Guide](./QUICK_START.md)
   - [Device Onboarding Guide](./DEVICE_ONBOARDING_GUIDE.md)
   - [User Guide](./USER_GUIDE.md)

2. **Join the Community:**
   - GitHub: https://github.com/MrNova420/NeuralMesh
   - Discussions: https://github.com/MrNova420/NeuralMesh/discussions

3. **Explore Features:**
   - Deploy templates
   - Add devices
   - Configure mesh network
   - Monitor resources

---

## Getting Help

- **Documentation:** https://github.com/MrNova420/NeuralMesh/wiki
- **Issues:** https://github.com/MrNova420/NeuralMesh/issues
- **Discussions:** https://github.com/MrNova420/NeuralMesh/discussions

---

**Congratulations! NeuralMesh is now installed and running!** 🎉

Start managing your infrastructure the FREE way! 💚
