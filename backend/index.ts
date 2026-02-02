import { Hono } from 'hono';
import { cors } from 'hono/cors';
import nodesRouter from './src/routes/nodes';
import metricsRouter from './src/routes/metrics';
import statusRouter from './src/routes/status';
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
    agentWebSocket: 'enabled',
  });
});

// API Routes
app.route('/api/nodes', nodesRouter);
app.route('/api/metrics', metricsRouter);
app.route('/api/status', statusRouter);

const PORT = process.env.PORT || 3001;
const USE_MOCK_NODES = process.env.USE_MOCK_NODES === 'true';

// Bun server with WebSocket support for agents
Bun.serve({
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
    
    // Regular HTTP/API requests
    return app.fetch(req);
  },
  websocket: setupAgentWebSocket(null),
});

console.log(`🚀 NeuralMesh API on http://localhost:${PORT}`);
console.log(`🦀 Agent WebSocket at ws://localhost:${PORT}/agent`);
console.log(`📦 Mock nodes: ${USE_MOCK_NODES ? 'ENABLED' : 'DISABLED'}`);

export default app;
