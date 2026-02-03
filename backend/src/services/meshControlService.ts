import { logger } from '../utils/logger';
import { nodeService } from './nodeService';

export interface MeshTopology {
  nodes: MeshNode[];
  connections: MeshConnection[];
  clusters: MeshCluster[];
  stats: {
    totalNodes: number;
    totalClusters: number;
    totalConnections: number;
    avgLatency: number;
    totalBandwidth: number;
  };
}

export interface MeshNode {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
  role: 'master' | 'worker' | 'edge' | 'gateway';
  clusterId?: string;
  position: { x: number; y: number; z: number };
}

export interface MeshConnection {
  id: string;
  source: string;
  target: string;
  latency: number; // ms
  bandwidth: number; // Mbps
  reliability: number; // 0-100
  protocol: 'tcp' | 'udp' | 'websocket' | 'grpc';
}

export interface MeshCluster {
  id: string;
  name: string;
  nodes: string[];
  role: 'compute' | 'storage' | 'web' | 'database' | 'mixed';
  resources: {
    totalCpu: number;
    totalMemory: number;
    totalStorage: number;
    utilization: number;
  };
}

export interface WorkloadDistribution {
  workloadId: string;
  type: 'compute' | 'storage' | 'web' | 'database';
  resources: {
    cpu: number;
    memory: number;
    storage?: number;
  };
  assignments: Array<{
    nodeId: string;
    portion: number; // percentage
    priority: number;
  }>;
  status: 'pending' | 'distributing' | 'running' | 'completed' | 'failed';
}

class MeshControlService {
  private topology: MeshTopology | null = null;
  private workloads: Map<string, WorkloadDistribution> = new Map();

  // Get mesh topology
  async getMeshTopology(): Promise<MeshTopology> {
    const nodes = await nodeService.getAllNodes();
    
    // Convert nodes to mesh nodes
    const meshNodes: MeshNode[] = nodes.map((node, index) => ({
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      capabilities: {
        cpu: node.specs.cpu.cores,
        memory: node.specs.memory.total / (1024 * 1024 * 1024), // GB
        storage: node.specs.storage.total / (1024 * 1024 * 1024), // GB
        bandwidth: 1000, // Mbps
      },
      role: this.assignRole(node.type),
      position: this.calculatePosition(index, nodes.length),
    }));

    // Generate connections based on node proximity and capabilities
    const connections: MeshConnection[] = [];
    for (let i = 0; i < meshNodes.length; i++) {
      for (let j = i + 1; j < meshNodes.length; j++) {
        const source = meshNodes[i];
        const target = meshNodes[j];
        
        // Create connections between nodes
        if (this.shouldConnect(source, target)) {
          connections.push({
            id: `${source.id}-${target.id}`,
            source: source.id,
            target: target.id,
            latency: this.calculateLatency(source, target),
            bandwidth: Math.min(source.capabilities.bandwidth, target.capabilities.bandwidth),
            reliability: 95 + Math.random() * 5,
            protocol: this.selectProtocol(source, target),
          });
        }
      }
    }

    // Create clusters
    const clusters = this.createClusters(meshNodes);

    const topology: MeshTopology = {
      nodes: meshNodes,
      connections,
      clusters,
      stats: {
        totalNodes: meshNodes.length,
        totalClusters: clusters.length,
        totalConnections: connections.length,
        avgLatency: connections.length > 0
          ? connections.reduce((sum, c) => sum + c.latency, 0) / connections.length
          : 0,
        totalBandwidth: meshNodes.reduce((sum, n) => sum + n.capabilities.bandwidth, 0),
      },
    };

    this.topology = topology;
    return topology;
  }

  // Distribute workload across mesh
  async distributeWorkload(
    workloadType: 'compute' | 'storage' | 'web' | 'database',
    resources: { cpu: number; memory: number; storage?: number }
  ): Promise<WorkloadDistribution> {
    const topology = await this.getMeshTopology();
    
    // Find suitable nodes
    const suitableNodes = topology.nodes.filter((node) => {
      return (
        node.status === 'healthy' &&
        node.capabilities.cpu >= resources.cpu &&
        node.capabilities.memory >= resources.memory &&
        (resources.storage ? node.capabilities.storage >= resources.storage : true)
      );
    });

    if (suitableNodes.length === 0) {
      throw new Error('No suitable nodes available for workload');
    }

    // Distribute across nodes based on capabilities
    const assignments = this.calculateOptimalDistribution(suitableNodes, resources);

    const workload: WorkloadDistribution = {
      workloadId: `wl-${Date.now()}`,
      type: workloadType,
      resources,
      assignments,
      status: 'pending',
    };

    this.workloads.set(workload.workloadId, workload);
    
    // Simulate workload distribution
    setTimeout(() => this.executeWorkload(workload.workloadId), 2000);

    return workload;
  }

  // Get workload status
  getWorkloadStatus(workloadId: string): WorkloadDistribution | null {
    return this.workloads.get(workloadId) || null;
  }

  // Get all workloads
  getAllWorkloads(): WorkloadDistribution[] {
    return Array.from(this.workloads.values());
  }

  // Helper methods
  private assignRole(nodeType: string): 'master' | 'worker' | 'edge' | 'gateway' {
    switch (nodeType) {
      case 'alpha':
        return 'master';
      case 'beta':
        return 'worker';
      case 'gamma':
        return 'edge';
      case 'delta':
        return 'gateway';
      default:
        return 'worker';
    }
  }

  private calculatePosition(index: number, total: number): { x: number; y: number; z: number } {
    const angle = (index / total) * 2 * Math.PI;
    const radius = 100;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      z: Math.random() * 50 - 25,
    };
  }

  private shouldConnect(source: MeshNode, target: MeshNode): boolean {
    // Connect master to all workers
    if (source.role === 'master' || target.role === 'master') return true;
    
    // Connect nodes in same cluster
    if (source.clusterId && source.clusterId === target.clusterId) return true;
    
    // Random connections for resilience
    return Math.random() > 0.7;
  }

  private calculateLatency(source: MeshNode, target: MeshNode): number {
    const distance = Math.sqrt(
      Math.pow(source.position.x - target.position.x, 2) +
      Math.pow(source.position.y - target.position.y, 2) +
      Math.pow(source.position.z - target.position.z, 2)
    );
    
    // Base latency + distance factor
    return 1 + (distance / 100) * 10;
  }

  private selectProtocol(source: MeshNode, target: MeshNode): 'tcp' | 'udp' | 'websocket' | 'grpc' {
    if (source.role === 'edge' || target.role === 'edge') return 'websocket';
    if (source.role === 'master' || target.role === 'master') return 'grpc';
    return 'tcp';
  }

  private createClusters(nodes: MeshNode[]): MeshCluster[] {
    const clusters: MeshCluster[] = [];
    
    // Group by role
    const roleGroups = nodes.reduce((acc, node) => {
      if (!acc[node.role]) acc[node.role] = [];
      acc[node.role].push(node);
      return acc;
    }, {} as Record<string, MeshNode[]>);

    Object.entries(roleGroups).forEach(([role, groupNodes], index) => {
      const cluster: MeshCluster = {
        id: `cluster-${index}`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} Cluster`,
        nodes: groupNodes.map((n) => n.id),
        role: this.mapRoleToClusterRole(role),
        resources: {
          totalCpu: groupNodes.reduce((sum, n) => sum + n.capabilities.cpu, 0),
          totalMemory: groupNodes.reduce((sum, n) => sum + n.capabilities.memory, 0),
          totalStorage: groupNodes.reduce((sum, n) => sum + n.capabilities.storage, 0),
          utilization: 40 + Math.random() * 30,
        },
      };

      // Update node cluster IDs
      groupNodes.forEach((node) => {
        node.clusterId = cluster.id;
      });

      clusters.push(cluster);
    });

    return clusters;
  }

  private mapRoleToClusterRole(role: string): 'compute' | 'storage' | 'web' | 'database' | 'mixed' {
    switch (role) {
      case 'master':
        return 'compute';
      case 'worker':
        return 'mixed';
      case 'edge':
        return 'web';
      case 'gateway':
        return 'storage';
      default:
        return 'mixed';
    }
  }

  private calculateOptimalDistribution(
    nodes: MeshNode[],
    resources: { cpu: number; memory: number; storage?: number }
  ): Array<{ nodeId: string; portion: number; priority: number }> {
    // Calculate capacity scores
    const scores = nodes.map((node) => ({
      nodeId: node.id,
      score: node.capabilities.cpu * 0.4 + node.capabilities.memory * 0.4 + node.capabilities.storage * 0.2,
    }));

    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

    // Distribute proportionally
    return scores.map((s, index) => ({
      nodeId: s.nodeId,
      portion: (s.score / totalScore) * 100,
      priority: scores.length - index,
    }));
  }

  private async executeWorkload(workloadId: string): Promise<void> {
    const workload = this.workloads.get(workloadId);
    if (!workload) return;

    try {
      workload.status = 'distributing';
      await this.sleep(3000);
      
      workload.status = 'running';
      logger.info(`Workload executing: ${workloadId}`);
      
      // Simulate completion
      setTimeout(() => {
        workload.status = 'completed';
        logger.info(`Workload completed: ${workloadId}`);
      }, 10000);
    } catch (error) {
      workload.status = 'failed';
      logger.error(`Workload failed: ${workloadId}`, error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const meshControlService = new MeshControlService();
