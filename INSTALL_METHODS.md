# 🚀 NeuralMesh Installation Methods - Complete Guide

**For WSL Ubuntu, Termux, Linux, macOS, and Windows**

This document explains ALL installation methods available for NeuralMesh and when to use each one.

---

## 📋 Quick Reference

| Method | Best For | Time | Database | Prerequisites |
|--------|----------|------|----------|---------------|
| **setup-database.sh** | Full setup with DB | 10 min | ✅ Yes | PostgreSQL (auto-starts) |
| **quick-fix.sh** | Quick test, no DB | 2-3 min | ❌ No | Node.js only |
| **install.sh** | Production + services | 10-15 min | ✅ Yes | sudo access |
| **setup.sh** | Already cloned repo | 10-15 min | ✅ Yes | sudo access |
| **quick-start.sh** | Development work | 5 min | ✅ Yes | PostgreSQL, Redis |
| **Docker Compose** | Isolated environment | 2-3 min | ✅ Yes | Docker |
| **Manual** | Custom setup | 15+ min | ✅ Yes | All tools |

---

## 🗄️ Method 1: Database Setup Script (RECOMMENDED)

**Perfect for:** Complete functionality with database, WSL/Termux/Linux/macOS

**What it does:**
- ✅ Starts PostgreSQL (handles Termux/WSL/macOS differences)
- ✅ Creates database and user
- ✅ Sets proper permissions
- ✅ Installs backend dependencies
- ✅ Generates secure secrets
- ✅ Runs database migrations
- ✅ Creates .env files
- ✅ Verifies everything works
- ✅ Saves credentials securely

**Usage:**
```bash
# Clone or download the repo first
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh

# Run database setup
chmod +x setup-database.sh
./setup-database.sh

# Start the application
./start.sh
```

**Access:** http://localhost:5173

**Time:** 10 minutes

**Includes:**
- User authentication ✅
- Device management ✅
- Historical metrics ✅
- Persistent storage ✅
- All features enabled ✅

---

## 🔧 Method 2: Quick Fix (NO Database)

**Perfect for:** Quick testing, development without database

**What it does:**
- ✅ Installs frontend dependencies
- ✅ Installs backend dependencies
- ✅ Creates minimal .env files (random dev secrets)
- ✅ Builds frontend
- ❌ Does NOT install PostgreSQL/Redis
- ❌ Does NOT require sudo

**Usage:**
```bash
# Clone or download the repo first
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh

# Run the quick fix
chmod +x quick-fix.sh
./quick-fix.sh

# Start the application
./start.sh
```

**Access:** http://localhost:5173

**Time:** 2-3 minutes

**Note:** Frontend works, but features requiring database won't function.

---

## 📦 Method 2: One-Click Installer (Full Setup)

**Perfect for:** Production deployments, automatic everything

**What it does:**
- ✅ Clones repository
- ✅ Installs Node.js, PostgreSQL, Redis
- ✅ Creates database with proper ownership
- ✅ Generates secure secrets
- ✅ Installs all dependencies
- ✅ Configures firewall
- ✅ Sets up systemd service (Linux)
- ✅ Builds frontend

**Usage:**

**Linux/macOS/WSL:**
```bash
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash
```

**Termux (Android):**
```bash
pkg install curl
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash
```

**Windows PowerShell (as Administrator):**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install-windows.ps1" -OutFile "install.ps1"
Set-ExecutionPolicy Bypass -Scope Process
.\install.ps1
```

**Time:** 10-15 minutes

---

## 🛠️ Method 3: Setup Script (Already Cloned)

**Perfect for:** You already have the repo, want full setup

**What it does:**
- Same as one-click installer but assumes you already cloned

**Usage:**
```bash
# You already cloned it
cd NeuralMesh

# Run setup
chmod +x setup.sh
./setup.sh
```

**Time:** 10-15 minutes

---

## 👨‍💻 Method 4: Quick Start (Development)

**Perfect for:** Developers, you have PostgreSQL & Redis already

**What it does:**
- ✅ Installs dependencies
- ✅ Creates .env from examples
- ✅ Runs migrations
- ✅ Starts dev servers
- ⚠️ Requires PostgreSQL and Redis running

**Usage:**
```bash
# Clone if needed
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh

# Make sure PostgreSQL and Redis are running!
sudo systemctl start postgresql  # Linux
sudo systemctl start redis       # Linux

# Run quick start
chmod +x quick-start.sh
./quick-start.sh
```

**Time:** 5 minutes (after DB/Redis are running)

---

## 🐳 Method 5: Docker Compose

**Perfect for:** Testing, isolated environments, consistency

**What it does:**
- ✅ Runs everything in containers
- ✅ Includes PostgreSQL, Redis, Backend, Frontend
- ✅ No system dependencies needed
- ✅ Easy cleanup

**Usage:**
```bash
# Clone repo
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh

# Start everything
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop everything
docker-compose -f docker-compose.prod.yml down
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

**Time:** 2-3 minutes (plus download time)

---

## 🔨 Method 6: Manual Installation

**Perfect for:** Custom setups, understanding internals

**Prerequisites:**
- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (optional)

**Steps:**

### 1. Clone Repository
```bash
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh
```

### 2. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Setup Database
```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE neuralmesh;
CREATE USER neuralmesh WITH PASSWORD 'your_secure_password';
ALTER DATABASE neuralmesh OWNER TO neuralmesh;
GRANT ALL PRIVILEGES ON DATABASE neuralmesh TO neuralmesh;
\c neuralmesh
GRANT ALL ON SCHEMA public TO neuralmesh;
ALTER SCHEMA public OWNER TO neuralmesh;
\q
```

### 4. Create Backend .env
```bash
cd backend
cat > .env << EOF
PORT=3000
AGENT_PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://neuralmesh:your_secure_password@localhost:5432/neuralmesh
JWT_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)
REDIS_HOST=localhost
REDIS_PORT=6379
EOF
```

### 5. Run Migrations
```bash
cd backend
npm run db:push
```

### 6. Create Frontend .env
```bash
cd ../frontend
cat > .env << EOF
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001
EOF
```

### 7. Start Services
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Time:** 15-30 minutes

---

## 🌍 Platform-Specific Notes

### WSL Ubuntu
- All methods work perfectly
- Use `quick-fix.sh` for fastest start
- PostgreSQL works out of the box
- Access from Windows: Use `hostname -I` to get WSL IP

### Termux (Android)
- Use `quick-fix.sh` or `install.sh`
- PostgreSQL available via `pkg install postgresql`
- Redis available via `pkg install redis`
- May need to use `pkg install` instead of `apt` in scripts

### macOS
- All methods work
- Use Homebrew for dependencies: `brew install node postgresql redis`
- Start services: `brew services start postgresql redis`

### Regular Linux (Ubuntu/Debian)
- All methods work perfectly
- `install.sh` and `setup.sh` are optimized for Linux
- Systemd service auto-configured

### Windows
- Use `install-windows.ps1` PowerShell script
- Or use WSL (recommended)
- Or use Docker Compose

---

## 🎯 Recommended Path by Use Case

### Just Want It Working With Full Features
→ **setup-database.sh** (10 min, includes database)

### Just Testing / No Database Needed
→ **quick-fix.sh** (2 min, no DB)

### Production Server
→ **install.sh** (15 min, full system setup)

### Development
→ **setup-database.sh** (10 min) or **quick-start.sh** (5 min, needs DB running)

### WSL Ubuntu
→ **setup-database.sh** for full features, **quick-fix.sh** for testing

### Termux
→ **setup-database.sh** (handles Termux PostgreSQL setup)

### Understanding the Code
→ **Manual Installation** (follow along)

---

## 🔄 Upgrade Path

Start simple, upgrade later:

```
quick-fix.sh → setup-database.sh → Full production setup
     ↓              ↓                       ↓
  2 min          10 min                 15 min
  No DB       Full DB setup          Full services
```

---

## 🆘 Getting Help

- **Troubleshooting Guide**: `TROUBLESHOOTING.md`
- **Quick Start Guide**: `QUICK_START.md`
- **Full Docs**: `INSTALLATION_GUIDE.md`
- **Issues**: https://github.com/MrNova420/NeuralMesh/issues

---

## ✅ Verification

After any installation method, verify it works:

```bash
# Check services are running
./start.sh  # if not already running

# Access frontend
curl http://localhost:5173

# Access backend
curl http://localhost:3000

# Check backend logs
tail -f /tmp/neuralmesh-backend.log

# Check frontend logs
tail -f /tmp/neuralmesh-frontend.log
```

**Expected result:** Frontend loads at http://localhost:5173

---

**Last Updated:** 2026-02-03  
**Optimized for:** WSL Ubuntu, Termux, Linux, macOS, Windows
