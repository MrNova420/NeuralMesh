#!/bin/bash

# NeuralMesh Stop Script
# Universal: Works on WSL, Termux, Linux, macOS
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

# Function to get PIDs for a port (universal)
get_port_pids() {
    local port=$1
    if command -v lsof &> /dev/null; then
        lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null
    elif command -v netstat &> /dev/null; then
        netstat -tulpn 2>/dev/null | grep ":$port " | awk '{print $7}' | cut -d'/' -f1
    elif command -v ss &> /dev/null; then
        ss -tulpn 2>/dev/null | grep ":$port " | grep -o 'pid=[0-9][0-9]*' | sed 's/.*=//'
    else
        # Fallback: search process list for node/npm on this port
        ps aux | grep -E "node|npm" | grep -v grep | awk '{print $2}'
    fi
}

# Function to stop processes on a port (universal)
stop_port() {
    local port=$1
    local name=$2
    
    local pids=$(get_port_pids $port)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Stopping $name (port $port)...${NC}"
        for pid in $pids; do
            if kill -0 $pid 2>/dev/null; then
                kill -15 $pid 2>/dev/null && echo -e "${GREEN}✓${NC} Stopped process $pid" || echo -e "${YELLOW}⚠${NC} Process $pid already stopped"
            fi
        done
        sleep 1
        
        # Force kill if still running
        for pid in $pids; do
            if kill -0 $pid 2>/dev/null; then
                echo -e "${YELLOW}Force stopping process $pid...${NC}"
                kill -9 $pid 2>/dev/null
            fi
        done
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

# Additional cleanup: stop any remaining node/npm processes from NeuralMesh
echo
echo -e "${BLUE}Cleaning up any remaining NeuralMesh processes...${NC}"
NEURALMESH_PIDS=$(ps -eo pid,command 2>/dev/null | awk '(/[n]ode/ || /[n]pm/) && /neuralmesh/ {print $1}')
if [ -n "$NEURALMESH_PIDS" ]; then
    for pid in $NEURALMESH_PIDS; do
        kill -15 "$pid" 2>/dev/null && echo -e "${GREEN}✓${NC} Stopped process $pid"
    done
fi

# Check if systemd service is running (Linux only)
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
echo -e "${BLUE}🔄 To restart:${NC} ${YELLOW}./start.sh${NC}"
echo

