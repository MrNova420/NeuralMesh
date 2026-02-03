import { Hono } from 'hono';
import { nodeService } from '../services/nodeService';
import { nodeActionSchema } from '../utils/validation';
import { optionalAuthMiddleware } from '../middleware/auth';
import { relaxedRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const actionsRouter = new Hono();

// Apply middleware
actionsRouter.use('*', relaxedRateLimit);
actionsRouter.use('*', optionalAuthMiddleware);

// Restart node
actionsRouter.post('/restart', async (c) => {
  const body = await c.req.json();
  const validation = nodeActionSchema.safeParse({ ...body, action: 'restart' });

  if (!validation.success) {
    return c.json({ error: 'Validation failed', details: validation.error.errors }, 400);
  }

  const { nodeId } = validation.data;
  const result = await nodeService.sendAction(nodeId, 'restart');

  if (!result.success) {
    logger.warn(`Failed to restart node ${nodeId}: ${result.error}`);
    return c.json({ error: result.error }, 404);
  }

  logger.info(`Node restart requested: ${nodeId}`);
  return c.json({ message: 'Restart command sent', nodeId });
});

// Shutdown node
actionsRouter.post('/shutdown', async (c) => {
  const body = await c.req.json();
  const validation = nodeActionSchema.safeParse({ ...body, action: 'shutdown' });

  if (!validation.success) {
    return c.json({ error: 'Validation failed', details: validation.error.errors }, 400);
  }

  const { nodeId } = validation.data;
  const result = await nodeService.sendAction(nodeId, 'shutdown');

  if (!result.success) {
    logger.warn(`Failed to shutdown node ${nodeId}: ${result.error}`);
    return c.json({ error: result.error }, 404);
  }

  logger.info(`Node shutdown requested: ${nodeId}`);
  return c.json({ message: 'Shutdown command sent', nodeId });
});

// Disconnect node
actionsRouter.post('/disconnect', async (c) => {
  const body = await c.req.json();
  const validation = nodeActionSchema.safeParse({ ...body, action: 'disconnect' });

  if (!validation.success) {
    return c.json({ error: 'Validation failed', details: validation.error.errors }, 400);
  }

  const { nodeId } = validation.data;
  const result = await nodeService.disconnectNode(nodeId);

  if (!result.success) {
    logger.warn(`Failed to disconnect node ${nodeId}: ${result.error}`);
    return c.json({ error: result.error }, 404);
  }

  logger.info(`Node disconnected: ${nodeId}`);
  return c.json({ message: 'Node disconnected', nodeId });
});

// Get node actions history
actionsRouter.get('/history/:nodeId', async (c) => {
  const nodeId = c.req.param('nodeId');
  const history = await nodeService.getActionHistory(nodeId);

  return c.json({ nodeId, history });
});

export default actionsRouter;
