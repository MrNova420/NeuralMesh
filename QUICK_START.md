# 🧠 NeuralMesh Quick Start Guide

## Starting NeuralMesh

### Option 1: One-Command Start (Recommended)
```bash
cd ~/neuralmesh
./start.sh
```

This automatically starts both backend and frontend in the background.

### Option 2: Manual Start
```bash
# Terminal 1: Backend
cd ~/neuralmesh/backend
bun run index-ws.ts

# Terminal 2: Frontend  
cd ~/neuralmesh/frontend
npm run dev
```

## Accessing NeuralMesh

Once started, open in your browser:
- **Frontend**: http://localhost:5173 (or 5174)
- **Backend API**: http://localhost:3001

**Important**: Do a hard refresh (Ctrl+Shift+R) on first load!

## Stopping NeuralMesh

### Quick Stop
```bash
cd ~/neuralmesh
./stop.sh
```

### Manual Stop
Find the process IDs:
```bash
lsof -ti:3001  # Backend PID
lsof -ti:5173  # Frontend PID
```

Then kill them:
```bash
kill <PID>
```

## Viewing Logs

```bash
# Backend logs
tail -f /tmp/neuralmesh-backend.log

# Frontend logs
tail -f /tmp/neuralmesh-frontend.log
```

## Troubleshooting

### Port Already in Use
If you see "port already in use", the server is already running!

Check what's running:
```bash
lsof -i:3001  # Check backend
lsof -i:5173  # Check frontend
```

Stop it with:
```bash
./stop.sh
```

### White Screen / No Styles
Do a **hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Backend Not Responding
Restart the backend:
```bash
./stop.sh
./start.sh
```

## Development Tips

### Watch Logs in Real-Time
```bash
# Open 2 terminals
tail -f /tmp/neuralmesh-backend.log   # Terminal 1
tail -f /tmp/neuralmesh-frontend.log  # Terminal 2
```

### Check if Running
```bash
# Quick check
curl http://localhost:3001/        # Backend
curl http://localhost:5173/        # Frontend
```

### Restart After Changes

**Backend changes** (TypeScript files):
```bash
./stop.sh
./start.sh
```

**Frontend changes**: 
Vite auto-reloads, no restart needed!

## File Structure

```
neuralmesh/
├── start.sh          ← Start everything
├── stop.sh           ← Stop everything  
├── backend/          ← Bun backend
├── frontend/         ← React frontend
├── agent/            ← Rust agent (optional)
└── README.md         ← Full documentation
```

## Next Time You Open Your Computer

Just run:
```bash
cd ~/neuralmesh
./start.sh
```

Then open http://localhost:5173 in your browser!

---

**Quick Commands Reference:**

| Command | Action |
|---------|--------|
| `./start.sh` | Start NeuralMesh |
| `./stop.sh` | Stop NeuralMesh |
| `tail -f /tmp/neuralmesh-*.log` | View logs |
| Ctrl+Shift+R | Hard refresh browser |

---

Enjoy NeuralMesh! 🧠⚡
