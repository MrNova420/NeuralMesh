import { z } from 'zod';

// Node validation schemas
export const nodeSpecsSchema = z.object({
  cpu: z.object({
    cores: z.number().min(1),
    usage: z.number().min(0).max(100),
    model: z.string(),
  }),
  memory: z.object({
    total: z.number().min(0),
    used: z.number().min(0),
    usage: z.number().min(0).max(100),
  }),
  storage: z.object({
    total: z.number().min(0),
    used: z.number().min(0),
    usage: z.number().min(0).max(100),
  }),
  network: z.object({
    rx: z.number().min(0),
    tx: z.number().min(0),
  }),
});

export const nodePlatformSchema = z.object({
  os: z.string(),
  arch: z.string(),
  hostname: z.string(),
  version: z.string().optional(),
});

export const nodeLocationSchema = z.object({
  region: z.string().optional(),
  ip: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export const nodeSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  type: z.enum(['alpha', 'beta', 'gamma', 'delta']),
  specs: nodeSpecsSchema,
  platform: nodePlatformSchema,
  location: nodeLocationSchema.optional(),
  connections: z.array(z.string()).optional(),
});

// User validation schemas
export const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Alert validation schemas
export const alertSchema = z.object({
  type: z.enum(['info', 'warning', 'critical', 'success']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  nodeId: z.string().optional(),
  nodeName: z.string().optional(),
});

// Action validation schemas
export const nodeActionSchema = z.object({
  action: z.enum(['restart', 'shutdown', 'disconnect', 'reconnect']),
  nodeId: z.string(),
});
