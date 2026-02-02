import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import nodesRouter from './src/routes/nodes';
import metricsRouter from './src/routes/metrics';
import statusRouter from './src/routes/status';
import { setupWebSocket } from './src/websocket/server';
import { setupAgentWebSocket } from './src/websocket/agentServer';

const app = new Hono();

// Middleware
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
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
  });
});

// Routes
app.route('/api/nodes', nodesRouter);
app.route('/api/metrics', metricsRouter);
app.route('/api/status', statusRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);
  return c.json({ error: err.message }, 500);
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const agentPort = process.env.AGENT_PORT ? parseInt(process.env.AGENT_PORT) : 4001;

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
  console.log(`🚀 NeuralMesh API with WebSocket on http://localhost:${port}`);
  console.log(`🔌 Socket.IO ready at ws://localhost:${port}`);
  console.log(`🦀 Agent WebSocket ready at ws://localhost:${agentPort}/agent`);
});
