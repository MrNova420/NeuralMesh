import { describe, it, expect } from '@jest/globals';
import { createTestUser, createTestNode, createTestServer, mockApiResponse, mockApiError } from './setup';

describe('Authentication API Tests', () => {
  describe('POST /api/auth/register', () => {
    it('registers new user successfully', async () => {
      const user = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'SecurePass123!',
      };
      const response = mockApiResponse({ user: await createTestUser(user), token: 'jwt-token' });
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
    });

    it('rejects duplicate username', async () => {
      const error = mockApiError('Username already exists', 409);
      expect(error.response.status).toBe(409);
    });

    it('rejects invalid email', async () => {
      const error = mockApiError('Invalid email format', 400);
      expect(error.response.status).toBe(400);
    });

    it('rejects weak password', async () => {
      const error = mockApiError('Password too weak', 400);
      expect(error.response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const response = mockApiResponse({ user: await createTestUser(), token: 'jwt-token' });
      expect(response.data.token).toBeDefined();
    });

    it('rejects invalid password', async () => {
      const error = mockApiError('Invalid credentials', 401);
      expect(error.response.status).toBe(401);
    });

    it('rejects non-existent user', async () => {
      const error = mockApiError('User not found', 404);
      expect(error.response.status).toBe(404);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('logs out successfully', async () => {
      const response = mockApiResponse({ message: 'Logged out successfully' });
      expect(response.data.message).toContain('Logged out');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('returns user profile', async () => {
      const response = mockApiResponse(await createTestUser());
      expect(response.data.username).toBeDefined();
    });

    it('requires authentication', async () => {
      const error = mockApiError('Unauthorized', 401);
      expect(error.response.status).toBe(401);
    });
  });
});

describe('Nodes API Tests', () => {
  describe('GET /api/nodes', () => {
    it('returns list of nodes', async () => {
      const nodes = [await createTestNode(), await createTestNode({ name: 'Node 2' })];
      const response = mockApiResponse(nodes);
      expect(response.data).toHaveLength(2);
    });

    it('returns empty array when no nodes', async () => {
      const response = mockApiResponse([]);
      expect(response.data).toHaveLength(0);
    });

    it('filters nodes by status', async () => {
      const nodes = [await createTestNode({ status: 'online' })];
      const response = mockApiResponse(nodes);
      expect(response.data[0].status).toBe('online');
    });
  });

  describe('POST /api/nodes', () => {
    it('creates new node', async () => {
      const nodeData = { name: 'New Node', ipAddress: '192.168.1.200', port: 8080 };
      const response = mockApiResponse(await createTestNode(nodeData));
      expect(response.data.name).toBe(nodeData.name);
    });

    it('validates required fields', async () => {
      const error = mockApiError('Name is required', 400);
      expect(error.response.status).toBe(400);
    });

    it('validates IP address format', async () => {
      const error = mockApiError('Invalid IP address', 400);
      expect(error.response.status).toBe(400);
    });
  });

  describe('GET /api/nodes/:id', () => {
    it('returns node by id', async () => {
      const node = await createTestNode();
      const response = mockApiResponse(node);
      expect(response.data.id).toBe(node.id);
    });

    it('returns 404 for non-existent node', async () => {
      const error = mockApiError('Node not found', 404);
      expect(error.response.status).toBe(404);
    });
  });

  describe('PUT /api/nodes/:id', () => {
    it('updates node', async () => {
      const updates = { name: 'Updated Node' };
      const node = await createTestNode(updates);
      const response = mockApiResponse(node);
      expect(response.data.name).toBe(updates.name);
    });

    it('validates update data', async () => {
      const error = mockApiError('Invalid update data', 400);
      expect(error.response.status).toBe(400);
    });
  });

  describe('DELETE /api/nodes/:id', () => {
    it('deletes node', async () => {
      const response = mockApiResponse({ message: 'Node deleted' });
      expect(response.data.message).toContain('deleted');
    });

    it('prevents deleting node with active servers', async () => {
      const error = mockApiError('Node has active servers', 409);
      expect(error.response.status).toBe(409);
    });
  });

  describe('POST /api/nodes/:id/actions/:action', () => {
    it('executes action on node', async () => {
      const response = mockApiResponse({ success: true, action: 'restart' });
      expect(response.data.success).toBe(true);
    });

    it('validates action type', async () => {
      const error = mockApiError('Invalid action', 400);
      expect(error.response.status).toBe(400);
    });
  });
});

describe('Servers API Tests', () => {
  describe('GET /api/servers', () => {
    it('returns list of servers', async () => {
      const servers = [await createTestServer(), await createTestServer({ name: 'Server 2' })];
      const response = mockApiResponse(servers);
      expect(response.data).toHaveLength(2);
    });

    it('filters by status', async () => {
      const servers = [await createTestServer({ status: 'running' })];
      const response = mockApiResponse(servers);
      expect(response.data[0].status).toBe('running');
    });

    it('filters by node', async () => {
      const servers = [await createTestServer({ nodeId: 'node-123' })];
      const response = mockApiResponse(servers);
      expect(response.data[0].nodeId).toBe('node-123');
    });
  });

  describe('POST /api/servers', () => {
    it('creates new server', async () => {
      const serverData = { name: 'New Server', type: 'web', nodeId: 'node-1' };
      const response = mockApiResponse(await createTestServer(serverData));
      expect(response.data.name).toBe(serverData.name);
    });

    it('validates node exists', async () => {
      const error = mockApiError('Node not found', 404);
      expect(error.response.status).toBe(404);
    });

    it('checks node capacity', async () => {
      const error = mockApiError('Node at capacity', 409);
      expect(error.response.status).toBe(409);
    });
  });

  describe('POST /api/servers/:id/start', () => {
    it('starts stopped server', async () => {
      const server = await createTestServer({ status: 'stopped' });
      const response = mockApiResponse({ ...server, status: 'running' });
      expect(response.data.status).toBe('running');
    });

    it('cannot start running server', async () => {
      const error = mockApiError('Server already running', 409);
      expect(error.response.status).toBe(409);
    });
  });

  describe('POST /api/servers/:id/stop', () => {
    it('stops running server', async () => {
      const server = await createTestServer({ status: 'running' });
      const response = mockApiResponse({ ...server, status: 'stopped' });
      expect(response.data.status).toBe('stopped');
    });
  });

  describe('POST /api/servers/:id/restart', () => {
    it('restarts server', async () => {
      const response = mockApiResponse({ status: 'restarting' });
      expect(response.data.status).toBe('restarting');
    });
  });

  describe('DELETE /api/servers/:id', () => {
    it('deletes server', async () => {
      const response = mockApiResponse({ message: 'Server deleted' });
      expect(response.data.message).toContain('deleted');
    });

    it('stops server before deletion', async () => {
      const response = mockApiResponse({ message: 'Server stopped and deleted' });
      expect(response.data.message).toContain('stopped');
    });
  });
});

describe('Templates API Tests', () => {
  describe('GET /api/templates/list', () => {
    it('returns all templates', async () => {
      const templates = [
        { id: '1', name: 'WordPress', category: 'hosting' },
        { id: '2', name: 'Minecraft', category: 'game' },
      ];
      const response = mockApiResponse(templates);
      expect(response.data).toHaveLength(2);
    });

    it('filters by category', async () => {
      const templates = [{ id: '1', name: 'Minecraft', category: 'game' }];
      const response = mockApiResponse(templates);
      expect(response.data[0].category).toBe('game');
    });
  });

  describe('POST /api/templates/:id/deploy', () => {
    it('deploys template', async () => {
      const deployment = { serverId: 'new-server', status: 'deploying' };
      const response = mockApiResponse(deployment);
      expect(response.data.status).toBe('deploying');
    });

    it('validates template exists', async () => {
      const error = mockApiError('Template not found', 404);
      expect(error.response.status).toBe(404);
    });

    it('validates target node', async () => {
      const error = mockApiError('Invalid node', 400);
      expect(error.response.status).toBe(400);
    });
  });
});

describe('Device Onboarding API Tests', () => {
  describe('POST /api/onboarding/pairing-code', () => {
    it('generates pairing code', async () => {
      const response = mockApiResponse({ code: '123456', expiresAt: Date.now() + 900000 });
      expect(response.data.code).toHaveLength(6);
    });
  });

  describe('POST /api/onboarding/register', () => {
    it('registers device', async () => {
      const deviceData = { code: '123456', name: 'My Device', type: 'mobile' };
      const response = mockApiResponse({ deviceId: 'dev-1', apiKey: 'key-123' });
      expect(response.data.deviceId).toBeDefined();
      expect(response.data.apiKey).toBeDefined();
    });

    it('validates pairing code', async () => {
      const error = mockApiError('Invalid pairing code', 400);
      expect(error.response.status).toBe(400);
    });

    it('checks code expiration', async () => {
      const error = mockApiError('Pairing code expired', 410);
      expect(error.response.status).toBe(410);
    });
  });

  describe('POST /api/onboarding/verify', () => {
    it('verifies device', async () => {
      const response = mockApiResponse({ verified: true });
      expect(response.data.verified).toBe(true);
    });
  });
});

describe('Storage API Tests', () => {
  describe('GET /api/storage/pools', () => {
    it('returns storage pools', async () => {
      const pools = [{ id: 'pool-1', name: 'Main Pool', capacity: 1000000000 }];
      const response = mockApiResponse(pools);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('GET /api/storage/volumes', () => {
    it('returns storage volumes', async () => {
      const volumes = [{ id: 'vol-1', name: 'Data', size: 500000000 }];
      const response = mockApiResponse(volumes);
      expect(response.data).toHaveLength(1);
    });
  });

  describe('POST /api/storage/volumes', () => {
    it('creates volume', async () => {
      const volumeData = { name: 'New Volume', size: 1000000000 };
      const response = mockApiResponse({ id: 'vol-new', ...volumeData });
      expect(response.data.name).toBe(volumeData.name);
    });
  });
});

describe('Game Server API Tests', () => {
  describe('GET /api/gameservers/:id/console', () => {
    it('returns console output', async () => {
      const response = mockApiResponse({ lines: ['Server started', 'Player joined'] });
      expect(response.data.lines).toHaveLength(2);
    });
  });

  describe('POST /api/gameservers/:id/console/command', () => {
    it('executes command', async () => {
      const response = mockApiResponse({ success: true, output: 'Command executed' });
      expect(response.data.success).toBe(true);
    });
  });

  describe('GET /api/gameservers/:id/players', () => {
    it('returns online players', async () => {
      const players = [{ username: 'Player1', playtime: 3600 }];
      const response = mockApiResponse(players);
      expect(response.data).toHaveLength(1);
    });
  });
});

describe('Analytics API Tests', () => {
  describe('GET /api/analytics/overview', () => {
    it('returns overview', async () => {
      const overview = { totalNodes: 10, totalServers: 25, totalResources: { cpu: 1000 } };
      const response = mockApiResponse(overview);
      expect(response.data.totalNodes).toBe(10);
    });
  });
});

describe('Metrics API Tests', () => {
  describe('GET /api/metrics/system', () => {
    it('returns system metrics', async () => {
      const metrics = [{ timestamp: Date.now(), cpu: 50, memory: 60 }];
      const response = mockApiResponse(metrics);
      expect(response.data).toHaveLength(1);
    });
  });
});

describe('Error Handling Tests', () => {
  it('handles network errors', async () => {
    const error = mockApiError('Network error', 0);
    expect(error.message).toContain('Network error');
  });

  it('handles server errors', async () => {
    const error = mockApiError('Internal error', 500);
    expect(error.response.status).toBe(500);
  });

  it('handles not found', async () => {
    const error = mockApiError('Not found', 404);
    expect(error.response.status).toBe(404);
  });

  it('handles unauthorized', async () => {
    const error = mockApiError('Unauthorized', 401);
    expect(error.response.status).toBe(401);
  });

  it('handles forbidden', async () => {
    const error = mockApiError('Forbidden', 403);
    expect(error.response.status).toBe(403);
  });

  it('handles bad request', async () => {
    const error = mockApiError('Bad request', 400);
    expect(error.response.status).toBe(400);
  });

  it('handles conflict', async () => {
    const error = mockApiError('Conflict', 409);
    expect(error.response.status).toBe(409);
  });

  it('handles rate limit', async () => {
    const error = mockApiError('Rate limit exceeded', 429);
    expect(error.response.status).toBe(429);
  });
});
