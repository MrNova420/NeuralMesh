import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import nodesRouter from './src/routes/nodes';
import metricsRouter from './src/routes/metrics';
import statusRouter from './src/routes/status';

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

console.log(`🚀 NeuralMesh API starting on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});