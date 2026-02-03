# NeuralMesh v0.5.0 - Complete Server Capabilities Guide

## Overview

NeuralMesh v0.5.0 introduces professional-grade server orchestration capabilities including container management, cloud integration, clustering, automated backups, and deployment templates.

---

## 🐳 Container Management

### Features
- **Full Lifecycle**: Create, start, stop, restart, remove containers
- **Resource Control**: CPU/memory limits and monitoring
- **Network Config**: Port mapping and custom networks
- **Storage**: Volume mounting and persistence
- **Monitoring**: Real-time stats and logs
- **Exec**: Run commands inside containers

### API Endpoints

#### List Containers
```bash
GET /api/containers?nodeId=node_123
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cont_1234567890_abc123",
      "name": "my-nginx",
      "image": "nginx:latest",
      "status": "running",
      "ports": [{ "container": 80, "host": 8080, "protocol": "tcp" }],
      "resources": {
        "cpuLimit": 1,
        "memoryLimit": "512m",
        "cpuUsage": 25.5,
        "memoryUsage": 256
      }
    }
  ]
}
```

#### Create Container
```bash
POST /api/containers
Authorization: Bearer YOUR_TOKEN
```

**Request:**
```json
{
  "name": "my-postgres",
  "image": "postgres:16",
  "nodeId": "node_123",
  "environment": {
    "POSTGRES_PASSWORD": "mysecretpassword",
    "POSTGRES_DB": "myapp"
  },
  "ports": [
    { "container": 5432, "host": 5432 }
  ],
  "volumes": [
    { "container": "/var/lib/postgresql/data", "host": "/data/postgres" }
  ],
  "cpuLimit": 2,
  "memoryLimit": "1g",
  "restart": "always"
}
```

#### Container Operations
```bash
POST /api/containers/:id/start       # Start container
POST /api/containers/:id/stop        # Stop container
POST /api/containers/:id/restart     # Restart container
DELETE /api/containers/:id?force=true # Remove container
```

#### View Logs
```bash
GET /api/containers/:id/logs?tail=100
```

#### Get Stats
```bash
GET /api/containers/:id/stats?limit=60
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "containerId": "cont_123",
      "cpu": 35.2,
      "memory": 412.5,
      "memoryLimit": 1073741824,
      "networkRx": 1524887,
      "networkTx": 892345,
      "timestamp": "2026-02-03T02:30:00.000Z"
    }
  ]
}
```

#### Execute Command
```bash
POST /api/containers/:id/exec
```

**Request:**
```json
{
  "command": ["npm", "install", "express"]
}
```

### Container Templates

#### Available Templates
```bash
GET /api/containers/templates/list
```

**Templates:**
1. **Nginx Web Server** - High-performance HTTP server
2. **PostgreSQL Database** - Production-ready database
3. **Redis Cache** - In-memory data store
4. **Node.js App** - Node.js application runtime

---

## ☁️ Cloud Integration

### Supported Providers
- Amazon Web Services (AWS)
- Google Cloud Platform (GCP)
- Microsoft Azure
- DigitalOcean
- Custom providers

### API Endpoints

#### List Providers
```bash
GET /api/cloud/providers
```

#### Add Provider
```bash
POST /api/cloud/providers
Authorization: Bearer YOUR_TOKEN
```

**Request:**
```json
{
  "name": "My AWS Account",
  "type": "aws",
  "enabled": true,
  "config": {
    "accessKeyId": "AKIA...",
    "secretAccessKey": "...",
    "region": "us-east-1"
  },
  "capabilities": ["compute", "storage", "database"],
  "regions": ["us-east-1", "us-west-2", "eu-west-1"]
}
```

#### Test Connection
```bash
POST /api/cloud/providers/:id/test
```

#### Get Instance Types
```bash
GET /api/cloud/providers/:id/types
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "t2.micro",
      "name": "Micro",
      "specs": { "cpu": 1, "memory": 1, "storage": 8 },
      "cost": { "hourly": 0.0116, "monthly": 8.47 }
    },
    {
      "type": "m5.xlarge",
      "name": "Extra Large",
      "specs": { "cpu": 4, "memory": 16, "storage": 100 },
      "cost": { "hourly": 0.192, "monthly": 140.16 }
    }
  ]
}
```

#### Create Cloud Instance
```bash
POST /api/cloud/instances
Authorization: Bearer YOUR_TOKEN
```

**Request:**
```json
{
  "providerId": "aws-default",
  "name": "web-server-01",
  "type": "t2.medium",
  "region": "us-east-1",
  "tags": {
    "environment": "production",
    "role": "web-server"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "inst_1234567890_xyz",
    "status": "pending",
    "specs": { "cpu": 2, "memory": 4, "storage": 30 },
    "cost": { "hourly": 0.0464, "monthly": 33.87 }
  }
}
```

#### Instance Operations
```bash
POST /api/cloud/instances/:id/start     # Start instance
POST /api/cloud/instances/:id/stop      # Stop instance
DELETE /api/cloud/instances/:id         # Terminate instance
```

---

## 🔧 Server Clustering

### Features
- **Load Balancing**: Round-robin, least-connections, IP-hash, weighted
- **Auto-Scaling**: CPU/memory-based automatic scaling
- **Health Monitoring**: Real-time cluster health tracking
- **Metrics**: Requests, response time, error rate, bandwidth

### API Endpoints

#### Create Cluster
```bash
POST /api/capabilities/clusters
Authorization: Bearer YOUR_TOKEN
```

**Request:**
```json
{
  "name": "Production Web Cluster",
  "type": "load-balanced",
  "servers": ["server_1", "server_2", "server_3"],
  "loadBalancer": {
    "algorithm": "least-connections",
    "healthCheckInterval": 30,
    "healthCheckTimeout": 5
  },
  "autoScaling": {
    "enabled": true,
    "minServers": 2,
    "maxServers": 10,
    "targetCpuPercent": 70,
    "targetMemoryPercent": 80,
    "scaleUpCooldown": 300,
    "scaleDownCooldown": 600
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cluster_1234567890_abc",
    "name": "Production Web Cluster",
    "status": "healthy",
    "servers": ["server_1", "server_2", "server_3"],
    "metrics": {
      "totalRequests": 0,
      "averageResponseTime": 0,
      "errorRate": 0,
      "totalBandwidth": 0
    }
  }
}
```

#### List Clusters
```bash
GET /api/capabilities/clusters
```

#### Get Cluster Details
```bash
GET /api/capabilities/clusters/:id
```

#### Update Cluster
```bash
PATCH /api/capabilities/clusters/:id
```

**Request:**
```json
{
  "autoScaling": {
    "enabled": true,
    "maxServers": 15,
    "targetCpuPercent": 60
  }
}
```

### Cluster Types

1. **Load-Balanced**: Distributes traffic across multiple servers
2. **High-Availability**: Ensures service continuity with failover
3. **Compute**: Optimized for CPU-intensive workloads
4. **Database**: Database replication and read replicas

### Load Balancing Algorithms

- **Round-Robin**: Distributes requests evenly across servers
- **Least-Connections**: Routes to server with fewest active connections
- **IP-Hash**: Consistent routing based on client IP
- **Weighted**: Routes based on server capacity weights

---

## 🏥 Health Checks

### Features
- **Comprehensive**: CPU, memory, disk, network, services
- **Real-Time**: Continuous monitoring
- **Status Tracking**: Healthy, unhealthy, unknown
- **Uptime**: Track server availability

### API Endpoints

#### Perform Health Check
```bash
POST /api/capabilities/health/:serverId/check
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "serverId": "server_123",
    "status": "healthy",
    "lastCheck": "2026-02-03T02:30:00.000Z",
    "checks": {
      "cpu": true,
      "memory": true,
      "disk": true,
      "network": true,
      "services": true
    },
    "uptime": 2592000,
    "responseTime": 45.2
  }
}
```

#### List All Health Checks
```bash
GET /api/capabilities/health
```

#### Get Specific Health Check
```bash
GET /api/capabilities/health/:serverId
```

---

## 💾 Backup & Restore

### Features
- **Backup Types**: Full, incremental, differential
- **Scheduling**: Cron-based automation
- **Encryption**: Optional backup encryption
- **Compression**: Space-saving compression
- **Retention**: Configurable retention policies

### API Endpoints

#### Create Backup Configuration
```bash
POST /api/capabilities/backups/configs
Authorization: Bearer YOUR_TOKEN
```

**Request:**
```json
{
  "serverId": "server_123",
  "name": "Daily Production Backup",
  "schedule": "0 2 * * *",
  "retention": 30,
  "type": "incremental",
  "destination": "/backups/production",
  "encryption": true,
  "compression": true
}
```

#### List Backup Configurations
```bash
GET /api/capabilities/backups/configs?serverId=server_123
```

#### Perform Backup Now
```bash
POST /api/capabilities/backups/perform/:configId
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "backup_1234567890_xyz",
    "status": "in-progress",
    "serverId": "server_123",
    "type": "incremental",
    "location": "/backups/production/backup_1234567890_xyz"
  }
}
```

#### List Backups
```bash
GET /api/capabilities/backups/:serverId
```

#### Restore Backup
```bash
POST /api/capabilities/backups/:backupId/restore
Authorization: Bearer YOUR_TOKEN
```

### Backup Types

1. **Full**: Complete backup of all data
2. **Incremental**: Only changes since last backup
3. **Differential**: Changes since last full backup

### Schedule Format

Use standard cron format:
- `0 2 * * *` - Daily at 2 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday
- `0 0 1 * *` - Monthly on 1st day

---

## 🚀 Deployment Templates

### Available Templates

#### 1. WordPress Site
Complete WordPress hosting with MySQL and Redis cache

**Specs:**
- CPU: 2 cores minimum
- Memory: 4 GB minimum
- Storage: 20 GB minimum
- Cost: $0.15/hour ($109.50/month)

**Components:**
- Nginx web server
- WordPress container
- MySQL 8.0 database
- Redis cache

#### 2. E-commerce Platform
High-performance e-commerce with Magento/WooCommerce

**Specs:**
- CPU: 8 cores minimum
- Memory: 16 GB minimum
- Storage: 100 GB minimum
- Cost: $0.65/hour ($474.50/month)

**Components:**
- Load balancer
- 2x Web servers
- MySQL 8.0 with replication
- Redis cache
- Elasticsearch 8

#### 3. API Backend
Scalable REST API with Node.js and PostgreSQL

**Specs:**
- CPU: 4 cores minimum
- Memory: 8 GB minimum
- Storage: 50 GB minimum
- Cost: $0.35/hour ($255.50/month)

**Components:**
- Load balancer
- 3x API servers
- PostgreSQL 16
- Redis cache

#### 4. Analytics Platform
Real-time analytics with ClickHouse and Grafana

**Specs:**
- CPU: 8 cores minimum
- Memory: 32 GB minimum
- Storage: 500 GB minimum
- Cost: $1.20/hour ($876/month)

**Components:**
- Analytics server
- ClickHouse database
- Grafana dashboard
- Prometheus monitoring

#### 5. Kubernetes Cluster
Production-ready Kubernetes with 3 masters + 5 workers

**Specs:**
- CPU: 24 cores minimum
- Memory: 64 GB minimum
- Storage: 500 GB minimum
- Cost: $2.50/hour ($1,825/month)

**Components:**
- 3x Master nodes
- 5x Worker nodes
- Load balancer

### API Endpoints

#### List Templates
```bash
GET /api/capabilities/templates
```

#### Deploy Template
```bash
POST /api/capabilities/templates/:templateId/deploy
Authorization: Bearer YOUR_TOKEN
```

**Request:**
```json
{
  "name": "production-wordpress",
  "region": "us-east-1"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deploymentId": "deploy_1234567890_xyz",
    "status": "in-progress",
    "components": [
      { "type": "server", "status": "provisioning" },
      { "type": "container", "status": "provisioning" },
      { "type": "database", "status": "provisioning" }
    ]
  }
}
```

---

## 📊 Best Practices

### Container Management
1. Always set resource limits
2. Use volumes for persistent data
3. Configure restart policies
4. Monitor container stats regularly
5. Use official images when possible

### Cloud Integration
1. Test provider connections before use
2. Tag instances appropriately
3. Monitor costs regularly
4. Use appropriate instance types
5. Implement auto-shutdown for dev/test

### Clustering
1. Start with at least 2 servers
2. Configure health checks
3. Set appropriate scaling thresholds
4. Monitor cluster metrics
5. Test failover scenarios

### Backups
1. Enable encryption for sensitive data
2. Test restore procedures regularly
3. Use retention policies
4. Store backups off-site
5. Monitor backup success/failure

### Deployments
1. Start with templates
2. Customize for your needs
3. Test in staging first
4. Monitor resource usage
5. Plan for scaling

---

## 🔐 Security Considerations

### Containers
- Use non-root users
- Scan images for vulnerabilities
- Limit container capabilities
- Use network policies
- Keep images updated

### Cloud
- Use IAM roles and policies
- Encrypt data at rest
- Use private networks
- Enable audit logging
- Rotate credentials regularly

### Clusters
- Secure inter-node communication
- Use TLS/SSL
- Implement network segmentation
- Monitor for anomalies
- Regular security updates

### Backups
- Always encrypt backups
- Secure backup storage
- Test restore procedures
- Limit access to backups
- Monitor backup integrity

---

## 📈 Monitoring & Metrics

### Container Metrics
- CPU usage percentage
- Memory usage (MB)
- Network I/O (bytes)
- Disk I/O (bytes)
- Process count

### Cluster Metrics
- Total requests
- Average response time
- Error rate
- Total bandwidth
- Server health status

### Cloud Metrics
- Instance status
- Resource utilization
- Cost tracking
- Network traffic
- API calls

---

## 🆘 Troubleshooting

### Container Won't Start
1. Check logs: `GET /api/containers/:id/logs`
2. Verify image exists
3. Check resource limits
4. Verify port availability
5. Check dependencies

### Cloud Connection Failed
1. Verify credentials
2. Check network connectivity
3. Verify region availability
4. Review API quotas
5. Check firewall rules

### Cluster Unhealthy
1. Check individual server health
2. Verify network connectivity
3. Review resource usage
4. Check load balancer config
5. Review recent changes

### Backup Failed
1. Check disk space
2. Verify permissions
3. Check network connectivity
4. Review backup configuration
5. Check system resources

---

## 📚 Additional Resources

- [API Documentation](./API.md)
- [Quick Start Guide](./QUICK_START.md)
- [Security Guide](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)

For more information, visit the [NeuralMesh Documentation](https://github.com/MrNova420/NeuralMesh).
