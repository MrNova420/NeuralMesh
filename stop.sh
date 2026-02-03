#!/bin/bash

# NeuralMesh Stop Script
# Stops all NeuralMesh services gracefully

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Stopping NeuralMesh Services${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Function to stop processes on a port
stop_port() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping $name (port $port)...${NC}"
        local pids=$(lsof -Pi :$port -sTCP:LISTEN -t)
        for pid in $pids; do
            kill -15 $pid 2>/dev/null && echo -e "${GREEN}✓${NC} Stopped process $pid" || echo -e "${YELLOW}⚠${NC} Process $pid already stopped"
        done
        sleep 1
        
        # Force kill if still running
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "${YELLOW}Force stopping remaining processes...${NC}"
            pids=$(lsof -Pi :$port -sTCP:LISTEN -t)
            for pid in $pids; do
                kill -9 $pid 2>/dev/null
            done
        fi
    else
        echo -e "${BLUE}$name (port $port):${NC} ${GREEN}Not running${NC}"
    fi
}

# Stop backend on port 3000
stop_port 3000 "Backend API"

# Stop agent WebSocket on port 3001
stop_port 3001 "Agent WebSocket"

# Stop frontend on port 5173
stop_port 5173 "Frontend"

# Stop frontend on port 5174 (fallback port)
stop_port 5174 "Frontend (alternate)"

# Stop by legacy port configuration if exists
LEGACY_BACKEND_PID=$(lsof -ti:3001 2>/dev/null)
if [ -n "$LEGACY_BACKEND_PID" ]; then
    echo -e "${YELLOW}Stopping legacy backend process (old port 3001)...${NC}"
    kill $LEGACY_BACKEND_PID 2>/dev/null
    echo -e "${GREEN}✓${NC} Stopped legacy backend (PID: $LEGACY_BACKEND_PID)"
fi

# Check if systemd service is running (Linux)
if command -v systemctl &> /dev/null; then
    if systemctl is-active --quiet neuralmesh 2>/dev/null; then
        echo
        echo -e "${YELLOW}NeuralMesh systemd service is running${NC}"
        echo -e "To stop it, run: ${GREEN}sudo systemctl stop neuralmesh${NC}"
    fi
fi

echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   All NeuralMesh Services Stopped${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${BLUE}📝 Log files preserved:${NC}"
echo -e "   Backend:  /tmp/neuralmesh-backend.log"
echo -e "   Frontend: /tmp/neuralmesh-frontend.log"
echo
echo -e "${BLUE}🔄 To restart:${NC} ${YELLOW}./start.sh${NC} or ${YELLOW}./quick-start.sh${NC}"
echo

