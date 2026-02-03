#!/bin/bash

# NeuralMesh Agent Installer for Linux/macOS
# Installs and configures the NeuralMesh agent

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
SERVER_URL=""
API_KEY=""
INSTALL_DIR="/opt/neuralmesh-agent"
SERVICE_NAME="neuralmesh-agent"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --server)
            SERVER_URL="$2"
            shift 2
            ;;
        --api-key)
            API_KEY="$2"
            shift 2
            ;;
        --install-dir)
            INSTALL_DIR="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}NeuralMesh Agent Installer v1.0.0${NC}"
echo

# Prompt for server URL if not provided
if [ -z "$SERVER_URL" ]; then
    read -p "Enter NeuralMesh server URL: " SERVER_URL
fi

# Prompt for API key if not provided
if [ -z "$API_KEY" ]; then
    read -p "Enter API key: " API_KEY
fi

# Validate inputs
if [ -z "$SERVER_URL" ] || [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: Server URL and API key are required${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Configuration validated"

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

# Check for sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}This installer requires root privileges${NC}"
    exec sudo "$0" --server "$SERVER_URL" --api-key "$API_KEY" --install-dir "$INSTALL_DIR"
fi

# Create installation directory
echo
echo -e "${YELLOW}Creating installation directory...${NC}"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Download agent binary (simulated for now)
echo -e "${YELLOW}Downloading agent...${NC}"
cat > agent.sh << 'AGENT_SCRIPT'
#!/bin/bash
# NeuralMesh Agent
while true; do
    # Send heartbeat to server
    curl -s -X POST "$SERVER_URL/api/nodes/heartbeat" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "{
            \"hostname\": \"$(hostname)\",
            \"ip\": \"$(hostname -I | awk '{print $1}')\",
            \"cpu\": $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}'),
            \"memory\": $(free | grep Mem | awk '{print ($3/$2) * 100.0}'),
            \"disk\": $(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
        }" 2>/dev/null
    sleep 30
done
AGENT_SCRIPT

chmod +x agent.sh

# Create configuration file
echo -e "${YELLOW}Creating configuration...${NC}"
cat > config.json << EOF
{
  "serverUrl": "$SERVER_URL",
  "apiKey": "$API_KEY",
  "hostname": "$(hostname)",
  "updateInterval": 30
}
EOF

echo -e "${GREEN}✓${NC} Agent installed"

# Create systemd service (Linux) or launchd (macOS)
echo -e "${YELLOW}Setting up service...${NC}"

if [[ "$OS" == "linux" ]]; then
    # Create systemd service
    cat > /etc/systemd/system/$SERVICE_NAME.service << EOF
[Unit]
Description=NeuralMesh Agent
After=network.target

[Service]
Type=simple
ExecStart=$INSTALL_DIR/agent.sh
Restart=always
RestartSec=10
Environment="SERVER_URL=$SERVER_URL"
Environment="API_KEY=$API_KEY"

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    systemctl start $SERVICE_NAME
    
    echo -e "${GREEN}✓${NC} Service configured (systemd)"
    
elif [[ "$OS" == "macos" ]]; then
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
        <string>$INSTALL_DIR/agent.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>EnvironmentVariables</key>
    <dict>
        <key>SERVER_URL</key>
        <string>$SERVER_URL</string>
        <key>API_KEY</key>
        <string>$API_KEY</string>
    </dict>
</dict>
</plist>
EOF

    launchctl load "$PLIST_PATH"
    
    echo -e "${GREEN}✓${NC} Service configured (launchd)"
fi

# Summary
echo
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Installation Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo
echo -e "Agent installed to: ${GREEN}$INSTALL_DIR${NC}"
echo -e "Server: ${GREEN}$SERVER_URL${NC}"
echo
echo -e "Service status:"
if [[ "$OS" == "linux" ]]; then
    systemctl status $SERVICE_NAME --no-pager | head -5
elif [[ "$OS" == "macos" ]]; then
    launchctl list | grep neuralmesh
fi
echo
echo -e "To stop the agent:"
if [[ "$OS" == "linux" ]]; then
    echo -e "  ${YELLOW}sudo systemctl stop $SERVICE_NAME${NC}"
elif [[ "$OS" == "macos" ]]; then
    echo -e "  ${YELLOW}launchctl unload $PLIST_PATH${NC}"
fi
echo
