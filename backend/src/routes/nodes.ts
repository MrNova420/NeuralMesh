import { Hono } from 'hono';
import { nodeService } from '../services/nodeService';
import { optionalAuthMiddleware } from '../middleware/auth';
import { relaxedRateLimit } from '../middleware/rateLimit';
import { cache } from '../utils/cache';

const router = new Hono();

// Apply middleware
router.use('*', relaxedRateLimit);
router.use('*', optionalAuthMiddleware);

// GET /api/nodes - Get all nodes (with caching)
router.get('/', async (c) => {
  const cacheKey = 'nodes:all';
  
  // Try to get from cache
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return c.json(cached);
  }

  // Get from database/memory
  const nodes = await nodeService.getAllNodes();
  const response = { nodes, count: nodes.length };

  // Cache for 5 seconds
  await cache.set(cacheKey, response, 5);

  return c.json(response);
});

// GET /api/nodes/:id - Get node by ID (with caching)
router.get('/:id', async (c) => {
  const id = c.req.param('id');
  const cacheKey = `nodes:${id}`;

  // Try to get from cache
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return c.json(cached);
  }

  // Get from database/memory
  const node = await nodeService.getNodeById(id);

  if (!node) {
    return c.json({ error: 'Node not found' }, 404);
  }

  const response = { node };

  // Cache for 5 seconds
  await cache.set(cacheKey, response, 5);

  return c.json(response);
});

export default router;
