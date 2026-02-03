#!/bin/bash
# NeuralMesh Startup Script

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🧠 Starting NeuralMesh..."
echo ""

# Check if backend is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Backend already running on port 3000"
else
    echo "🔥 Starting Backend (Node)..."
    cd "$SCRIPT_DIR/backend"
    npm run dev > /tmp/neuralmesh-backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend PID: $BACKEND_PID"
    sleep 2
fi

# Check if agent websocket port is running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Agent WS already running on port 3001"
else
    echo "🔌 Agent WS running on port 3001 (via backend dev script)"
fi

# Check if frontend is already running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 || lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Frontend already running"
else
    echo "⚡ Starting Frontend..."
    cd "$SCRIPT_DIR/frontend"
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
