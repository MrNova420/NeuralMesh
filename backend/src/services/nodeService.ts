import type { Node } from '../types';
import { db, isDatabaseAvailable } from '../db';
import { nodes, metricsHistory } from '../db/schema';
import { eq } from 'drizzle-orm';

const mockNodes: Node[] = [];

interface ActionResult {
  success: boolean;
  error?: string;
}

interface ActionHistoryEntry {
  action: string;
  timestamp: string;
  success: boolean;
}

class NodeService {
  private readonly useMockNodes = process.env.USE_MOCK_NODES === 'true';
  private nodes: Node[] = this.useMockNodes ? [...mockNodes] : [];
  private actionHandlers = new Map<string, (action: string) => Promise<void>>();
  private actionHistory = new Map<string, ActionHistoryEntry[]>();

  async getAllNodes(): Promise<Node[]> {
    if (isDatabaseAvailable() && !this.useMockNodes) {
      try {
        const dbNodes = await db!.select().from(nodes);
        return dbNodes.map(this.dbNodeToNode);
      } catch (error) {
        console.error('Error fetching nodes from database:', error);
      }
    }
    return this.nodes;
  }

  async getNodeById(id: string): Promise<Node | undefined> {
    if (isDatabaseAvailable() && !this.useMockNodes) {
      try {
        const [node] = await db!.select().from(nodes).where(eq(nodes.id, id)).limit(1);
        return node ? this.dbNodeToNode(node) : undefined;
      } catch (error) {
        console.error('Error fetching node from database:', error);
      }
    }
    return this.nodes.find((node) => node.id === id);
  }

  async addOrUpdateNode(nodeData: any) {
    const status = this.calculateStatus(nodeData);
    
    if (isDatabaseAvailable() && !this.useMockNodes) {
      try {
        const existingNode = await this.getNodeById(nodeData.id);
        
        if (existingNode) {
          // Update existing node
          await db!
            .update(nodes)
            .set({
              name: nodeData.name,
              type: nodeData.type,
              status,
              specs: nodeData.specs,
              platform: nodeData.platform,
              location: nodeData.location || null,
              connections: nodeData.connections || [],
              lastSeen: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(nodes.id, nodeData.id));
          
          // Store metrics history
          await this.storeMetrics(nodeData.id, nodeData.specs);
        } else {
          // Add new node
          await db!.insert(nodes).values({
            id: nodeData.id,
            name: nodeData.name,
            type: nodeData.type,
            status,
            specs: nodeData.specs,
            platform: nodeData.platform,
            location: nodeData.location || null,
            connections: nodeData.connections || [],
            uptime: nodeData.uptime || 0,
          });
        }
        return;
      } catch (error) {
        console.error('Error saving node to database:', error);
      }
    }
    
    // In-memory fallback
    const existingIndex = this.nodes.findIndex(n => n.id === nodeData.id);
    
    if (existingIndex >= 0) {
      this.nodes[existingIndex] = {
        ...this.nodes[existingIndex],
        ...nodeData,
        lastSeen: new Date().toISOString(),
        status,
      };
    } else {
      this.nodes.push({
        ...nodeData,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        status,
      });
    }
  }

  async markNodeOffline(nodeId: string) {
    if (isDatabaseAvailable() && !this.useMockNodes) {
      try {
        await db!.update(nodes).set({ status: 'offline' }).where(eq(nodes.id, nodeId));
        return;
      } catch (error) {
        console.error('Error marking node offline:', error);
      }
    }
    
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

  async updateNodeMetrics(nodeId: string): Promise<Node | undefined> {
    if (!this.useMockNodes) return this.getNodeById(nodeId);
    const node = await this.getNodeById(nodeId);
    if (!node) return undefined;
    node.specs.cpu.usage = Math.max(10, Math.min(90, node.specs.cpu.usage + (Math.random() - 0.5) * 10));
    node.specs.memory.usage = Math.max(20, Math.min(95, node.specs.memory.usage + (Math.random() - 0.5) * 5));
    node.specs.network.rx = Math.max(0, node.specs.network.rx + (Math.random() - 0.5) * 100);
    node.specs.network.tx = Math.max(0, node.specs.network.tx + (Math.random() - 0.5) * 80);
    node.lastSeen = new Date().toISOString();
    return node;
  }

  async updateAllNodes(): Promise<void> {
    if (!this.useMockNodes) return;
    const allNodes = await this.getAllNodes();
    for (const node of allNodes) {
      await this.updateNodeMetrics(node.id);
    }
  }

  // Register action handler for a node (called by WebSocket server)
  registerActionHandler(nodeId: string, handler: (action: string) => Promise<void>) {
    this.actionHandlers.set(nodeId, handler);
  }

  // Unregister action handler
  unregisterActionHandler(nodeId: string) {
    this.actionHandlers.delete(nodeId);
  }

  // Send action to node
  async sendAction(nodeId: string, action: string): Promise<ActionResult> {
    const handler = this.actionHandlers.get(nodeId);
    
    if (!handler) {
      return { success: false, error: 'Node not connected or action handler not available' };
    }

    try {
      await handler(action);
      this.recordAction(nodeId, action, true);
      return { success: true };
    } catch (error) {
      this.recordAction(nodeId, action, false);
      return { success: false, error: 'Failed to execute action' };
    }
  }

  // Disconnect node
  async disconnectNode(nodeId: string): Promise<ActionResult> {
    const handler = this.actionHandlers.get(nodeId);
    
    if (!handler) {
      return { success: false, error: 'Node not connected' };
    }

    try {
      await handler('disconnect');
      this.unregisterActionHandler(nodeId);
      await this.markNodeOffline(nodeId);
      this.recordAction(nodeId, 'disconnect', true);
      return { success: true };
    } catch (error) {
      this.recordAction(nodeId, 'disconnect', false);
      return { success: false, error: 'Failed to disconnect node' };
    }
  }

  // Record action in history
  private recordAction(nodeId: string, action: string, success: boolean) {
    if (!this.actionHistory.has(nodeId)) {
      this.actionHistory.set(nodeId, []);
    }
    
    const history = this.actionHistory.get(nodeId)!;
    history.push({
      action,
      timestamp: new Date().toISOString(),
      success,
    });
    
    // Keep only last 50 actions
    if (history.length > 50) {
      history.shift();
    }
  }

  // Get action history for a node
  async getActionHistory(nodeId: string): Promise<ActionHistoryEntry[]> {
    return this.actionHistory.get(nodeId) || [];
  }

  // Store metrics in database
  private async storeMetrics(nodeId: string, specs: any) {
    if (!isDatabaseAvailable()) return;
    
    try {
      await db!.insert(metricsHistory).values({
        nodeId,
        cpuUsage: specs.cpu.usage,
        memoryUsage: specs.memory.usage,
        storageUsage: specs.storage.usage,
        networkRx: specs.network.rx,
        networkTx: specs.network.tx,
      });
    } catch (error) {
      console.error('Error storing metrics:', error);
    }
  }

  // Convert database node to Node type
  private dbNodeToNode(dbNode: any): Node {
    return {
      id: dbNode.id,
      name: dbNode.name,
      type: dbNode.type,
      status: dbNode.status,
      specs: dbNode.specs as any,
      platform: dbNode.platform as any,
      location: dbNode.location as any,
      connections: (dbNode.connections as string[]) || [],
      uptime: dbNode.uptime,
      createdAt: dbNode.createdAt.toISOString(),
      lastSeen: dbNode.lastSeen.toISOString(),
    };
  }
}

export const nodeService = new NodeService();
