import { pgTable, text, timestamp, integer, boolean, uuid, real, jsonb, index } from 'drizzle-orm/pg-core';

// Users table for authentication
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // bcrypt hashed
  role: text('role').notNull().default('user'), // admin, user, viewer
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').default(true).notNull(),
});

// Nodes table for persistent storage
export const nodes = pgTable('nodes', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // alpha, beta, gamma, delta
  status: text('status').notNull(), // healthy, warning, critical, offline
  
  // Specs stored as JSONB for flexibility
  specs: jsonb('specs').notNull(),
  
  // Platform info
  platform: jsonb('platform').notNull(),
  
  // Location
  location: jsonb('location'),
  
  // Connections
  connections: jsonb('connections').default([]),
  
  // Timestamps
  uptime: integer('uptime').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  typeIdx: index('nodes_type_idx').on(table.type),
  statusIdx: index('nodes_status_idx').on(table.status),
  lastSeenIdx: index('nodes_last_seen_idx').on(table.lastSeen),
}));

// Metrics history table for analytics
export const metricsHistory = pgTable('metrics_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  nodeId: text('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  
  // Metrics
  cpuUsage: real('cpu_usage').notNull(),
  memoryUsage: real('memory_usage').notNull(),
  storageUsage: real('storage_usage').notNull(),
  networkRx: real('network_rx').notNull(),
  networkTx: real('network_tx').notNull(),
  
  // Additional metrics
  cpuTemp: real('cpu_temp'),
  loadAvg: real('load_avg'),
}, (table) => ({
  nodeIdIdx: index('metrics_node_id_idx').on(table.nodeId),
  timestampIdx: index('metrics_timestamp_idx').on(table.timestamp),
  nodeTimestampIdx: index('metrics_node_timestamp_idx').on(table.nodeId, table.timestamp),
}));

// Alerts table
export const alerts = pgTable('alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull(), // info, warning, critical, success
  title: text('title').notNull(),
  message: text('message').notNull(),
  nodeId: text('node_id').references(() => nodes.id, { onDelete: 'cascade' }),
  nodeName: text('node_name'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  read: boolean('read').default(false).notNull(),
  resolved: boolean('resolved').default(false).notNull(),
  resolvedAt: timestamp('resolved_at'),
}, (table) => ({
  nodeIdIdx: index('alerts_node_id_idx').on(table.nodeId),
  readIdx: index('alerts_read_idx').on(table.read),
  timestampIdx: index('alerts_timestamp_idx').on(table.timestamp),
}));

// Audit log for tracking actions
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(), // node.restart, node.shutdown, user.login, etc.
  resource: text('resource').notNull(), // node id, user id, etc.
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('audit_user_id_idx').on(table.userId),
  timestampIdx: index('audit_timestamp_idx').on(table.timestamp),
  actionIdx: index('audit_action_idx').on(table.action),
}));

// Sessions table for JWT refresh tokens
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  refreshTokenIdx: index('sessions_refresh_token_idx').on(table.refreshToken),
}));
