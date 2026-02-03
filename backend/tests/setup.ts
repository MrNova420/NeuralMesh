import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Mock database connection
let mockDb: any;

export const setupTestDatabase = async () => {
  mockDb = {
    query: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
  };
  
  console.log('Test database initialized');
  return mockDb;
};

export const teardownTestDatabase = async () => {
  if (mockDb) {
    console.log('Test database cleaned up');
    mockDb = null;
  }
};

export const createTestUser = async (overrides = {}) => {
  return {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    role: 'user',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
};

export const createTestNode = async (overrides = {}) => {
  return {
    id: 'test-node-id',
    name: 'Test Node',
    ipAddress: '192.168.1.100',
    status: 'online',
    cpu: 50,
    memory: 60,
    disk: 40,
    network: 100,
    ...overrides,
  };
};

export const createTestServer = async (overrides = {}) => {
  return {
    id: 'test-server-id',
    name: 'Test Server',
    type: 'web',
    status: 'running',
    nodeId: 'test-node-id',
    ...overrides,
  };
};

export const mockApiResponse = (data: any, status = 200) => {
  return { data, status, statusText: 'OK', headers: {}, config: {} };
};

export const mockApiError = (message: string, status = 500) => {
  const error: any = new Error(message);
  error.response = { data: { error: message }, status, statusText: 'Error' };
  return error;
};

beforeAll(async () => { await setupTestDatabase(); });
afterAll(async () => { await teardownTestDatabase(); });
beforeEach(() => { jest.clearAllMocks(); });

export { mockDb };
