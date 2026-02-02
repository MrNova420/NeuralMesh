import { Server } from 'socket.io';
import { nodeService } from '../services/nodeService';
import { alertService } from '../services/alertService';

export function setupWebSocket(io: Server) {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Send initial data
    socket.emit('nodes:initial', {
      nodes: nodeService.getAllNodes(),
      timestamp: new Date().toISOString(),
    });

    // Send initial alerts
    socket.emit('alerts:initial', {
      alerts: alertService.getAll(),
      unread: alertService.getUnread().length,
    });

    // Handle node subscription
    socket.on('nodes:subscribe', () => {
      console.log(`📊 Client ${socket.id} subscribed to node updates`);
      
      // Send updates every 2 seconds
      const interval = setInterval(() => {
        // Update mock nodes only when enabled (real nodes handled by agent)
        nodeService.updateAllNodes();
        
        // Check for health issues
        const nodes = nodeService.getAllNodes();
        nodes.forEach((node) => {
          const alert = alertService.checkNodeHealth(node);
          if (alert) {
            io.emit('alert:new', alert);
          }
        });
        
        // Send updated data
        socket.emit('nodes:update', {
          nodes,
          timestamp: new Date().toISOString(),
        });
      }, 2000);

      // Clean up on disconnect
      socket.on('disconnect', () => {
        clearInterval(interval);
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });

    // Handle metrics request
    socket.on('metrics:request', (data: { nodeId?: string }) => {
      if (data.nodeId) {
        const node = nodeService.getNodeById(data.nodeId);
        if (node) {
          socket.emit('metrics:response', {
            nodeId: data.nodeId,
            metrics: node.specs,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // Send all metrics
        const nodes = nodeService.getAllNodes();
        socket.emit('metrics:response', {
          metrics: nodes.map(n => ({
            nodeId: n.id,
            cpu: n.specs.cpu.usage,
            memory: n.specs.memory.usage,
            storage: n.specs.storage.usage,
            network: n.specs.network,
          })),
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Alert management
    socket.on('alerts:getAll', () => {
      socket.emit('alerts:list', {
        alerts: alertService.getAll(),
      });
    });

    socket.on('alert:markRead', (data: { id: string }) => {
      alertService.markAsRead(data.id);
      socket.emit('alerts:updated', {
        alerts: alertService.getAll(),
        unread: alertService.getUnread().length,
      });
    });

    socket.on('alerts:markAllRead', () => {
      alertService.markAllAsRead();
      socket.emit('alerts:updated', {
        alerts: alertService.getAll(),
        unread: 0,
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log('🔌 WebSocket server ready');
}
