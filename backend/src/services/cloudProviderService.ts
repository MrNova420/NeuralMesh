import { logger } from '../utils/logger';

export interface CloudProvider {
  id: string;
  name: string;
  type: 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
  capabilities: string[];
  regions: string[];
  status: 'connected' | 'disconnected' | 'error';
}

export interface CloudInstance {
  id: string;
  providerId: string;
  name: string;
  type: string;
  region: string;
  status: 'pending' | 'running' | 'stopping' | 'stopped' | 'terminated';
  publicIp?: string;
  privateIp?: string;
  specs: {
    cpu: number;
    memory: number;
    storage: number;
  };
  cost: {
    hourly: number;
    monthly: number;
  };
  created: Date;
  tags: Record<string, string>;
}

class CloudProviderService {
  private providers: Map<string, CloudProvider> = new Map();
  private instances: Map<string, CloudInstance> = new Map();

  constructor() {
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders() {
    const defaultProviders: CloudProvider[] = [
      {
        id: 'aws-default',
        name: 'Amazon Web Services',
        type: 'aws',
        enabled: false,
        config: {},
        capabilities: ['compute', 'storage', 'database', 'network', 'serverless'],
        regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
        status: 'disconnected',
      },
      {
        id: 'gcp-default',
        name: 'Google Cloud Platform',
        type: 'gcp',
        enabled: false,
        config: {},
        capabilities: ['compute', 'storage', 'database', 'network', 'ai-ml'],
        regions: ['us-central1', 'us-east1', 'europe-west1', 'asia-east1'],
        status: 'disconnected',
      },
      {
        id: 'azure-default',
        name: 'Microsoft Azure',
        type: 'azure',
        enabled: false,
        config: {},
        capabilities: ['compute', 'storage', 'database', 'network', 'iot'],
        regions: ['eastus', 'westus', 'westeurope', 'southeastasia'],
        status: 'disconnected',
      },
      {
        id: 'do-default',
        name: 'DigitalOcean',
        type: 'digitalocean',
        enabled: false,
        config: {},
        capabilities: ['compute', 'storage', 'database', 'network'],
        regions: ['nyc1', 'nyc3', 'sfo3', 'lon1', 'fra1'],
        status: 'disconnected',
      },
    ];

    defaultProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
    });
  }

  // Provider management
  async listProviders(): Promise<CloudProvider[]> {
    return Array.from(this.providers.values());
  }

  async getProvider(id: string): Promise<CloudProvider | null> {
    return this.providers.get(id) || null;
  }

  async addProvider(provider: Omit<CloudProvider, 'id' | 'status'>): Promise<CloudProvider> {
    const id = `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProvider: CloudProvider = {
      ...provider,
      id,
      status: 'disconnected',
    };

    this.providers.set(id, newProvider);
    logger.info(`Cloud provider added: ${provider.name} (${id})`);

    return newProvider;
  }

  async updateProvider(id: string, updates: Partial<CloudProvider>): Promise<CloudProvider> {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }

    const updated = { ...provider, ...updates, id: provider.id };
    this.providers.set(id, updated);

    logger.info(`Cloud provider updated: ${id}`);
    return updated;
  }

  async testProviderConnection(id: string): Promise<{ connected: boolean; message: string }> {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`Provider not found: ${id}`);
    }

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000));

    const connected = Math.random() > 0.3; // 70% success rate
    const status = connected ? 'connected' : 'error';
    
    provider.status = status;
    this.providers.set(id, provider);

    logger.info(`Provider connection test ${connected ? 'succeeded' : 'failed'}: ${id}`);

    return {
      connected,
      message: connected ? 'Connection successful' : 'Connection failed. Check credentials.',
    };
  }

  // Instance management
  async listInstances(providerId?: string): Promise<CloudInstance[]> {
    const instances = Array.from(this.instances.values());
    if (providerId) {
      return instances.filter(i => i.providerId === providerId);
    }
    return instances;
  }

  async getInstance(id: string): Promise<CloudInstance | null> {
    return this.instances.get(id) || null;
  }

  async createInstance(
    providerId: string,
    options: {
      name: string;
      type: string;
      region: string;
      tags?: Record<string, string>;
    }
  ): Promise<CloudInstance> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    if (!provider.enabled || provider.status !== 'connected') {
      throw new Error(`Provider not available: ${providerId}`);
    }

    const id = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate instance specs based on type
    const specs = this.getInstanceSpecs(options.type);
    const cost = this.calculateCost(specs);

    const instance: CloudInstance = {
      id,
      providerId,
      name: options.name,
      type: options.type,
      region: options.region,
      status: 'pending',
      specs,
      cost,
      created: new Date(),
      tags: options.tags || {},
    };

    this.instances.set(id, instance);

    // Simulate provisioning
    setTimeout(() => {
      instance.status = 'running';
      instance.publicIp = this.generateIp();
      instance.privateIp = this.generateIp(true);
      this.instances.set(id, instance);
    }, 3000);

    logger.info(`Cloud instance created: ${id} (${options.name}) on ${providerId}`);

    return instance;
  }

  async startInstance(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Instance not found: ${id}`);
    }

    if (instance.status === 'running') {
      throw new Error(`Instance already running: ${id}`);
    }

    instance.status = 'running';
    this.instances.set(id, instance);

    logger.info(`Cloud instance started: ${id}`);
  }

  async stopInstance(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Instance not found: ${id}`);
    }

    instance.status = 'stopping';
    this.instances.set(id, instance);

    setTimeout(() => {
      instance.status = 'stopped';
      this.instances.set(id, instance);
    }, 2000);

    logger.info(`Cloud instance stopped: ${id}`);
  }

  async terminateInstance(id: string): Promise<void> {
    const instance = this.instances.get(id);
    if (!instance) {
      throw new Error(`Instance not found: ${id}`);
    }

    instance.status = 'terminated';
    this.instances.set(id, instance);

    setTimeout(() => {
      this.instances.delete(id);
    }, 5000);

    logger.info(`Cloud instance terminated: ${id}`);
  }

  // Helper methods
  private getInstanceSpecs(type: string): { cpu: number; memory: number; storage: number } {
    const specs: Record<string, any> = {
      't2.micro': { cpu: 1, memory: 1, storage: 8 },
      't2.small': { cpu: 1, memory: 2, storage: 20 },
      't2.medium': { cpu: 2, memory: 4, storage: 30 },
      'm5.large': { cpu: 2, memory: 8, storage: 50 },
      'm5.xlarge': { cpu: 4, memory: 16, storage: 100 },
      'c5.large': { cpu: 2, memory: 4, storage: 50 },
      'c5.xlarge': { cpu: 4, memory: 8, storage: 100 },
    };

    return specs[type] || { cpu: 1, memory: 1, storage: 10 };
  }

  private calculateCost(specs: { cpu: number; memory: number; storage: number }): { hourly: number; monthly: number } {
    const baseCost = 0.01; // $0.01 per hour base
    const cpuCost = specs.cpu * 0.02;
    const memoryCost = specs.memory * 0.01;
    const storageCost = specs.storage * 0.0001;

    const hourly = baseCost + cpuCost + memoryCost + storageCost;
    const monthly = hourly * 730; // Average hours per month

    return {
      hourly: Math.round(hourly * 100) / 100,
      monthly: Math.round(monthly * 100) / 100,
    };
  }

  private generateIp(private_ip: boolean = false): string {
    if (private_ip) {
      return `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  // Get instance types for a provider
  getInstanceTypes(providerId: string): Array<{ type: string; name: string; specs: any; cost: any }> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}`);
    }

    // Common instance types
    const types = [
      { type: 't2.micro', name: 'Micro', specs: { cpu: 1, memory: 1, storage: 8 }, cost: { hourly: 0.0116, monthly: 8.47 } },
      { type: 't2.small', name: 'Small', specs: { cpu: 1, memory: 2, storage: 20 }, cost: { hourly: 0.023, monthly: 16.79 } },
      { type: 't2.medium', name: 'Medium', specs: { cpu: 2, memory: 4, storage: 30 }, cost: { hourly: 0.0464, monthly: 33.87 } },
      { type: 'm5.large', name: 'Large', specs: { cpu: 2, memory: 8, storage: 50 }, cost: { hourly: 0.096, monthly: 70.08 } },
      { type: 'm5.xlarge', name: 'Extra Large', specs: { cpu: 4, memory: 16, storage: 100 }, cost: { hourly: 0.192, monthly: 140.16 } },
      { type: 'c5.large', name: 'Compute Large', specs: { cpu: 2, memory: 4, storage: 50 }, cost: { hourly: 0.085, monthly: 62.05 } },
      { type: 'c5.xlarge', name: 'Compute XL', specs: { cpu: 4, memory: 8, storage: 100 }, cost: { hourly: 0.17, monthly: 124.10 } },
    ];

    return types;
  }
}

export const cloudProviderService = new CloudProviderService();
