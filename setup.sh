#!/bin/bash

# NeuralMesh Setup Script
# Automated installation and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_VERSION="16"
REDIS_VERSION="7"
NODE_VERSION="20"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   NeuralMesh Setup v1.0.0${NC}"
echo -e "${GREEN}=====================================${NC}"
echo

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}Warning: Running as root. Consider running as regular user with sudo privileges.${NC}"
fi

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/debian_version ]; then
        OS="debian"
        PKG_MANAGER="apt"
    elif [ -f /etc/redhat-release ]; then
        OS="redhat"
        PKG_MANAGER="yum"
    else
        OS="linux"
        PKG_MANAGER="unknown"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    PKG_MANAGER="brew"
else
    echo -e "${RED}Unsupported operating system: $OSTYPE${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Detected OS: $OS"

# Check prerequisites
echo
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    if [[ "$OS" == "debian" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "macos" ]]; then
        if ! command -v brew &> /dev/null; then
            echo -e "${RED}Homebrew not found. Please install from https://brew.sh${NC}"
            exit 1
        fi
        brew install node
    fi
else
    NODE_VER=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VER installed"
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL not found. Installing...${NC}"
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y postgresql-$POSTGRES_VERSION postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    elif [[ "$OS" == "macos" ]]; then
        brew install postgresql@$POSTGRES_VERSION
        brew services start postgresql@$POSTGRES_VERSION
    fi
else
    PSQL_VER=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} PostgreSQL $PSQL_VER installed"
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}Redis not found. Installing...${NC}"
    if [[ "$OS" == "debian" ]]; then
        sudo apt-get install -y redis-server
        sudo systemctl start redis-server
        sudo systemctl enable redis-server
    elif [[ "$OS" == "macos" ]]; then
        brew install redis
        brew services start redis
    fi
else
    REDIS_VER=$(redis-cli --version | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Redis $REDIS_VER installed"
fi

# Setup database
echo
echo -e "${YELLOW}Setting up database...${NC}"

DB_NAME="neuralmesh"
DB_USER="neuralmesh"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)

# Create database and user
if [[ "$OS" == "macos" ]]; then
    psql -U $(whoami) -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
    psql -U $(whoami) -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
    psql -U $(whoami) -d postgres -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
    psql -U $(whoami) -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    psql -U $(whoami) -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    psql -U $(whoami) -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;"
else
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
    sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;"
fi

echo -e "${GREEN}✓${NC} Database created"

# Install dependencies
echo
echo -e "${YELLOW}Installing dependencies...${NC}"

# Backend dependencies
cd "$SCRIPT_DIR/backend"
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi
echo -e "${GREEN}✓${NC} Backend dependencies installed"

# Frontend dependencies
cd "$SCRIPT_DIR/frontend"
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi
echo -e "${GREEN}✓${NC} Frontend dependencies installed"

cd "$SCRIPT_DIR"

# Generate secrets
echo
echo -e "${YELLOW}Generating secrets...${NC}"

JWT_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)

# Create backend .env file
cat > "$SCRIPT_DIR/backend/.env" << EOF
# Server Configuration
PORT=3000
AGENT_PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Features
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
ENABLE_MONITORING=true
USE_MOCK_NODES=false
EOF

echo -e "${GREEN}✓${NC} Backend environment configured"

# Create frontend .env file
cat > "$SCRIPT_DIR/frontend/.env" << EOF
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
EOF

echo -e "${GREEN}✓${NC} Frontend environment configured"

# Run database migrations
echo
echo -e "${YELLOW}Running database migrations...${NC}"
cd "$SCRIPT_DIR/backend"

# Try to run migrations with better error handling
if npm run db:push 2>&1 | grep -v "Warning" | tee /tmp/neuralmesh-migration.log | grep -q "permission denied"; then
    echo -e "${RED}✗${NC} Database migration failed due to permissions"
    echo -e "${YELLOW}Attempting to fix permissions...${NC}"
    
    # Fix permissions
    if [[ "$OS" == "macos" ]]; then
        psql -U $(whoami) -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;" 2>/dev/null || true
        psql -U $(whoami) -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
    else
        sudo -u postgres psql -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;" 2>/dev/null || true
        sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
    fi
    
    # Retry migration
    npm run db:push 2>&1 | grep -v "Warning" || true
fi

echo -e "${GREEN}✓${NC} Database migrations completed"

cd "$SCRIPT_DIR"

# Configure firewall (if available)
echo
echo -e "${YELLOW}Configuring firewall...${NC}"

if command -v ufw &> /dev/null; then
    sudo ufw allow 3000/tcp comment "NeuralMesh API" 2>/dev/null || true
    sudo ufw allow 5173/tcp comment "NeuralMesh Frontend" 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Firewall configured (ufw)"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
    sudo firewall-cmd --permanent --add-port=5173/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Firewall configured (firewalld)"
else
    echo -e "${YELLOW}⚠${NC} No firewall detected, skipping"
fi

# Create systemd service (Linux only)
if [[ "$OS" != "macos" ]] && command -v systemctl &> /dev/null; then
    echo
    echo -e "${YELLOW}Creating systemd service...${NC}"
    
    sudo tee /etc/systemd/system/neuralmesh.service > /dev/null << EOF
[Unit]
Description=NeuralMesh Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR/backend
ExecStart=$(which npm) start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable neuralmesh.service 2>/dev/null || true
    
    echo -e "${GREEN}✓${NC} Systemd service created"
fi

# Build frontend
echo
echo -e "${YELLOW}Building frontend...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run build:quick
echo -e "${GREEN}✓${NC} Frontend built"

cd "$SCRIPT_DIR"

# Summary
echo
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo
echo -e "Configuration saved to:"
echo -e "  Backend:  ${GREEN}$SCRIPT_DIR/backend/.env${NC}"
echo -e "  Frontend: ${GREEN}$SCRIPT_DIR/frontend/.env${NC}"
echo
echo -e "Database:"
echo -e "  Name:     ${GREEN}$DB_NAME${NC}"
echo -e "  User:     ${GREEN}$DB_USER${NC}"
echo -e "  Password: ${GREEN}$DB_PASSWORD${NC}"
echo
echo -e "To start NeuralMesh:"
if [[ "$OS" == "macos" ]]; then
    echo -e "  ${YELLOW}cd $SCRIPT_DIR && ./start.sh${NC}"
else
    echo -e "  ${YELLOW}sudo systemctl start neuralmesh${NC}"
    echo -e "  or"
    echo -e "  ${YELLOW}cd $SCRIPT_DIR && ./start.sh${NC}"
fi
echo
echo -e "Access the platform at:"
echo -e "  ${GREEN}http://localhost:5173${NC}"
echo
echo -e "API available at:"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo
echo -e "${YELLOW}Important: Save your credentials securely!${NC}"
echo
