import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import nodesRouter from './src/routes/nodes';
import metricsRouter from './src/routes/metrics';
import statusRouter from './src/routes/status';
import authRouter from './src/routes/auth';
import actionsRouter from './src/routes/actions';
import analyticsRouter from './src/routes/analytics';
import serversRouter from './src/routes/servers';
import deviceRouter from './src/routes/devices';
import meshRouter from './src/routes/mesh';
import containersRouter from './src/routes/containers';
import cloudRouter from './src/routes/cloud';
import capabilitiesRouter from './src/routes/capabilities';
import { setupWebSocket } from './src/websocket/server';
import { setupAgentWebSocket } from './src/websocket/agentServer';
import { errorHandler } from './src/middleware/error';
import { logger } from './src/utils/logger';
import { testDatabaseConnection, closeDatabaseConnection } from './src/db';
import { stopMonitoringCycle } from './src/services/smartMonitoring';

const app = new Hono();

// Global error handler
app.use('*', errorHandler);

// Middleware
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'NeuralMesh API',
    version: '0.5.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    websocket: 'enabled',
    features: {
      authentication: true,
      database: true,
      rateLimit: true,
      nodeActions: true,
      smartMonitoring: true,
      analytics: true,
      caching: true,
      serverManagement: true,
      deviceTransformation: true,
      meshControl: true,
      containerManagement: true,
      cloudIntegration: true,
      serverClustering: true,
      autoScaling: true,
      backupAutomation: true,
      deploymentTemplates: true,
    },
  });
});

// Routes
app.route('/api/auth', authRouter);
app.route('/api/nodes', nodesRouter);
app.route('/api/metrics', metricsRouter);
app.route('/api/status', statusRouter);
app.route('/api/actions', actionsRouter);
app.route('/api/analytics', analyticsRouter);
app.route('/api/servers', serversRouter);
app.route('/api/devices', deviceRouter);
app.route('/api/mesh', meshRouter);
app.route('/api/containers', containersRouter);
app.route('/api/cloud', cloudRouter);
app.route('/api/capabilities', capabilitiesRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  logger.error(`Error: ${err.message}`);
  return c.json({ error: err.message }, 500);
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const agentPort = process.env.AGENT_PORT ? parseInt(process.env.AGENT_PORT) : 4001;

// Test database connection on startup
testDatabaseConnection().then((connected) => {
  if (connected) {
    logger.info('Database connection established');
  } else {
    logger.warn('Database not available, running in-memory mode');
  }
});

// Create HTTP server
const server = createServer((req, res) => {
  app.fetch(new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers as any,
  })).then(response => {
    res.writeHead(response.status, Object.fromEntries(response.headers));
    response.body?.pipeTo(new WritableStream({
      write(chunk) {
        res.write(chunk);
      },
      close() {
        res.end();
      }
    }));
  });
});

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupWebSocket(io);

// Raw WebSocket server for agents (dedicated port to avoid upgrade conflicts)
const agentWss = new WebSocketServer({
  port: agentPort,
  path: '/agent',
  perMessageDeflate: false,
});
setupAgentWebSocket(agentWss);

// Start server
server.listen(port, () => {
  logger.info(`🚀 NeuralMesh API v0.2.0 on http://localhost:${port}`);
  logger.info(`🔌 Socket.IO ready at ws://localhost:${port}`);
  logger.info(`🦀 Agent WebSocket ready at ws://localhost:${agentPort}/agent`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    stopMonitoringCycle();
    await closeDatabaseConnection();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    stopMonitoringCycle();
    await closeDatabaseConnection();
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});
