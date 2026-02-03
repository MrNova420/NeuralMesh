#!/bin/bash
# NeuralMesh Startup Script
# Universal: Works on WSL, Termux, Linux, macOS

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to check if port is in use (universal)
port_in_use() {
    local port=$1
    # Try multiple methods for compatibility
    if command -v lsof &> /dev/null; then
        lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1
    elif command -v netstat &> /dev/null; then
        netstat -tuln 2>/dev/null | grep -q ":$port "
    elif command -v ss &> /dev/null; then
        ss -tuln 2>/dev/null | grep -q ":$port "
    elif command -v nc &> /dev/null; then
        # Fallback: use netcat to test if the port is open
        nc -z localhost "$port" >/dev/null 2>&1
    else
        # Final fallback: try to bind to the port (requires bash)
        (echo >/dev/tcp/localhost/$port) &>/dev/null
    fi
}

echo "🧠 Starting NeuralMesh..."
echo ""

# Check if backend is already running
if port_in_use 3000; then
    echo "⚠️  Backend already running on port 3000"
else
    echo "🔥 Starting Backend (Node)..."
    cd "$SCRIPT_DIR/backend"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "⚠️  Dependencies not installed. Run ./quick-fix.sh or ./setup-database.sh first"
        exit 1
    fi
    
    npm run dev > /tmp/neuralmesh-backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend PID: $BACKEND_PID"
    sleep 2
fi

# Check if agent websocket port is running
if port_in_use 3001; then
    echo "⚠️  Agent WS already running on port 3001"
else
    echo "🔌 Agent WS running on port 3001 (via backend dev script)"
fi

# Check if frontend is already running
if port_in_use 5173 || port_in_use 5174; then
    echo "⚠️  Frontend already running"
else
    echo "⚡ Starting Frontend..."
    cd "$SCRIPT_DIR/frontend"
    
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
        echo "⚠️  Dependencies not installed. Run ./quick-fix.sh or ./setup-database.sh first"
        exit 1
    fi
    
    npm run dev -- --host 0.0.0.0 > /tmp/neuralmesh-frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "   Frontend PID: $FRONTEND_PID"
    sleep 3
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ NeuralMesh is running!"
echo ""
echo "🌐 Frontend:  http://localhost:5173"
echo "              (or http://localhost:5174 if port changed)"
echo ""
echo "🔌 Backend:   http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/neuralmesh-backend.log"
echo "   Frontend: tail -f /tmp/neuralmesh-frontend.log"
echo ""
echo "🛑 To stop: ./stop.sh"
echo ""
echo "💡 Tip: If services don't start, check:"
echo "   - Dependencies installed? (./quick-fix.sh)"
echo "   - Database setup? (./setup-database.sh)"
echo "   - Check logs above for errors"
echo ""
