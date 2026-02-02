import { Hono } from 'hono';
import { nodeService } from '../services/nodeService';

const router = new Hono();

// GET /api/nodes - Get all nodes
router.get('/', (c) => {
  const nodes = nodeService.getAllNodes();
  return c.json({ nodes, count: nodes.length });
});

// GET /api/nodes/:id - Get node by ID
router.get('/:id', (c) => {
  const id = c.req.param('id');
  const node = nodeService.getNodeById(id);
  
  if (!node) {
    return c.json({ error: 'Node not found' }, 404);
  }
  
  return c.json({ node });
});

export default router;
