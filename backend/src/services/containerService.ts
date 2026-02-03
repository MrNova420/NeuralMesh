import { logger } from '../utils/logger';

export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'paused' | 'exited' | 'created';
  created: Date;
  ports: { container: number; host: number; protocol: string }[];
  volumes: { container: string; host: string }[];
  environment: Record<string, string>;
  resources: {
    cpuLimit?: number;
    memoryLimit?: string;
    cpuUsage?: number;
    memoryUsage?: number;
  };
  labels: Record<string, string>;
  nodeId: string;
}

export interface ContainerCreateOptions {
  name: string;
  image: string;
  command?: string[];
  entrypoint?: string[];
  environment?: Record<string, string>;
  ports?: { container: number; host: number; protocol?: string }[];
  volumes?: { container: string; host: string; mode?: string }[];
  cpuLimit?: number;
  memoryLimit?: string;
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  labels?: Record<string, string>;
  network?: string;
  nodeId: string;
}

export interface ContainerStats {
  containerId: string;
  cpu: number;
  memory: number;
  memoryLimit: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
  timestamp: Date;
}

class ContainerService {
  private containers: Map<string, Container> = new Map();
  private stats: Map<string, ContainerStats[]> = new Map();

  async listContainers(nodeId?: string): Promise<Container[]> {
    const containers = Array.from(this.containers.values());
    if (nodeId) {
      return containers.filter(c => c.nodeId === nodeId);
    }
    return containers;
  }

  async getContainer(id: string): Promise<Container | null> {
    return this.containers.get(id) || null;
  }

  async createContainer(options: ContainerCreateOptions): Promise<Container> {
    const id = `cont_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const container: Container = {
      id,
      name: options.name,
      image: options.image,
      status: 'created',
      created: new Date(),
      ports: options.ports?.map(p => ({ ...p, protocol: p.protocol || 'tcp' })) || [],
      volumes: options.volumes?.map(v => ({ ...v })) || [],
      environment: options.environment || {},
      resources: {
        cpuLimit: options.cpuLimit,
        memoryLimit: options.memoryLimit,
      },
      labels: options.labels || {},
      nodeId: options.nodeId,
    };

    this.containers.set(id, container);
    
    logger.info(`Container created: ${id} (${options.name}) on node ${options.nodeId}`);
    
    return container;
  }

  async startContainer(id: string): Promise<void> {
    const container = this.containers.get(id);
    if (!container) {
      throw new Error(`Container not found: ${id}`);
    }

    if (container.status === 'running') {
      throw new Error(`Container already running: ${id}`);
    }

    container.status = 'running';
    this.containers.set(id, container);

    // Simulate resource usage
    this.simulateContainerStats(id);

    logger.info(`Container started: ${id} (${container.name})`);
  }

  async stopContainer(id: string): Promise<void> {
    const container = this.containers.get(id);
    if (!container) {
      throw new Error(`Container not found: ${id}`);
    }

    if (container.status === 'stopped') {
      throw new Error(`Container already stopped: ${id}`);
    }

    container.status = 'stopped';
    this.containers.set(id, container);

    logger.info(`Container stopped: ${id} (${container.name})`);
  }

  async restartContainer(id: string): Promise<void> {
    await this.stopContainer(id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.startContainer(id);
    
    logger.info(`Container restarted: ${id}`);
  }

  async removeContainer(id: string, force: boolean = false): Promise<void> {
    const container = this.containers.get(id);
    if (!container) {
      throw new Error(`Container not found: ${id}`);
    }

    if (container.status === 'running' && !force) {
      throw new Error(`Container is running. Use force=true to remove: ${id}`);
    }

    this.containers.delete(id);
    this.stats.delete(id);

    logger.info(`Container removed: ${id} (${container.name})`);
  }

  async getContainerLogs(id: string, tail: number = 100): Promise<string[]> {
    const container = this.containers.get(id);
    if (!container) {
      throw new Error(`Container not found: ${id}`);
    }

    // Simulate logs
    const logs: string[] = [];
    for (let i = 0; i < Math.min(tail, 50); i++) {
      logs.push(`[${new Date().toISOString()}] Log entry ${i + 1} from ${container.name}`);
    }
    
    return logs;
  }

  async getContainerStats(id: string, limit: number = 60): Promise<ContainerStats[]> {
    const containerStats = this.stats.get(id) || [];
    return containerStats.slice(-limit);
  }

  async execCommand(id: string, command: string[]): Promise<{ exitCode: number; output: string }> {
    const container = this.containers.get(id);
    if (!container) {
      throw new Error(`Container not found: ${id}`);
    }

    if (container.status !== 'running') {
      throw new Error(`Container not running: ${id}`);
    }

    // Simulate command execution
    logger.info(`Executing command in container ${id}: ${command.join(' ')}`);
    
    return {
      exitCode: 0,
      output: `Command executed: ${command.join(' ')}\nSuccess!`,
    };
  }

  private simulateContainerStats(containerId: string) {
    const interval = setInterval(() => {
      const container = this.containers.get(containerId);
      if (!container || container.status !== 'running') {
        clearInterval(interval);
        return;
      }

      const stats: ContainerStats = {
        containerId,
        cpu: Math.random() * 50 + 10, // 10-60%
        memory: Math.random() * 500 + 100, // 100-600 MB
        memoryLimit: this.parseMemoryLimit(container.resources.memoryLimit || '1g'),
        networkRx: Math.random() * 1000000, // bytes
        networkTx: Math.random() * 500000, // bytes
        blockRead: Math.random() * 100000,
        blockWrite: Math.random() * 50000,
        timestamp: new Date(),
      };

      const containerStats = this.stats.get(containerId) || [];
      containerStats.push(stats);
      
      // Keep only last 300 stats (5 minutes at 1 stat/second)
      if (containerStats.length > 300) {
        containerStats.shift();
      }
      
      this.stats.set(containerId, containerStats);

      // Update container resource usage
      container.resources.cpuUsage = stats.cpu;
      container.resources.memoryUsage = stats.memory;
      this.containers.set(containerId, container);
    }, 1000);
  }

  private parseMemoryLimit(limit: string): number {
    const units: Record<string, number> = {
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024,
    };
    
    const match = limit.toLowerCase().match(/^(\d+)([kmg])?$/);
    if (!match) return 1024 * 1024 * 1024; // Default 1GB
    
    const value = parseInt(match[1]);
    const unit = match[2] || 'm';
    
    return value * (units[unit] || 1);
  }

  // Image management
  async listImages(): Promise<{ id: string; name: string; tag: string; size: number }[]> {
    // Simulate available images
    return [
      { id: 'img_1', name: 'nginx', tag: 'latest', size: 142 * 1024 * 1024 },
      { id: 'img_2', name: 'postgres', tag: '16', size: 432 * 1024 * 1024 },
      { id: 'img_3', name: 'redis', tag: '7', size: 117 * 1024 * 1024 },
      { id: 'img_4', name: 'node', tag: '20', size: 1100 * 1024 * 1024 },
      { id: 'img_5', name: 'python', tag: '3.12', size: 1010 * 1024 * 1024 },
    ];
  }

  async pullImage(name: string, tag: string = 'latest'): Promise<void> {
    logger.info(`Pulling image: ${name}:${tag}`);
    // Simulate pull
    await new Promise(resolve => setTimeout(resolve, 2000));
    logger.info(`Image pulled: ${name}:${tag}`);
  }

  // Container templates
  getTemplates(): Array<{ name: string; description: string; config: Partial<ContainerCreateOptions> }> {
    return [
      {
        name: 'Nginx Web Server',
        description: 'High-performance web server and reverse proxy',
        config: {
          image: 'nginx:latest',
          ports: [{ container: 80, host: 8080 }],
          memoryLimit: '512m',
          cpuLimit: 1,
          restart: 'always',
        },
      },
      {
        name: 'PostgreSQL Database',
        description: 'Production-ready PostgreSQL database',
        config: {
          image: 'postgres:16',
          ports: [{ container: 5432, host: 5432 }],
          environment: {
            POSTGRES_PASSWORD: 'changeme',
            POSTGRES_DB: 'app_db',
          },
          memoryLimit: '1g',
          cpuLimit: 2,
          restart: 'always',
          volumes: [{ container: '/var/lib/postgresql/data', host: '/data/postgres' }],
        },
      },
      {
        name: 'Redis Cache',
        description: 'High-performance in-memory data store',
        config: {
          image: 'redis:7',
          ports: [{ container: 6379, host: 6379 }],
          memoryLimit: '512m',
          cpuLimit: 1,
          restart: 'always',
        },
      },
      {
        name: 'Node.js App',
        description: 'Node.js application container',
        config: {
          image: 'node:20',
          memoryLimit: '1g',
          cpuLimit: 2,
          restart: 'always',
        },
      },
    ];
  }
}

export const containerService = new ContainerService();
