#!/bin/bash

# NeuralMesh Universal Compatibility Test
# Tests all scripts work on current environment

set +e  # Don't exit on error, we want to report all issues

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   NeuralMesh Universal Compatibility Test${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Test function
test_check() {
    local name="$1"
    local result="$2"
    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}✓${NC} $name"
        ((PASS++))
    elif [ "$result" = "warn" ]; then
        echo -e "${YELLOW}⚠${NC} $name"
        ((WARN++))
    else
        echo -e "${RED}✗${NC} $name"
        ((FAIL++))
    fi
}

# Detect Environment
echo -e "${BLUE}1. Environment Detection${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "/data/data/com.termux" ] || [ -n "$TERMUX_VERSION" ]; then
    ENV="Termux"
elif grep -qEi "(Microsoft|WSL)" /proc/version 2>/dev/null; then
    ENV="WSL"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    ENV="macOS"
else
    ENV="Linux"
fi

echo "   Environment: $ENV"
test_check "Environment detected" "pass"
echo

# Check Required Tools
echo -e "${BLUE}2. Required Tools${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v node &> /dev/null; then
    echo "   Node.js: $(node -v)"
    test_check "Node.js installed" "pass"
else
    test_check "Node.js installed" "fail"
fi

if command -v npm &> /dev/null; then
    echo "   npm: $(npm -v)"
    test_check "npm installed" "pass"
else
    test_check "npm installed" "fail"
fi

if command -v git &> /dev/null; then
    echo "   Git: $(git --version | cut -d' ' -f3)"
    test_check "Git installed" "pass"
else
    test_check "Git installed" "fail"
fi

# Optional but useful
if command -v psql &> /dev/null; then
    echo "   PostgreSQL: $(psql --version | awk '{print $3}')"
    test_check "PostgreSQL installed" "pass"
else
    test_check "PostgreSQL installed (optional)" "warn"
fi

if command -v redis-cli &> /dev/null; then
    test_check "Redis installed (optional)" "pass"
else
    test_check "Redis installed (optional)" "warn"
fi

echo

# Check Port Detection Methods
echo -e "${BLUE}3. Port Detection Capabilities${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v lsof &> /dev/null; then
    test_check "lsof available (preferred)" "pass"
elif command -v netstat &> /dev/null; then
    test_check "netstat available (fallback)" "pass"
elif command -v ss &> /dev/null; then
    test_check "ss available (fallback)" "pass"
else
    test_check "Port detection method available" "warn"
    echo "   → Will use basic TCP check"
fi
echo

# Check Scripts Exist
echo -e "${BLUE}4. Installation Scripts${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

scripts=(
    "quick-fix.sh"
    "setup-database.sh"
    "setup.sh"
    "install.sh"
    "start.sh"
    "stop.sh"
    "quick-start.sh"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ] && [ -x "$script" ]; then
        test_check "$script exists and executable" "pass"
    elif [ -f "$script" ]; then
        test_check "$script exists but not executable" "warn"
        echo "   → Run: chmod +x $script"
    else
        test_check "$script exists" "fail"
    fi
done
echo

# Check Dependencies
echo -e "${BLUE}5. Project Dependencies${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "frontend/node_modules" ]; then
    test_check "Frontend dependencies installed" "pass"
else
    test_check "Frontend dependencies installed" "warn"
    echo "   → Run: ./quick-fix.sh or cd frontend && npm install"
fi

if [ -d "backend/node_modules" ]; then
    test_check "Backend dependencies installed" "pass"
else
    test_check "Backend dependencies installed" "warn"
    echo "   → Run: ./quick-fix.sh or cd backend && npm install"
fi
echo

# Check Configuration
echo -e "${BLUE}6. Configuration Files${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "backend/.env" ]; then
    test_check "Backend .env exists" "pass"
else
    test_check "Backend .env exists" "warn"
    echo "   → Run: ./quick-fix.sh or ./setup-database.sh"
fi

if [ -f "frontend/.env" ]; then
    test_check "Frontend .env exists" "pass"
else
    test_check "Frontend .env exists" "warn"
    echo "   → Run: ./quick-fix.sh or ./setup-database.sh"
fi
echo

# Check Build Capability
echo -e "${BLUE}7. Build Capability${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "frontend/node_modules" ]; then
    cd frontend
    if npm run build --silent >/dev/null 2>&1; then
        test_check "Frontend can build" "pass"
    else
        test_check "Frontend can build" "fail"
        echo "   → Check: cd frontend && npm run build"
    fi
    cd ..
else
    test_check "Frontend can build (dependencies needed)" "warn"
fi
echo

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${GREEN}✓ Passed:${NC}  $PASS"
echo -e "${YELLOW}⚠ Warnings:${NC} $WARN"
echo -e "${RED}✗ Failed:${NC}  $FAIL"
echo

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ System is compatible!${NC}"
    echo
    echo -e "${BLUE}Quick Start:${NC}"
    if [ $WARN -gt 0 ]; then
        echo -e "  1. ${YELLOW}./quick-fix.sh${NC}          (fix warnings, 2 min)"
        echo -e "  2. ${GREEN}./start.sh${NC}              (start the app)"
        echo
        echo -e "${BLUE}Or for full setup:${NC}"
        echo -e "  1. ${YELLOW}./setup-database.sh${NC}     (10 min, includes database)"
        echo -e "  2. ${GREEN}./start.sh${NC}              (start the app)"
    else
        echo -e "  ${GREEN}./start.sh${NC}                (start the app now!)"
    fi
else
    echo -e "${RED}❌ System has compatibility issues${NC}"
    echo
    echo -e "${YELLOW}Fix the failed checks above, then run this test again.${NC}"
fi

echo
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Environment: $ENV | Passed: $PASS | Warnings: $WARN | Failed: $FAIL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
