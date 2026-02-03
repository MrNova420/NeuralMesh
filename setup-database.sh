#!/bin/bash

# NeuralMesh Database Setup & Integration Script
# Ensures database is properly configured and integrated
# Works on: WSL Ubuntu, Termux, Linux, macOS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   NeuralMesh Database Setup & Integration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Detect environment
echo -e "${BLUE}🔍 Detecting environment...${NC}"
if [ -d "/data/data/com.termux" ] || [ -n "$TERMUX_VERSION" ]; then
    ENV_TYPE="Termux"
    PKG_CMD="pkg"
elif grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null; then
    ENV_TYPE="WSL"
    PKG_CMD="apt"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    ENV_TYPE="macOS"
    PKG_CMD="brew"
else
    ENV_TYPE="Linux"
    PKG_CMD="apt"
fi
echo -e "${GREEN}✓${NC} Detected: $ENV_TYPE"
echo

# Database configuration
DB_NAME="${DB_NAME:-neuralmesh}"
DB_USER="${DB_USER:-neuralmesh}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 16 | tr -d /=+ | cut -c1-16)}"

# Check PostgreSQL
echo -e "${BLUE}📊 Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗${NC} PostgreSQL not found!"
    echo
    echo -e "${YELLOW}Install PostgreSQL:${NC}"
    if [ "$ENV_TYPE" = "Termux" ]; then
        echo -e "  ${GREEN}pkg install postgresql${NC}"
    elif [ "$ENV_TYPE" = "WSL" ] || [ "$ENV_TYPE" = "Linux" ]; then
        echo -e "  ${GREEN}sudo apt update && sudo apt install postgresql${NC}"
    elif [ "$ENV_TYPE" = "macOS" ]; then
        echo -e "  ${GREEN}brew install postgresql@16${NC}"
    fi
    echo
    exit 1
fi
echo -e "${GREEN}✓${NC} PostgreSQL $(psql --version | awk '{print $3}') installed"

# Start PostgreSQL
echo -e "${BLUE}🚀 Starting PostgreSQL...${NC}"
if [ "$ENV_TYPE" = "Termux" ]; then
    # Termux PostgreSQL setup
    if [ ! -d "$HOME/.postgresql" ]; then
        echo -e "  ${YELLOW}→${NC} Initializing PostgreSQL data directory..."
        mkdir -p "$HOME/.postgresql"
        initdb -D "$HOME/.postgresql"
    fi
    
    # Check if PostgreSQL is running
    if ! pg_isready -q 2>/dev/null; then
        echo -e "  ${YELLOW}→${NC} Starting PostgreSQL..."
        pg_ctl -D "$HOME/.postgresql" -l "$HOME/.postgresql/logfile" start
        sleep 2
    fi
elif [ "$ENV_TYPE" = "macOS" ]; then
    # macOS PostgreSQL
    if ! pg_isready -q 2>/dev/null; then
        echo -e "  ${YELLOW}→${NC} Starting PostgreSQL..."
        brew services start postgresql@16 2>/dev/null || brew services start postgresql
        sleep 3
    fi
else
    # Linux/WSL PostgreSQL
    if ! systemctl is-active --quiet postgresql 2>/dev/null; then
        echo -e "  ${YELLOW}→${NC} Starting PostgreSQL service..."
        sudo service postgresql start
        sleep 2
    fi
fi

# Verify PostgreSQL is running
if pg_isready -q 2>/dev/null; then
    echo -e "${GREEN}✓${NC} PostgreSQL is running"
else
    echo -e "${RED}✗${NC} PostgreSQL failed to start"
    echo -e "${YELLOW}Try manually:${NC}"
    if [ "$ENV_TYPE" = "Termux" ]; then
        echo -e "  ${GREEN}pg_ctl -D ~/.postgresql start${NC}"
    elif [ "$ENV_TYPE" = "macOS" ]; then
        echo -e "  ${GREEN}brew services start postgresql${NC}"
    else
        echo -e "  ${GREEN}sudo service postgresql start${NC}"
    fi
    exit 1
fi
echo

# Create database and user
echo -e "${BLUE}🗄️  Setting up database...${NC}"

if [ "$ENV_TYPE" = "Termux" ] || [ "$ENV_TYPE" = "macOS" ]; then
    # Termux/macOS: Use current user
    POSTGRES_USER=$(whoami)
    
    echo -e "  ${YELLOW}→${NC} Creating database '$DB_NAME'..."
    psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo -e "    ${YELLOW}Database already exists${NC}"
    
    echo -e "  ${YELLOW}→${NC} Creating user '$DB_USER'..."
    psql -U "$POSTGRES_USER" -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo -e "    ${YELLOW}User already exists${NC}"
    
    echo -e "  ${YELLOW}→${NC} Granting privileges..."
    psql -U "$POSTGRES_USER" -d postgres -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
    psql -U "$POSTGRES_USER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    psql -U "$POSTGRES_USER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    psql -U "$POSTGRES_USER" -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO $DB_USER;"
else
    # Linux/WSL: Use postgres superuser
    echo -e "  ${YELLOW}→${NC} Creating database '$DB_NAME'..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo -e "    ${YELLOW}Database already exists${NC}"
    
    echo -e "  ${YELLOW}→${NC} Creating user '$DB_USER'..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo -e "    ${YELLOW}User already exists${NC}"
    
    echo -e "  ${YELLOW}→${NC} Granting privileges..."
    sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    sudo -u postgres psql -d "$DB_NAME" -c "ALTER SCHEMA public OWNER TO $DB_USER;"
fi

echo -e "${GREEN}✓${NC} Database setup complete"
echo

# Test database connection
echo -e "${BLUE}🔌 Testing database connection...${NC}"
if PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d "$DB_NAME" -h localhost -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${RED}✗${NC} Database connection failed"
    echo -e "${YELLOW}Connection details:${NC} postgresql://$DB_USER:[REDACTED]@localhost:5432/$DB_NAME"
    echo -e "${YELLOW}Check .db-credentials file for full connection string${NC}"
    exit 1
fi
echo

# Install backend dependencies if needed
echo -e "${BLUE}📦 Checking backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo -e "  ${YELLOW}→${NC} Installing dependencies..."
    npm install --silent
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${GREEN}✓${NC} Dependencies already installed"
fi
echo

# Generate secure secrets
echo -e "${BLUE}🔐 Generating secure secrets...${NC}"
JWT_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d /=+ | cut -c1-64)
echo -e "${GREEN}✓${NC} Secrets generated"
echo

# Create backend .env
echo -e "${BLUE}⚙️  Creating backend configuration...${NC}"
cat > "$SCRIPT_DIR/backend/.env" << EOF
# NeuralMesh Backend Configuration
# Generated: $(date)

# Server Configuration
PORT=3000
AGENT_PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# JWT Secrets (Secure Random Generated)
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

echo -e "${GREEN}✓${NC} Backend .env created"
echo

# Run database migrations
echo -e "${BLUE}🔄 Running database migrations...${NC}"
cd "$SCRIPT_DIR/backend"

if npm run db:push 2>&1 | tee /tmp/neuralmesh-migration.log | grep -q "Done"; then
    echo -e "${GREEN}✓${NC} Database migrations completed"
else
    echo -e "${YELLOW}⚠${NC}  Migration output (check for errors):"
    tail -20 /tmp/neuralmesh-migration.log
fi
echo

# Verify tables were created
echo -e "${BLUE}📋 Verifying database schema...${NC}"
TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d "$DB_NAME" -h localhost -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Database schema created ($TABLE_COUNT tables)"
    echo -e "  ${BLUE}→${NC} Tables created successfully"
else
    echo -e "${YELLOW}⚠${NC}  No tables found in database"
    echo -e "  ${YELLOW}→${NC} Migrations may need to be run again"
fi
echo

# Create frontend .env
echo -e "${BLUE}⚙️  Creating frontend configuration...${NC}"
cat > "$SCRIPT_DIR/frontend/.env" << EOF
# NeuralMesh Frontend Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001
EOF
echo -e "${GREEN}✓${NC} Frontend .env created"
echo

# Save database credentials
cat > "$SCRIPT_DIR/.db-credentials" << EOF
# NeuralMesh Database Credentials
# Keep this file secure!

DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
CONNECTION_STRING=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
EOF
chmod 600 "$SCRIPT_DIR/.db-credentials"
echo -e "${GREEN}✓${NC} Database credentials saved to .db-credentials"
echo

# Success summary
cd "$SCRIPT_DIR"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ Database Integration Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${GREEN}Database Details:${NC}"
echo -e "  Name:     ${BLUE}$DB_NAME${NC}"
echo -e "  User:     ${BLUE}$DB_USER${NC}"
echo -e "  Tables:   ${BLUE}$TABLE_COUNT${NC}"
echo
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo
echo -e "  ${YELLOW}1. Start the application:${NC}"
echo -e "     ${GREEN}./start.sh${NC}"
echo
echo -e "  ${YELLOW}2. Access frontend:${NC}"
echo -e "     ${BLUE}http://localhost:5173${NC}"
echo
echo -e "  ${YELLOW}3. View database credentials:${NC}"
echo -e "     ${GREEN}cat .db-credentials${NC}"
echo
echo -e "  ${YELLOW}4. Connect to database:${NC}"
echo -e "     ${GREEN}PGPASSWORD='<see .db-credentials>' psql -U $DB_USER -d $DB_NAME -h localhost${NC}"
echo -e "     ${YELLOW}(Password stored in .db-credentials file)${NC}"
echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📚 Optimized for: WSL Ubuntu, Termux, Linux, macOS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
