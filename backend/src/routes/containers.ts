import { Router } from 'express';
import { z } from 'zod';
import { containerService } from '../services/containerService';
import { logger } from '../utils/logger';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation schemas
const createContainerSchema = z.object({
  name: z.string().min(1).max(100),
  image: z.string().min(1),
  command: z.array(z.string()).optional(),
  entrypoint: z.array(z.string()).optional(),
  environment: z.record(z.string()).optional(),
  ports: z.array(z.object({
    container: z.number().int().min(1).max(65535),
    host: z.number().int().min(1).max(65535),
    protocol: z.enum(['tcp', 'udp']).optional(),
  })).optional(),
  volumes: z.array(z.object({
    container: z.string(),
    host: z.string(),
    mode: z.enum(['ro', 'rw']).optional(),
  })).optional(),
  cpuLimit: z.number().min(0.1).max(64).optional(),
  memoryLimit: z.string().regex(/^\d+[kmg]$/i).optional(),
  restart: z.enum(['no', 'always', 'on-failure', 'unless-stopped']).optional(),
  labels: z.record(z.string()).optional(),
  network: z.string().optional(),
  nodeId: z.string(),
});

const execCommandSchema = z.object({
  command: z.array(z.string()).min(1),
});

// List all containers
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { nodeId } = req.query;
    const containers = await containerService.listContainers(nodeId as string);
    
    res.json({
      success: true,
      data: containers,
      count: containers.length,
    });
  } catch (error: any) {
    logger.error('Error listing containers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list containers',
    });
  }
});

// Get container by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const container = await containerService.getContainer(id);
    
    if (!container) {
      return res.status(404).json({
        success: false,
        error: 'Container not found',
      });
    }
    
    res.json({
      success: true,
      data: container,
    });
  } catch (error: any) {
    logger.error('Error getting container:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get container',
    });
  }
});

// Create container
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createContainerSchema.parse(req.body);
    const container = await containerService.createContainer(data);
    
    res.status(201).json({
      success: true,
      data: container,
      message: 'Container created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating container:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create container',
    });
  }
});

// Start container
router.post('/:id/start', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await containerService.startContainer(id);
    
    res.json({
      success: true,
      message: 'Container started successfully',
    });
  } catch (error: any) {
    logger.error('Error starting container:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start container',
    });
  }
});

// Stop container
router.post('/:id/stop', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await containerService.stopContainer(id);
    
    res.json({
      success: true,
      message: 'Container stopped successfully',
    });
  } catch (error: any) {
    logger.error('Error stopping container:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop container',
    });
  }
});

// Restart container
router.post('/:id/restart', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await containerService.restartContainer(id);
    
    res.json({
      success: true,
      message: 'Container restarted successfully',
    });
  } catch (error: any) {
    logger.error('Error restarting container:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restart container',
    });
  }
});

// Remove container
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    await containerService.removeContainer(id, force === 'true');
    
    res.json({
      success: true,
      message: 'Container removed successfully',
    });
  } catch (error: any) {
    logger.error('Error removing container:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove container',
    });
  }
});

// Get container logs
router.get('/:id/logs', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { tail } = req.query;
    const logs = await containerService.getContainerLogs(id, tail ? parseInt(tail as string) : 100);
    
    res.json({
      success: true,
      data: logs,
    });
  } catch (error: any) {
    logger.error('Error getting container logs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get container logs',
    });
  }
});

// Get container stats
router.get('/:id/stats', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit } = req.query;
    const stats = await containerService.getContainerStats(id, limit ? parseInt(limit as string) : 60);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error('Error getting container stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get container stats',
    });
  }
});

// Execute command in container
router.post('/:id/exec', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data = execCommandSchema.parse(req.body);
    const result = await containerService.execCommand(id, data.command);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error executing command:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute command',
    });
  }
});

// List images
router.get('/images/list', optionalAuth, async (req, res) => {
  try {
    const images = await containerService.listImages();
    
    res.json({
      success: true,
      data: images,
    });
  } catch (error: any) {
    logger.error('Error listing images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list images',
    });
  }
});

// Pull image
router.post('/images/pull', authenticate, async (req, res) => {
  try {
    const { name, tag } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Image name is required',
      });
    }
    
    await containerService.pullImage(name, tag);
    
    res.json({
      success: true,
      message: `Image ${name}:${tag || 'latest'} pulled successfully`,
    });
  } catch (error: any) {
    logger.error('Error pulling image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pull image',
    });
  }
});

// Get container templates
router.get('/templates/list', optionalAuth, async (req, res) => {
  try {
    const templates = containerService.getTemplates();
    
    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    logger.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get templates',
    });
  }
});

export default router;
