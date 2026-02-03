import { db, isDatabaseAvailable } from '../db';
import { servers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

export interface Server {
  id: string;
  name: string;
  type: 'vm' | 'container' | 'bare-metal' | 'cloud';
  provider?: string;
  template?: string;
  status: 'creating' | 'running' | 'stopped' | 'error' | 'deleted';
  specs: {
    cpu: number;
    memory: number; // GB
    storage: number; // GB
    os: string;
  };
  network: {
    ip?: string;
    ports: number[];
  };
  config: Record<string, any>;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ServerCreateData {
  name: string;
  type: 'vm' | 'container' | 'bare-metal' | 'cloud';
  provider?: string;
  template?: string;
  specs: {
    cpu: number;
    memory: number;
    storage: number;
    os: string;
  };
  config?: Record<string, any>;
}

interface ServerUpdateData {
  name?: string;
  specs?: Partial<Server['specs']>;
  config?: Record<string, any>;
}

interface ServerTemplate {
  id: string;
  name: string;
  description: string;
  type: 'vm' | 'container' | 'cloud';
  specs: {
    cpu: number;
    memory: number;
    storage: number;
    os: string;
  };
  features: string[];
}

class ServerService {
  private servers: Map<string, Server> = new Map();

  // Get all servers for a user
  async getAllServers(userId: string): Promise<Server[]> {
    if (isDatabaseAvailable()) {
      try {
        const dbServers = await db!
          .select()
          .from(servers)
          .where(eq(servers.userId, userId));
        
        return dbServers.map(this.dbServerToServer);
      } catch (error) {
        logger.error('Error fetching servers from database:', error);
      }
    }
    
    // In-memory fallback
    return Array.from(this.servers.values()).filter(s => s.userId === userId);
  }

  // Get server by ID
  async getServerById(id: string, userId: string): Promise<Server | null> {
    if (isDatabaseAvailable()) {
      try {
        const [server] = await db!
          .select()
          .from(servers)
          .where(and(eq(servers.id, id), eq(servers.userId, userId)))
          .limit(1);
        
        return server ? this.dbServerToServer(server) : null;
      } catch (error) {
        logger.error('Error fetching server from database:', error);
      }
    }
    
    // In-memory fallback
    const server = this.servers.get(id);
    return server && server.userId === userId ? server : null;
  }

  // Create server
  async createServer(data: ServerCreateData, userId: string): Promise<Server> {
    const id = `srv-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const server: Server = {
      id,
      name: data.name,
      type: data.type,
      provider: data.provider,
      template: data.template,
      status: 'creating',
      specs: data.specs,
      network: {
        ports: [],
      },
      config: data.config || {},
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDatabaseAvailable()) {
      try {
        await db!.insert(servers).values({
          id: server.id,
          name: server.name,
          type: server.type,
          provider: server.provider,
          template: server.template,
          status: server.status,
          specs: server.specs as any,
          network: server.network as any,
          config: server.config as any,
          userId: server.userId,
        });
        
        // Simulate server provisioning
        setTimeout(() => this.provisionServer(id), 3000);
        
        return server;
      } catch (error) {
        logger.error('Error creating server in database:', error);
        throw new Error('Failed to create server');
      }
    }
    
    // In-memory fallback
    this.servers.set(id, server);
    setTimeout(() => this.provisionServer(id), 3000);
    
    return server;
  }

  // Update server
  async updateServer(id: string, data: ServerUpdateData, userId: string): Promise<Server | null> {
    const server = await this.getServerById(id, userId);
    if (!server) return null;

    const updated: Server = {
      ...server,
      name: data.name || server.name,
      specs: { ...server.specs, ...data.specs },
      config: { ...server.config, ...data.config },
      updatedAt: new Date().toISOString(),
    };

    if (isDatabaseAvailable()) {
      try {
        await db!
          .update(servers)
          .set({
            name: updated.name,
            specs: updated.specs as any,
            config: updated.config as any,
            updatedAt: new Date(),
          })
          .where(and(eq(servers.id, id), eq(servers.userId, userId)));
        
        return updated;
      } catch (error) {
        logger.error('Error updating server in database:', error);
        throw new Error('Failed to update server');
      }
    }
    
    // In-memory fallback
    this.servers.set(id, updated);
    return updated;
  }

  // Delete server
  async deleteServer(id: string, userId: string): Promise<boolean> {
    const server = await this.getServerById(id, userId);
    if (!server) return false;

    if (isDatabaseAvailable()) {
      try {
        await db!
          .update(servers)
          .set({ status: 'deleted', updatedAt: new Date() })
          .where(and(eq(servers.id, id), eq(servers.userId, userId)));
        
        return true;
      } catch (error) {
        logger.error('Error deleting server in database:', error);
        return false;
      }
    }
    
    // In-memory fallback
    this.servers.delete(id);
    return true;
  }

  // Start server
  async startServer(id: string, userId: string): Promise<{ success: boolean; error?: string; server?: Server }> {
    const server = await this.getServerById(id, userId);
    if (!server) return { success: false, error: 'Server not found' };

    if (server.status === 'running') {
      return { success: false, error: 'Server is already running' };
    }

    server.status = 'running';
    server.updatedAt = new Date().toISOString();

    if (isDatabaseAvailable()) {
      try {
        await db!
          .update(servers)
          .set({ status: 'running', updatedAt: new Date() })
          .where(and(eq(servers.id, id), eq(servers.userId, userId)));
      } catch (error) {
        logger.error('Error starting server:', error);
        return { success: false, error: 'Failed to start server' };
      }
    } else {
      this.servers.set(id, server);
    }

    return { success: true, server };
  }

  // Stop server
  async stopServer(id: string, userId: string): Promise<{ success: boolean; error?: string; server?: Server }> {
    const server = await this.getServerById(id, userId);
    if (!server) return { success: false, error: 'Server not found' };

    if (server.status === 'stopped') {
      return { success: false, error: 'Server is already stopped' };
    }

    server.status = 'stopped';
    server.updatedAt = new Date().toISOString();

    if (isDatabaseAvailable()) {
      try {
        await db!
          .update(servers)
          .set({ status: 'stopped', updatedAt: new Date() })
          .where(and(eq(servers.id, id), eq(servers.userId, userId)));
      } catch (error) {
        logger.error('Error stopping server:', error);
        return { success: false, error: 'Failed to stop server' };
      }
    } else {
      this.servers.set(id, server);
    }

    return { success: true, server };
  }

  // Restart server
  async restartServer(id: string, userId: string): Promise<{ success: boolean; error?: string; server?: Server }> {
    const stopResult = await this.stopServer(id, userId);
    if (!stopResult.success) return stopResult;

    // Wait a bit before starting
    await new Promise(resolve => setTimeout(resolve, 1000));

    return await this.startServer(id, userId);
  }

  // Simulate server provisioning
  private async provisionServer(id: string): Promise<void> {
    const server = this.servers.get(id);
    
    if (isDatabaseAvailable()) {
      try {
        await db!
          .update(servers)
          .set({ 
            status: 'running',
            updatedAt: new Date(),
          })
          .where(eq(servers.id, id));
        
        logger.info(`Server provisioned: ${id}`);
      } catch (error) {
        logger.error('Error provisioning server:', error);
      }
    } else if (server) {
      server.status = 'running';
      server.updatedAt = new Date().toISOString();
      this.servers.set(id, server);
    }
  }

  // Get server templates
  getServerTemplates(): ServerTemplate[] {
    return [
      {
        id: 'ubuntu-server',
        name: 'Ubuntu Server 22.04',
        description: 'Ubuntu Server with Docker and essential tools',
        type: 'vm',
        specs: { cpu: 2, memory: 4, storage: 50, os: 'Ubuntu 22.04' },
        features: ['Docker', 'Node.js', 'PostgreSQL'],
      },
      {
        id: 'debian-server',
        name: 'Debian 12',
        description: 'Debian stable server',
        type: 'vm',
        specs: { cpu: 2, memory: 2, storage: 30, os: 'Debian 12' },
        features: ['Apache', 'MySQL', 'PHP'],
      },
      {
        id: 'docker-container',
        name: 'Docker Container',
        description: 'Lightweight Docker container',
        type: 'container',
        specs: { cpu: 1, memory: 1, storage: 10, os: 'Alpine Linux' },
        features: ['Docker', 'Minimal footprint'],
      },
      {
        id: 'high-performance',
        name: 'High Performance Server',
        description: 'High-end server for demanding workloads',
        type: 'vm',
        specs: { cpu: 16, memory: 64, storage: 500, os: 'Ubuntu 22.04' },
        features: ['NVMe SSD', 'High bandwidth', 'GPU support'],
      },
    ];
  }

  // Convert database server to Server type
  private dbServerToServer(dbServer: any): Server {
    return {
      id: dbServer.id,
      name: dbServer.name,
      type: dbServer.type,
      provider: dbServer.provider,
      template: dbServer.template,
      status: dbServer.status,
      specs: dbServer.specs as any,
      network: dbServer.network as any,
      config: dbServer.config as any,
      userId: dbServer.userId,
      createdAt: dbServer.createdAt.toISOString(),
      updatedAt: dbServer.updatedAt.toISOString(),
    };
  }
}

export const serverService = new ServerService();
