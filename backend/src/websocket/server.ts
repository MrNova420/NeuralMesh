import { Server } from 'socket.io';
import { nodeService } from '../services/nodeService';
import { alertService } from '../services/alertService';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

// Batch update configuration
const BATCH_INTERVAL = 2000; // 2 seconds
const UPDATE_BATCH_SIZE = 50; // Max nodes per batch

export function setupWebSocket(io: Server) {
  let updateBatch: any[] = [];
  let batchTimer: NodeJS.Timeout | null = null;

  // Function to flush batch updates
  const flushBatch = () => {
    if (updateBatch.length > 0) {
      io.emit('nodes:update:batch', {
        updates: updateBatch,
        timestamp: new Date().toISOString(),
      });
      updateBatch = [];
    }
  };

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

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
    socket.on('nodes:subscribe', async () => {
      logger.info(`Client ${socket.id} subscribed to node updates`);
      
      // Send updates every 2 seconds
      const interval = setInterval(async () => {
        // Update mock nodes only when enabled (real nodes handled by agent)
        await nodeService.updateAllNodes();
        
        // Invalidate cache
        await cache.invalidatePattern('nodes:*');
        
        // Check for health issues
        const nodes = await nodeService.getAllNodes();
        
        // Check alerts for nodes (batch process)
        const alertPromises = nodes.map(async (node) => {
          const alert = alertService.checkNodeHealth(node);
          if (alert) {
            io.emit('alert:new', alert);
          }
        });
        await Promise.all(alertPromises);
        
        // Send updated data (batched for large deployments)
        if (nodes.length > UPDATE_BATCH_SIZE) {
          // Split into batches
          for (let i = 0; i < nodes.length; i += UPDATE_BATCH_SIZE) {
            const batch = nodes.slice(i, i + UPDATE_BATCH_SIZE);
            socket.emit('nodes:update', {
              nodes: batch,
              total: nodes.length,
              batch: Math.floor(i / UPDATE_BATCH_SIZE) + 1,
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          // Send all at once for small deployments
          socket.emit('nodes:update', {
            nodes,
            timestamp: new Date().toISOString(),
          });
        }
      }, BATCH_INTERVAL);

      // Clean up on disconnect
      socket.on('disconnect', () => {
        clearInterval(interval);
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    // Handle metrics request (with caching)
    socket.on('metrics:request', async (data: { nodeId?: string }) => {
      if (data.nodeId) {
        const cacheKey = `metrics:${data.nodeId}`;
        let metrics = await cache.get(cacheKey);

        if (!metrics) {
          const node = await nodeService.getNodeById(data.nodeId);
          if (node) {
            metrics = {
              nodeId: data.nodeId,
              metrics: node.specs,
              timestamp: new Date().toISOString(),
            };
            await cache.set(cacheKey, metrics, 5); // Cache for 5 seconds
          }
        }

        if (metrics) {
          socket.emit('metrics:response', metrics);
        }
      } else {
        // Send all metrics (cached)
        const cacheKey = 'metrics:all';
        let allMetrics = await cache.get(cacheKey);

        if (!allMetrics) {
          const nodes = await nodeService.getAllNodes();
          allMetrics = {
            metrics: nodes.map(n => ({
              nodeId: n.id,
              cpu: n.specs.cpu.usage,
              memory: n.specs.memory.usage,
              storage: n.specs.storage.usage,
              network: n.specs.network,
            })),
            timestamp: new Date().toISOString(),
          };
          await cache.set(cacheKey, allMetrics, 5);
        }

        socket.emit('metrics:response', allMetrics);
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
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  // Start batch flush timer
  if (!batchTimer) {
    batchTimer = setInterval(flushBatch, BATCH_INTERVAL);
  }

  logger.info('WebSocket server ready');
}
