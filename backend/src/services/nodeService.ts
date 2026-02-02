import type { Node } from '../types';

const mockNodes: Node[] = [];

class NodeService {
  private readonly useMockNodes = process.env.USE_MOCK_NODES === 'true';
  private nodes: Node[] = this.useMockNodes ? [...mockNodes] : [];

  getAllNodes(): Node[] {
    return this.nodes;
  }

  getNodeById(id: string): Node | undefined {
    return this.nodes.find((node) => node.id === id);
  }

  addOrUpdateNode(nodeData: any) {
    const existingIndex = this.nodes.findIndex(n => n.id === nodeData.id);
    
    if (existingIndex >= 0) {
      // Update existing node
      this.nodes[existingIndex] = {
        ...this.nodes[existingIndex],
        ...nodeData,
        lastSeen: new Date().toISOString(),
        status: this.calculateStatus(nodeData),
      };
    } else {
      // Add new node
      this.nodes.push({
        ...nodeData,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        status: this.calculateStatus(nodeData),
      });
    }
  }

  markNodeOffline(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      node.status = 'offline';
    }
  }

  calculateStatus(node: any): 'healthy' | 'warning' | 'critical' | 'offline' {
    const { cpu, memory, storage } = node.specs;
    
    if (cpu.usage > 90 || memory.usage > 90 || storage.usage > 95) {
      return 'critical';
    }
    
    if (cpu.usage > 75 || memory.usage > 75 || storage.usage > 85) {
      return 'warning';
    }
    
    return 'healthy';
  }

  updateNodeMetrics(nodeId: string): Node | undefined {
    if (!this.useMockNodes) return this.getNodeById(nodeId);
    const node = this.getNodeById(nodeId);
    if (!node) return undefined;
    node.specs.cpu.usage = Math.max(10, Math.min(90, node.specs.cpu.usage + (Math.random() - 0.5) * 10));
    node.specs.memory.usage = Math.max(20, Math.min(95, node.specs.memory.usage + (Math.random() - 0.5) * 5));
    node.specs.network.rx = Math.max(0, node.specs.network.rx + (Math.random() - 0.5) * 100);
    node.specs.network.tx = Math.max(0, node.specs.network.tx + (Math.random() - 0.5) * 80);
    node.lastSeen = new Date().toISOString();
    return node;
  }

  updateAllNodes(): void {
    if (!this.useMockNodes) return;
    this.nodes.forEach((node) => this.updateNodeMetrics(node.id));
  }
}

export const nodeService = new NodeService();
