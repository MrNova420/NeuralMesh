import { logger } from '../utils/logger.js';

interface StorageNode {
  id: string;
  name: string;
  type: 'local' | 'network' | 'cloud' | 'distributed';
  capacity: number; // bytes
  used: number; // bytes
  available: number; // bytes
  path: string;
  healthy: boolean;
  lastCheck: Date;
  replicationFactor: number;
  encryptionEnabled: boolean;
}

interface StorageVolume {
  id: string;
  name: string;
  size: number;
  used: number;
  filesystem: string;
  mountPoint: string;
  nodeId: string;
  redundancy: 'none' | 'mirror' | 'raid5' | 'raid10' | 'distributed';
  compressed: boolean;
  encrypted: boolean;
  autoExpand: boolean;
  quotaEnabled: boolean;
  quotaLimit?: number;
}

interface StoragePool {
  id: string;
  name: string;
  type: 'local' | 'distributed' | 'tiered';
  totalCapacity: number;
  totalUsed: number;
  volumes: string[]; // volume IDs
  nodes: string[]; // node IDs
  replicationFactor: number;
  autoBalance: boolean;
  compressionEnabled: boolean;
  deduplicationEnabled: boolean;
  encryptionEnabled: boolean;
}

interface DataObject {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  checksum: string;
  replicas: ReplicaInfo[];
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  ownerId: string;
  permissions: string;
  metadata: Record<string, any>;
}

interface ReplicaInfo {
  nodeId: string;
  volumeId: string;
  path: string;
  status: 'synced' | 'syncing' | 'outdated' | 'error';
  lastSync: Date;
}

interface StoragePolicy {
  id: string;
  name: string;
  description: string;
  rules: {
    minReplicas: number;
    maxReplicas: number;
    preferredNodes?: string[];
    autoReplication: boolean;
    autoCompression: boolean;
    autoEncryption: boolean;
    retentionDays?: number;
    autoTiering: boolean;
    tieringRules?: TieringRule[];
  };
}

interface TieringRule {
  condition: 'age' | 'access_frequency' | 'size';
  threshold: number;
  targetTier: 'hot' | 'warm' | 'cold' | 'archive';
}

interface BackupJob {
  id: string;
  name: string;
  sourceVolumeId: string;
  targetVolumeId: string;
  schedule: string; // cron expression
  type: 'full' | 'incremental' | 'differential';
  compressionLevel: number;
  encryptionEnabled: boolean;
  retentionCount: number;
  lastRun?: Date;
  nextRun: Date;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

interface SnapshotInfo {
  id: string;
  volumeId: string;
  name: string;
  size: number;
  createdAt: Date;
  type: 'manual' | 'scheduled' | 'automatic';
  retainUntil?: Date;
}

interface StorageMetrics {
  timestamp: Date;
  totalCapacity: number;
  totalUsed: number;
  totalAvailable: number;
  usagePercent: number;
  iops: { read: number; write: number };
  throughput: { read: number; write: number }; // bytes/sec
  latency: { read: number; write: number }; // milliseconds
  nodeCount: number;
  volumeCount: number;
  objectCount: number;
  healthScore: number;
}

export class StorageManagementService {
  private storageNodes: Map<string, StorageNode> = new Map();
  private volumes: Map<string, StorageVolume> = new Map();
  private storagePools: Map<string, StoragePool> = new Map();
  private dataObjects: Map<string, DataObject> = new Map();
  private policies: Map<string, StoragePolicy> = new Map();
  private backupJobs: Map<string, BackupJob> = new Map();
  private snapshots: Map<string, SnapshotInfo> = new Map();
  private metricsHistory: StorageMetrics[] = [];

  constructor() {
    logger.info('StorageManagementService initialized');
    this.initializeDefaultPolicies();
    this.startAutomationTasks();
  }

  private initializeDefaultPolicies() {
    const defaultPolicy: StoragePolicy = {
      id: 'default',
      name: 'Default Storage Policy',
      description: 'Standard replication and protection',
      rules: {
        minReplicas: 2,
        maxReplicas: 3,
        autoReplication: true,
        autoCompression: true,
        autoEncryption: false,
        retentionDays: 30,
        autoTiering: true,
        tieringRules: [
          { condition: 'age', threshold: 30, targetTier: 'warm' },
          { condition: 'age', threshold: 90, targetTier: 'cold' },
          { condition: 'access_frequency', threshold: 0.1, targetTier: 'archive' }
        ]
      }
    };
    this.policies.set(defaultPolicy.id, defaultPolicy);
  }

  private startAutomationTasks() {
    // Run automation tasks periodically
    setInterval(() => this.runAutomationCycle(), 60000); // Every minute
  }

  private async runAutomationCycle() {
    logger.info('Running storage automation cycle');
    
    try {
      await this.autoBalance();
      await this.autoReplicate();
      await this.autoTier();
      await this.autoCleanup();
      await this.collectMetrics();
    } catch (error) {
      logger.error('Error in automation cycle:', error);
    }
  }

  // ========== STORAGE NODE MANAGEMENT ==========

  async registerStorageNode(node: Omit<StorageNode, 'id' | 'lastCheck'>): Promise<StorageNode> {
    const id = `node-${Date.now()}`;
    const storageNode: StorageNode = {
      id,
      ...node,
      lastCheck: new Date()
    };
    
    this.storageNodes.set(id, storageNode);
    logger.info(`Storage node registered: ${id} (${node.name})`);
    
    return storageNode;
  }

  async getStorageNodes(): Promise<StorageNode[]> {
    return Array.from(this.storageNodes.values());
  }

  async getStorageNode(nodeId: string): Promise<StorageNode | undefined> {
    return this.storageNodes.get(nodeId);
  }

  async updateStorageNode(nodeId: string, updates: Partial<StorageNode>): Promise<StorageNode> {
    const node = this.storageNodes.get(nodeId);
    if (!node) throw new Error(`Storage node ${nodeId} not found`);
    
    const updated = { ...node, ...updates, lastCheck: new Date() };
    this.storageNodes.set(nodeId, updated);
    
    return updated;
  }

  async removeStorageNode(nodeId: string): Promise<void> {
    const node = this.storageNodes.get(nodeId);
    if (!node) throw new Error(`Storage node ${nodeId} not found`);
    
    // Check if node has data
    const volumes = Array.from(this.volumes.values()).filter(v => v.nodeId === nodeId);
    if (volumes.length > 0) {
      throw new Error(`Cannot remove node ${nodeId}: has ${volumes.length} volumes`);
    }
    
    this.storageNodes.delete(nodeId);
    logger.info(`Storage node removed: ${nodeId}`);
  }

  async checkNodeHealth(nodeId: string): Promise<boolean> {
    const node = this.storageNodes.get(nodeId);
    if (!node) return false;
    
    // Simulate health check
    const healthy = node.available > 0 && node.capacity > 0;
    
    node.healthy = healthy;
    node.lastCheck = new Date();
    this.storageNodes.set(nodeId, node);
    
    return healthy;
  }

  // ========== VOLUME MANAGEMENT ==========

  async createVolume(volume: Omit<StorageVolume, 'id'>): Promise<StorageVolume> {
    const id = `vol-${Date.now()}`;
    const newVolume: StorageVolume = { id, ...volume };
    
    this.volumes.set(id, newVolume);
    logger.info(`Volume created: ${id} (${volume.name})`);
    
    return newVolume;
  }

  async getVolumes(nodeId?: string): Promise<StorageVolume[]> {
    const volumes = Array.from(this.volumes.values());
    if (nodeId) {
      return volumes.filter(v => v.nodeId === nodeId);
    }
    return volumes;
  }

  async getVolume(volumeId: string): Promise<StorageVolume | undefined> {
    return this.volumes.get(volumeId);
  }

  async resizeVolume(volumeId: string, newSize: number): Promise<void> {
    const volume = this.volumes.get(volumeId);
    if (!volume) throw new Error(`Volume ${volumeId} not found`);
    
    if (newSize < volume.used) {
      throw new Error(`Cannot resize volume: new size ${newSize} is less than used space ${volume.used}`);
    }
    
    volume.size = newSize;
    this.volumes.set(volumeId, volume);
    logger.info(`Volume ${volumeId} resized to ${newSize} bytes`);
  }

  async deleteVolume(volumeId: string, force: boolean = false): Promise<void> {
    const volume = this.volumes.get(volumeId);
    if (!volume) throw new Error(`Volume ${volumeId} not found`);
    
    if (volume.used > 0 && !force) {
      throw new Error(`Cannot delete volume ${volumeId}: not empty (use force=true to override)`);
    }
    
    this.volumes.delete(volumeId);
    logger.info(`Volume deleted: ${volumeId}`);
  }

  // ========== STORAGE POOL MANAGEMENT ==========

  async createStoragePool(pool: Omit<StoragePool, 'id'>): Promise<StoragePool> {
    const id = `pool-${Date.now()}`;
    const newPool: StoragePool = { id, ...pool };
    
    this.storagePools.set(id, newPool);
    logger.info(`Storage pool created: ${id} (${pool.name})`);
    
    return newPool;
  }

  async getStoragePools(): Promise<StoragePool[]> {
    return Array.from(this.storagePools.values());
  }

  async getStoragePool(poolId: string): Promise<StoragePool | undefined> {
    return this.storagePools.get(poolId);
  }

  async addVolumeToPool(poolId: string, volumeId: string): Promise<void> {
    const pool = this.storagePools.get(poolId);
    if (!pool) throw new Error(`Storage pool ${poolId} not found`);
    
    const volume = this.volumes.get(volumeId);
    if (!volume) throw new Error(`Volume ${volumeId} not found`);
    
    if (!pool.volumes.includes(volumeId)) {
      pool.volumes.push(volumeId);
      pool.totalCapacity += volume.size;
      pool.totalUsed += volume.used;
      this.storagePools.set(poolId, pool);
      logger.info(`Volume ${volumeId} added to pool ${poolId}`);
    }
  }

  async removeVolumeFromPool(poolId: string, volumeId: string): Promise<void> {
    const pool = this.storagePools.get(poolId);
    if (!pool) throw new Error(`Storage pool ${poolId} not found`);
    
    const volume = this.volumes.get(volumeId);
    if (!volume) throw new Error(`Volume ${volumeId} not found`);
    
    pool.volumes = pool.volumes.filter(id => id !== volumeId);
    pool.totalCapacity -= volume.size;
    pool.totalUsed -= volume.used;
    this.storagePools.set(poolId, pool);
    logger.info(`Volume ${volumeId} removed from pool ${poolId}`);
  }

  // ========== DATA OBJECT MANAGEMENT ==========

  async storeObject(object: Omit<DataObject, 'id' | 'replicas' | 'createdAt' | 'modifiedAt' | 'accessedAt'>): Promise<DataObject> {
    const id = `obj-${Date.now()}`;
    const now = new Date();
    
    const dataObject: DataObject = {
      id,
      ...object,
      replicas: [],
      createdAt: now,
      modifiedAt: now,
      accessedAt: now
    };
    
    // Apply storage policy
    await this.applyStoragePolicy(dataObject);
    
    this.dataObjects.set(id, dataObject);
    logger.info(`Object stored: ${id} (${object.name})`);
    
    return dataObject;
  }

  async getObject(objectId: string): Promise<DataObject | undefined> {
    const object = this.dataObjects.get(objectId);
    if (object) {
      object.accessedAt = new Date();
      this.dataObjects.set(objectId, object);
    }
    return object;
  }

  async listObjects(filter?: { ownerId?: string; type?: string }): Promise<DataObject[]> {
    let objects = Array.from(this.dataObjects.values());
    
    if (filter?.ownerId) {
      objects = objects.filter(o => o.ownerId === filter.ownerId);
    }
    if (filter?.type) {
      objects = objects.filter(o => o.type === filter.type);
    }
    
    return objects;
  }

  async deleteObject(objectId: string): Promise<void> {
    const object = this.dataObjects.get(objectId);
    if (!object) throw new Error(`Object ${objectId} not found`);
    
    // Delete all replicas
    for (const replica of object.replicas) {
      logger.info(`Deleting replica from node ${replica.nodeId}`);
      // In real implementation: delete actual file
    }
    
    this.dataObjects.delete(objectId);
    logger.info(`Object deleted: ${objectId}`);
  }

  // ========== REPLICATION MANAGEMENT ==========

  private async applyStoragePolicy(object: DataObject): Promise<void> {
    const policy = this.policies.get('default');
    if (!policy) return;
    
    const minReplicas = policy.rules.minReplicas;
    const nodes = Array.from(this.storageNodes.values()).filter(n => n.healthy);
    
    // Create replicas
    for (let i = 0; i < Math.min(minReplicas, nodes.length); i++) {
      const node = nodes[i];
      const volumes = Array.from(this.volumes.values()).filter(v => v.nodeId === node.id);
      
      if (volumes.length > 0) {
        const volume = volumes[0];
        const replica: ReplicaInfo = {
          nodeId: node.id,
          volumeId: volume.id,
          path: `${volume.mountPoint}/${object.path}`,
          status: 'synced',
          lastSync: new Date()
        };
        object.replicas.push(replica);
      }
    }
  }

  async replicateObject(objectId: string, targetNodeId: string): Promise<void> {
    const object = this.dataObjects.get(objectId);
    if (!object) throw new Error(`Object ${objectId} not found`);
    
    const node = this.storageNodes.get(targetNodeId);
    if (!node) throw new Error(`Node ${targetNodeId} not found`);
    
    // Check if already replicated to this node
    if (object.replicas.some(r => r.nodeId === targetNodeId)) {
      logger.info(`Object ${objectId} already replicated to node ${targetNodeId}`);
      return;
    }
    
    const volumes = Array.from(this.volumes.values()).filter(v => v.nodeId === targetNodeId);
    if (volumes.length === 0) {
      throw new Error(`No volumes available on node ${targetNodeId}`);
    }
    
    const volume = volumes[0];
    const replica: ReplicaInfo = {
      nodeId: targetNodeId,
      volumeId: volume.id,
      path: `${volume.mountPoint}/${object.path}`,
      status: 'syncing',
      lastSync: new Date()
    };
    
    object.replicas.push(replica);
    this.dataObjects.set(objectId, object);
    
    // Simulate replication
    setTimeout(() => {
      replica.status = 'synced';
      this.dataObjects.set(objectId, object);
      logger.info(`Object ${objectId} replicated to node ${targetNodeId}`);
    }, 1000);
  }

  async syncReplicas(objectId: string): Promise<void> {
    const object = this.dataObjects.get(objectId);
    if (!object) throw new Error(`Object ${objectId} not found`);
    
    for (const replica of object.replicas) {
      if (replica.status !== 'synced') {
        replica.status = 'syncing';
        // Simulate sync
        setTimeout(() => {
          replica.status = 'synced';
          replica.lastSync = new Date();
        }, 500);
      }
    }
    
    logger.info(`Syncing replicas for object ${objectId}`);
  }

  // ========== BACKUP & SNAPSHOT MANAGEMENT ==========

  async createSnapshot(volumeId: string, name: string): Promise<SnapshotInfo> {
    const volume = this.volumes.get(volumeId);
    if (!volume) throw new Error(`Volume ${volumeId} not found`);
    
    const snapshot: SnapshotInfo = {
      id: `snap-${Date.now()}`,
      volumeId,
      name,
      size: volume.used,
      createdAt: new Date(),
      type: 'manual'
    };
    
    this.snapshots.set(snapshot.id, snapshot);
    logger.info(`Snapshot created: ${snapshot.id} for volume ${volumeId}`);
    
    return snapshot;
  }

  async listSnapshots(volumeId?: string): Promise<SnapshotInfo[]> {
    const snapshots = Array.from(this.snapshots.values());
    if (volumeId) {
      return snapshots.filter(s => s.volumeId === volumeId);
    }
    return snapshots;
  }

  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found`);
    
    logger.info(`Restoring snapshot ${snapshotId} to volume ${snapshot.volumeId}`);
    
    // In real implementation: restore actual data
    // This would involve stopping services, replacing data, and restarting
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found`);
    
    this.snapshots.delete(snapshotId);
    logger.info(`Snapshot deleted: ${snapshotId}`);
  }

  async createBackupJob(job: Omit<BackupJob, 'id' | 'nextRun' | 'status'>): Promise<BackupJob> {
    const id = `backup-${Date.now()}`;
    const backupJob: BackupJob = {
      id,
      ...job,
      nextRun: new Date(), // Calculate from cron
      status: 'idle'
    };
    
    this.backupJobs.set(id, backupJob);
    logger.info(`Backup job created: ${id} (${job.name})`);
    
    return backupJob;
  }

  async listBackupJobs(): Promise<BackupJob[]> {
    return Array.from(this.backupJobs.values());
  }

  async runBackupJob(jobId: string): Promise<void> {
    const job = this.backupJobs.get(jobId);
    if (!job) throw new Error(`Backup job ${jobId} not found`);
    
    job.status = 'running';
    job.lastRun = new Date();
    this.backupJobs.set(jobId, job);
    
    logger.info(`Running backup job: ${jobId}`);
    
    // Simulate backup
    setTimeout(() => {
      job.status = 'completed';
      this.backupJobs.set(jobId, job);
      logger.info(`Backup job completed: ${jobId}`);
    }, 2000);
  }

  // ========== AUTOMATION ==========

  private async autoBalance(): Promise<void> {
    // Balance data across nodes
    const pools = Array.from(this.storagePools.values()).filter(p => p.autoBalance);
    
    for (const pool of pools) {
      // Calculate ideal distribution
      const totalCapacity = pool.totalCapacity;
      const totalUsed = pool.totalUsed;
      const avgUsage = totalUsed / pool.nodes.length;
      
      // Check each node for imbalance
      for (const nodeId of pool.nodes) {
        const volumes = Array.from(this.volumes.values()).filter(v => v.nodeId === nodeId);
        const nodeUsed = volumes.reduce((sum, v) => sum + v.used, 0);
        
        if (Math.abs(nodeUsed - avgUsage) / avgUsage > 0.2) {
          logger.info(`Node ${nodeId} needs rebalancing: ${nodeUsed} vs ${avgUsage} average`);
          // In real implementation: trigger data migration
        }
      }
    }
  }

  private async autoReplicate(): Promise<void> {
    // Ensure minimum replica count
    for (const [objectId, object] of this.dataObjects.entries()) {
      const policy = this.policies.get('default');
      if (!policy) continue;
      
      const minReplicas = policy.rules.minReplicas;
      const healthyReplicas = object.replicas.filter(r => r.status === 'synced').length;
      
      if (healthyReplicas < minReplicas) {
        logger.info(`Object ${objectId} has ${healthyReplicas} replicas, needs ${minReplicas}`);
        
        // Find available nodes
        const existingNodes = new Set(object.replicas.map(r => r.nodeId));
        const availableNodes = Array.from(this.storageNodes.values())
          .filter(n => n.healthy && !existingNodes.has(n.id));
        
        if (availableNodes.length > 0) {
          await this.replicateObject(objectId, availableNodes[0].id);
        }
      }
    }
  }

  private async autoTier(): Promise<void> {
    // Move data to appropriate storage tiers based on access patterns
    const policy = this.policies.get('default');
    if (!policy || !policy.rules.autoTiering) return;
    
    for (const [objectId, object] of this.dataObjects.entries()) {
      const ageInDays = (Date.now() - object.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceAccess = (Date.now() - object.accessedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      for (const rule of policy.rules.tieringRules || []) {
        let shouldTier = false;
        
        if (rule.condition === 'age' && ageInDays > rule.threshold) {
          shouldTier = true;
        } else if (rule.condition === 'access_frequency' && daysSinceAccess > rule.threshold) {
          shouldTier = true;
        }
        
        if (shouldTier) {
          logger.info(`Object ${objectId} should be tiered to ${rule.targetTier}`);
          // In real implementation: move to appropriate storage tier
        }
      }
    }
  }

  private async autoCleanup(): Promise<void> {
    // Clean up old snapshots based on retention
    const now = Date.now();
    
    for (const [snapshotId, snapshot] of this.snapshots.entries()) {
      if (snapshot.retainUntil && snapshot.retainUntil.getTime() < now) {
        logger.info(`Deleting expired snapshot: ${snapshotId}`);
        await this.deleteSnapshot(snapshotId);
      }
    }
    
    // Clean up orphaned replicas
    for (const [objectId, object] of this.dataObjects.entries()) {
      const validReplicas = object.replicas.filter(r => this.storageNodes.has(r.nodeId));
      if (validReplicas.length < object.replicas.length) {
        object.replicas = validReplicas;
        this.dataObjects.set(objectId, object);
        logger.info(`Cleaned up orphaned replicas for object ${objectId}`);
      }
    }
  }

  // ========== METRICS & MONITORING ==========

  private async collectMetrics(): Promise<void> {
    const nodes = Array.from(this.storageNodes.values());
    const totalCapacity = nodes.reduce((sum, n) => sum + n.capacity, 0);
    const totalUsed = nodes.reduce((sum, n) => sum + n.used, 0);
    const totalAvailable = nodes.reduce((sum, n) => sum + n.available, 0);
    
    const metrics: StorageMetrics = {
      timestamp: new Date(),
      totalCapacity,
      totalUsed,
      totalAvailable,
      usagePercent: (totalUsed / totalCapacity) * 100,
      iops: {
        read: Math.floor(Math.random() * 10000),
        write: Math.floor(Math.random() * 5000)
      },
      throughput: {
        read: Math.floor(Math.random() * 1000000000), // bytes/sec
        write: Math.floor(Math.random() * 500000000)
      },
      latency: {
        read: Math.random() * 10,
        write: Math.random() * 20
      },
      nodeCount: nodes.length,
      volumeCount: this.volumes.size,
      objectCount: this.dataObjects.size,
      healthScore: nodes.filter(n => n.healthy).length / nodes.length * 100
    };
    
    this.metricsHistory.push(metrics);
    
    // Keep only last 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp.getTime() > cutoff);
  }

  async getMetrics(duration: number = 3600): Promise<StorageMetrics[]> {
    const cutoff = Date.now() - duration * 1000;
    return this.metricsHistory.filter(m => m.timestamp.getTime() > cutoff);
  }

  async getCurrentMetrics(): Promise<StorageMetrics> {
    await this.collectMetrics();
    return this.metricsHistory[this.metricsHistory.length - 1];
  }

  // ========== STORAGE POLICIES ==========

  async createPolicy(policy: Omit<StoragePolicy, 'id'>): Promise<StoragePolicy> {
    const id = `policy-${Date.now()}`;
    const newPolicy: StoragePolicy = { id, ...policy };
    
    this.policies.set(id, newPolicy);
    logger.info(`Storage policy created: ${id} (${policy.name})`);
    
    return newPolicy;
  }

  async getPolicies(): Promise<StoragePolicy[]> {
    return Array.from(this.policies.values());
  }

  async getPolicy(policyId: string): Promise<StoragePolicy | undefined> {
    return this.policies.get(policyId);
  }

  async updatePolicy(policyId: string, updates: Partial<StoragePolicy>): Promise<StoragePolicy> {
    const policy = this.policies.get(policyId);
    if (!policy) throw new Error(`Policy ${policyId} not found`);
    
    const updated = { ...policy, ...updates };
    this.policies.set(policyId, updated);
    
    return updated;
  }
}

export const storageManagementService = new StorageManagementService();
