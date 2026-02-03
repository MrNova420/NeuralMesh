# Server Management Guide

## Overview

NeuralMesh v0.3.0 introduces comprehensive server management capabilities, allowing you to create, configure, and manage virtual machines, containers, and bare-metal servers directly from the platform.

## Features

- **Multiple Server Types**: VM, containers, bare-metal, cloud
- **Pre-configured Templates**: Quick deployment with optimized configurations
- **Lifecycle Management**: Start, stop, restart, delete operations
- **Resource Monitoring**: Track CPU, memory, storage usage
- **User Isolation**: Each user manages their own servers
- **Authentication Required**: Secure access with JWT tokens

---

## API Endpoints

### List All Servers
```http
GET /api/servers
Authorization: Bearer <token>
```

**Response**:
```json
{
  "servers": [
    {
      "id": "srv-1234567890-abc",
      "name": "Web Server",
      "type": "vm",
      "status": "running",
      "specs": {
        "cpu": 4,
        "memory": 8,
        "storage": 100,
        "os": "Ubuntu 22.04"
      },
      "network": {
        "ip": "192.168.1.100",
        "ports": [80, 443]
      },
      "createdAt": "2026-02-03T00:00:00.000Z",
      "updatedAt": "2026-02-03T01:00:00.000Z"
    }
  ],
  "count": 1
}
```

### Create Server
```http
POST /api/servers
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "My Web Server",
  "type": "vm",
  "template": "ubuntu-server",
  "specs": {
    "cpu": 4,
    "memory": 8,
    "storage": 100,
    "os": "Ubuntu 22.04"
  },
  "config": {
    "autoStart": true,
    "backupEnabled": true
  }
}
```

**Response**: `201 Created`
```json
{
  "server": {
    "id": "srv-1234567890-abc",
    "name": "My Web Server",
    "type": "vm",
    "status": "creating",
    "specs": { ... },
    "userId": "user-id",
    "createdAt": "2026-02-03T00:00:00.000Z"
  }
}
```

### Start Server
```http
POST /api/servers/:id/start
Authorization: Bearer <token>
```

**Response**:
```json
{
  "message": "Server start initiated",
  "server": { ... }
}
```

### Stop Server
```http
POST /api/servers/:id/stop
Authorization: Bearer <token>
```

### Restart Server
```http
POST /api/servers/:id/restart
Authorization: Bearer <token>
```

### Delete Server
```http
DELETE /api/servers/:id
Authorization: Bearer <token>
```

### Get Server Templates
```http
GET /api/servers/templates/list
```

**Response**:
```json
{
  "templates": [
    {
      "id": "ubuntu-server",
      "name": "Ubuntu Server 22.04",
      "description": "Ubuntu Server with Docker and essential tools",
      "type": "vm",
      "specs": {
        "cpu": 2,
        "memory": 4,
        "storage": 50,
        "os": "Ubuntu 22.04"
      },
      "features": ["Docker", "Node.js", "PostgreSQL"]
    }
  ]
}
```

---

## Server Templates

### Ubuntu Server
- **CPU**: 2 cores
- **Memory**: 4 GB
- **Storage**: 50 GB
- **OS**: Ubuntu 22.04
- **Includes**: Docker, Node.js, PostgreSQL

### Debian Server
- **CPU**: 2 cores
- **Memory**: 2 GB
- **Storage**: 30 GB
- **OS**: Debian 12
- **Includes**: Apache, MySQL, PHP

### Docker Container
- **CPU**: 1 core
- **Memory**: 1 GB
- **Storage**: 10 GB
- **OS**: Alpine Linux
- **Features**: Lightweight, minimal footprint

### High Performance Server
- **CPU**: 16 cores
- **Memory**: 64 GB
- **Storage**: 500 GB
- **OS**: Ubuntu 22.04
- **Features**: NVMe SSD, High bandwidth, GPU support

---

## Usage Examples

### Creating a Server with JavaScript

```javascript
import { apiService } from './services/auth';

async function createServer() {
  try {
    const response = await apiService.createServer({
      name: 'Production API Server',
      type: 'vm',
      template: 'ubuntu-server',
      specs: {
        cpu: 4,
        memory: 8,
        storage: 100,
        os: 'Ubuntu 22.04'
      },
      config: {
        autoStart: true,
        backupEnabled: true
      }
    });

    console.log('Server created:', response.data.server.id);
  } catch (error) {
    console.error('Failed to create server:', error);
  }
}
```

### Managing Server Lifecycle

```javascript
// Start server
await apiService.startServer(serverId);

// Stop server
await apiService.stopServer(serverId);

// Restart server
await apiService.restartServer(serverId);

// Delete server
await apiService.deleteServer(serverId);
```

---

## Frontend Integration

### Server Management Page

The ServersPage component provides:
- List of all user servers
- Server status indicators
- Quick actions (start, stop, restart)
- Server creation wizard
- Template selection
- Resource usage display

### Authentication Required

All server management operations require authentication:

```javascript
// User must be logged in
const token = localStorage.getItem('accessToken');
if (!token) {
  // Redirect to login
  navigate('/login');
}
```

---

## Server States

| State | Description |
|-------|-------------|
| `creating` | Server is being provisioned |
| `running` | Server is active and operational |
| `stopped` | Server is shut down |
| `error` | Server encountered an error |
| `deleted` | Server has been deleted |

---

## Best Practices

### 1. Use Templates
Start with pre-configured templates for faster deployment:
```javascript
const response = await apiService.createServer({
  name: 'Quick Server',
  type: 'vm',
  template: 'ubuntu-server', // Use template
  specs: { /* template specs */ }
});
```

### 2. Monitor Resources
Regularly check server resource usage:
```javascript
const insights = await apiService.getNodeInsights(nodeId);
console.log('CPU:', insights.data.health.factors.cpu);
```

### 3. Graceful Shutdown
Always stop servers gracefully before deletion:
```javascript
await apiService.stopServer(serverId);
// Wait for server to stop
await new Promise(resolve => setTimeout(resolve, 5000));
await apiService.deleteServer(serverId);
```

### 4. Handle Errors
Implement proper error handling:
```javascript
try {
  await apiService.startServer(serverId);
} catch (error) {
  if (error.response?.status === 404) {
    console.log('Server not found');
  } else if (error.response?.status === 401) {
    console.log('Authentication required');
  }
}
```

---

## Permissions

### User Isolation
- Users can only see and manage their own servers
- Server IDs are unique across the system
- Authentication required for all operations

### Admin Features (Coming Soon)
- View all servers
- Manage quotas
- Set resource limits
- Override user permissions

---

## Troubleshooting

### Server Won't Start
1. Check server status: `GET /api/servers/:id`
2. Verify server isn't already running
3. Check for errors in server logs
4. Ensure sufficient resources

### Creation Fails
1. Verify authentication token is valid
2. Check request body format
3. Ensure template exists
4. Verify resource limits not exceeded

### Can't Delete Server
1. Ensure server is stopped first
2. Check for authentication issues
3. Verify you own the server
4. Check for dependent resources

---

## Future Features

- **Auto-scaling**: Automatic resource adjustment
- **Snapshots**: Save and restore server states
- **Cloning**: Duplicate existing servers
- **Networking**: Advanced network configuration
- **Monitoring**: Detailed performance metrics
- **Billing**: Resource usage tracking
- **Quotas**: User resource limits

---

**Version**: 0.3.0  
**Last Updated**: 2026-02-03
