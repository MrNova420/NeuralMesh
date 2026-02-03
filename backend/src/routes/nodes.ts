import { Hono } from 'hono';
import { nodeService } from '../services/nodeService';
import { optionalAuthMiddleware } from '../middleware/auth';
import { relaxedRateLimit } from '../middleware/rateLimit';

const router = new Hono();

// Apply middleware
router.use('*', relaxedRateLimit);
router.use('*', optionalAuthMiddleware);

// GET /api/nodes - Get all nodes
router.get('/', async (c) => {
  const nodes = await nodeService.getAllNodes();
  return c.json({ nodes, count: nodes.length });
});

// GET /api/nodes/:id - Get node by ID
router.get('/:id', async (c) => {
  const id = c.req.param('id');
  const node = await nodeService.getNodeById(id);
  
  if (!node) {
    return c.json({ error: 'Node not found' }, 404);
  }
  
  return c.json({ node });
});

export default router;
