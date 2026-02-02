# NeuralMesh API Documentation

## Overview

NeuralMesh provides a RESTful API and WebSocket interface for managing and monitoring distributed server nodes.

**Base URL**: `http://localhost:3001/api`  
**WebSocket**: `ws://localhost:3001`

## Authentication

Currently in development. Future versions will support JWT-based authentication.

---

## REST API Endpoints

### Nodes

#### Get All Nodes
```http
GET /api/nodes
```

**Response**: `200 OK`
```json
{
  "nodes": [
    {
      "id": "node-001",
      "name": "alpha-server1",
      "type": "alpha",
      "status": "healthy",
      "specs": {
        "cpu": {
          "cores": 16,
          "usage": 45.2,
          "model": "AMD Ryzen 9 5950X"
        },
        "memory": {
          "total": 68719476736,
          "used": 34359738368,
          "usage": 50.0
        },
        "storage": {
          "total": 2000398934016,
          "used": 800159573606,
          "usage": 40.0
        },
        "network": {
          "rx": 125.5,
          "tx": 89.3
        }
      },
      "platform": {
        "os": "Linux",
        "arch": "x86_64",
        "hostname": "server1"
      },
      "location": {
        "region": "us-east-1",
        "ip": "192.168.1.100"
      },
      "connections": ["node-002", "node-003"],
      "uptime": 3600000
    }
  ],
  "count": 12
}
```

#### Get Node by ID
```http
GET /api/nodes/:id
```

**Parameters**:
- `id` (string) - Node identifier

**Response**: `200 OK`
```json
{
  "node": { /* Node object */ }
}
```

**Error**: `404 Not Found`
```json
{
  "error": "Node not found"
}
```

### Metrics

#### Get System Metrics
```http
GET /api/metrics
```

**Response**: `200 OK`
```json
{
  "timestamp": "2026-02-02T08:30:00.000Z",
  "aggregated": {
    "totalNodes": 12,
    "avgCpuUsage": 45.2,
    "avgMemoryUsage": 62.1,
    "totalStorage": 24004787208192,
    "networkThroughput": 2567.8
  }
}
```

#### Get Node Metrics
```http
GET /api/metrics/:nodeId
```

**Parameters**:
- `nodeId` (string) - Node identifier

**Response**: `200 OK`
```json
{
  "nodeId": "node-001",
  "timestamp": "2026-02-02T08:30:00.000Z",
  "metrics": {
    "cpu": { "usage": 45.2, "cores": 16 },
    "memory": { "usage": 50.0, "total": 68719476736 },
    "storage": { "usage": 40.0, "total": 2000398934016 },
    "network": { "rx": 125.5, "tx": 89.3 }
  }
}
```

### System Status

#### Get System Health
```http
GET /api/status
```

**Response**: `200 OK`
```json
{
  "health": "healthy",
  "nodes": {
    "total": 12,
    "healthy": 10,
    "warning": 2,
    "critical": 0,
    "offline": 0
  },
  "resources": {
    "avgCpuUsage": 45.2,
    "avgMemoryUsage": 62.1,
    "totalStorage": 24004787208192,
    "networkThroughput": 2567.8
  },
  "timestamp": "2026-02-02T08:30:00.000Z"
}
```

---

## WebSocket API

### Connection

Connect to WebSocket server:
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3001', {
  transports: ['websocket']
});
```

### Events

#### Client → Server

**Subscribe to Node Updates**
```javascript
socket.emit('nodes:subscribe');
```

**Request Metrics**
```javascript
socket.emit('metrics:request', {
  nodeId: 'node-001' // Optional, omit for all nodes
});
```

**Get All Alerts**
```javascript
socket.emit('alerts:getAll');
```

**Mark Alert as Read**
```javascript
socket.emit('alert:markRead', {
  id: 'alert-123'
});
```

**Mark All Alerts as Read**
```javascript
socket.emit('alerts:markAllRead');
```

#### Server → Client

**Initial Node Data**
```javascript
socket.on('nodes:initial', (data) => {
  console.log(data);
  // {
  //   nodes: [...],
  //   timestamp: "2026-02-02T08:30:00.000Z"
  // }
});
```

**Node Updates (Every 2s)**
```javascript
socket.on('nodes:update', (data) => {
  console.log(data);
  // {
  //   nodes: [...],
  //   timestamp: "2026-02-02T08:30:00.000Z"
  // }
});
```

**Metrics Response**
```javascript
socket.on('metrics:response', (data) => {
  console.log(data);
  // {
  //   nodeId: "node-001",
  //   metrics: {...},
  //   timestamp: "2026-02-02T08:30:00.000Z"
  // }
});
```

**Initial Alerts**
```javascript
socket.on('alerts:initial', (data) => {
  console.log(data);
  // {
  //   alerts: [...],
  //   unread: 5
  // }
});
```

**New Alert**
```javascript
socket.on('alert:new', (alert) => {
  console.log(alert);
  // {
  //   id: "alert-123",
  //   type: "warning",
  //   title: "High CPU Usage",
  //   message: "alpha-server1 CPU usage at 92.5%",
  //   nodeId: "node-001",
  //   nodeName: "alpha-server1",
  //   timestamp: "2026-02-02T08:30:00.000Z",
  //   read: false
  // }
});
```

**Alerts Updated**
```javascript
socket.on('alerts:updated', (data) => {
  console.log(data);
  // {
  //   alerts: [...],
  //   unread: 3
  // }
});
```

---

## Data Types

### Node
```typescript
interface Node {
  id: string;
  name: string;
  type: 'alpha' | 'beta' | 'gamma' | 'delta';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  specs: NodeSpecs;
  platform: Platform;
  location: Location;
  connections: string[];
  uptime: number; // milliseconds
}
```

### NodeSpecs
```typescript
interface NodeSpecs {
  cpu: {
    cores: number;
    usage: number; // 0-100
    model: string;
  };
  memory: {
    total: number; // bytes
    used: number;  // bytes
    usage: number; // 0-100
  };
  storage: {
    total: number; // bytes
    used: number;  // bytes
    usage: number; // 0-100
  };
  network: {
    rx: number; // MB/s
    tx: number; // MB/s
  };
}
```

### Alert
```typescript
interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  nodeId?: string;
  nodeName?: string;
  timestamp: Date;
  read: boolean;
}
```

---

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* Optional additional info */ }
}
```

**Common HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

**WebSocket Error Event**:
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

## Rate Limiting

Currently no rate limits. Future versions will implement:
- 100 requests/minute for REST API
- Unlimited WebSocket connections (with connection limit per IP)

---

## Examples

### React Hook for Real-Time Nodes
```typescript
import { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';

function useNodes() {
  const [nodes, setNodes] = useState([]);
  const { on, emit } = useWebSocket();

  useEffect(() => {
    emit('nodes:subscribe');
    
    on('nodes:initial', (data) => setNodes(data.nodes));
    on('nodes:update', (data) => setNodes(data.nodes));
  }, [on, emit]);

  return nodes;
}
```

### Fetch Nodes with Error Handling
```typescript
async function fetchNodes() {
  try {
    const response = await fetch('http://localhost:3001/api/nodes');
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return data.nodes;
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return [];
  }
}
```

---

## Future API Endpoints

Coming in v0.2.0:
- `POST /api/nodes` - Register new node
- `DELETE /api/nodes/:id` - Remove node
- `POST /api/nodes/:id/restart` - Restart node agent
- `POST /api/auth/login` - User authentication
- `GET /api/analytics` - Historical analytics

---

**Last Updated**: 2026-02-02  
**Version**: 0.1.0
