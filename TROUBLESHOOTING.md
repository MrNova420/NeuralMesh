# NeuralMesh Troubleshooting Guide

This guide helps you resolve common installation and deployment issues.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [Build Issues](#build-issues)
- [Runtime Issues](#runtime-issues)
- [Port Conflicts](#port-conflicts)
- [Permission Issues](#permission-issues)

---

## Installation Issues

### Issue: "cho: command not found"

**Symptoms:**
```
bash: line 65: cho: command not found
```

**Solution:**
This is likely from an older version of the install script. Update to the latest version:

```bash
# Remove old installation
rm -rf ~/neuralmesh

# Get latest version
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash
```

### Issue: Node.js version too old

**Symptoms:**
```
Node.js version is too old (need v18+)
```

**Solution:**
Update Node.js to version 18 or higher:

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v20.x.x or higher
```

**macOS:**
```bash
brew install node@20
node --version
```

**Windows:**
Download and install from [nodejs.org](https://nodejs.org/)

---

## Database Issues

### Issue: "permission denied for schema public"

**Symptoms:**
```
PostgresError: permission denied for schema public
```

**Cause:**
The database user doesn't have proper permissions on the public schema.

**Solution 1: Automated Fix (Recommended)**
Re-run the setup script - it now includes automatic permission fixing:

```bash
cd ~/neuralmesh  # or your installation directory
./setup.sh
```

**Solution 2: Manual Fix**
```bash
# Connect as postgres superuser
sudo -u postgres psql

# Run these commands (replace 'neuralmesh' with your DB name/user if different)
\c neuralmesh
ALTER DATABASE neuralmesh OWNER TO neuralmesh;
ALTER SCHEMA public OWNER TO neuralmesh;
GRANT ALL ON SCHEMA public TO neuralmesh;
GRANT ALL ON ALL TABLES IN SCHEMA public TO neuralmesh;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO neuralmesh;
\q

# Now retry the setup
cd ~/neuralmesh/backend
npm run db:push
```

### Issue: "Database connection failed"

**Symptoms:**
```
Error: Could not connect to database
```

**Solution:**
1. **Check if PostgreSQL is running:**
```bash
# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# macOS
brew services list
brew services start postgresql@16
```

2. **Check connection string in .env:**
```bash
cd backend
cat .env | grep DATABASE_URL
# Should look like: DATABASE_URL=postgresql://neuralmesh:PASSWORD@localhost:5432/neuralmesh
```

3. **Test connection manually:**
```bash
psql -U neuralmesh -d neuralmesh -h localhost
# Enter password when prompted
```

### Issue: Database already exists but migrations fail

**Solution:**
Drop and recreate the database:

```bash
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS neuralmesh;
DROP USER IF EXISTS neuralmesh;
EOF

# Then re-run setup
./setup.sh
```

---

## Build Issues

### Issue: Frontend TypeScript compilation errors

**Symptoms:**
```
src/components/react-bits/GlassSurface.tsx:166:7 - error TS2448: Block-scoped variable 'supportsSVGFilters' used before its declaration.
Found 34 errors.
```

**Cause:**
TypeScript strict checking finds issues in the codebase during build.

**Solution 1: Use Quick Build (Recommended for Installation)**
The setup script now uses `build:quick` which skips TypeScript checking:

```bash
cd frontend
npm run build:quick
```

**Solution 2: Fix TypeScript Errors**
If you need full TypeScript checking, the errors need to be fixed in the source code. This is being addressed in a separate PR.

**Solution 3: Disable Strict Mode Temporarily**
Edit `frontend/tsconfig.app.json` and set `"strict": false` temporarily.

### Issue: "npm install" fails with peer dependency warnings

**Solution:**
Use `npm install --legacy-peer-deps`:

```bash
cd backend
npm install --legacy-peer-deps

cd ../frontend
npm install --legacy-peer-deps
```

### Issue: Build succeeds but page is blank

**Solution:**
1. **Check if .env files exist:**
```bash
ls -la backend/.env frontend/.env
```

2. **Check frontend .env has correct API URL:**
```bash
cat frontend/.env
# Should contain:
# VITE_API_URL=http://localhost:3000
# VITE_WS_URL=ws://localhost:3000
```

3. **Rebuild with correct environment:**
```bash
cd frontend
rm -rf dist
npm run build:quick
```

---

## Runtime Issues

### Issue: Backend won't start

**Symptoms:**
```
Error: Cannot find module
```

**Solution:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: Frontend shows "Cannot connect to backend"

**Solution:**
1. **Verify backend is running:**
```bash
curl http://localhost:3000/
# Should return JSON with API info
```

2. **Check backend logs:**
```bash
tail -f /tmp/neuralmesh-backend.log
```

3. **Verify ports in .env files match:**
```bash
grep PORT backend/.env
# Should show: PORT=3000

grep VITE_API_URL frontend/.env
# Should show: VITE_API_URL=http://localhost:3000
```

### Issue: WebSocket connection fails

**Symptoms:**
Frontend shows "Disconnected" or agent can't connect

**Solution:**
1. **Check if WebSocket port is accessible:**
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:3000/socket.io/
```

2. **Check firewall settings:**
```bash
# Linux
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# macOS
# Check System Preferences → Security & Privacy → Firewall
```

---

## Port Conflicts

### Issue: "Port 3000 is already in use"

**Solution:**
```bash
# Find process using port
lsof -i :3000
# or
sudo netstat -tulpn | grep :3000

# Kill the process (replace PID)
kill -9 PID

# Or change port in backend/.env
echo "PORT=3001" >> backend/.env
```

### Issue: "Port 5173 is already in use"

**Solution:**
```bash
# Frontend will automatically try port 5174
# Or specify a different port
cd frontend
npm run dev -- --port 5175
```

---

## Permission Issues

### Issue: "Permission denied" when running scripts

**Solution:**
```bash
# Make scripts executable
chmod +x install.sh setup.sh start.sh stop.sh deploy.sh

# Or run with bash
bash install.sh
```

### Issue: "EACCES: permission denied" npm errors

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $USER:$USER ~/.npm
sudo chown -R $USER:$USER ~/neuralmesh

# Or use sudo (not recommended)
sudo npm install
```

### Issue: Cannot create systemd service

**Symptoms:**
```
Failed to enable unit: Access denied
```

**Solution:**
Run setup with sudo:
```bash
sudo ./setup.sh
```

---

## Docker Issues

### Issue: "Docker is not installed"

**Solution:**
Install Docker:

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in
```

**macOS:**
Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)

**Windows:**
Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)

### Issue: Docker Compose fails to start services

**Solution:**
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose down
docker-compose up -d

# Rebuild if needed
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Redis Issues

### Issue: "Redis connection refused"

**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
# Linux
sudo systemctl start redis-server

# macOS
brew services start redis

# Windows
# Start Redis service from Services app
```

### Issue: Redis password issues

**Solution:**
If Redis requires a password, update `.env`:

```bash
cd backend
echo "REDIS_PASSWORD=your_redis_password" >> .env
```

---

## Getting More Help

If you're still experiencing issues:

1. **Check the logs:**
   ```bash
   # Backend logs
   tail -f /tmp/neuralmesh-backend.log
   
   # Frontend logs
   tail -f /tmp/neuralmesh-frontend.log
   
   # System logs
   journalctl -u neuralmesh -f
   ```

2. **Enable debug mode:**
   ```bash
   cd backend
   echo "LOG_LEVEL=debug" >> .env
   ```

3. **Open an issue:**
   - Visit: https://github.com/MrNova420/NeuralMesh/issues
   - Include:
     - Your OS and version
     - Node.js version (`node --version`)
     - Error messages
     - Relevant log files

4. **Join discussions:**
   - https://github.com/MrNova420/NeuralMesh/discussions

---

## Quick Fixes Checklist

Before opening an issue, try these quick fixes:

- [ ] Restart all services: `./stop.sh && ./start.sh`
- [ ] Check all services are running: `ps aux | grep neuralmesh`
- [ ] Verify ports are not in use: `lsof -i :3000 && lsof -i :5173`
- [ ] Check .env files exist and are correct
- [ ] Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- [ ] Check database is accessible: `psql -U neuralmesh -d neuralmesh`
- [ ] Verify Redis is running: `redis-cli ping`
- [ ] Check firewall rules allow traffic on ports 3000, 3001, 5173
- [ ] Look at log files for specific error messages
- [ ] Try running with elevated privileges (sudo) if permission issues

---

**Last Updated:** 2026-02-03  
**Version:** 1.0.0
