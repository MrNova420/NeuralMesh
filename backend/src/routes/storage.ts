import express from 'express';
import { storageManagementService } from '../services/storageManagementService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// ========== STORAGE NODE MANAGEMENT ==========

router.get('/nodes', async (req, res) => {
  try {
    const nodes = await storageManagementService.getStorageNodes();
    res.json(nodes);
  } catch (error: any) {
    logger.error('Error getting storage nodes:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/nodes', async (req, res) => {
  try {
    const node = await storageManagementService.registerStorageNode(req.body);
    res.json(node);
  } catch (error: any) {
    logger.error('Error registering storage node:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const node = await storageManagementService.getStorageNode(nodeId);
    
    if (!node) {
      return res.status(404).json({ error: 'Storage node not found' });
    }
    
    res.json(node);
  } catch (error: any) {
    logger.error('Error getting storage node:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const node = await storageManagementService.updateStorageNode(nodeId, req.body);
    res.json(node);
  } catch (error: any) {
    logger.error('Error updating storage node:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/nodes/:nodeId', async (req, res) => {
  try {
    const { nodeId } = req.params;
    await storageManagementService.removeStorageNode(nodeId);
    res.json({ success: true, message: 'Storage node removed' });
  } catch (error: any) {
    logger.error('Error removing storage node:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/nodes/:nodeId/health', async (req, res) => {
  try {
    const { nodeId } = req.params;
    const healthy = await storageManagementService.checkNodeHealth(nodeId);
    res.json({ healthy });
  } catch (error: any) {
    logger.error('Error checking node health:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== VOLUME MANAGEMENT ==========

router.get('/volumes', async (req, res) => {
  try {
    const { nodeId } = req.query;
    const volumes = await storageManagementService.getVolumes(nodeId as string);
    res.json(volumes);
  } catch (error: any) {
    logger.error('Error getting volumes:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/volumes', async (req, res) => {
  try {
    const volume = await storageManagementService.createVolume(req.body);
    res.json(volume);
  } catch (error: any) {
    logger.error('Error creating volume:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/volumes/:volumeId', async (req, res) => {
  try {
    const { volumeId } = req.params;
    const volume = await storageManagementService.getVolume(volumeId);
    
    if (!volume) {
      return res.status(404).json({ error: 'Volume not found' });
    }
    
    res.json(volume);
  } catch (error: any) {
    logger.error('Error getting volume:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/volumes/:volumeId/resize', async (req, res) => {
  try {
    const { volumeId } = req.params;
    const { size } = req.body;
    
    await storageManagementService.resizeVolume(volumeId, size);
    res.json({ success: true, message: 'Volume resized' });
  } catch (error: any) {
    logger.error('Error resizing volume:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/volumes/:volumeId', async (req, res) => {
  try {
    const { volumeId } = req.params;
    const { force } = req.query;
    
    await storageManagementService.deleteVolume(volumeId, force === 'true');
    res.json({ success: true, message: 'Volume deleted' });
  } catch (error: any) {
    logger.error('Error deleting volume:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== STORAGE POOL MANAGEMENT ==========

router.get('/pools', async (req, res) => {
  try {
    const pools = await storageManagementService.getStoragePools();
    res.json(pools);
  } catch (error: any) {
    logger.error('Error getting storage pools:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/pools', async (req, res) => {
  try {
    const pool = await storageManagementService.createStoragePool(req.body);
    res.json(pool);
  } catch (error: any) {
    logger.error('Error creating storage pool:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/pools/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const pool = await storageManagementService.getStoragePool(poolId);
    
    if (!pool) {
      return res.status(404).json({ error: 'Storage pool not found' });
    }
    
    res.json(pool);
  } catch (error: any) {
    logger.error('Error getting storage pool:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/pools/:poolId/volumes/:volumeId', async (req, res) => {
  try {
    const { poolId, volumeId } = req.params;
    await storageManagementService.addVolumeToPool(poolId, volumeId);
    res.json({ success: true, message: 'Volume added to pool' });
  } catch (error: any) {
    logger.error('Error adding volume to pool:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/pools/:poolId/volumes/:volumeId', async (req, res) => {
  try {
    const { poolId, volumeId } = req.params;
    await storageManagementService.removeVolumeFromPool(poolId, volumeId);
    res.json({ success: true, message: 'Volume removed from pool' });
  } catch (error: any) {
    logger.error('Error removing volume from pool:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== DATA OBJECT MANAGEMENT ==========

router.get('/objects', async (req, res) => {
  try {
    const { ownerId, type } = req.query;
    const objects = await storageManagementService.listObjects({
      ownerId: ownerId as string,
      type: type as string
    });
    res.json(objects);
  } catch (error: any) {
    logger.error('Error listing objects:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/objects', async (req, res) => {
  try {
    const object = await storageManagementService.storeObject(req.body);
    res.json(object);
  } catch (error: any) {
    logger.error('Error storing object:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/objects/:objectId', async (req, res) => {
  try {
    const { objectId } = req.params;
    const object = await storageManagementService.getObject(objectId);
    
    if (!object) {
      return res.status(404).json({ error: 'Object not found' });
    }
    
    res.json(object);
  } catch (error: any) {
    logger.error('Error getting object:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/objects/:objectId', async (req, res) => {
  try {
    const { objectId } = req.params;
    await storageManagementService.deleteObject(objectId);
    res.json({ success: true, message: 'Object deleted' });
  } catch (error: any) {
    logger.error('Error deleting object:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/objects/:objectId/replicate', async (req, res) => {
  try {
    const { objectId } = req.params;
    const { targetNodeId } = req.body;
    
    await storageManagementService.replicateObject(objectId, targetNodeId);
    res.json({ success: true, message: 'Replication started' });
  } catch (error: any) {
    logger.error('Error replicating object:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/objects/:objectId/sync', async (req, res) => {
  try {
    const { objectId } = req.params;
    await storageManagementService.syncReplicas(objectId);
    res.json({ success: true, message: 'Sync initiated' });
  } catch (error: any) {
    logger.error('Error syncing replicas:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== SNAPSHOT MANAGEMENT ==========

router.get('/snapshots', async (req, res) => {
  try {
    const { volumeId } = req.query;
    const snapshots = await storageManagementService.listSnapshots(volumeId as string);
    res.json(snapshots);
  } catch (error: any) {
    logger.error('Error listing snapshots:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/snapshots', async (req, res) => {
  try {
    const { volumeId, name } = req.body;
    const snapshot = await storageManagementService.createSnapshot(volumeId, name);
    res.json(snapshot);
  } catch (error: any) {
    logger.error('Error creating snapshot:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/snapshots/:snapshotId/restore', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    await storageManagementService.restoreSnapshot(snapshotId);
    res.json({ success: true, message: 'Snapshot restored' });
  } catch (error: any) {
    logger.error('Error restoring snapshot:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/snapshots/:snapshotId', async (req, res) => {
  try {
    const { snapshotId } = req.params;
    await storageManagementService.deleteSnapshot(snapshotId);
    res.json({ success: true, message: 'Snapshot deleted' });
  } catch (error: any) {
    logger.error('Error deleting snapshot:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== BACKUP MANAGEMENT ==========

router.get('/backups', async (req, res) => {
  try {
    const jobs = await storageManagementService.listBackupJobs();
    res.json(jobs);
  } catch (error: any) {
    logger.error('Error listing backup jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/backups', async (req, res) => {
  try {
    const job = await storageManagementService.createBackupJob(req.body);
    res.json(job);
  } catch (error: any) {
    logger.error('Error creating backup job:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/backups/:jobId/run', async (req, res) => {
  try {
    const { jobId } = req.params;
    await storageManagementService.runBackupJob(jobId);
    res.json({ success: true, message: 'Backup job started' });
  } catch (error: any) {
    logger.error('Error running backup job:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== METRICS & MONITORING ==========

router.get('/metrics', async (req, res) => {
  try {
    const { duration } = req.query;
    const metrics = await storageManagementService.getMetrics(
      duration ? parseInt(duration as string) : 3600
    );
    res.json(metrics);
  } catch (error: any) {
    logger.error('Error getting storage metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/metrics/current', async (req, res) => {
  try {
    const metrics = await storageManagementService.getCurrentMetrics();
    res.json(metrics);
  } catch (error: any) {
    logger.error('Error getting current metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== STORAGE POLICIES ==========

router.get('/policies', async (req, res) => {
  try {
    const policies = await storageManagementService.getPolicies();
    res.json(policies);
  } catch (error: any) {
    logger.error('Error getting storage policies:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/policies', async (req, res) => {
  try {
    const policy = await storageManagementService.createPolicy(req.body);
    res.json(policy);
  } catch (error: any) {
    logger.error('Error creating storage policy:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/policies/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = await storageManagementService.getPolicy(policyId);
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    res.json(policy);
  } catch (error: any) {
    logger.error('Error getting storage policy:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/policies/:policyId', async (req, res) => {
  try {
    const { policyId } = req.params;
    const policy = await storageManagementService.updatePolicy(policyId, req.body);
    res.json(policy);
  } catch (error: any) {
    logger.error('Error updating storage policy:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
