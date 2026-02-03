import { Hono } from 'hono';
import { nodeService } from '../services/nodeService';
import { optionalAuthMiddleware } from '../middleware/auth';
import { relaxedRateLimit } from '../middleware/rateLimit';

const router = new Hono();

// Apply middleware
router.use('*', relaxedRateLimit);
router.use('*', optionalAuthMiddleware);

// GET /api/metrics - Get aggregated metrics
router.get('/', async (c) => {
  const nodes = await nodeService.getAllNodes();
  
  const metrics = {
    timestamp: new Date().toISOString(),
    totalCpu: nodes.reduce((sum, n) => sum + n.specs.cpu.usage, 0) / nodes.length || 0,
    totalMemory: nodes.reduce((sum, n) => sum + n.specs.memory.usage, 0) / nodes.length || 0,
    totalNetworkRx: nodes.reduce((sum, n) => sum + n.specs.network.rx, 0),
    totalNetworkTx: nodes.reduce((sum, n) => sum + n.specs.network.tx, 0),
    nodes: nodes.map(n => ({
      id: n.id,
      name: n.name,
      cpu: n.specs.cpu.usage,
      memory: n.specs.memory.usage,
      network: n.specs.network,
    })),
  };
  
  return c.json(metrics);
});

// GET /api/metrics/:nodeId - Get metrics for specific node
router.get('/:nodeId', async (c) => {
  const nodeId = c.req.param('nodeId');
  const node = await nodeService.getNodeById(nodeId);
  
  if (!node) {
    return c.json({ error: 'Node not found' }, 404);
  }
  
  return c.json({
    nodeId: node.id,
    timestamp: new Date().toISOString(),
    cpu: node.specs.cpu.usage,
    memory: node.specs.memory.usage,
    storage: node.specs.storage.usage,
    network: node.specs.network,
  });
});

export default router;
