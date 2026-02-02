# NeuralMesh User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Nodes](#managing-nodes)
4. [Neural Network View](#neural-network-view)
5. [Alerts & Notifications](#alerts--notifications)
6. [Settings](#settings)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

**Option 1: Docker (Recommended)**
```bash
./deploy.sh
```

**Option 2: Manual**
1. Start backend: `cd backend && bun run index-ws.ts`
2. Start frontend: `cd frontend && npm run dev`
3. Run agent: `cd agent && cargo run`

### Adding Your First Node

1. Download the agent for your platform
2. Run the agent:
   ```bash
   ./neuralmesh-agent --server ws://your-server:3001
   ```
3. The node will automatically appear in the dashboard

---

## Dashboard Overview

The main dashboard provides a real-time overview of your entire NeuralMesh network.

### Key Metrics

**Top Stats Bar**
- **Total Nodes**: Number of connected devices
- **Active Connections**: Total mesh connections
- **CPU Usage**: Average across all nodes
- **Memory Usage**: Average across all nodes
- **Total Storage**: Combined storage capacity
- **Network Throughput**: Total network traffic

### Real-Time Charts

The dashboard displays three live-updating charts:
- **CPU Usage (%)**: Average CPU utilization over time
- **Memory Usage (%)**: Average memory consumption
- **Network (MB/s)**: Total network throughput

**Live Updates**: Green "● Live" indicator shows active WebSocket connection

### Activity Feed

Shows recent events:
- 🟢 Node joins
- 🔴 Node disconnections
- 🚀 Deployments
- ⚠️ Alerts
- ⚡ System optimizations

### Quick Actions

Fast access to common tasks:
- **Add Node**: Register a new device
- **Deploy Service**: Deploy to nodes
- **Run Optimization**: Optimize resource allocation
- **View Logs**: System-wide logs

### Node Status List

Compact list of all nodes with:
- Node name and status indicator
- Node type (Alpha/Beta/Gamma/Delta)
- CPU, Memory, Storage usage bars
- Uptime counter

**Color Coding**:
- 🟢 Green: Healthy (<70% usage)
- 🟡 Yellow: Warning (70-90% usage)
- 🔴 Red: Critical (>90% usage)

---

## Managing Nodes

### Nodes Page

Access via sidebar: **Nodes** → View all connected devices

### Node Grid View

Each node card displays:
- **Type Icon**: 🖥️ Alpha, 💻 Beta, 📱 Gamma, 🔌 Delta
- **Status Indicator**: Live health status
- **Node Name**: Auto-generated or custom
- **Hostname & OS**: System information
- **Type Badge**: Classification
- **Resource Bars**: CPU, Memory, Disk usage

### Filtering Nodes

**Search Box**: Type to filter by name, hostname, or IP

**Type Filters**:
- **All**: Show all nodes
- **Alpha**: High-end servers only
- **Beta**: Mid-tier servers
- **Gamma**: Desktops/mobile
- **Delta**: IoT/Raspberry Pi

### Node Details

Click any node card to open detailed view:

**System Specifications**
- CPU: Cores, model, usage %
- Memory: Total, used, usage %
- Storage: Total, used, usage %
- Network: Download/upload speeds

**Platform Information**
- Operating System
- Architecture (x86_64, ARM, etc.)
- Region/Location
- IP Address

**Connected Nodes**
- List of mesh connections
- Click to view connected node

**Actions**
- 🔄 Restart Agent
- 🔌 Disconnect
- ⚠️ Shutdown Node (use with caution)

---

## Neural Network View

Access via sidebar: **Neural Network** → 3D visualization

### 3D Mesh Topology

Interactive 3D visualization of your node network:

**Navigation**:
- **Left Mouse**: Rotate view
- **Right Mouse**: Pan
- **Scroll**: Zoom in/out
- **Double Click**: Reset view

**Node Spheres**:
- Color indicates node type
- Size varies by resource capacity
- Glow effect shows activity level

**Connection Lines**:
- Blue lines: Active connections
- Line thickness: Connection strength
- Animated flow: Data transfer

### Node Selection

**Click a node sphere** to:
- View node details in side panel
- Highlight connections
- Show real-time metrics

### Fullscreen Mode

Click **⛶ Fullscreen** for immersive view

### Background Effects

Animated background with:
- Crossing light beams
- Particle system
- Starfield backdrop

---

## Alerts & Notifications

### Alert Center

Click **🔔 Bell Icon** in top-right corner

**Unread Count**: Red badge shows unread alerts

### Alert Types

- 💡 **Info**: General information
- ⚠️ **Warning**: Resource usage 80-95%
- 🔴 **Critical**: Resource usage >95%
- ✅ **Success**: Successful operations

### Managing Alerts

**View Alerts**:
1. Click bell icon
2. Select **All** or **Unread** filter

**Mark as Read**:
- Click individual alert
- Or click **Mark all read** button

**Clear Alerts**:
- Click **Clear all** to remove

### Auto-Generated Alerts

System automatically creates alerts for:
- CPU usage >80% (Warning)
- CPU usage >95% (Critical)
- Memory usage >80% (Warning)
- Memory usage >95% (Critical)
- Storage usage >95% (Critical)
- Node disconnections
- Failed health checks

---

## Settings

Access via sidebar: **Settings** → Configure system

### Connection Settings

**Server URL**: WebSocket endpoint
- Default: `ws://localhost:3001`
- Change for remote server

**Update Interval**: Metrics refresh rate
- Default: 2 seconds
- Range: 1-60 seconds
- Lower = more real-time, higher CPU

**Auto Reconnect**: Toggle automatic reconnection

### Node Management

**Max Nodes**: Maximum allowed nodes
- Default: 100
- Increase for larger deployments

**Health Thresholds**:
- Warning: Default 70%
- Critical: Default 90%

### Notifications

**Enable Notifications**: Toggle system alerts

**Alert Types**: Choose which events trigger alerts
- Node Join
- Node Warning
- Node Critical
- Deployment

### Appearance

**Theme**:
- Dark (default)
- Light
- Auto (follow system)

**Animation Effects**: Toggle background animations
- Disable for better performance on low-end devices

### Performance

**Data Retention**: Historical metrics storage
- 1 Hour
- 6 Hours
- 24 Hours (default)
- 7 Days
- 30 Days

**3D Rendering Quality**:
- Low (better performance)
- Medium (default)
- High (better quality)

### System Information

View current versions:
- Platform version
- Backend runtime
- Frontend framework
- Agent version
- WebSocket library

---

## Troubleshooting

### Connection Issues

**"Failed to connect to backend"**
1. Check backend is running: `docker-compose ps`
2. Verify URL in Settings → Server URL
3. Check firewall allows port 3001
4. View backend logs: `docker-compose logs backend`

**WebSocket disconnects frequently**
1. Check network stability
2. Increase reconnection timeout in settings
3. Check backend logs for errors

### Node Not Appearing

**Agent connected but node missing**
1. Refresh the page (F5)
2. Check agent logs for errors
3. Verify WebSocket URL in agent
4. Restart agent: `./neuralmesh-agent --server ws://host:3001`

### High Resource Usage

**Dashboard using too much CPU**
1. Reduce update interval in settings
2. Lower 3D rendering quality
3. Disable background animations
4. Use "Nodes" page instead of 3D view

### Data Not Updating

**Metrics stuck/not refreshing**
1. Check "● Live" indicator in dashboard
2. Verify WebSocket connection in browser console
3. Restart backend service
4. Clear browser cache

### Performance Optimization

**For low-end devices**:
1. Settings → Update Interval: 5-10 seconds
2. Settings → 3D Quality: Low
3. Settings → Animations: Off
4. Settings → Data Retention: 1 Hour
5. Use Nodes page instead of Neural Network view

**For many nodes (100+)**:
1. Increase update interval to 5-10s
2. Filter nodes by type
3. Use search to find specific nodes
4. Consider database integration (future)

### Getting Help

1. Check logs: `docker-compose logs -f`
2. GitHub Issues: Report bugs
3. Documentation: Re-read relevant sections
4. Community: Discord/Forum (coming soon)

---

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Open command palette (future)
- `F5`: Refresh page
- `Esc`: Close modals

---

## Best Practices

1. **Regular Monitoring**: Check dashboard daily
2. **Alert Threshold**: Adjust based on workload
3. **Update Interval**: Balance real-time vs performance
4. **Node Naming**: Use descriptive names
5. **Health Checks**: Monitor critical alerts
6. **Backups**: Regular data backups (future)
7. **Updates**: Keep agents/server updated

---

**Version**: 0.1.0  
**Last Updated**: 2026-02-02

For additional help, see [DEPLOYMENT.md](./DEPLOYMENT.md) and [API.md](./API.md)
