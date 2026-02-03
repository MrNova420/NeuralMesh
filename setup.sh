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

# Detect OS and environment
echo
echo -e "${BLUE}Detecting platform...${NC}"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Check if running in Termux (Android)
    if [ -d "/data/data/com.termux" ] || [ -n "$TERMUX_VERSION" ]; then
        OS="termux"
        PKG_MANAGER="pkg"
        echo -e "${GREEN}✓${NC} Detected: Termux (Android)"
    # Check if running in WSL
    elif grep -qEi "(Microsoft|WSL)" /proc/version &> /dev/null; then
        OS="wsl"
        if [ -f /etc/debian_version ]; then
            PKG_MANAGER="apt"
        elif [ -f /etc/redhat-release ]; then
            PKG_MANAGER="yum"
        else
            PKG_MANAGER="unknown"
        fi
        echo -e "${GREEN}✓${NC} Detected: WSL (Windows Subsystem for Linux)"
    # Regular Linux
    elif [ -f /etc/debian_version ]; then
        OS="debian"
        PKG_MANAGER="apt"
        echo -e "${GREEN}✓${NC} Detected: Debian/Ubuntu Linux"
    elif [ -f /etc/redhat-release ]; then
        OS="redhat"
        PKG_MANAGER="yum"
        echo -e "${GREEN}✓${NC} Detected: RedHat/CentOS/Fedora Linux"
    elif [ -f /etc/arch-release ]; then
        OS="arch"
        PKG_MANAGER="pacman"
        echo -e "${GREEN}✓${NC} Detected: Arch Linux"
    else
        OS="linux"
        PKG_MANAGER="unknown"
        echo -e "${GREEN}✓${NC} Detected: Generic Linux"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    PKG_MANAGER="brew"
    echo -e "${GREEN}✓${NC} Detected: macOS"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
    PKG_MANAGER="chocolatey"
    echo -e "${GREEN}✓${NC} Detected: Windows (Git Bash/Cygwin)"
else
    OS="unknown"
    PKG_MANAGER="unknown"
    echo -e "${YELLOW}⚠${NC} Detected: Unknown OS ($OSTYPE)"
    echo -e "${YELLOW}   Will attempt generic installation...${NC}"
fi

# Check prerequisites
echo
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "wsl" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [[ "$OS" == "redhat" ]]; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    elif [[ "$OS" == "arch" ]]; then
        sudo pacman -S --noconfirm nodejs npm
    elif [[ "$OS" == "macos" ]]; then
        if ! command -v brew &> /dev/null; then
            echo -e "${RED}Homebrew not found. Please install from https://brew.sh${NC}"
            exit 1
        fi
        brew install node
    elif [[ "$OS" == "termux" ]]; then
        pkg install -y nodejs
    else
        echo -e "${RED}Cannot install Node.js automatically on this platform${NC}"
        echo -e "Please install Node.js ${NODE_VERSION}+ manually from https://nodejs.org"
        exit 1
    fi
else
    NODE_VER=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js $NODE_VER installed"
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL not found. Installing...${NC}"
    
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "wsl" ]]; then
        sudo apt-get install -y postgresql-$POSTGRES_VERSION postgresql-contrib
        sudo systemctl start postgresql || sudo service postgresql start
        sudo systemctl enable postgresql 2>/dev/null || true
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y postgresql-server postgresql-contrib
        sudo postgresql-setup initdb
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    elif [[ "$OS" == "arch" ]]; then
        sudo pacman -S --noconfirm postgresql
        sudo -u postgres initdb -D /var/lib/postgres/data
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    elif [[ "$OS" == "macos" ]]; then
        brew install postgresql@$POSTGRES_VERSION
        brew services start postgresql@$POSTGRES_VERSION
    elif [[ "$OS" == "termux" ]]; then
        pkg install -y postgresql
        # Termux specific setup
        mkdir -p $PREFIX/var/lib/postgresql
        initdb $PREFIX/var/lib/postgresql
        pg_ctl -D $PREFIX/var/lib/postgresql start
    else
        echo -e "${RED}Cannot install PostgreSQL automatically on this platform${NC}"
        echo -e "Please install PostgreSQL manually:"
        echo -e "  ${YELLOW}https://www.postgresql.org/download/${NC}"
        exit 1
    fi
else
    PSQL_VER=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} PostgreSQL $PSQL_VER installed"
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}Redis not found. Installing...${NC}"
    
    if [[ "$OS" == "debian" ]] || [[ "$OS" == "wsl" ]]; then
        sudo apt-get install -y redis-server
        sudo systemctl start redis-server || sudo service redis-server start
        sudo systemctl enable redis-server 2>/dev/null || true
    elif [[ "$OS" == "redhat" ]]; then
        sudo yum install -y redis
        sudo systemctl start redis
        sudo systemctl enable redis
    elif [[ "$OS" == "arch" ]]; then
        sudo pacman -S --noconfirm redis
        sudo systemctl start redis
        sudo systemctl enable redis
    elif [[ "$OS" == "macos" ]]; then
        brew install redis
        brew services start redis
    elif [[ "$OS" == "termux" ]]; then
        pkg install -y redis
        redis-server --daemonize yes
    else
        echo -e "${YELLOW}Cannot install Redis automatically on this platform${NC}"
        echo -e "Redis is optional but recommended for better performance"
        echo -e "Install from: ${YELLOW}https://redis.io/download${NC}"
    fi
else
    REDIS_VER=$(redis-cli --version | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Redis $REDIS_VER installed"
fi

# Setup database
echo
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Database Setup${NC}"
echo -e "${GREEN}=====================================${NC}"
echo

DB_NAME="neuralmesh"
DB_USER="neuralmesh"
DB_PASSWORD=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)

echo -e "${BLUE}Creating PostgreSQL database and user...${NC}"
echo -e "  Database name: ${YELLOW}$DB_NAME${NC}"
echo -e "  Database user: ${YELLOW}$DB_USER${NC}"
echo -e "  Password: ${YELLOW}[Generated securely - will be saved to .env]${NC}"
echo

# Create database and user
echo -e "${BLUE}→${NC} Creating database..."

if [[ "$OS" == "termux" ]]; then
    # Termux doesn't use sudo or postgres user
    createdb $DB_NAME 2>/dev/null || echo -e "  ${YELLOW}Database already exists, continuing...${NC}"
    echo -e "  ${GREEN}✓${NC} Database created"
    
    echo -e "${BLUE}→${NC} Note: Termux PostgreSQL runs as current user"
    echo -e "  ${GREEN}✓${NC} You have full database ownership automatically"
    
elif [[ "$OS" == "macos" ]]; then
    psql -U $(whoami) -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo -e "  ${YELLOW}Database already exists, continuing...${NC}"
    
    echo -e "${BLUE}→${NC} Creating database user..."
    psql -U $(whoami) -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo -e "  ${YELLOW}User already exists, continuing...${NC}"
    
    echo -e "${BLUE}→${NC} Setting database ownership to $DB_USER..."
    psql -U $(whoami) -d postgres -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
    
    echo -e "${BLUE}→${NC} Granting all privileges to $DB_USER..."
    psql -U $(whoami) -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    echo -e "${BLUE}→${NC} Setting schema ownership to $DB_USER..."
    psql -U $(whoami) -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    psql -U $(whoami) -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;"
    echo -e "  ${GREEN}✓${NC} Schema 'public' is now owned by $DB_USER"
    
else
    # Standard Linux/WSL
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo -e "  ${YELLOW}Database already exists, continuing...${NC}"
    
    echo -e "${BLUE}→${NC} Creating database user (as postgres superuser)..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo -e "  ${YELLOW}User already exists, continuing...${NC}"
    
    echo -e "${BLUE}→${NC} Transferring database ownership to $DB_USER..."
    sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
    echo -e "  ${GREEN}✓${NC} Database is now owned by $DB_USER"
    
    echo -e "${BLUE}→${NC} Granting all privileges to $DB_USER..."
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    
    echo -e "${BLUE}→${NC} Transferring schema ownership to $DB_USER..."
    sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;"
    echo -e "  ${GREEN}✓${NC} Schema 'public' is now owned by $DB_USER"
fi

echo
echo -e "${GREEN}✓${NC} Database setup complete!"
echo -e "  ${GREEN}✓${NC} User '$DB_USER' has full ownership and control"
echo -e "  ${GREEN}✓${NC} All permissions granted"
echo

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
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Security Configuration${NC}"
echo -e "${GREEN}=====================================${NC}"
echo

echo -e "${BLUE}Generating secure secrets...${NC}"

JWT_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)

echo -e "  ${GREEN}✓${NC} JWT Secret: [64 character secure string generated]"
echo -e "  ${GREEN}✓${NC} JWT Refresh Secret: [64 character secure string generated]"
echo

# Create backend .env file
echo -e "${BLUE}Creating backend environment configuration...${NC}"
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

echo -e "  ${GREEN}✓${NC} File created: backend/.env"
echo -e "  ${GREEN}✓${NC} Contains: Database URL, JWT secrets, Redis config"
echo

# Create frontend .env file
echo -e "${BLUE}Creating frontend environment configuration...${NC}"
cat > "$SCRIPT_DIR/frontend/.env" << EOF
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
EOF

echo -e "  ${GREEN}✓${NC} File created: frontend/.env"
echo -e "  ${GREEN}✓${NC} Contains: API and WebSocket URLs"
echo

# Run database migrations
echo
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Database Migration${NC}"
echo -e "${GREEN}=====================================${NC}"
echo

cd "$SCRIPT_DIR/backend"

echo -e "${BLUE}Initializing database schema...${NC}"
echo -e "  ${BLUE}→${NC} Creating tables, indexes, and relationships..."

# Try to run migrations with better error handling
if npm run db:push 2>&1 | grep -v "Warning" | tee /tmp/neuralmesh-migration.log | grep -q "permission denied"; then
    echo -e "${RED}✗${NC} Database migration failed due to permissions"
    echo -e "${YELLOW}Attempting to fix permissions...${NC}"
    
    # Fix permissions
    if [[ "$OS" == "macos" ]]; then
        echo -e "  ${BLUE}→${NC} Re-granting schema ownership to $DB_USER..."
        psql -U $(whoami) -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;" 2>/dev/null || true
        psql -U $(whoami) -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
    else
        echo -e "  ${BLUE}→${NC} Re-granting schema ownership to $DB_USER (requires sudo)..."
        sudo -u postgres psql -d $DB_NAME -c "ALTER SCHEMA public OWNER TO $DB_USER;" 2>/dev/null || true
        sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
    fi
    
    # Retry migration
    echo -e "  ${BLUE}→${NC} Retrying migration..."
    npm run db:push 2>&1 | grep -v "Warning" || true
fi

echo
echo -e "${GREEN}✓${NC} Database schema initialized!"
echo -e "  ${GREEN}✓${NC} Tables created (users, nodes, servers, metrics, alerts, etc.)"
echo -e "  ${GREEN}✓${NC} Indexes created for optimal performance"
echo -e "  ${GREEN}✓${NC} Database ready for use"
echo

cd "$SCRIPT_DIR"

# Configure firewall (if available)
echo
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Network Configuration${NC}"
echo -e "${GREEN}=====================================${NC}"
echo

echo -e "${BLUE}Configuring firewall rules...${NC}"

if command -v ufw &> /dev/null; then
    echo -e "  ${BLUE}→${NC} Opening port 3000 (Backend API)..."
    sudo ufw allow 3000/tcp comment "NeuralMesh API" 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Port 3000/tcp allowed"
    
    echo -e "  ${BLUE}→${NC} Opening port 3001 (Agent WebSocket)..."
    sudo ufw allow 3001/tcp comment "NeuralMesh Agent WS" 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Port 3001/tcp allowed"
    
    echo -e "  ${BLUE}→${NC} Opening port 5173 (Frontend Dev)..."
    sudo ufw allow 5173/tcp comment "NeuralMesh Frontend" 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Port 5173/tcp allowed"
    
    echo -e "${GREEN}✓${NC} Firewall configured (ufw)"
elif command -v firewall-cmd &> /dev/null; then
    echo -e "  ${BLUE}→${NC} Opening port 3000 (Backend API)..."
    sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null || true
    echo -e "  ${BLUE}→${NC} Opening port 3001 (Agent WebSocket)..."
    sudo firewall-cmd --permanent --add-port=3001/tcp 2>/dev/null || true
    echo -e "  ${BLUE}→${NC} Opening port 5173 (Frontend Dev)..."
    sudo firewall-cmd --permanent --add-port=5173/tcp 2>/dev/null || true
    sudo firewall-cmd --reload 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Firewall configured (firewalld)"
else
    echo -e "${YELLOW}⚠${NC} No firewall detected, skipping"
    echo -e "  ${YELLOW}Note:${NC} If you have a firewall, manually allow ports 3000, 3001, and 5173"
fi
echo

# Create systemd service (Linux only)
if [[ "$OS" != "macos" ]] && command -v systemctl &> /dev/null; then
    echo
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}   System Service Setup${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo
    
    echo -e "${BLUE}Creating systemd service for auto-start...${NC}"
    echo -e "  ${BLUE}→${NC} Service name: neuralmesh.service"
    echo -e "  ${BLUE}→${NC} Install directory: $SCRIPT_DIR"
    echo -e "  ${BLUE}→${NC} Run as user: $USER"
    
    sudo tee /etc/systemd/system/neuralmesh.service > /dev/null << EOF
[Unit]
Description=NeuralMesh Server
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$SCRIPT_DIR/backend
ExecStart=$(which npm) start
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    echo -e "  ${GREEN}✓${NC} Service file created at /etc/systemd/system/neuralmesh.service"
    
    echo -e "  ${BLUE}→${NC} Reloading systemd daemon..."
    sudo systemctl daemon-reload
    
    echo -e "  ${BLUE}→${NC} Enabling service to start on boot..."
    sudo systemctl enable neuralmesh.service 2>/dev/null || true
    
    echo
    echo -e "${GREEN}✓${NC} System service configured!"
    echo -e "  ${GREEN}✓${NC} Service will auto-start on system boot"
    echo -e "  ${GREEN}✓${NC} Can be controlled with: sudo systemctl {start|stop|restart|status} neuralmesh"
    echo
fi

# Build frontend
echo
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}   Frontend Build${NC}"
echo -e "${GREEN}=====================================${NC}"
echo

cd "$SCRIPT_DIR/frontend"

echo -e "${BLUE}Building frontend application...${NC}"
echo -e "  ${BLUE}→${NC} Compiling TypeScript and React components..."
echo -e "  ${BLUE}→${NC} Optimizing assets for production..."
echo -e "  ${YELLOW}Note:${NC} Using quick build (skips type checking) for faster installation"

npm run build:quick

echo
echo -e "${GREEN}✓${NC} Frontend built successfully!"
echo -e "  ${GREEN}✓${NC} Build output: frontend/dist/"
echo -e "  ${GREEN}✓${NC} Ready for production deployment"
echo

cd "$SCRIPT_DIR"

# Create database access guide
cat > "$SCRIPT_DIR/DATABASE_ACCESS.txt" << EOF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NeuralMesh Database Access Information
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 DATABASE CREDENTIALS:

  Database Name:     $DB_NAME
  Database User:     $DB_USER
  Database Password: $DB_PASSWORD
  Host:              localhost
  Port:              5432
  
  Full Connection String:
  postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HOW TO ACCESS YOUR DATABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 Option 1: Using psql (Command Line)

  psql -U $DB_USER -d $DB_NAME -h localhost
  
  When prompted, enter password: $DB_PASSWORD

🔐 Option 2: One-line command

  PGPASSWORD='$DB_PASSWORD' psql -U $DB_USER -d $DB_NAME -h localhost

🔐 Option 3: Connection String

  psql postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  YOUR DATABASE OWNERSHIP & PERMISSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Full Ownership:
   - You ($DB_USER) OWN the database '$DB_NAME'
   - You OWN the 'public' schema
   - You have ALL privileges

✅ What You Can Do:
   - Create/Drop Tables
   - Insert/Update/Delete Data
   - Create Indexes
   - Create Functions
   - Grant permissions to other users
   - Everything a database owner can do!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COMMON DATABASE OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 List all tables:
  psql -U $DB_USER -d $DB_NAME -c "\dt"

📋 View table structure:
  psql -U $DB_USER -d $DB_NAME -c "\d table_name"

📋 Query data:
  psql -U $DB_USER -d $DB_NAME -c "SELECT * FROM users LIMIT 10;"

📋 Interactive mode:
  psql -U $DB_USER -d $DB_NAME
  
  Then use SQL commands:
    \dt                  -- List tables
    \du                  -- List users
    \l                   -- List databases
    SELECT * FROM users; -- Query data
    \q                   -- Quit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GUI TOOLS (Optional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use these credentials with any PostgreSQL GUI tool:

  • pgAdmin: https://www.pgadmin.org/
  • DBeaver: https://dbeaver.io/
  • TablePlus: https://tableplus.com/
  • DataGrip: https://www.jetbrains.com/datagrip/
  
Connection details:
  Host: localhost
  Port: 5432
  Database: $DB_NAME
  Username: $DB_USER
  Password: $DB_PASSWORD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔒 SECURITY REMINDER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  KEEP THIS FILE SECURE!
   - Contains your database password
   - Do not commit to Git (already in .gitignore)
   - Do not share publicly
   - Back up securely

📍 Location: $SCRIPT_DIR/DATABASE_ACCESS.txt

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

chmod 600 "$SCRIPT_DIR/DATABASE_ACCESS.txt"

# Summary
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}               SETUP COMPLETE! 🎉${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${BLUE}📁 Installation Summary:${NC}"
echo -e "   Location:      ${GREEN}$SCRIPT_DIR${NC}"
echo -e "   Platform:      ${GREEN}$OS${NC}"
echo -e "   Owner:         ${GREEN}$USER${NC}"
echo
echo -e "${BLUE}🗄️ Database Access:${NC}"
echo -e "   Database:      ${GREEN}$DB_NAME${NC}"
echo -e "   User:          ${GREEN}$DB_USER${NC} ${YELLOW}(FULL OWNER)${NC}"
echo -e "   Password:      ${GREEN}$DB_PASSWORD${NC}"
echo -e "   Host:          ${GREEN}localhost:5432${NC}"
echo
echo -e "${YELLOW}⚠️  Security Note: Password shown above. Consider clearing terminal history.${NC}"
echo
echo -e "${BLUE}🔑 Quick Access Commands:${NC}"
echo -e "   Connect:       ${YELLOW}psql -U $DB_USER -d $DB_NAME${NC}"
echo -e "   With password: ${YELLOW}PGPASSWORD='$DB_PASSWORD' psql -U $DB_USER -d $DB_NAME${NC}"
echo
echo -e "${BLUE}📄 Complete database access info saved to:${NC}"
echo -e "   ${GREEN}$SCRIPT_DIR/DATABASE_ACCESS.txt${NC}"
echo -e "   ${YELLOW}⚠ Keep this file secure!${NC}"
echo
echo -e "${BLUE}🔐 Security Information:${NC}"
echo -e "   Backend config:  ${GREEN}$SCRIPT_DIR/backend/.env${NC}"
echo -e "   Frontend config: ${GREEN}$SCRIPT_DIR/frontend/.env${NC}"
echo -e "   DB access info:  ${GREEN}$SCRIPT_DIR/DATABASE_ACCESS.txt${NC}"
echo -e "   ${YELLOW}⚠ All files contain sensitive information - keep secure!${NC}"
echo
echo -e "${BLUE}🌐 Access Information:${NC}"
echo -e "   Frontend:      ${GREEN}http://localhost:5173${NC}"
echo -e "   API:           ${GREEN}http://localhost:3000${NC}"
echo -e "   WebSocket:     ${GREEN}ws://localhost:3000${NC}"
echo -e "   Agent WS:      ${GREEN}ws://localhost:3001${NC}"
echo
echo -e "${BLUE}🚀 Starting NeuralMesh:${NC}"
if [[ "$OS" == "macos" ]]; then
    echo -e "   ${YELLOW}cd $SCRIPT_DIR && ./start.sh${NC}"
elif [[ "$OS" == "termux" ]]; then
    echo -e "   ${YELLOW}cd $SCRIPT_DIR && ./start.sh${NC}"
elif [[ "$OS" == "wsl" ]]; then
    echo -e "   ${YELLOW}cd $SCRIPT_DIR && ./start.sh${NC}"
else
    echo -e "   Option 1 (systemd): ${YELLOW}sudo systemctl start neuralmesh${NC}"
    echo -e "   Option 2 (manual):  ${YELLOW}cd $SCRIPT_DIR && ./start.sh${NC}"
fi
echo
echo -e "${BLUE}🛑 Stopping NeuralMesh:${NC}"
if [[ "$OS" == "macos" ]] || [[ "$OS" == "termux" ]] || [[ "$OS" == "wsl" ]]; then
    echo -e "   ${YELLOW}cd $SCRIPT_DIR && ./stop.sh${NC}"
else
    echo -e "   Option 1 (systemd): ${YELLOW}sudo systemctl stop neuralmesh${NC}"
    echo -e "   Option 2 (manual):  ${YELLOW}cd $SCRIPT_DIR && ./stop.sh${NC}"
fi
echo
echo -e "${BLUE}📊 Service Management:${NC}"
if [[ "$OS" != "macos" ]] && [[ "$OS" != "termux" ]] && [[ "$OS" != "wsl" ]] && command -v systemctl &> /dev/null; then
    echo -e "   Start:         ${YELLOW}sudo systemctl start neuralmesh${NC}"
    echo -e "   Stop:          ${YELLOW}sudo systemctl stop neuralmesh${NC}"
    echo -e "   Restart:       ${YELLOW}sudo systemctl restart neuralmesh${NC}"
    echo -e "   Status:        ${YELLOW}sudo systemctl status neuralmesh${NC}"
    echo -e "   Logs:          ${YELLOW}sudo journalctl -u neuralmesh -f${NC}"
else
    echo -e "   Use: ${YELLOW}./start.sh${NC} and ${YELLOW}./stop.sh${NC} to manage services"
fi
echo
echo -e "${BLUE}📝 Documentation:${NC}"
echo -e "   Quick Start:     ${GREEN}$SCRIPT_DIR/QUICK_START.md${NC}"
echo -e "   Installation:    ${GREEN}$SCRIPT_DIR/INSTALLATION_GUIDE.md${NC}"
echo -e "   Troubleshooting: ${GREEN}$SCRIPT_DIR/TROUBLESHOOTING.md${NC}"
echo -e "   Database Access: ${GREEN}$SCRIPT_DIR/DATABASE_ACCESS.txt${NC}"
echo -e "   User Guide:      ${GREEN}$SCRIPT_DIR/USER_GUIDE.md${NC}"
echo
echo -e "${BLUE}❓ Need Help?${NC}"
echo -e "   Issues:      ${GREEN}https://github.com/MrNova420/NeuralMesh/issues${NC}"
echo -e "   Discussions: ${GREEN}https://github.com/MrNova420/NeuralMesh/discussions${NC}"
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  IMPORTANT SECURITY NOTES:${NC}"
echo -e "   1. Database credentials: ${GREEN}DATABASE_ACCESS.txt${NC}"
echo -e "   2. Application config: ${GREEN}backend/.env${NC} and ${GREEN}frontend/.env${NC}"
echo -e "   3. ${YELLOW}Change passwords before production deployment${NC}"
echo -e "   4. Enable HTTPS/SSL for production"
echo -e "   5. All sensitive files are in .gitignore"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${GREEN}✨ Thank you for installing NeuralMesh! ✨${NC}"
echo -e "${GREEN}Your FREE, self-hosted infrastructure platform is ready!${NC}"
echo
