import { Hono } from 'hono';
import { deviceTransformationService } from '../services/deviceTransformationService';
import { authMiddleware } from '../middleware/auth';
import { normalRateLimit } from '../middleware/rateLimit';
import { logger } from '../utils/logger';

const deviceRouter = new Hono();

// Apply middleware
deviceRouter.use('*', normalRateLimit);
deviceRouter.use('*', authMiddleware);

// Analyze device capabilities
deviceRouter.get('/:nodeId/capabilities', async (c) => {
  const nodeId = c.req.param('nodeId');
  
  try {
    const capabilities = await deviceTransformationService.analyzeDevice(nodeId);
    return c.json({ capabilities });
  } catch (error: any) {
    logger.error('Failed to analyze device:', error);
    return c.json({ error: error.message || 'Failed to analyze device' }, 500);
  }
});

// Get transformation profiles
deviceRouter.get('/transformation/profiles', async (c) => {
  const profiles = deviceTransformationService.getTransformationProfiles();
  return c.json({ profiles });
});

// Start device transformation
deviceRouter.post('/:nodeId/transform', async (c) => {
  const nodeId = c.req.param('nodeId');
  const body = await c.req.json();
  const { profileId } = body;

  if (!profileId) {
    return c.json({ error: 'Profile ID is required' }, 400);
  }

  try {
    const transformation = await deviceTransformationService.startTransformation(
      nodeId,
      profileId
    );
    
    logger.info(`Transformation started: ${nodeId} -> ${profileId}`);
    return c.json({ transformation }, 202);
  } catch (error: any) {
    logger.error('Failed to start transformation:', error);
    return c.json({ error: error.message || 'Failed to start transformation' }, 400);
  }
});

// Get transformation status
deviceRouter.get('/:nodeId/transformation/status', async (c) => {
  const nodeId = c.req.param('nodeId');
  
  const transformation = deviceTransformationService.getTransformationStatus(nodeId);
  
  if (!transformation) {
    return c.json({ error: 'No transformation found for this device' }, 404);
  }
  
  return c.json({ transformation });
});

export default deviceRouter;
