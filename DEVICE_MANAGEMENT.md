# 📱 Device & Node Management Guide

**Easy guide to adding and managing devices in your NeuralMesh**

## 🎯 Quick Overview

NeuralMesh turns ANY device into a powerful node in your infrastructure:
- 💻 Your laptop, desktop, or server
- 📱 Android phones (via Termux)
- 🍓 Raspberry Pi and single-board computers
- ☁️ Cloud VPS instances
- 🖥️ Old computers you want to repurpose

---

## 🚀 Adding Your First Device (Super Easy!)

### Step 1: Generate Pairing Code

1. **Open NeuralMesh Dashboard** in your browser: `http://localhost:5173`
2. **Click "Devices"** in the sidebar (or "Nodes" page)
3. **Click "+ Add Device"** button
4. A **pairing code** appears (like `ABCD-1234-EFGH`)
5. **Keep this page open!** The code expires in 10 minutes

### Step 2: Install Agent on Device

Choose your device's operating system:

#### 🐧 Linux (Debian/Ubuntu/Fedora/Arch)

**One-Line Install:**
```bash
curl -fsSL http://YOUR_SERVER_IP:3000/install-agent.sh | bash -s -- --pairing-code ABCD-1234-EFGH
```

Replace `YOUR_SERVER_IP` with your NeuralMesh server's IP address, and `ABCD-1234-EFGH` with your actual pairing code.

**Example:**
```bash
# If NeuralMesh is on the same computer:
curl -fsSL http://localhost:3000/install-agent.sh | bash -s -- --pairing-code ABCD-1234-EFGH

# If NeuralMesh is on 192.168.1.100:
curl -fsSL http://192.168.1.100:3000/install-agent.sh | bash -s -- --pairing-code ABCD-1234-EFGH
```

#### 🍎 macOS

**One-Line Install:**
```bash
curl -fsSL http://YOUR_SERVER_IP:3000/install-agent.sh | bash -s -- --pairing-code ABCD-1234-EFGH
```

**Example:**
```bash
curl -fsSL http://localhost:3000/install-agent.sh | bash -s -- --pairing-code ABCD-1234-EFGH
```

#### 🪟 Windows

**PowerShell (as Administrator):**
```powershell
# Download installer
Invoke-WebRequest -Uri "http://YOUR_SERVER_IP:3000/install-agent.ps1" -OutFile "agent.ps1"

# Run installer with pairing code
.\agent.ps1 -PairingCode "ABCD-1234-EFGH"
```

**Example:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/install-agent.ps1" -OutFile "agent.ps1"
.\agent.ps1 -PairingCode "ABCD-1234-EFGH"
```

#### 📱 Android (Termux)

1. **Install Termux** from F-Droid or Play Store
2. **Open Termux** and run:

```bash
# Install curl if needed
pkg install curl

# Install agent
curl -fsSL http://YOUR_SERVER_IP:3000/install-agent.sh | bash -s -- --pairing-code ABCD-1234-EFGH
```

**Example:**
```bash
curl -fsSL http://192.168.1.100:3000/install-agent.sh | bash -s -- --pairing-code ABCD-1234-EFGH
```

#### 🍓 Raspberry Pi

Same as Linux! Just use:
```bash
curl -fsSL http://YOUR_SERVER_IP:3000/install-agent.sh | bash -s -- --pairing-code ABCD-1234-EFGH
```

### Step 3: Watch It Connect! 🎉

Within seconds you'll see:
- ✅ Device appears in your dashboard
- 📊 Real-time metrics start flowing
- 🌐 Neural network updates with new node
- 🎊 You're connected!

---

## 🔧 Manual Agent Installation

If you prefer manual installation or the one-line installer doesn't work:

### Download Agent

**Linux/macOS/Termux:**
```bash
# Create directory
mkdir -p ~/neuralmesh-agent
cd ~/neuralmesh-agent

# Download agent binary
curl -L -o neuralmesh-agent https://github.com/MrNova420/NeuralMesh/releases/latest/download/neuralmesh-agent-linux-amd64

# For ARM (Raspberry Pi, Android):
# curl -L -o neuralmesh-agent https://github.com/MrNova420/NeuralMesh/releases/latest/download/neuralmesh-agent-linux-arm64

# Make executable
chmod +x neuralmesh-agent
```

**Windows:**
```powershell
# Download from browser or PowerShell
Invoke-WebRequest -Uri "https://github.com/MrNova420/NeuralMesh/releases/latest/download/neuralmesh-agent-windows-amd64.exe" -OutFile "neuralmesh-agent.exe"
```

### Configure Agent

**Option 1: Command Line Arguments**

```bash
./neuralmesh-agent \
  --server ws://YOUR_SERVER_IP:3001/agent \
  --name "My Laptop" \
  --interval 2
```

**Option 2: Environment Variables**

Create a `.env` file:
```bash
# .env file
SERVER_URL=ws://YOUR_SERVER_IP:3001/agent
UPDATE_INTERVAL=2
NODE_NAME=My Laptop
```

Then run:
```bash
./neuralmesh-agent
```

**Option 3: Configuration File**

Create `config.yaml`:
```yaml
server:
  url: ws://YOUR_SERVER_IP:3001/agent
  
node:
  name: My Laptop
  update_interval: 2
  
features:
  metrics: true
  logs: true
```

Run with:
```bash
./neuralmesh-agent --config config.yaml
```

### Configuration Options

| Option | Environment Variable | Description | Default |
|--------|---------------------|-------------|---------|
| `--server` | `SERVER_URL` | WebSocket URL of NeuralMesh server | Required |
| `--name` | `NODE_NAME` | Friendly name for this device | Hostname |
| `--interval` | `UPDATE_INTERVAL` | Metrics update interval (seconds) | 2 |
| `--token` | `AUTH_TOKEN` | Authentication token | None |
| `--log-level` | `LOG_LEVEL` | Log level (debug, info, warn, error) | info |

### Start Agent

**Foreground (for testing):**
```bash
./neuralmesh-agent --server ws://192.168.1.100:3001/agent
```

**Background (daemon):**
```bash
# Linux/macOS
nohup ./neuralmesh-agent --server ws://192.168.1.100:3001/agent > agent.log 2>&1 &

# Save PID for later
echo $! > agent.pid
```

**As a service (Linux - systemd):**

Create `/etc/systemd/system/neuralmesh-agent.service`:
```ini
[Unit]
Description=NeuralMesh Agent
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/neuralmesh-agent
ExecStart=/home/YOUR_USERNAME/neuralmesh-agent/neuralmesh-agent --server ws://YOUR_SERVER_IP:3001/agent
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable neuralmesh-agent
sudo systemctl start neuralmesh-agent
sudo systemctl status neuralmesh-agent
```

---

## 📊 Managing Devices

### View All Devices

**Dashboard:**
- Go to **"Devices"** or **"Nodes"** page
- See all connected devices at a glance
- Filter by status: Online, Offline, Warning

**CLI (coming soon):**
```bash
neuralmesh-cli devices list
```

### Device Details

**Click any device** to see:
- 📊 **Real-time metrics**: CPU, RAM, Disk, Network
- 🖥️ **System info**: OS, Architecture, Uptime
- 📈 **Historical data**: Performance over time
- ⚙️ **Actions**: Restart, Shutdown, Disconnect

### Update Device Name

**In Dashboard:**
1. Click the device
2. Click "Settings" or edit icon
3. Change the name
4. Click "Save"

**Via Agent:**
```bash
# Stop agent
pkill neuralmesh-agent

# Restart with new name
./neuralmesh-agent --server ws://YOUR_SERVER_IP:3001/agent --name "New Name"
```

### Remove Device

**Soft Remove (keeps history):**
1. Click device in dashboard
2. Click "Remove" or trash icon
3. Confirm removal
4. Device is marked offline but data is kept

**Hard Remove (deletes everything):**
1. Click device in dashboard
2. Click "Settings"
3. Click "Delete Permanently"
4. Type device name to confirm
5. Click "Delete Forever"

**Stop Agent on Device:**
```bash
# Find process
ps aux | grep neuralmesh-agent

# Kill process
kill PID

# Or if running as service
sudo systemctl stop neuralmesh-agent
```

---

## 🔄 Agent Updates

### Check Version

```bash
./neuralmesh-agent --version
```

### Update Agent

**Linux/macOS:**
```bash
# Download latest
curl -L -o neuralmesh-agent-new https://github.com/MrNova420/NeuralMesh/releases/latest/download/neuralmesh-agent-linux-amd64

# Stop old agent
pkill neuralmesh-agent

# Replace binary
mv neuralmesh-agent-new neuralmesh-agent
chmod +x neuralmesh-agent

# Restart
./neuralmesh-agent --server ws://YOUR_SERVER_IP:3001/agent
```

**Windows:**
```powershell
# Download latest
Invoke-WebRequest -Uri "https://github.com/MrNova420/NeuralMesh/releases/latest/download/neuralmesh-agent-windows-amd64.exe" -OutFile "neuralmesh-agent-new.exe"

# Stop old agent (Task Manager or PowerShell)
Stop-Process -Name "neuralmesh-agent"

# Replace
Move-Item -Force neuralmesh-agent-new.exe neuralmesh-agent.exe

# Restart
.\neuralmesh-agent.exe --server ws://YOUR_SERVER_IP:3001/agent
```

---

## 🚨 Troubleshooting

### Agent Won't Connect

**Check server URL:**
```bash
# Test if server is reachable
curl http://YOUR_SERVER_IP:3000/

# Test WebSocket (requires wscat)
wscat -c ws://YOUR_SERVER_IP:3001/agent
```

**Check firewall:**
```bash
# Linux
sudo ufw status
sudo ufw allow 3001/tcp

# macOS
# System Preferences → Security & Privacy → Firewall
```

**Check agent logs:**
```bash
# If running in foreground, check terminal output
# If running as service:
sudo journalctl -u neuralmesh-agent -f

# If running in background:
tail -f agent.log
```

### Agent Disconnects Frequently

**Increase timeout:**
```bash
./neuralmesh-agent \
  --server ws://YOUR_SERVER_IP:3001/agent \
  --timeout 30 \
  --retry-interval 5
```

**Check network stability:**
```bash
# Ping server continuously
ping YOUR_SERVER_IP
```

**Check system resources:**
```bash
# CPU and memory usage
top

# If system is overloaded, increase update interval
./neuralmesh-agent --server ws://YOUR_SERVER_IP:3001/agent --interval 5
```

### High CPU Usage

**Increase update interval:**
```bash
# Default is 2 seconds, try 5 or 10
./neuralmesh-agent --server ws://YOUR_SERVER_IP:3001/agent --interval 10
```

**Disable detailed metrics:**
```bash
# Coming in future version
./neuralmesh-agent --server ws://YOUR_SERVER_IP:3001/agent --minimal-metrics
```

### Permission Denied

**Linux/macOS:**
```bash
# Make sure binary is executable
chmod +x neuralmesh-agent

# Check if port requires root (ports < 1024)
# Use sudo only if necessary
sudo ./neuralmesh-agent --server ws://YOUR_SERVER_IP:3001/agent
```

### Can't Find Server

**Use IP address instead of hostname:**
```bash
# Instead of:
./neuralmesh-agent --server ws://neuralmesh:3001/agent

# Use:
./neuralmesh-agent --server ws://192.168.1.100:3001/agent
```

**Check DNS:**
```bash
# Try to resolve hostname
nslookup neuralmesh
ping neuralmesh

# If fails, use IP directly
```

---

## 💡 Advanced Topics

### Multi-Server Setup

Connect agent to multiple NeuralMesh instances:

```bash
# Primary server
./neuralmesh-agent --server ws://primary:3001/agent --name "Device-Primary" &

# Backup server
./neuralmesh-agent --server ws://backup:3001/agent --name "Device-Backup" &
```

### Custom Metrics

Future feature - send custom metrics to NeuralMesh:

```bash
./neuralmesh-agent \
  --server ws://YOUR_SERVER_IP:3001/agent \
  --custom-metrics /path/to/metrics.json
```

### Security Hardening

**Use authentication:**
```bash
./neuralmesh-agent \
  --server ws://YOUR_SERVER_IP:3001/agent \
  --token "your-secret-token"
```

**Use TLS:**
```bash
./neuralmesh-agent \
  --server wss://YOUR_SERVER_IP:3001/agent \
  --tls-cert /path/to/cert.pem
```

**Restrict permissions:**
```bash
# Run as specific user
sudo -u neuralmesh ./neuralmesh-agent --server ws://YOUR_SERVER_IP:3001/agent
```

---

## 📚 Quick Reference

### Common Commands

```bash
# Start agent
./neuralmesh-agent --server ws://SERVER:3001/agent

# Start with custom name
./neuralmesh-agent --server ws://SERVER:3001/agent --name "My Device"

# Start in background
nohup ./neuralmesh-agent --server ws://SERVER:3001/agent > agent.log 2>&1 &

# Stop agent
pkill neuralmesh-agent

# Check if running
ps aux | grep neuralmesh-agent

# View logs
tail -f agent.log

# Check version
./neuralmesh-agent --version

# Help
./neuralmesh-agent --help
```

### Environment Variables

```bash
export SERVER_URL=ws://YOUR_SERVER_IP:3001/agent
export NODE_NAME="My Device"
export UPDATE_INTERVAL=2
export LOG_LEVEL=info
./neuralmesh-agent
```

### Service Management (Linux)

```bash
# Status
sudo systemctl status neuralmesh-agent

# Start
sudo systemctl start neuralmesh-agent

# Stop
sudo systemctl stop neuralmesh-agent

# Restart
sudo systemctl restart neuralmesh-agent

# Enable on boot
sudo systemctl enable neuralmesh-agent

# Disable on boot
sudo systemctl disable neuralmesh-agent

# View logs
sudo journalctl -u neuralmesh-agent -f
```

---

## ❓ Need Help?

- 📚 **Documentation**: [NeuralMesh Wiki](https://github.com/MrNova420/NeuralMesh/wiki)
- 💬 **Community**: [GitHub Discussions](https://github.com/MrNova420/NeuralMesh/discussions)
- 🐛 **Report Bug**: [GitHub Issues](https://github.com/MrNova420/NeuralMesh/issues)
- 📧 **Contact**: support@neuralmesh.dev

---

<div align="center">

**Made with 🧠 and ⚡ for the NeuralMesh Platform**

[⭐ Star on GitHub](https://github.com/MrNova420/NeuralMesh) | [📚 Documentation](../README.md) | [💬 Community](https://github.com/MrNova420/NeuralMesh/discussions)

</div>
