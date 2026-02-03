# 🚀 NeuralMesh Quick Start Guide

**Welcome to NeuralMesh!** This guide will get you up and running in just a few minutes.

## 📋 What You'll Need

Before you start, make sure you have:
- A computer running **Linux, macOS, or Windows**
- An internet connection
- About **10-15 minutes** of your time

That's it! The installer will handle the rest.

---

## 🎯 Choose Your Installation Method

### Option 1: 🏃 Quick Install (Recommended)

**Best for:** Most users, production deployments

This will install everything you need:
- ✅ PostgreSQL (database)
- ✅ Redis (caching)
- ✅ Node.js (if needed)
- ✅ All NeuralMesh components

**Linux/macOS:**
```bash
curl -fsSL https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install.sh | bash
```

**Windows (PowerShell as Administrator):**
```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MrNova420/NeuralMesh/main/install-windows.ps1" -OutFile "install.ps1"
Set-ExecutionPolicy Bypass -Scope Process
.\install.ps1
```

⏱️ **Time:** 5-10 minutes

### Option 2: 🐳 Docker Compose

**Best for:** Quick testing, isolated environments

**Prerequisites:** Docker and Docker Compose installed

```bash
# Clone the repository
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh

# Start everything
docker-compose -f docker-compose.prod.yml up -d
```

⏱️ **Time:** 2-3 minutes

### Option 3: 👨‍💻 Development Setup

**Best for:** Developers contributing to NeuralMesh

**Prerequisites:** Node.js 18+, PostgreSQL, Redis already installed

```bash
# Clone the repository
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh

# Quick start with npm
chmod +x quick-start.sh
./quick-start.sh
```

Or manually:

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Create .env files (copy from examples)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env with your database credentials
# Then start both services
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

⏱️ **Time:** 3-5 minutes (after prerequisites)

---

## 🎉 First Time Setup

After installation, here's what happens:

### 1️⃣ Access the Platform

Open your browser and go to:
```
http://localhost:5173
```

You should see the NeuralMesh login page! 🎊

### 2️⃣ Create Your Account

1. Click **"Register"** on the login page
2. Fill in:
   - **Username:** Your choice (e.g., "admin")
   - **Email:** Your email address
   - **Password:** Strong password (min 8 characters)
3. Click **"Create Account"**

🎉 You're in! You'll be redirected to the dashboard.

### 3️⃣ Explore the Dashboard

You'll see:
- **📊 System Overview:** Real-time stats
- **🖥️ Nodes:** Your connected devices (empty for now)
- **📈 Activity Feed:** Recent events
- **🔔 Notifications:** System alerts

---

## 📱 Adding Your First Device

Let's connect a device to your NeuralMesh!

### Step 1: Generate a Pairing Code

1. Click **"Devices"** in the sidebar
2. Click **"+ Add Device"**
3. A pairing code appears (e.g., `ABCD-1234-EFGH`)
4. **Keep this page open!**

### Step 2: Install Agent on Device

**On the device you want to add** (can be the same computer):

**Linux/macOS:**
```bash
curl -fsSL http://localhost:3000/install-agent.sh | bash -s -- --pairing-code YOUR_CODE
```

**Windows:**
```powershell
Invoke-WebRequest http://localhost:3000/install-agent.ps1 -OutFile agent.ps1
.\agent.ps1 -PairingCode YOUR_CODE
```

Replace `YOUR_CODE` with your actual pairing code!

### Step 3: Watch It Connect! 🎊

Within seconds, you'll see:
- ✅ Device appears in your device list
- 📊 Real-time metrics start flowing
- 🌐 Neural network visualization updates

---

## 🎮 What Can You Do Now?

### 📊 Monitor Your Devices

- **Dashboard:** Real-time overview of all devices
- **Device Grid:** Detailed view of each device
- **3D Visualization:** See your neural mesh in 3D!

### 🔧 Transform Devices

Turn any device into a specialized server:
- **Web Server:** Host websites and web apps
- **Database Server:** Run PostgreSQL, MongoDB, etc.
- **Compute Node:** Process-intensive tasks
- **Storage Server:** File storage and backup

### 📦 Deploy Templates

One-click deployment of popular applications:
- 🎮 **Game Servers:** Minecraft, CS:GO, Valheim
- 🌐 **Web Hosting:** WordPress, Node.js, Static sites
- 📊 **Analytics:** Grafana, Elasticsearch
- 💾 **Databases:** PostgreSQL, Redis, MongoDB

### 🔔 Set Up Alerts

Get notified when:
- CPU usage is high
- Disk space is low
- Devices go offline
- Performance degrades

---

## 🛠️ Managing NeuralMesh

### Starting the Platform

**Method 1: Quick Start (Development)**
```bash
cd ~/neuralmesh  # or your installation directory
./quick-start.sh
```

**Method 2: Manual Start**
```bash
./start.sh
```

**Method 3: System Service (Linux)**
```bash
sudo systemctl start neuralmesh
```

### Stopping the Platform

```bash
./stop.sh
```

Or for system service:
```bash
sudo systemctl stop neuralmesh
```

### Checking Status

**Development mode:**
```bash
# Check if running
lsof -i :3000  # Backend
lsof -i :5173  # Frontend

# View logs
tail -f /tmp/neuralmesh-backend.log
tail -f /tmp/neuralmesh-frontend.log
```

**System service:**
```bash
sudo systemctl status neuralmesh
sudo journalctl -u neuralmesh -f  # Live logs
```

### Restarting After Changes

```bash
./stop.sh && ./start.sh
```

Or:
```bash
sudo systemctl restart neuralmesh
```

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:5173 | Main dashboard |
| **Backend API** | http://localhost:3000 | REST API |
| **API Docs** | http://localhost:3000/docs | API documentation |
| **WebSocket** | ws://localhost:3000 | Real-time updates |

---

## ⚡ Quick Tips

### 💡 Development Tips

1. **Auto-reload:** Both frontend and backend auto-reload on code changes
2. **Debug logs:** Set `LOG_LEVEL=debug` in `backend/.env`
3. **Port conflicts:** Frontend uses 5174 if 5173 is busy

### 🔒 Security Tips

1. **Change default passwords** in production
2. **Use HTTPS** for production deployments
3. **Keep .env files private** (already in .gitignore)
4. **Update JWT secrets** in `backend/.env`

### 🚀 Performance Tips

1. **Enable Redis** for better performance
2. **Use production build** for frontend: `npm run build`
3. **Monitor resource usage** in the dashboard
4. **Scale agents** across multiple devices

---

## ❓ Need Help?

### 📚 Documentation

- **[Full Installation Guide](./INSTALLATION_GUIDE.md)** - Detailed installation instructions
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[User Guide](./USER_GUIDE.md)** - Complete feature documentation
- **[API Documentation](./API.md)** - REST API reference

### 🐛 Something Not Working?

1. **Check the logs:**
   ```bash
   tail -f /tmp/neuralmesh-backend.log
   tail -f /tmp/neuralmesh-frontend.log
   ```

2. **Read the troubleshooting guide:**
   ```bash
   cat TROUBLESHOOTING.md
   ```

3. **Ask for help:**
   - 💬 [GitHub Discussions](https://github.com/MrNova420/NeuralMesh/discussions)
   - 🐞 [Report a Bug](https://github.com/MrNova420/NeuralMesh/issues)

### 🎓 Learning Resources

- **Video tutorials:** Coming soon!
- **Example projects:** Check `/examples` directory
- **Community guides:** GitHub Discussions

---

## 🎊 What's Next?

Now that you're set up, try these:

1. ✅ **Add more devices** to your mesh
2. ✅ **Deploy your first template**
3. ✅ **Set up notifications**
4. ✅ **Explore the 3D visualization**
5. ✅ **Transform a device** into a server
6. ✅ **Check out the API** at http://localhost:3000/docs

---

## 🎉 Welcome to NeuralMesh!

You're now part of a community building the **FREE, self-hosted infrastructure platform**. 

**No subscriptions. No limits. Complete control.**

Enjoy! 🚀

---

**Questions?** Open a [discussion](https://github.com/MrNova420/NeuralMesh/discussions)  
**Found a bug?** [Report it](https://github.com/MrNova420/NeuralMesh/issues)  
**Want to contribute?** Check out [CONTRIBUTING.md](./CONTRIBUTING.md)

---

<div align="center">

**Made with 🧠 and ⚡ for the NeuralMesh Platform**

[⭐ Star us on GitHub](https://github.com/MrNova420/NeuralMesh) | [📚 Documentation](./README.md) | [💬 Community](https://github.com/MrNova420/NeuralMesh/discussions)

</div>
