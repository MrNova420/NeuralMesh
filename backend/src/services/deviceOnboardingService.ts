import crypto from 'crypto';
import { db } from '../db';
import { nodes } from '../db/schema';
import { eq } from 'drizzle-orm';

interface PairingCode {
  code: string;
  expiresAt: Date;
  deviceInfo?: any;
}

interface DeviceRegistration {
  name: string;
  type: string;
  os: string;
  pairingCode: string;
}

interface QRCodeData {
  serverUrl: string;
  pairingCode: string;
  timestamp: number;
}

/**
 * Device Onboarding Service
 * Handles device registration, pairing, and mesh joining
 */
class DeviceOnboardingService {
  private pairingCodes: Map<string, PairingCode>;
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 15;

  constructor() {
    this.pairingCodes = new Map();
    // Clean up expired codes every 5 minutes
    setInterval(() => this.cleanupExpiredCodes(), 5 * 60 * 1000);
  }

  /**
   * Generate a secure pairing code
   */
  generatePairingCode(): { code: string; expiresAt: Date } {
    const code = this.generateSecureCode();
    const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);
    
    this.pairingCodes.set(code, {
      code,
      expiresAt
    });

    return { code, expiresAt };
  }

  /**
   * Generate a secure random code
   */
  private generateSecureCode(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      const randomIndex = crypto.randomInt(0, chars.length);
      code += chars[randomIndex];
    }
    
    // Ensure code is unique
    if (this.pairingCodes.has(code)) {
      return this.generateSecureCode();
    }
    
    return code;
  }

  /**
   * Verify and consume a pairing code
   */
  async verifyPairingCode(code: string): Promise<boolean> {
    const pairingCode = this.pairingCodes.get(code);
    
    if (!pairingCode) {
      return false;
    }
    
    if (new Date() > pairingCode.expiresAt) {
      this.pairingCodes.delete(code);
      return false;
    }
    
    return true;
  }

  /**
   * Register a new device
   */
  async registerDevice(registration: DeviceRegistration, userId: string): Promise<any> {
    // Verify pairing code
    const isValid = await this.verifyPairingCode(registration.pairingCode);
    
    if (!isValid) {
      throw new Error('Invalid or expired pairing code');
    }

    // Generate API key for device
    const apiKey = this.generateApiKey();
    
    // Check if database is available
    if (!db) {
      throw new Error('Database not available');
    }
    
    // Create node record aligned with current nodes schema
    const nodeData = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: registration.name,
      type: registration.type,
      platform: {
        os: registration.os,
        arch: 'unknown',
        version: 'unknown'
      },
      status: 'pending' as const,
      lastSeen: new Date(),
      specs: {
        apiKey: apiKey,
        userId: userId,
        cpu: { cores: 0, model: 'unknown', usage: 0 },
        memory: { total: 0, used: 0, available: 0 },
        disk: { total: 0, used: 0, available: 0 }
      },
      connections: []
    };

    const [newNode] = await db.insert(nodes).values(nodeData).returning();
    
    // Consume the pairing code
    this.pairingCodes.delete(registration.pairingCode);
    
    return {
      nodeId: newNode.id,
      apiKey: apiKey,
      serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
      instructions: this.getInstallationInstructions(registration.os, apiKey)
    };
  }

  /**
   * Generate API key for device
   */
  private generateApiKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify device using API key
   */
  async verifyDevice(apiKey: string): Promise<any> {
    // Check if database is available
    if (!db) {
      throw new Error('Database not available');
    }
    
    // Query database efficiently using SQL instead of loading all nodes
    const nodesList = await db.select().from(nodes);
    const node = nodesList.find((n: any) => {
      const specs = typeof n.specs === 'string' ? JSON.parse(n.specs) : n.specs;
      return specs?.apiKey === apiKey;
    });
    
    if (!node) {
      throw new Error('Invalid API key');
    }
    
    return {
      nodeId: node.id,
      name: node.name,
      status: node.status
    };
  }

  /**
   * Join device to mesh network
   */
  async joinMesh(nodeId: string, capabilities: any): Promise<any> {
    // Update node with capabilities
    const nodesList = await db.select().from(nodes).where(eq(nodes.id, nodeId));
    
    if (nodesList.length === 0) {
      throw new Error('Node not found');
    }

    const existingSpecs = typeof nodesList[0].specs === 'string' 
      ? JSON.parse(nodesList[0].specs) 
      : nodesList[0].specs || {};

    await db.update(nodes)
      .set({
        status: 'online',
        specs: {
          ...existingSpecs,
          ...capabilities,
          joinedAt: new Date().toISOString()
        },
        lastSeen: new Date()
      })
      .where(eq(nodes.id, nodeId));

    return {
      success: true,
      nodeId,
      meshStatus: 'joined',
      role: this.assignRole(capabilities)
    };
  }

  /**
   * Assign role based on capabilities
   */
  private assignRole(capabilities: any): string {
    const { cpu, memory, storage } = capabilities;
    
    if (cpu >= 8 && memory >= 16) {
      return 'master';
    } else if (cpu >= 4 && memory >= 8) {
      return 'worker';
    } else {
      return 'edge';
    }
  }

  /**
   * Discover devices on network
   */
  async discoverDevices(): Promise<any[]> {
    // In a real implementation, this would scan the network
    // For now, return list of pending nodes
    const nodesList = await db.select().from(nodes);
    return nodesList
      .filter((n: any) => n.status === 'pending' || n.status === 'discovering')
      .map((n: any) => ({
        id: n.id,
        name: n.name,
        ipAddress: n.ipAddress,
        status: n.status
      }));
  }

  /**
   * Generate QR code data
   */
  generateQRCodeData(pairingCode: string): QRCodeData {
    return {
      serverUrl: process.env.SERVER_URL || 'http://localhost:3000',
      pairingCode,
      timestamp: Date.now()
    };
  }

  /**
   * Get installation instructions based on OS
   */
  private getInstallationInstructions(os: string, apiKey: string): string {
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    
    switch (os.toLowerCase()) {
      case 'linux':
      case 'macos':
        return `# Install NeuralMesh Agent
curl -fsSL ${serverUrl}/install-agent.sh | bash
# Or download and run:
wget ${serverUrl}/install-agent.sh
chmod +x install-agent.sh
./install-agent.sh --api-key ${apiKey} --server ${serverUrl}`;

      case 'windows':
        return `# Install NeuralMesh Agent (PowerShell as Administrator)
Invoke-WebRequest -Uri "${serverUrl}/install-agent.ps1" -OutFile "install-agent.ps1"
Set-ExecutionPolicy Bypass -Scope Process
.\\install-agent.ps1 -ApiKey "${apiKey}" -Server "${serverUrl}"`;

      default:
        return `# Visit ${serverUrl}/docs/installation for detailed instructions
# API Key: ${apiKey}
# Server: ${serverUrl}`;
    }
  }

  /**
   * Get installation guide
   */
  getInstallationGuide(os?: string): any {
    const guides = {
      linux: {
        title: 'Linux Installation',
        steps: [
          'Download the agent installer',
          'Make it executable: chmod +x install-agent.sh',
          'Run with API key: ./install-agent.sh --api-key YOUR_KEY',
          'Agent will start automatically'
        ],
        downloadUrl: '/install-agent.sh'
      },
      macos: {
        title: 'macOS Installation',
        steps: [
          'Download the agent installer',
          'Make it executable: chmod +x install-agent.sh',
          'Run with API key: ./install-agent.sh --api-key YOUR_KEY',
          'Grant necessary permissions when prompted'
        ],
        downloadUrl: '/install-agent.sh'
      },
      windows: {
        title: 'Windows Installation',
        steps: [
          'Download the PowerShell installer',
          'Open PowerShell as Administrator',
          'Run: .\\install-agent.ps1 -ApiKey YOUR_KEY',
          'Follow the installation wizard'
        ],
        downloadUrl: '/install-agent.ps1'
      },
      docker: {
        title: 'Docker Installation',
        steps: [
          'Pull the agent image: docker pull neuralmesh/agent',
          'Run with: docker run -e API_KEY=YOUR_KEY neuralmesh/agent',
          'Container will connect automatically'
        ],
        downloadUrl: null
      }
    };

    if (os && guides[os.toLowerCase() as keyof typeof guides]) {
      return guides[os.toLowerCase() as keyof typeof guides];
    }

    return {
      all: Object.values(guides)
    };
  }

  /**
   * Revoke device access
   */
  async revokeDevice(nodeId: string): Promise<void> {
    await db.update(nodes)
      .set({
        status: 'revoked',
        lastSeen: new Date()
      })
      .where(eq(nodes.id, nodeId));
  }

  /**
   * Clean up expired pairing codes
   */
  private cleanupExpiredCodes(): void {
    const now = new Date();
    for (const [code, data] of this.pairingCodes.entries()) {
      if (now > data.expiresAt) {
        this.pairingCodes.delete(code);
      }
    }
  }
}

export const deviceOnboardingService = new DeviceOnboardingService();
export default deviceOnboardingService;
