import { Hono } from 'hono';
import { smartMonitoring } from '../services/smartMonitoring';
import { optionalAuthMiddleware } from '../middleware/auth';
import { relaxedRateLimit } from '../middleware/rateLimit';

const analyticsRouter = new Hono();

// Apply middleware
analyticsRouter.use('*', relaxedRateLimit);
analyticsRouter.use('*', optionalAuthMiddleware);

// Get all node health scores
analyticsRouter.get('/health', async (c) => {
  const scores = await smartMonitoring.getAllHealthScores();
  return c.json({ scores, timestamp: new Date().toISOString() });
});

// Get insights for a specific node
analyticsRouter.get('/insights/:nodeId', async (c) => {
  const nodeId = c.req.param('nodeId');
  const insights = await smartMonitoring.getNodeInsights(nodeId);

  if (!insights) {
    return c.json({ error: 'Node not found' }, 404);
  }

  return c.json(insights);
});

// Get optimization recommendations for all nodes
analyticsRouter.get('/recommendations', async (c) => {
  const scores = await smartMonitoring.getAllHealthScores();
  
  const recommendations = scores
    .filter(score => score.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 10); // Top 10 nodes needing attention

  return c.json({
    count: recommendations.length,
    nodes: recommendations,
    timestamp: new Date().toISOString(),
  });
});

export default analyticsRouter;
