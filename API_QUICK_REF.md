# NeuralMesh v0.2.0 - API Quick Reference

## Base URLs
- **REST API**: `http://localhost:3001/api`
- **WebSocket**: `ws://localhost:3001`

## Authentication Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/auth/register` | Register new user | 10/15min |
| POST | `/api/auth/login` | Login and get tokens | 10/15min |
| POST | `/api/auth/refresh` | Refresh access token | None |
| POST | `/api/auth/logout` | Logout and invalidate token | None |

## Node Endpoints

| Method | Endpoint | Description | Cached | Auth |
|--------|----------|-------------|--------|------|
| GET | `/api/nodes` | Get all nodes | 5s | Optional |
| GET | `/api/nodes/:id` | Get node by ID | 5s | Optional |

## Metrics Endpoints

| Method | Endpoint | Description | Cached | Auth |
|--------|----------|-------------|--------|------|
| GET | `/api/metrics` | Get aggregated metrics | 5s | Optional |
| GET | `/api/metrics/:nodeId` | Get node metrics | 5s | Optional |

## Status Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/status` | Get system health | Optional |

## Node Actions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/actions/restart` | Restart a node | Optional |
| POST | `/api/actions/shutdown` | Shutdown a node | Optional |
| POST | `/api/actions/disconnect` | Disconnect a node | Optional |
| GET | `/api/actions/history/:nodeId` | Get action history | Optional |

## Analytics Endpoints (New in v0.2.0)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/health` | Get all health scores | Optional |
| GET | `/api/analytics/insights/:nodeId` | Get node insights | Optional |
| GET | `/api/analytics/recommendations` | Get optimization tips | Optional |

## WebSocket Events

### Client → Server
- `nodes:subscribe` - Subscribe to node updates
- `metrics:request` - Request metrics
- `alerts:getAll` - Get all alerts
- `alert:markRead` - Mark alert as read
- `alerts:markAllRead` - Mark all alerts as read

### Server → Client
- `nodes:initial` - Initial node data
- `nodes:update` - Node updates (every 2s)
- `nodes:update:batch` - Batched updates (100+ nodes)
- `metrics:response` - Metrics response
- `alerts:initial` - Initial alerts
- `alert:new` - New alert
- `alerts:updated` - Alerts updated

## Rate Limits
- **Strict** (Auth): 10 requests/15 minutes
- **Normal** (General): 100 requests/15 minutes
- **Relaxed** (Real-time): 60 requests/minute

## Response Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Example: Node Health Insights

```bash
curl http://localhost:3001/api/analytics/insights/node-001
```

Response:
```json
{
  "health": {
    "nodeId": "node-001",
    "score": 78,
    "factors": {
      "cpu": 65,
      "memory": 70,
      "storage": 85,
      "network": 90,
      "uptime": 95
    },
    "prediction": "stable"
  },
  "anomalies": [],
  "recommendations": [
    "Consider upgrading CPU or redistributing workload"
  ]
}
```

## Example: Authentication Flow

```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"SecurePass123!"}'

# 2. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"SecurePass123!"}'

# 3. Use token
curl http://localhost:3001/api/nodes \
  -H "Authorization: Bearer <access_token>"

# 4. Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refresh_token>"}'
```

## Smart Monitoring Features

### Health Scoring (0-100)
- **CPU**: 30% weight
- **Memory**: 30% weight
- **Storage**: 20% weight
- **Network**: 10% weight (based on stability)
- **Uptime**: 10% weight

### Anomaly Detection
- Uses 2.5 standard deviations
- Requires 10+ data points
- Severity: low, medium, high
- Monitors: CPU, Memory, Storage

### Predictions
- **Stable**: Normal operation
- **Degrading**: Performance declining
- **Critical**: Immediate action needed

---

For complete API documentation, see [API.md](./API.md)
