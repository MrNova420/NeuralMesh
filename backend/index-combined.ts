import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import nodesRouter from './src/routes/nodes';
import metricsRouter from './src/routes/metrics';
import statusRouter from './src/routes/status';
import { setupWebSocket } from './src/websocket/server';
import { setupAgentWebSocket } from './src/websocket/agentServer';

const app = new Hono();

// CORS
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'NeuralMesh API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    websocket: 'enabled',
    agentWebSocket: 'enabled',
  });
});

// API Routes
app.route('/api/nodes', nodesRouter);
app.route('/api/metrics', metricsRouter);
app.route('/api/status', statusRouter);

// Start HTTP server with Socket.IO for web clients
const httpServer = createServer(app.fetch.bind(app) as any);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
  },
});

setupWebSocket(io);

const PORT = process.env.PORT || 3001;

// Start server with both Socket.IO and raw WebSocket support
const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    
    // Raw WebSocket endpoint for agents
    if (url.pathname === '/agent') {
      const upgraded = server.upgrade(req, {
        data: {
          id: url.searchParams.get('id') || `agent-${Date.now()}`,
        },
      });
      
      if (upgraded) {
        return undefined;
      }
      
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
    
    // Regular HTTP requests go to Hono/Socket.IO
    return app.fetch(req);
  },
  websocket: setupAgentWebSocket(null),
});

// Also start Socket.IO server
httpServer.listen(PORT, () => {
  console.log('🔌 WebSocket server ready');
  console.log(`🚀 NeuralMesh API with WebSocket on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket ready at ws://localhost:${PORT}`);
  console.log(`🦀 Agent WebSocket ready at ws://localhost:${PORT}/agent`);
});

export default server;
