#!/bin/bash

# NeuralMesh Quick Start Script
# For developers who want to start quickly without full setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   NeuralMesh Quick Start (Development Mode)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${BLUE}This will:${NC}"
echo -e "  ${GREEN}✓${NC} Install dependencies (npm install)"
echo -e "  ${GREEN}✓${NC} Start backend in development mode"
echo -e "  ${GREEN}✓${NC} Start frontend in development mode"
echo -e "  ${YELLOW}⚠${NC} Requires PostgreSQL and Redis to be running"
echo
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled"
    exit 0
fi

# Check prerequisites
echo
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo -e "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v) found"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm -v) found"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null && ! psql -U postgres -l &> /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC} PostgreSQL doesn't appear to be running"
    echo -e "  Please start PostgreSQL before continuing:"
    echo -e "  Linux:  ${YELLOW}sudo systemctl start postgresql${NC}"
    echo -e "  macOS:  ${YELLOW}brew services start postgresql@16${NC}"
    echo
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} PostgreSQL is running"
fi

# Check if Redis is running
if ! redis-cli ping &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Redis doesn't appear to be running (optional)"
    echo -e "  To start Redis:"
    echo -e "  Linux:  ${YELLOW}sudo systemctl start redis${NC}"
    echo -e "  macOS:  ${YELLOW}brew services start redis${NC}"
else
    echo -e "${GREEN}✓${NC} Redis is running"
fi

# Check if .env files exist
if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    echo
    echo -e "${YELLOW}⚠${NC} Backend .env file not found"
    echo -e "  Creating from example..."
    
    if [ -f "$SCRIPT_DIR/backend/.env.example" ]; then
        cp "$SCRIPT_DIR/backend/.env.example" "$SCRIPT_DIR/backend/.env"
        echo -e "${GREEN}✓${NC} Created backend/.env (edit for your configuration)"
    else
        echo -e "${RED}✗${NC} Could not find .env.example"
        echo -e "  Please run ${YELLOW}./setup.sh${NC} for full setup"
        exit 1
    fi
fi

if [ ! -f "$SCRIPT_DIR/frontend/.env" ]; then
    echo -e "${YELLOW}⚠${NC} Frontend .env file not found"
    echo -e "  Creating default configuration..."
    
    cat > "$SCRIPT_DIR/frontend/.env" << EOF
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
EOF
    echo -e "${GREEN}✓${NC} Created frontend/.env"
fi

# Install backend dependencies
echo
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi
echo -e "${GREEN}✓${NC} Backend dependencies installed"

# Install frontend dependencies
echo
echo -e "${BLUE}Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi
echo -e "${GREEN}✓${NC} Frontend dependencies installed"

# Check if we need to run migrations
echo
echo -e "${BLUE}Checking database...${NC}"
cd "$SCRIPT_DIR/backend"
if npm run db:push 2>&1 | grep -q "error"; then
    echo -e "${YELLOW}⚠${NC} Database migration had issues"
    echo -e "  You may need to run: ${YELLOW}./setup.sh${NC} for full database setup"
else
    echo -e "${GREEN}✓${NC} Database is ready"
fi

# Start services
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Starting Development Services${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Start backend
echo -e "${BLUE}Starting backend...${NC}"
cd "$SCRIPT_DIR/backend"
npm run dev > /tmp/neuralmesh-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓${NC} Backend started (PID: $BACKEND_PID)"
echo -e "  Logs: ${YELLOW}tail -f /tmp/neuralmesh-backend.log${NC}"

# Wait for backend to start
sleep 3

# Start frontend
echo
echo -e "${BLUE}Starting frontend...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev > /tmp/neuralmesh-frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓${NC} Frontend started (PID: $FRONTEND_PID)"
echo -e "  Logs: ${YELLOW}tail -f /tmp/neuralmesh-frontend.log${NC}"

# Wait for services to be ready
sleep 5

# Display status
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   NeuralMesh Development Server Running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:5173${NC}"
echo -e "   Backend:   ${GREEN}http://localhost:3000${NC}"
echo -e "   API Docs:  ${GREEN}http://localhost:3000/docs${NC}"
echo
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Backend:   ${YELLOW}tail -f /tmp/neuralmesh-backend.log${NC}"
echo -e "   Frontend:  ${YELLOW}tail -f /tmp/neuralmesh-frontend.log${NC}"
echo
echo -e "${BLUE}🛑 To Stop:${NC}"
echo -e "   Run: ${YELLOW}./stop.sh${NC}"
echo -e "   Or:  ${YELLOW}pkill -f 'npm run dev'${NC}"
echo
echo -e "${BLUE}💡 Tip:${NC} Changes to code will auto-reload!"
echo
echo -e "${GREEN}Happy coding! 🚀${NC}"
echo
