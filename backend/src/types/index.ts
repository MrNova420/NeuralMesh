export interface Node {
  id: string;
  name: string;
  type: 'alpha' | 'beta' | 'gamma' | 'delta';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  specs: {
    cpu: { cores: number; usage: number; model: string };
    memory: { total: number; used: number; usage: number };
    storage: { total: number; used: number; usage: number };
    network: { rx: number; tx: number };
  };
  connections: string[];
  location: {
    ip: string;
    hostname: string;
    platform: string;
  };
  uptime: number;
  lastSeen: string;
  createdAt: string;
}

export interface Metrics {
  nodeId: string;
  timestamp: string;
  cpu: number;
  memory: number;
  storage: number;
  network: { rx: number; tx: number };
}

export interface SystemStatus {
  totalNodes: number;
  activeNodes: number;
  totalConnections: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  totalStorage: number;
  networkThroughput: number;
  uptime: number;
  health: 'healthy' | 'warning' | 'critical';
}
