import { Hono } from 'hono';
import { meshControlService } from '../services/meshControlService';
import { authMiddleware } from '../middleware/auth';
import { relaxedRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const meshRouter = new Hono();

// Apply middleware
meshRouter.use('*', relaxedRateLimit);
meshRouter.use('*', authMiddleware);

// Get mesh topology
meshRouter.get('/topology', async (c) => {
  try {
    const topology = await meshControlService.getMeshTopology();
    return c.json({ topology });
  } catch (error: any) {
    logger.error('Failed to get mesh topology:', error);
    return c.json({ error: error.message || 'Failed to get mesh topology' }, 500);
  }
});

// Distribute workload
meshRouter.post('/workload/distribute', async (c) => {
  const body = await c.req.json();
  const { type, resources } = body;

  if (!type || !resources) {
    return c.json({ error: 'Type and resources are required' }, 400);
  }

  try {
    const workload = await meshControlService.distributeWorkload(type, resources);
    logger.info(`Workload distributed: ${workload.workloadId}`);
    return c.json({ workload }, 202);
  } catch (error: any) {
    logger.error('Failed to distribute workload:', error);
    return c.json({ error: error.message || 'Failed to distribute workload' }, 400);
  }
});

// Get workload status
meshRouter.get('/workload/:id', async (c) => {
  const id = c.req.param('id');
  
  const workload = meshControlService.getWorkloadStatus(id);
  
  if (!workload) {
    return c.json({ error: 'Workload not found' }, 404);
  }
  
  return c.json({ workload });
});

// Get all workloads
meshRouter.get('/workload', async (c) => {
  const workloads = meshControlService.getAllWorkloads();
  return c.json({ workloads, count: workloads.length });
});

export default meshRouter;
