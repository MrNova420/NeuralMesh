import { Hono } from 'hono';
import { serverService } from '../services/serverService';
import { authMiddleware, requireRole } from '../middleware/auth';
import { normalRateLimit } from '../middleware/rateLimit';
import { serverCreateSchema, serverUpdateSchema } from '../utils/validation';
import { logger } from '../utils/logger';

const serversRouter = new Hono();

// Apply middleware
serversRouter.use('*', normalRateLimit);
serversRouter.use('*', authMiddleware); // Require authentication for server management

// Get all servers
serversRouter.get('/', async (c) => {
  const auth = c.get('auth');
  const servers = await serverService.getAllServers(auth.userId);
  
  return c.json({
    servers,
    count: servers.length,
  });
});

// Get server by ID
serversRouter.get('/:id', async (c) => {
  const id = c.req.param('id');
  const auth = c.get('auth');
  
  const server = await serverService.getServerById(id, auth.userId);
  
  if (!server) {
    return c.json({ error: 'Server not found or access denied' }, 404);
  }
  
  return c.json({ server });
});

// Create new server
serversRouter.post('/', async (c) => {
  const body = await c.req.json();
  const validation = serverCreateSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Validation failed', details: validation.error.errors }, 400);
  }

  const auth = c.get('auth');
  
  try {
    const server = await serverService.createServer(validation.data, auth.userId);
    logger.info(`Server created: ${server.id} by user ${auth.userId}`);
    
    return c.json({ server }, 201);
  } catch (error: any) {
    logger.error('Server creation failed:', error);
    return c.json({ error: error.message || 'Failed to create server' }, 500);
  }
});

// Update server
serversRouter.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const validation = serverUpdateSchema.safeParse(body);

  if (!validation.success) {
    return c.json({ error: 'Validation failed', details: validation.error.errors }, 400);
  }

  const auth = c.get('auth');
  
  try {
    const server = await serverService.updateServer(id, validation.data, auth.userId);
    
    if (!server) {
      return c.json({ error: 'Server not found or access denied' }, 404);
    }
    
    logger.info(`Server updated: ${id} by user ${auth.userId}`);
    return c.json({ server });
  } catch (error: any) {
    logger.error('Server update failed:', error);
    return c.json({ error: error.message || 'Failed to update server' }, 500);
  }
});

// Delete server
serversRouter.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const auth = c.get('auth');
  
  try {
    const success = await serverService.deleteServer(id, auth.userId);
    
    if (!success) {
      return c.json({ error: 'Server not found or access denied' }, 404);
    }
    
    logger.info(`Server deleted: ${id} by user ${auth.userId}`);
    return c.json({ message: 'Server deleted successfully' });
  } catch (error: any) {
    logger.error('Server deletion failed:', error);
    return c.json({ error: error.message || 'Failed to delete server' }, 500);
  }
});

// Start server
serversRouter.post('/:id/start', async (c) => {
  const id = c.req.param('id');
  const auth = c.get('auth');
  
  try {
    const result = await serverService.startServer(id, auth.userId);
    
    if (!result.success) {
      return c.json({ error: result.error }, result.error === 'Server not found' ? 404 : 500);
    }
    
    logger.info(`Server started: ${id} by user ${auth.userId}`);
    return c.json({ message: 'Server start initiated', server: result.server });
  } catch (error: any) {
    logger.error('Server start failed:', error);
    return c.json({ error: error.message || 'Failed to start server' }, 500);
  }
});

// Stop server
serversRouter.post('/:id/stop', async (c) => {
  const id = c.req.param('id');
  const auth = c.get('auth');
  
  try {
    const result = await serverService.stopServer(id, auth.userId);
    
    if (!result.success) {
      return c.json({ error: result.error }, result.error === 'Server not found' ? 404 : 500);
    }
    
    logger.info(`Server stopped: ${id} by user ${auth.userId}`);
    return c.json({ message: 'Server stop initiated', server: result.server });
  } catch (error: any) {
    logger.error('Server stop failed:', error);
    return c.json({ error: error.message || 'Failed to stop server' }, 500);
  }
});

// Restart server
serversRouter.post('/:id/restart', async (c) => {
  const id = c.req.param('id');
  const auth = c.get('auth');
  
  try {
    const result = await serverService.restartServer(id, auth.userId);
    
    if (!result.success) {
      return c.json({ error: result.error }, result.error === 'Server not found' ? 404 : 500);
    }
    
    logger.info(`Server restarted: ${id} by user ${auth.userId}`);
    return c.json({ message: 'Server restart initiated', server: result.server });
  } catch (error: any) {
    logger.error('Server restart failed:', error);
    return c.json({ error: error.message || 'Failed to restart server' }, 500);
  }
});

// Get server templates
serversRouter.get('/templates/list', async (c) => {
  const templates = serverService.getServerTemplates();
  
  return c.json({ templates });
});

export default serversRouter;
