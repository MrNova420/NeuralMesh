#!/bin/bash
# NeuralMesh Stop Script

echo "🛑 Stopping NeuralMesh..."
echo ""

# Find and stop backend
BACKEND_PID=$(lsof -ti:3001)
if [ -n "$BACKEND_PID" ]; then
    kill $BACKEND_PID
    echo "✓ Stopped Backend (PID: $BACKEND_PID)"
else
    echo "  Backend not running"
fi

# Find and stop frontend
FRONTEND_PID=$(lsof -ti:5173,5174)
if [ -n "$FRONTEND_PID" ]; then
    kill $FRONTEND_PID
    echo "✓ Stopped Frontend (PID: $FRONTEND_PID)"
else
    echo "  Frontend not running"
fi

echo ""
echo "✅ NeuralMesh stopped"
echo ""
