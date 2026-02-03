#!/bin/bash

# NeuralMesh Setup Script
# Automated installation and configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
POSTGRES_VERSION="16"
REDIS_VERSION="7"
NODE_VERSION="20"

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
    psql -U $(whoami) -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
else
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
fi

echo -e "${GREEN}✓${NC} Database created"

# Install dependencies
echo
echo -e "${YELLOW}Installing dependencies...${NC}"

# Backend dependencies
cd backend
npm install
echo -e "${GREEN}✓${NC} Backend dependencies installed"

# Frontend dependencies
cd ../frontend
npm install
echo -e "${GREEN}✓${NC} Frontend dependencies installed"

cd ..

# Generate secrets
echo
echo -e "${YELLOW}Generating secrets...${NC}"

JWT_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)

# Create .env file
cat > backend/.env << EOF
# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# JWT Secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# Server
PORT=3000
NODE_ENV=production
SERVER_URL=http://localhost:3000

# Features
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
ENABLE_MONITORING=true
EOF

echo -e "${GREEN}✓${NC} Environment configured"

# Run database migrations
echo
echo -e "${YELLOW}Running database migrations...${NC}"
cd backend
npm run db:push
echo -e "${GREEN}✓${NC} Database migrations completed"

cd ..

# Configure firewall (if available)
echo
echo -e "${YELLOW}Configuring firewall...${NC}"

if command -v ufw &> /dev/null; then
    sudo ufw allow 3000/tcp comment "NeuralMesh API"
    sudo ufw allow 5173/tcp comment "NeuralMesh Frontend"
    echo -e "${GREEN}✓${NC} Firewall configured (ufw)"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --permanent --add-port=5173/tcp
    sudo firewall-cmd --reload
    echo -e "${GREEN}✓${NC} Firewall configured (firewalld)"
else
    echo -e "${YELLOW}⚠${NC} No firewall detected, skipping"
fi

# Create systemd service (Linux only)
if [[ "$OS" != "macos" ]]; then
    echo
    echo -e "${YELLOW}Creating systemd service...${NC}"
    
    INSTALL_DIR=$(pwd)
    
    sudo tee /etc/systemd/system/neuralmesh.service > /dev/null << EOF
[Unit]
Description=NeuralMesh Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable neuralmesh.service
    
    echo -e "${GREEN}✓${NC} Systemd service created"
fi

# Build frontend
echo
echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm run build
echo -e "${GREEN}✓${NC} Frontend built"

cd ..

# Summary
echo
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo
echo -e "Configuration saved to: ${GREEN}backend/.env${NC}"
echo
echo -e "Database:"
echo -e "  Name: ${GREEN}$DB_NAME${NC}"
echo -e "  User: ${GREEN}$DB_USER${NC}"
echo -e "  Password: ${GREEN}$DB_PASSWORD${NC}"
echo
echo -e "To start NeuralMesh:"
if [[ "$OS" == "macos" ]]; then
    echo -e "  ${YELLOW}./start.sh${NC}"
else
    echo -e "  ${YELLOW}sudo systemctl start neuralmesh${NC}"
    echo -e "  or"
    echo -e "  ${YELLOW}./start.sh${NC}"
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
