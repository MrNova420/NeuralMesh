# NeuralMesh v0.3.0 - Complete Feature Guide

## Table of Contents
1. [Authentication](#authentication)
2. [Server Management](#server-management)
3. [Device & Node Management](#device--node-management)
4. [Analytics & Monitoring](#analytics--monitoring)
5. [Advanced Features](#advanced-features)

---

## Authentication

### Getting Started

#### Registration
1. Navigate to `/register`
2. Enter username (letters, numbers, -, _ only)
3. Provide valid email address
4. Create password (minimum 8 characters)
5. Confirm password
6. Click "Create Account"

**Auto-Login**: After successful registration, you'll be automatically logged in.

#### Login
1. Navigate to `/login`
2. Enter your username
3. Enter your password
4. Click "Sign In"

**Token Management**: 
- Access tokens valid for 15 minutes
- Refresh tokens valid for 7 days
- Auto-refresh on token expiry

#### Logout
```javascript
import { apiService } from './services/auth';

const refreshToken = localStorage.getItem('refreshToken');
await apiService.logout(refreshToken);

// Clear local storage
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('user');
```

---

## Server Management

### Creating a Server

#### Via UI
1. Go to Servers page
2. Click "Create Server"
3. Choose a template:
   - **Ubuntu Server**: General purpose
   - **Debian Server**: Stable, lightweight
   - **Docker Container**: Minimal footprint
   - **High Performance**: Resource-intensive workloads
4. Configure specs (if needed)
5. Click "Create"

#### Via API
```javascript
const server = await apiService.createServer({
  name: 'My Server',
  type: 'vm',
  template: 'ubuntu-server',
  specs: {
    cpu: 4,
    memory: 8,
    storage: 100,
    os: 'Ubuntu 22.04'
  }
});
```

### Managing Servers

#### Start Server
- **UI**: Click "Start" button on server card
- **API**: `await apiService.startServer(serverId)`

#### Stop Server
- **UI**: Click "Stop" button on server card
- **API**: `await apiService.stopServer(serverId)`

#### Restart Server
- **API**: `await apiService.restartServer(serverId)`

#### Delete Server
- **API**: `await apiService.deleteServer(serverId)`

**Note**: Always stop a server before deleting.

### Server Templates

| Template | Use Case | CPU | RAM | Storage |
|----------|----------|-----|-----|---------|
| Ubuntu Server | Web apps, APIs | 2 | 4GB | 50GB |
| Debian Server | LAMP stack | 2 | 2GB | 30GB |
| Docker Container | Microservices | 1 | 1GB | 10GB |
| High Performance | ML, Big Data | 16 | 64GB | 500GB |

---

## Device & Node Management

### Adding Devices

#### Install Agent
```bash
# Download agent
wget https://neuralmesh.dev/agent/latest

# Install
chmod +x neuralmesh-agent
./neuralmesh-agent --server ws://your-server:4001/agent
```

#### Configure Agent
```bash
# With custom name
./neuralmesh-agent \
  --server ws://your-server:4001/agent \
  --name "My Device" \
  --interval 2

# Environment variables
export SERVER_URL=ws://your-server:4001/agent
export UPDATE_INTERVAL=2
export NODE_NAME="My Device"
./neuralmesh-agent
```

### Monitoring Nodes

#### View All Nodes
- **UI**: Go to Nodes page
- **API**: `await apiService.getAllNodes()`

#### Node Details
- Click on any node card
- View real-time metrics
- See connection status
- Check health score

#### Node Actions
```javascript
// Restart node
await apiService.restartNode(nodeId);

// Shutdown node
await apiService.shutdownNode(nodeId);

// Disconnect node
await apiService.disconnectNode(nodeId);

// View action history
const history = await apiService.getActionHistory(nodeId);
```

### Node Classification

Nodes are automatically classified:
- **Alpha**: 16+ cores, 32GB+ RAM (high-end)
- **Beta**: 8+ cores, 16GB+ RAM (mid-tier)
- **Gamma**: 4+ cores (desktops)
- **Delta**: <4 cores (IoT, Raspberry Pi)

---

## Analytics & Monitoring

### Health Scoring

Every node receives a health score (0-100):
- **90-100**: Excellent
- **70-89**: Good
- **50-69**: Fair
- **Below 50**: Poor

**Factors**:
- CPU usage (30% weight)
- Memory usage (30% weight)
- Storage usage (20% weight)
- Network stability (10% weight)
- Uptime (10% weight)

### Get Health Scores
```javascript
// All nodes
const scores = await apiService.getHealthScores();

// Specific node
const insights = await apiService.getNodeInsights(nodeId);
console.log('Health Score:', insights.data.health.score);
```

### Anomaly Detection

System automatically detects anomalies:
- Uses 2.5 standard deviation threshold
- Requires 10+ data points
- Severity levels: low, medium, high
- Monitors: CPU, memory, storage

### View Anomalies
```javascript
const insights = await apiService.getNodeInsights(nodeId);
console.log('Anomalies:', insights.data.anomalies);
```

### Optimization Recommendations

Get auto-generated recommendations:
```javascript
const insights = await apiService.getNodeInsights(nodeId);
console.log('Recommendations:', insights.data.recommendations);
```

Example recommendations:
- "Consider upgrading CPU or redistributing workload"
- "Memory usage is high - increase RAM"
- "Storage critically low - expand capacity"

### Dashboard Features

#### Real-time Metrics
- Total nodes count
- Average CPU usage
- Average memory usage
- Network throughput
- Active alerts

#### Charts
- CPU usage over time
- Memory usage trends
- Network activity
- Historical data

#### Activity Feed
- Recent events
- Node status changes
- Alerts
- System actions

---

## Advanced Features

### WebSocket Integration

#### Connect to Real-time Updates
```javascript
import io from 'socket.io-client';

const socket = io('ws://your-server:3001');

// Subscribe to node updates
socket.emit('nodes:subscribe');

// Receive updates
socket.on('nodes:update', (data) => {
  console.log('Nodes updated:', data.nodes);
});

// Listen for alerts
socket.on('alert:new', (alert) => {
  console.log('New alert:', alert);
});
```

### Caching

API responses are cached for 5 seconds:
- Reduces database load
- Faster response times
- Automatic cache invalidation

### Rate Limiting

Protect against abuse:
- **Strict**: 10 req/15min (auth)
- **Normal**: 100 req/15min (general)
- **Relaxed**: 60 req/min (real-time)

### Audit Logging

All actions are logged:
- User authentication
- Node actions
- Server operations
- Configuration changes

View audit logs (admin):
```sql
SELECT * FROM audit_log 
WHERE user_id = 'your-user-id'
ORDER BY timestamp DESC;
```

---

## Configuration

### Environment Variables

#### Backend
```env
PORT=3001
AGENT_PORT=4001
NODE_ENV=production
LOG_LEVEL=info

DATABASE_URL=postgresql://...
REDIS_URL=redis://...

JWT_SECRET=your-secret
REFRESH_SECRET=your-refresh-secret

USE_MOCK_NODES=false
AUTO_START_MONITORING=true
```

#### Frontend
```env
VITE_API_URL=http://your-server:3001
VITE_WS_URL=ws://your-server:3001
```

#### Agent
```env
SERVER_URL=ws://your-server:4001/agent
UPDATE_INTERVAL=2
NODE_NAME=My Device
```

### Security Best Practices

1. **Change Default Secrets**
   ```bash
   node scripts/generate-secrets.js
   ```

2. **Enable HTTPS**
   - Use Let's Encrypt
   - Configure Nginx
   - Update CORS origins

3. **Regular Updates**
   - Update dependencies
   - Apply security patches
   - Monitor vulnerabilities

4. **Strong Passwords**
   - Minimum 8 characters
   - Mix of letters, numbers, symbols
   - Regular rotation

5. **Limit Permissions**
   - Use least privilege
   - Separate user roles
   - Audit access regularly

---

## Troubleshooting

### Can't Login
1. Verify username and password
2. Check account is active
3. Clear browser cache
4. Try password reset

### Server Won't Start
1. Check server status
2. Verify sufficient resources
3. Review error logs
4. Contact support

### Node Not Appearing
1. Check agent is running
2. Verify WebSocket connection
3. Check firewall rules
4. Review agent logs

### Performance Issues
1. Check health scores
2. Review recommendations
3. Monitor resource usage
4. Consider scaling

---

## Getting Help

- **Documentation**: [/docs](/)
- **API Reference**: [API.md](./API.md)
- **Security**: [SECURITY.md](./SECURITY.md)
- **Setup Guide**: [SETUP.md](./SETUP.md)
- **GitHub Issues**: [Report bugs](https://github.com/MrNova420/NeuralMesh/issues)

---

**Version**: 0.3.0  
**Last Updated**: 2026-02-03
