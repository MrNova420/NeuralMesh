import { Hono } from 'hono';
import { nodeService } from '../services/nodeService';

const router = new Hono();

// GET /api/status - Get system status
router.get('/', (c) => {
  const nodes = nodeService.getAllNodes();
  const activeNodes = nodes.filter(n => n.status !== 'offline');
  
  const totalConnections = nodes.reduce((sum, n) => sum + n.connections.length, 0);
  const avgCpuUsage = nodes.reduce((sum, n) => sum + n.specs.cpu.usage, 0) / nodes.length;
  const avgMemoryUsage = nodes.reduce((sum, n) => sum + n.specs.memory.usage, 0) / nodes.length;
  const totalStorage = nodes.reduce((sum, n) => sum + n.specs.storage.total, 0);
  const networkThroughput = nodes.reduce((sum, n) => sum + n.specs.network.rx + n.specs.network.tx, 0);
  
  // Determine overall health
  const warningNodes = nodes.filter(n => n.status === 'warning').length;
  const criticalNodes = nodes.filter(n => n.status === 'critical').length;
  
  let health: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (criticalNodes > 0) health = 'critical';
  else if (warningNodes > 0) health = 'warning';
  
  const status = {
    totalNodes: nodes.length,
    activeNodes: activeNodes.length,
    totalConnections,
    avgCpuUsage: Math.round(avgCpuUsage * 10) / 10,
    avgMemoryUsage: Math.round(avgMemoryUsage * 10) / 10,
    totalStorage: Math.round(totalStorage / 1000),
    networkThroughput: Math.round(networkThroughput),
    uptime: 7689600,
    health,
    timestamp: new Date().toISOString(),
  };
  
  return c.json(status);
});

export default router;
