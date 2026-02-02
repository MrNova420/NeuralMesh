# NeuralMesh Deployment Guide

## Quick Start with Docker

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

### One-Command Deployment

```bash
./deploy.sh
```

This will:
1. Build all Docker images (backend, frontend, agent)
2. Start all services
3. Display access URLs

### Manual Deployment

#### Build Images
```bash
docker-compose build
```

#### Start Services
```bash
docker-compose up -d
```

#### Stop Services
```bash
docker-compose down
```

#### View Logs
```bash
docker-compose logs -f
```

### Access Points

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **WebSocket**: ws://localhost:3001

### Scaling Agents

Add more node agents:

```bash
docker-compose up -d --scale agent=5
```

This runs 5 agent instances monitoring the host system.

### Environment Configuration

Copy `.env.example` to `.env` and customize:

```env
# Backend
PORT=3001

# Frontend
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001

# Agent
SERVER_URL=ws://localhost:3001
UPDATE_INTERVAL=2
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│  Bun/Hono   │◀────│ Rust Agent  │
│  Frontend   │     │   Backend   │     │   (Node)    │
│   (React)   │     │(WebSocket)  │     └─────────────┘
└─────────────┘     └─────────────┘
     :80                 :3001
```

## Production Deployment

### Cloud Platforms

#### Docker Swarm
```bash
docker swarm init
docker stack deploy -c docker-compose.yml neuralmesh
```

#### Kubernetes
```bash
# Convert to K8s manifests
kompose convert -f docker-compose.yml
kubectl apply -f .
```

#### AWS ECS / GCP Cloud Run / Azure Container Instances
- Use `Dockerfile.backend` and `Dockerfile.frontend`
- Set environment variables in platform console
- Configure load balancer for WebSocket support

### Security Checklist

- [ ] Change default ports in production
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Set strong authentication tokens
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring/alerting
- [ ] Regular security updates

### Performance Tuning

**Backend (Bun)**
- CPU: 1-2 cores
- Memory: 512MB-1GB
- Handles 1000+ concurrent connections

**Frontend (Nginx)**
- CPU: 0.5-1 core
- Memory: 128MB-256MB
- Serves static assets efficiently

**Agent (Rust)**
- CPU: 0.1 core
- Memory: 10-50MB per agent
- Minimal resource footprint

### Monitoring

View real-time stats:
```bash
docker stats
```

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f agent
```

### Backup & Restore

**Backup**
```bash
docker-compose down
tar -czf neuralmesh-backup.tar.gz .
```

**Restore**
```bash
tar -xzf neuralmesh-backup.tar.gz
docker-compose up -d
```

### Troubleshooting

**Port already in use:**
```bash
# Change ports in docker-compose.yml
ports:
  - "8080:80"  # Instead of 80:80
  - "3002:3001"  # Instead of 3001:3001
```

**WebSocket connection failed:**
- Check backend is running: `docker-compose ps`
- Check CORS settings in backend
- Verify WebSocket URL in frontend `.env`

**Agent not connecting:**
- Check SERVER_URL environment variable
- Ensure backend is accessible from agent container
- View agent logs: `docker-compose logs agent`

## Development Mode

Run without Docker:

```bash
# Terminal 1: Backend
cd backend
bun install
bun run index-ws.ts

# Terminal 2: Frontend
cd frontend
npm install
npm run dev

# Terminal 3: Agent
cd agent
cargo run -- --server ws://localhost:3001
```

## Updating

```bash
git pull
docker-compose build
docker-compose up -d
```

## Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/neuralmesh/issues)
- Documentation: [Full docs](https://neuralmesh.dev/docs)
- Community: [Discord](https://discord.gg/neuralmesh)
