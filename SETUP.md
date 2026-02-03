# NeuralMesh v0.2.0 Setup Guide

## Quick Start (5 Minutes)

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone https://github.com/MrNova420/NeuralMesh.git
cd NeuralMesh

# Set environment variables
export JWT_SECRET="your-super-secret-jwt-key-change-me"
export REFRESH_SECRET="your-super-secret-refresh-key-change-me"

# Start all services
docker-compose up -d

# Initialize database
docker-compose exec backend npm run db:push

# Create admin user (optional)
docker-compose exec backend npm run create-admin
```

**Access**:
- Frontend: http://localhost
- API: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+ (optional, for caching)
- Rust 1.70+ (for agent)

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Initialize database
npm run db:push

# Start server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Agent Setup

```bash
cd agent

# Build agent
cargo build --release

# Run agent
./target/release/neuralmesh-agent --server ws://localhost:4001/agent
```

---

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=3001
AGENT_PORT=4001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/neuralmesh

# Redis (Optional - graceful degradation if unavailable)
REDIS_URL=redis://localhost:6379

# Authentication (CHANGE IN PRODUCTION!)
JWT_SECRET=your-secret-key-min-32-characters-long
REFRESH_SECRET=your-refresh-key-min-32-characters-long

# Logging
LOG_LEVEL=info  # debug, info, warn, error

# Features
USE_MOCK_NODES=false
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### Database Setup

#### PostgreSQL
```bash
# Create database
createdb neuralmesh

# Or with Docker
docker run -d \
  --name neuralmesh-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=neuralmesh \
  -p 5432:5432 \
  postgres:16-alpine

# Run migrations
cd backend
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

#### Redis (Optional)
```bash
# With Docker
docker run -d \
  --name neuralmesh-redis \
  -p 6379:6379 \
  redis:7-alpine

# Check connection
redis-cli ping
```

---

## Production Deployment

### Security Checklist

- [ ] Change JWT_SECRET and REFRESH_SECRET
- [ ] Use strong database passwords
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting
- [ ] Review CORS origins
- [ ] Setup monitoring/alerting
- [ ] Enable database backups
- [ ] Setup log rotation

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
AGENT_PORT=4001

# Strong secrets (32+ characters)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
REFRESH_SECRET=<generate-with-openssl-rand-base64-32>

# Production database
DATABASE_URL=postgresql://user:pass@db-host:5432/neuralmesh

# Redis cluster
REDIS_URL=redis://redis-host:6379

# Logging
LOG_LEVEL=warn
```

### Docker Compose Production

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: neuralmesh
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

  backend:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/neuralmesh
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_SECRET: ${REFRESH_SECRET}
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
    restart: always
```

### Cloud Deployment

#### AWS ECS
```bash
# Build and push images
docker build -t neuralmesh-backend:latest ./backend
docker tag neuralmesh-backend:latest <ecr-url>/neuralmesh-backend:latest
docker push <ecr-url>/neuralmesh-backend:latest

# Deploy with ECS CLI
ecs-cli compose --project-name neuralmesh up
```

#### Google Cloud Run
```bash
# Build with Cloud Build
gcloud builds submit --tag gcr.io/PROJECT_ID/neuralmesh-backend

# Deploy
gcloud run deploy neuralmesh-backend \
  --image gcr.io/PROJECT_ID/neuralmesh-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars="DATABASE_URL=...,JWT_SECRET=..."
```

#### Kubernetes
```bash
# Generate manifests
kompose convert -f docker-compose.yml

# Apply
kubectl apply -f .

# Or use Helm (coming soon)
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql postgresql://postgres:postgres@localhost:5432/neuralmesh

# Check if running
docker ps | grep postgres

# View logs
docker logs neuralmesh-postgres
```

### Redis Connection Issues

```bash
# Test connection
redis-cli ping

# Check if running
docker ps | grep redis

# View logs
docker logs neuralmesh-redis
```

### Backend Won't Start

```bash
# Check logs
npm run dev

# Common issues:
# 1. Port already in use
lsof -i :3001

# 2. Database not accessible
psql postgresql://...

# 3. Missing environment variables
cat .env
```

### Agent Won't Connect

```bash
# Test WebSocket connection
wscat -c ws://localhost:4001/agent

# Check agent logs
./neuralmesh-agent --server ws://localhost:4001/agent --log-level debug

# Common issues:
# 1. Wrong port (use 4001, not 3001)
# 2. Firewall blocking connection
# 3. Backend not running
```

---

## Verification

### Health Check

```bash
# API health
curl http://localhost:3001/

# Expected response:
{
  "name": "NeuralMesh API",
  "version": "0.2.0",
  "status": "operational",
  "features": {
    "authentication": true,
    "database": true,
    "smartMonitoring": true,
    "analytics": true,
    "caching": true
  }
}
```

### Database Check

```bash
# Run in backend directory
npm run db:studio

# Opens browser at http://localhost:4983
# Verify tables exist: users, nodes, metrics_history, alerts, etc.
```

### Create Test User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

### Test Authentication

```bash
# Login
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' \
  | jq -r '.accessToken')

# Use token
curl http://localhost:3001/api/nodes \
  -H "Authorization: Bearer $TOKEN"
```

---

## Development

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Apply migration
npm run db:migrate

# Push schema (development)
npm run db:push
```

### Logs

```bash
# Backend logs
docker-compose logs -f backend

# All logs
docker-compose logs -f

# Specific service
docker logs -f neuralmesh-backend
```

### Scaling

```bash
# Scale agents
docker-compose up -d --scale agent=5

# Restart service
docker-compose restart backend

# Update and restart
docker-compose up -d --build
```

---

## Next Steps

1. **Create Admin User**: Register your first user
2. **Deploy Agents**: Install agents on nodes you want to monitor
3. **Configure Alerts**: Set up notification preferences
4. **Explore Analytics**: Check `/api/analytics/health`
5. **Monitor Performance**: Use Redis for caching
6. **Backup Database**: Setup automated backups
7. **Enable HTTPS**: Configure SSL/TLS certificates
8. **Monitor Logs**: Setup log aggregation

---

## Support

- **Documentation**: [/docs](/docs)
- **Issues**: [GitHub Issues](https://github.com/MrNova420/NeuralMesh/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MrNova420/NeuralMesh/discussions)
- **Security**: security@neuralmesh.dev

---

**Version**: 0.2.0  
**Last Updated**: 2026-02-03
