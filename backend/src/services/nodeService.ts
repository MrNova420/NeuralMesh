import type { Node } from '../types';

const mockNodes: Node[] = [
  { id: 'n1', name: 'alpha-server-01', type: 'alpha', status: 'healthy', specs: { cpu: { cores: 16, usage: 42, model: 'Intel Xeon E5-2680 v4' }, memory: { total: 64000, used: 43520, usage: 68 }, storage: { total: 2000000, used: 900000, usage: 45 }, network: { rx: 1250, tx: 850 } }, connections: ['n2', 'n3', 'n4'], location: { ip: '192.168.1.10', hostname: 'alpha-server-01.local', platform: 'linux' }, uptime: 3456000, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n2', name: 'alpha-server-02', type: 'alpha', status: 'healthy', specs: { cpu: { cores: 16, usage: 38, model: 'Intel Xeon E5-2680 v4' }, memory: { total: 64000, used: 33280, usage: 52 }, storage: { total: 2000000, used: 1240000, usage: 62 }, network: { rx: 980, tx: 720 } }, connections: ['n1', 'n5', 'n6'], location: { ip: '192.168.1.11', hostname: 'alpha-server-02.local', platform: 'linux' }, uptime: 2592000, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n3', name: 'beta-server-01', type: 'beta', status: 'warning', specs: { cpu: { cores: 8, usage: 72, model: 'Intel Core i7-9700K' }, memory: { total: 32000, used: 27200, usage: 85 }, storage: { total: 1000000, used: 780000, usage: 78 }, network: { rx: 560, tx: 420 } }, connections: ['n1', 'n7', 'n8'], location: { ip: '192.168.1.20', hostname: 'beta-server-01.local', platform: 'linux' }, uptime: 1036800, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n4', name: 'gamma-mobile-01', type: 'gamma', status: 'healthy', specs: { cpu: { cores: 8, usage: 28, model: 'Snapdragon 888' }, memory: { total: 8000, used: 3600, usage: 45 }, storage: { total: 128000, used: 43520, usage: 34 }, network: { rx: 125, tx: 85 } }, connections: ['n1', 'n9'], location: { ip: '192.168.1.50', hostname: 'gamma-mobile-01', platform: 'android' }, uptime: 691200, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n5', name: 'gamma-mobile-02', type: 'gamma', status: 'healthy', specs: { cpu: { cores: 8, usage: 35, model: 'Snapdragon 888' }, memory: { total: 12000, used: 6960, usage: 58 }, storage: { total: 256000, used: 107520, usage: 42 }, network: { rx: 180, tx: 120 } }, connections: ['n2', 'n10'], location: { ip: '192.168.1.51', hostname: 'gamma-mobile-02', platform: 'android' }, uptime: 475200, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n6', name: 'delta-pi-01', type: 'delta', status: 'healthy', specs: { cpu: { cores: 4, usage: 18, model: 'ARM Cortex-A72' }, memory: { total: 8000, used: 2560, usage: 32 }, storage: { total: 64000, used: 35200, usage: 55 }, network: { rx: 45, tx: 30 } }, connections: ['n2', 'n11'], location: { ip: '192.168.1.100', hostname: 'delta-pi-01.local', platform: 'linux' }, uptime: 7689600, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n7', name: 'beta-server-02', type: 'beta', status: 'healthy', specs: { cpu: { cores: 8, usage: 45, model: 'AMD Ryzen 7 5800X' }, memory: { total: 32000, used: 16640, usage: 52 }, storage: { total: 1000000, used: 520000, usage: 52 }, network: { rx: 420, tx: 310 } }, connections: ['n3', 'n12'], location: { ip: '192.168.1.21', hostname: 'beta-server-02.local', platform: 'linux' }, uptime: 1728000, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n8', name: 'gamma-mobile-03', type: 'gamma', status: 'healthy', specs: { cpu: { cores: 8, usage: 22, model: 'Snapdragon 8 Gen 2' }, memory: { total: 12000, used: 4800, usage: 40 }, storage: { total: 256000, used: 89600, usage: 35 }, network: { rx: 95, tx: 65 } }, connections: ['n3'], location: { ip: '192.168.1.52', hostname: 'gamma-mobile-03', platform: 'android' }, uptime: 345600, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n9', name: 'delta-pi-02', type: 'delta', status: 'healthy', specs: { cpu: { cores: 4, usage: 15, model: 'ARM Cortex-A72' }, memory: { total: 4000, used: 1600, usage: 40 }, storage: { total: 32000, used: 16000, usage: 50 }, network: { rx: 32, tx: 22 } }, connections: ['n4'], location: { ip: '192.168.1.101', hostname: 'delta-pi-02.local', platform: 'linux' }, uptime: 5184000, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n10', name: 'delta-pi-03', type: 'delta', status: 'healthy', specs: { cpu: { cores: 4, usage: 12, model: 'ARM Cortex-A72' }, memory: { total: 4000, used: 1200, usage: 30 }, storage: { total: 32000, used: 19200, usage: 60 }, network: { rx: 28, tx: 18 } }, connections: ['n5'], location: { ip: '192.168.1.102', hostname: 'delta-pi-03.local', platform: 'linux' }, uptime: 6048000, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 140 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n11', name: 'gamma-mobile-04', type: 'gamma', status: 'healthy', specs: { cpu: { cores: 8, usage: 30, model: 'Dimensity 9200' }, memory: { total: 8000, used: 3200, usage: 40 }, storage: { total: 128000, used: 51200, usage: 40 }, network: { rx: 110, tx: 75 } }, connections: ['n6'], location: { ip: '192.168.1.53', hostname: 'gamma-mobile-04', platform: 'android' }, uptime: 518400, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'n12', name: 'alpha-server-03', type: 'alpha', status: 'healthy', specs: { cpu: { cores: 16, usage: 48, model: 'Intel Xeon E5-2680 v4' }, memory: { total: 64000, used: 38400, usage: 60 }, storage: { total: 2000000, used: 1080000, usage: 54 }, network: { rx: 1100, tx: 780 } }, connections: ['n7', 'n1'], location: { ip: '192.168.1.12', hostname: 'alpha-server-03.local', platform: 'linux' }, uptime: 4320000, lastSeen: new Date().toISOString(), createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString() },
];

class NodeService {
  private nodes: Node[] = mockNodes;

  getAllNodes(): Node[] {
    return this.nodes;
  }

  getNodeById(id: string): Node | undefined {
    return this.nodes.find((node) => node.id === id);
  }

  updateNodeMetrics(nodeId: string): Node | undefined {
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
    this.nodes.forEach((node) => this.updateNodeMetrics(node.id));
  }
}

export const nodeService = new NodeService();
