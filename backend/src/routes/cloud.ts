import { Router } from 'express';
import { z } from 'zod';
import { cloudProviderService } from '../services/cloudProviderService';
import { logger } from '../utils/logger';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation schemas
const addProviderSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['aws', 'gcp', 'azure', 'digitalocean', 'custom']),
  enabled: z.boolean().default(false),
  config: z.record(z.any()),
  capabilities: z.array(z.string()),
  regions: z.array(z.string()),
});

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.any()).optional(),
  capabilities: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
});

const createInstanceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string(),
  region: z.string(),
  tags: z.record(z.string()).optional(),
});

// Provider management
router.get('/providers', optionalAuth, async (req, res) => {
  try {
    const providers = await cloudProviderService.listProviders();
    
    res.json({
      success: true,
      data: providers,
      count: providers.length,
    });
  } catch (error: any) {
    logger.error('Error listing providers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list providers',
    });
  }
});

router.get('/providers/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await cloudProviderService.getProvider(id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found',
      });
    }
    
    res.json({
      success: true,
      data: provider,
    });
  } catch (error: any) {
    logger.error('Error getting provider:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get provider',
    });
  }
});

router.post('/providers', authenticate, async (req, res) => {
  try {
    const data = addProviderSchema.parse(req.body);
    const provider = await cloudProviderService.addProvider(data);
    
    res.status(201).json({
      success: true,
      data: provider,
      message: 'Provider added successfully',
    });
  } catch (error: any) {
    logger.error('Error adding provider:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add provider',
    });
  }
});

router.patch('/providers/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateProviderSchema.parse(req.body);
    const provider = await cloudProviderService.updateProvider(id, data);
    
    res.json({
      success: true,
      data: provider,
      message: 'Provider updated successfully',
    });
  } catch (error: any) {
    logger.error('Error updating provider:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update provider',
    });
  }
});

router.post('/providers/:id/test', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await cloudProviderService.testProviderConnection(id);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error testing provider connection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test provider connection',
    });
  }
});

router.get('/providers/:id/types', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const types = cloudProviderService.getInstanceTypes(id);
    
    res.json({
      success: true,
      data: types,
    });
  } catch (error: any) {
    logger.error('Error getting instance types:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get instance types',
    });
  }
});

// Instance management
router.get('/instances', optionalAuth, async (req, res) => {
  try {
    const { providerId } = req.query;
    const instances = await cloudProviderService.listInstances(providerId as string);
    
    res.json({
      success: true,
      data: instances,
      count: instances.length,
    });
  } catch (error: any) {
    logger.error('Error listing instances:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list instances',
    });
  }
});

router.get('/instances/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const instance = await cloudProviderService.getInstance(id);
    
    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Instance not found',
      });
    }
    
    res.json({
      success: true,
      data: instance,
    });
  } catch (error: any) {
    logger.error('Error getting instance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get instance',
    });
  }
});

router.post('/instances', authenticate, async (req, res) => {
  try {
    const { providerId } = req.body;
    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID is required',
      });
    }

    const data = createInstanceSchema.parse(req.body);
    const instance = await cloudProviderService.createInstance(providerId, data);
    
    res.status(201).json({
      success: true,
      data: instance,
      message: 'Instance created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating instance:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create instance',
    });
  }
});

router.post('/instances/:id/start', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await cloudProviderService.startInstance(id);
    
    res.json({
      success: true,
      message: 'Instance started successfully',
    });
  } catch (error: any) {
    logger.error('Error starting instance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start instance',
    });
  }
});

router.post('/instances/:id/stop', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await cloudProviderService.stopInstance(id);
    
    res.json({
      success: true,
      message: 'Instance stopped successfully',
    });
  } catch (error: any) {
    logger.error('Error stopping instance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to stop instance',
    });
  }
});

router.delete('/instances/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await cloudProviderService.terminateInstance(id);
    
    res.json({
      success: true,
      message: 'Instance terminated successfully',
    });
  } catch (error: any) {
    logger.error('Error terminating instance:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to terminate instance',
    });
  }
});

export default router;
