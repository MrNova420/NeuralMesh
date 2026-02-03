#!/bin/bash

# NeuralMesh One-Click Installer
# Downloads and runs the complete setup

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
echo -e "${GREEN}NeuralMesh v1.0.0 - One-Click Installer${NC}"
echo

# Check for required commands
for cmd in curl git; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}Error: $cmd is not installed${NC}"
        echo "Please install $cmd and try again"
        exit 1
    fi
done

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="Linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macOS"
else
    echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Detected OS: $OS"

# Check for sudo
if ! sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}This installer requires sudo privileges${NC}"
    sudo -v
fi

# Installation directory
INSTALL_DIR="${HOME}/neuralmesh"
REPO_URL="https://github.com/MrNova420/NeuralMesh.git"

echo
echo -e "${YELLOW}Installation directory: $INSTALL_DIR${NC}"
echo -e "${BLUE}This will:${NC}"
echo -e "  ${GREEN}✓${NC} Clone the NeuralMesh repository"
echo -e "  ${GREEN}✓${NC} Install all dependencies (Node.js, PostgreSQL, Redis)"
echo -e "  ${GREEN}✓${NC} Create database with proper ownership"
echo -e "  ${GREEN}✓${NC} Generate secure secrets (JWT, passwords)"
echo -e "  ${GREEN}✓${NC} Configure firewall rules"
echo -e "  ${GREEN}✓${NC} Build frontend application"
echo -e "  ${GREEN}✓${NC} Set up systemd service (Linux)"
echo

# Confirm installation
read -p "Continue with installation? (y/n) " -n 1 -r </dev/tty
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 0
fi

# Clone repository
echo
echo -e "${YELLOW}Cloning NeuralMesh repository...${NC}"

if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Directory exists. Updating...${NC}"
    cd "$INSTALL_DIR"
    git pull
else
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

echo -e "${GREEN}✓${NC} Repository cloned"

# Run setup script
echo
echo -e "${YELLOW}Running setup script...${NC}"
echo

chmod +x setup.sh
./setup.sh

# Success message
echo
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Installation Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo
echo -e "NeuralMesh has been installed to:"
echo -e "  ${GREEN}$INSTALL_DIR${NC}"
echo
echo -e "To start the platform:"
echo -e "  ${YELLOW}cd $INSTALL_DIR${NC}"
echo -e "  ${YELLOW}./start.sh${NC}"
echo
echo -e "Documentation:"
echo -e "  ${BLUE}https://github.com/MrNova420/NeuralMesh${NC}"
echo
echo -e "${GREEN}Thank you for installing NeuralMesh!${NC}"
echo
