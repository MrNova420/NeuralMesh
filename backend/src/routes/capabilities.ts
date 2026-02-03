import { Router } from 'express';
import { z } from 'zod';
import { serverCapabilitiesService } from '../services/serverCapabilitiesService';
import { logger } from '../utils/logger';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation schemas
const createClusterSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['load-balanced', 'high-availability', 'compute', 'database']),
  servers: z.array(z.string()).min(1),
  loadBalancer: z.object({
    algorithm: z.enum(['round-robin', 'least-connections', 'ip-hash', 'weighted']),
    healthCheckInterval: z.number().min(10).max(300),
    healthCheckTimeout: z.number().min(1).max(60),
  }).optional(),
  autoScaling: z.object({
    enabled: z.boolean(),
    minServers: z.number().min(1).max(100),
    maxServers: z.number().min(1).max(100),
    targetCpuPercent: z.number().min(10).max(100),
    targetMemoryPercent: z.number().min(10).max(100),
    scaleUpCooldown: z.number().min(60).max(3600),
    scaleDownCooldown: z.number().min(60).max(3600),
  }).optional(),
});

const createBackupConfigSchema = z.object({
  serverId: z.string(),
  name: z.string().min(1).max(100),
  schedule: z.string(),
  retention: z.number().min(1).max(365),
  type: z.enum(['full', 'incremental', 'differential']),
  destination: z.string(),
  encryption: z.boolean().default(true),
  compression: z.boolean().default(true),
});

const deployTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  region: z.string().optional(),
});

// ===== Cluster Management =====

router.get('/clusters', optionalAuth, async (req, res) => {
  try {
    const clusters = await serverCapabilitiesService.listClusters();
    
    res.json({
      success: true,
      data: clusters,
      count: clusters.length,
    });
  } catch (error: any) {
    logger.error('Error listing clusters:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list clusters',
    });
  }
});

router.get('/clusters/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const cluster = await serverCapabilitiesService.getCluster(id);
    
    if (!cluster) {
      return res.status(404).json({
        success: false,
        error: 'Cluster not found',
      });
    }
    
    res.json({
      success: true,
      data: cluster,
    });
  } catch (error: any) {
    logger.error('Error getting cluster:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cluster',
    });
  }
});

router.post('/clusters', authenticate, async (req, res) => {
  try {
    const data = createClusterSchema.parse(req.body);
    const cluster = await serverCapabilitiesService.createCluster(data);
    
    res.status(201).json({
      success: true,
      data: cluster,
      message: 'Cluster created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating cluster:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create cluster',
    });
  }
});

router.patch('/clusters/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const cluster = await serverCapabilitiesService.updateCluster(id, req.body);
    
    res.json({
      success: true,
      data: cluster,
      message: 'Cluster updated successfully',
    });
  } catch (error: any) {
    logger.error('Error updating cluster:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update cluster',
    });
  }
});

router.delete('/clusters/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await serverCapabilitiesService.deleteCluster(id);
    
    res.json({
      success: true,
      message: 'Cluster deleted successfully',
    });
  } catch (error: any) {
    logger.error('Error deleting cluster:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete cluster',
    });
  }
});

// ===== Health Checks =====

router.get('/health', optionalAuth, async (req, res) => {
  try {
    const healthChecks = await serverCapabilitiesService.listHealthChecks();
    
    res.json({
      success: true,
      data: healthChecks,
      count: healthChecks.length,
    });
  } catch (error: any) {
    logger.error('Error listing health checks:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list health checks',
    });
  }
});

router.get('/health/:serverId', optionalAuth, async (req, res) => {
  try {
    const { serverId } = req.params;
    const healthCheck = await serverCapabilitiesService.getHealthCheck(serverId);
    
    if (!healthCheck) {
      return res.status(404).json({
        success: false,
        error: 'Health check not found',
      });
    }
    
    res.json({
      success: true,
      data: healthCheck,
    });
  } catch (error: any) {
    logger.error('Error getting health check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get health check',
    });
  }
});

router.post('/health/:serverId/check', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const healthCheck = await serverCapabilitiesService.performHealthCheck(serverId);
    
    res.json({
      success: true,
      data: healthCheck,
      message: 'Health check completed',
    });
  } catch (error: any) {
    logger.error('Error performing health check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform health check',
    });
  }
});

// ===== Backup Management =====

router.get('/backups/configs', optionalAuth, async (req, res) => {
  try {
    const { serverId } = req.query;
    const configs = await serverCapabilitiesService.listBackupConfigs(serverId as string);
    
    res.json({
      success: true,
      data: configs,
      count: configs.length,
    });
  } catch (error: any) {
    logger.error('Error listing backup configs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list backup configs',
    });
  }
});

router.post('/backups/configs', authenticate, async (req, res) => {
  try {
    const data = createBackupConfigSchema.parse(req.body);
    const config = await serverCapabilitiesService.createBackupConfig(data);
    
    res.status(201).json({
      success: true,
      data: config,
      message: 'Backup config created successfully',
    });
  } catch (error: any) {
    logger.error('Error creating backup config:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create backup config',
    });
  }
});

router.post('/backups/perform/:configId', authenticate, async (req, res) => {
  try {
    const { configId } = req.params;
    const backup = await serverCapabilitiesService.performBackup(configId);
    
    res.json({
      success: true,
      data: backup,
      message: 'Backup started successfully',
    });
  } catch (error: any) {
    logger.error('Error performing backup:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to perform backup',
    });
  }
});

router.get('/backups/:serverId', optionalAuth, async (req, res) => {
  try {
    const { serverId } = req.params;
    const backups = await serverCapabilitiesService.listBackups(serverId);
    
    res.json({
      success: true,
      data: backups,
      count: backups.length,
    });
  } catch (error: any) {
    logger.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list backups',
    });
  }
});

router.post('/backups/:backupId/restore', authenticate, async (req, res) => {
  try {
    const { backupId } = req.params;
    const result = await serverCapabilitiesService.restoreBackup(backupId);
    
    res.json({
      success: true,
      data: result,
      message: 'Backup restore initiated',
    });
  } catch (error: any) {
    logger.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restore backup',
    });
  }
});

// ===== Deployment Templates =====

router.get('/templates', optionalAuth, async (req, res) => {
  try {
    const templates = serverCapabilitiesService.getDeploymentTemplates();
    
    res.json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error: any) {
    logger.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get templates',
    });
  }
});

router.post('/templates/:templateId/deploy', authenticate, async (req, res) => {
  try {
    const { templateId } = req.params;
    const data = deployTemplateSchema.parse(req.body);
    const deployment = await serverCapabilitiesService.deployTemplate(templateId, data);
    
    res.status(201).json({
      success: true,
      data: deployment,
      message: 'Template deployment initiated',
    });
  } catch (error: any) {
    logger.error('Error deploying template:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deploy template',
    });
  }
});

export default router;
