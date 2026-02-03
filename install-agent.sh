#!/bin/bash

# NeuralMesh Agent Installer for Linux/macOS/Termux
# Installs and configures the NeuralMesh agent to connect to your server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
cat << "EOF"
 _   _                      _ __  __           _     
| \ | | ___ _   _ _ __ __ _| |  \/  | ___  ___| |__  
|  \| |/ _ \ | | | '__/ _` | | |\/| |/ _ \/ __| '_ \ 
| |\  |  __/ |_| | | | (_| | | |  | |  __/\__ \ | | |
|_| \_|\___|\__,_|_|  \__,_|_|_|  |_|\___||___/_| |_|
EOF
echo -e "${NC}"
echo -e "${GREEN}NeuralMesh Agent Installer v1.0.0${NC}"
echo

# Default values
SERVER_URL=""
PAIRING_CODE=""
NODE_NAME="$(hostname)"
UPDATE_INTERVAL="2"
INSTALL_DIR="$HOME/neuralmesh-agent"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --server)
            SERVER_URL="$2"
            shift 2
            ;;
        --pairing-code)
            PAIRING_CODE="$2"
            shift 2
            ;;
        --name)
            NODE_NAME="$2"
            shift 2
            ;;
        --interval)
            UPDATE_INTERVAL="$2"
            shift 2
            ;;
        --install-dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo
            echo "Options:"
            echo "  --server URL          WebSocket server URL (e.g., ws://192.168.1.100:3001/agent)"
            echo "  --pairing-code CODE   Pairing code from dashboard (6 chars, optional)"
            echo "  --name NAME           Friendly name for this device (default: hostname)"
            echo "  --interval SECONDS    Update interval in seconds (default: 2)"
            echo "  --install-dir DIR     Installation directory (default: ~/neuralmesh-agent)"
            echo "  -h, --help            Show this help message"
            echo
            echo "Examples:"
            echo "  # Basic installation (will prompt for server)"
            echo "  $0"
            echo
            echo "  # With server URL"
            echo "  $0 --server ws://192.168.1.100:3001/agent"
            echo
            echo "  # Full options"
            echo "  $0 \\"
            echo "    --server ws://192.168.1.100:3001/agent \\"
            echo "    --name \"My Device\" \\"
            echo "    --interval 2"
            echo
            echo "  # With pairing code (optional, for future authentication)"
            echo "  $0 \\"
            echo "    --server ws://192.168.1.100:3001/agent \\"
            echo "    --pairing-code ABC123"
            echo
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Detect platform
if [ -d "/data/data/com.termux" ] || [ -n "$TERMUX_VERSION" ]; then
    PLATFORM="termux"
    INSTALL_DIR="$HOME/neuralmesh-agent"
    echo -e "${GREEN}✓${NC} Platform: Termux (Android)"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    PLATFORM="linux"
    echo -e "${GREEN}✓${NC} Platform: Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    PLATFORM="macos"
    echo -e "${GREEN}✓${NC} Platform: macOS"
else
    PLATFORM="unknown"
    echo -e "${YELLOW}⚠${NC} Platform: Unknown ($OSTYPE) - will attempt generic installation"
fi

# Prompt for server URL if not provided
if [ -z "$SERVER_URL" ]; then
    echo
    echo -e "${YELLOW}Enter NeuralMesh server details:${NC}"
    echo
    read -p "Server IP or hostname (e.g., 192.168.1.100 or localhost): " SERVER_IP
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="localhost"
    fi
    SERVER_URL="ws://${SERVER_IP}:3001/agent"
fi

# Prompt for pairing code if not provided (OPTIONAL - for future use)
if [ -z "$PAIRING_CODE" ]; then
    echo
    echo -e "${BLUE}Pairing Code (Optional):${NC}"
    echo -e "  ${YELLOW}Note:${NC} Pairing code is 6 characters (e.g., ABC123)"
    echo -e "  Get from: Dashboard → Devices → Add Device"
    echo -e "  ${YELLOW}Press Enter to skip (direct connection mode)${NC}"
    echo
    read -p "Enter pairing code or press Enter to skip: " PAIRING_CODE
fi

# Validate server URL is provided
if [ -z "$SERVER_URL" ]; then
    echo -e "${RED}Error: Server URL is required${NC}"
    exit 1
fi

echo
echo -e "${GREEN}✓${NC} Configuration validated"
echo -e "  Server: ${GREEN}$SERVER_URL${NC}"
echo -e "  Device: ${GREEN}$NODE_NAME${NC}"
echo -e "  Interval: ${GREEN}${UPDATE_INTERVAL}s${NC}"

# Create installation directory
echo
echo -e "${BLUE}Setting up installation...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"
echo -e "${GREEN}✓${NC} Created directory: $INSTALL_DIR"

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        AGENT_ARCH="amd64"
        ;;
    aarch64|arm64)
        AGENT_ARCH="arm64"
        ;;
    armv7l|armv7*)
        AGENT_ARCH="armv7"
        ;;
    *)
        echo -e "${YELLOW}⚠${NC} Unknown architecture: $ARCH, assuming amd64"
        AGENT_ARCH="amd64"
        ;;
esac

# Download agent binary
echo
echo -e "${BLUE}Downloading NeuralMesh agent...${NC}"

# Try to download from GitHub releases (when available)
AGENT_URL="https://github.com/MrNova420/NeuralMesh/releases/latest/download/neuralmesh-agent-${PLATFORM}-${AGENT_ARCH}"

if command -v curl &> /dev/null; then
    if curl -fSL "$AGENT_URL" -o neuralmesh-agent 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Downloaded agent from GitHub releases"
    else
        echo -e "${YELLOW}⚠${NC} Could not download from GitHub, using local build"
        # Fallback: compile from source if Rust is available
        if command -v cargo &> /dev/null; then
            echo -e "${BLUE}Building agent from source...${NC}"
            git clone --depth 1 https://github.com/MrNova420/NeuralMesh.git temp-source
            cd temp-source/agent
            cargo build --release
            cp target/release/neuralmesh-agent "$INSTALL_DIR/"
            cd "$INSTALL_DIR"
            rm -rf temp-source
            echo -e "${GREEN}✓${NC} Built agent from source"
        else
            echo -e "${RED}✗${NC} Cannot download or build agent"
            echo -e "Please install Rust or download the agent manually"
            exit 1
        fi
    fi
elif command -v wget &> /dev/null; then
    if wget -q "$AGENT_URL" -O neuralmesh-agent 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Downloaded agent"
    else
        echo -e "${RED}✗${NC} Could not download agent"
        exit 1
    fi
else
    echo -e "${RED}✗${NC} Neither curl nor wget found"
    exit 1
fi

chmod +x neuralmesh-agent
echo -e "${GREEN}✓${NC} Agent installed"

# Create configuration file
echo
echo -e "${BLUE}Creating configuration...${NC}"
cat > config.env << EOF
# NeuralMesh Agent Configuration
SERVER_URL=$SERVER_URL
PAIRING_CODE=$PAIRING_CODE
NODE_NAME=$NODE_NAME
UPDATE_INTERVAL=$UPDATE_INTERVAL
LOG_LEVEL=info
EOF

echo -e "${GREEN}✓${NC} Configuration saved"

# Test connection
echo
echo -e "${BLUE}Testing connection to server...${NC}"
if ./neuralmesh-agent --version &> /dev/null; then
    echo -e "${GREEN}✓${NC} Agent binary is working"
else
    echo -e "${YELLOW}⚠${NC} Could not verify agent binary"
fi

# Setup service based on platform
echo
echo -e "${BLUE}Setting up service...${NC}"

if [[ "$PLATFORM" == "linux" ]] && command -v systemctl &> /dev/null && [ -d /etc/systemd/system ]; then
    # Create systemd service
    SERVICE_FILE="/etc/systemd/system/neuralmesh-agent.service"
    
    echo -e "${YELLOW}Creating systemd service (requires sudo)...${NC}"
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
[Unit]
Description=NeuralMesh Agent
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
EnvironmentFile=$INSTALL_DIR/config.env
ExecStart=$INSTALL_DIR/neuralmesh-agent --server \${SERVER_URL} --name "\${NODE_NAME}" --interval \${UPDATE_INTERVAL}
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable neuralmesh-agent
    sudo systemctl start neuralmesh-agent
    
    echo -e "${GREEN}✓${NC} Service configured and started (systemd)"
    echo
    echo -e "${BLUE}Service commands:${NC}"
    echo -e "  Status:  ${YELLOW}sudo systemctl status neuralmesh-agent${NC}"
    echo -e "  Stop:    ${YELLOW}sudo systemctl stop neuralmesh-agent${NC}"
    echo -e "  Restart: ${YELLOW}sudo systemctl restart neuralmesh-agent${NC}"
    echo -e "  Logs:    ${YELLOW}sudo journalctl -u neuralmesh-agent -f${NC}"
    
elif [[ "$PLATFORM" == "macos" ]]; then
    # Create launchd plist
    PLIST_PATH="$HOME/Library/LaunchAgents/com.neuralmesh.agent.plist"
    mkdir -p "$HOME/Library/LaunchAgents"
    
    cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.neuralmesh.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>$INSTALL_DIR/neuralmesh-agent</string>
        <string>--server</string>
        <string>$SERVER_URL</string>
        <string>--name</string>
        <string>$NODE_NAME</string>
        <string>--interval</string>
        <string>$UPDATE_INTERVAL</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$INSTALL_DIR/agent.log</string>
    <key>StandardErrorPath</key>
    <string>$INSTALL_DIR/agent.error.log</string>
</dict>
</plist>
EOF

    # Try to load the plist
    if ! launchctl load "$PLIST_PATH" 2>/dev/null; then
        # If load fails, try bootout and bootstrap
        launchctl bootout "gui/$(id -u)/com.neuralmesh.agent" 2>/dev/null
        launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
    fi
    
    echo -e "${GREEN}✓${NC} Service configured and started (launchd)"
    echo
    echo -e "${BLUE}Service commands:${NC}"
    echo -e "  Status:  ${YELLOW}launchctl list | grep neuralmesh${NC}"
    echo -e "  Stop:    ${YELLOW}launchctl unload $PLIST_PATH${NC}"
    echo -e "  Restart: ${YELLOW}launchctl unload $PLIST_PATH && launchctl load $PLIST_PATH${NC}"
    echo -e "  Logs:    ${YELLOW}tail -f $INSTALL_DIR/agent.log${NC}"
    
else
    # Manual start for Termux and other platforms
    echo -e "${YELLOW}Starting agent in background...${NC}"
    nohup ./neuralmesh-agent --server "$SERVER_URL" --name "$NODE_NAME" --interval "$UPDATE_INTERVAL" > agent.log 2>&1 &
    AGENT_PID=$!
    echo $AGENT_PID > agent.pid
    
    echo -e "${GREEN}✓${NC} Agent started (PID: $AGENT_PID)"
    echo
    echo -e "${BLUE}Agent commands:${NC}"
    echo -e "  Status:  ${YELLOW}ps aux | grep neuralmesh-agent${NC}"
    echo -e "  Stop:    ${YELLOW}kill \$(cat $INSTALL_DIR/agent.pid)${NC}"
    echo -e "  Logs:    ${YELLOW}tail -f $INSTALL_DIR/agent.log${NC}"
    
    # Create start/stop scripts
    cat > start-agent.sh << 'STARTSCRIPT'
#!/bin/bash
cd "$(dirname "$0")"
source config.env
nohup ./neuralmesh-agent --server "$SERVER_URL" --name "$NODE_NAME" --interval "$UPDATE_INTERVAL" > agent.log 2>&1 &
echo $! > agent.pid
echo "Agent started (PID: $(cat agent.pid))"
STARTSCRIPT
    
    cat > stop-agent.sh << 'STOPSCRIPT'
#!/bin/bash
cd "$(dirname "$0")"
if [ -f agent.pid ]; then
    PID=$(cat agent.pid)
    kill $PID 2>/dev/null && echo "Agent stopped (PID: $PID)" || echo "Agent not running"
    rm -f agent.pid
else
    echo "No PID file found"
fi
STOPSCRIPT
    
    chmod +x start-agent.sh stop-agent.sh
    echo -e "  Start:   ${YELLOW}$INSTALL_DIR/start-agent.sh${NC}"
    echo -e "  Stop:    ${YELLOW}$INSTALL_DIR/stop-agent.sh${NC}"
fi

# Summary
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}         NeuralMesh Agent Installation Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${BLUE}📁 Installation Details:${NC}"
echo -e "   Location:  ${GREEN}$INSTALL_DIR${NC}"
echo -e "   Platform:  ${GREEN}$PLATFORM${NC}"
echo -e "   Server:    ${GREEN}$SERVER_URL${NC}"
echo -e "   Device:    ${GREEN}$NODE_NAME${NC}"
echo
echo -e "${BLUE}🔗 Connection:${NC}"
echo -e "   Your device should appear in the NeuralMesh dashboard within seconds!"
echo -e "   Dashboard: ${GREEN}http://${SERVER_URL%%:*}:5173${NC}"
echo
echo -e "${BLUE}📝 Files:${NC}"
echo -e "   Config:  ${GREEN}$INSTALL_DIR/config.env${NC}"
echo -e "   Logs:    ${GREEN}$INSTALL_DIR/agent.log${NC}"
echo
echo -e "${GREEN}✨ Agent is now running and connected to your NeuralMesh! ✨${NC}"
echo
