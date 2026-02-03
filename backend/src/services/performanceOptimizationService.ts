import { Pool } from 'pg';
import Redis from 'ioredis';
import logger from '../utils/logger';

interface PerformanceMetric {
  timestamp: Date;
  metricType: string;
  value: number;
  metadata?: Record<string, any>;
}

interface OptimizationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: number;
}

interface OptimizationResult {
  ruleId: string;
  appliedAt: Date;
  improvements: {
    metric: string;
    before: number;
    after: number;
    improvement: number;
  }[];
}

export class PerformanceOptimizationService {
  private db: Pool;
  private redis: Redis;
  private optimizationRules: Map<string, OptimizationRule>;
  private performanceBaseline: Map<string, number>;

  constructor(db: Pool, redis: Redis) {
    this.db = db;
    this.redis = redis;
    this.optimizationRules = new Map();
    this.performanceBaseline = new Map();
    this.initializeRules();
  }

  private initializeRules(): void {
    const defaultRules: OptimizationRule[] = [
      {
        id: 'cpu-scaling',
        name: 'Auto-scale CPU resources',
        condition: 'cpu_usage > 80',
        action: 'scale_up_cpu',
        enabled: true,
        priority: 1
      },
      {
        id: 'memory-optimization',
        name: 'Optimize memory usage',
        condition: 'memory_usage > 85',
        action: 'optimize_memory',
        enabled: true,
        priority: 2
      },
      {
        id: 'cache-warming',
        name: 'Warm up cache',
        condition: 'cache_hit_rate < 70',
        action: 'warm_cache',
        enabled: true,
        priority: 3
      },
      {
        id: 'connection-pooling',
        name: 'Adjust connection pool',
        condition: 'active_connections > 90',
        action: 'adjust_pool_size',
        enabled: true,
        priority: 4
      }
    ];

    for (const rule of defaultRules) {
      this.optimizationRules.set(rule.id, rule);
    }
  }

  async analyzePerformance(targetId: string, targetType: string): Promise<PerformanceMetric[]> {
    try {
      logger.info(`Analyzing performance for ${targetType}: ${targetId}`);

      const metrics: PerformanceMetric[] = [];
      const now = new Date();

      // CPU metrics
      metrics.push({
        timestamp: now,
        metricType: 'cpu_usage',
        value: await this.getCPUUsage(targetId),
        metadata: { targetId, targetType }
      });

      // Memory metrics
      metrics.push({
        timestamp: now,
        metricType: 'memory_usage',
        value: await this.getMemoryUsage(targetId),
        metadata: { targetId, targetType }
      });

      // I/O metrics
      metrics.push({
        timestamp: now,
        metricType: 'disk_io',
        value: await this.getDiskIO(targetId),
        metadata: { targetId, targetType }
      });

      // Network metrics
      metrics.push({
        timestamp: now,
        metricType: 'network_throughput',
        value: await this.getNetworkThroughput(targetId),
        metadata: { targetId, targetType }
      });

      // Application metrics
      metrics.push({
        timestamp: now,
        metricType: 'response_time',
        value: await this.getResponseTime(targetId),
        metadata: { targetId, targetType }
      });

      metrics.push({
        timestamp: now,
        metricType: 'throughput',
        value: await this.getThroughput(targetId),
        metadata: { targetId, targetType }
      });

      // Store metrics
      await this.storeMetrics(targetId, metrics);

      return metrics;
    } catch (error) {
      logger.error('Failed to analyze performance:', error);
      throw error;
    }
  }

  private async getCPUUsage(targetId: string): Promise<number> {
    // Simulate CPU usage - in real implementation would query actual system
    return Math.random() * 100;
  }

  private async getMemoryUsage(targetId: string): Promise<number> {
    return Math.random() * 100;
  }

  private async getDiskIO(targetId: string): Promise<number> {
    return Math.random() * 1000; // MB/s
  }

  private async getNetworkThroughput(targetId: string): Promise<number> {
    return Math.random() * 1000; // Mbps
  }

  private async getResponseTime(targetId: string): Promise<number> {
    return Math.random() * 100; // ms
  }

  private async getThroughput(targetId: string): Promise<number> {
    return Math.random() * 1000; // requests/sec
  }

  private async storeMetrics(targetId: string, metrics: PerformanceMetric[]): Promise<void> {
    const key = `performance:metrics:${targetId}`;
    await this.redis.lpush(key, JSON.stringify(metrics));
    await this.redis.ltrim(key, 0, 999); // Keep last 1000 entries
    await this.redis.expire(key, 86400); // 24 hours
  }

  async optimizePerformance(targetId: string): Promise<OptimizationResult[]> {
    try {
      logger.info(`Starting performance optimization for: ${targetId}`);

      const metrics = await this.analyzePerformance(targetId, 'node');
      const results: OptimizationResult[] = [];

      // Sort rules by priority
      const sortedRules = Array.from(this.optimizationRules.values())
        .filter(rule => rule.enabled)
        .sort((a, b) => a.priority - b.priority);

      for (const rule of sortedRules) {
        if (this.evaluateCondition(rule.condition, metrics)) {
          logger.info(`Applying optimization rule: ${rule.name}`);
          const result = await this.applyOptimization(targetId, rule, metrics);
          results.push(result);
        }
      }

      logger.info(`Optimization complete. Applied ${results.length} optimizations`);
      return results;
    } catch (error) {
      logger.error('Failed to optimize performance:', error);
      throw error;
    }
  }

  private evaluateCondition(condition: string, metrics: PerformanceMetric[]): boolean {
    // Parse condition (e.g., "cpu_usage > 80")
    const parts = condition.split(' ');
    if (parts.length !== 3) return false;

    const [metricType, operator, thresholdStr] = parts;
    const threshold = parseFloat(thresholdStr);
    const metric = metrics.find(m => m.metricType === metricType);

    if (!metric) return false;

    switch (operator) {
      case '>': return metric.value > threshold;
      case '<': return metric.value < threshold;
      case '>=': return metric.value >= threshold;
      case '<=': return metric.value <= threshold;
      case '==': return metric.value === threshold;
      default: return false;
    }
  }

  private async applyOptimization(
    targetId: string,
    rule: OptimizationRule,
    currentMetrics: PerformanceMetric[]
  ): Promise<OptimizationResult> {
    const before = currentMetrics.find(m => m.metricType === rule.condition.split(' ')[0])?.value || 0;
    
    // Apply optimization action
    switch (rule.action) {
      case 'scale_up_cpu':
        await this.scaleCPUResources(targetId, 'up');
        break;
      case 'optimize_memory':
        await this.optimizeMemory(targetId);
        break;
      case 'warm_cache':
        await this.warmCache(targetId);
        break;
      case 'adjust_pool_size':
        await this.adjustConnectionPool(targetId);
        break;
    }

    // Measure improvement
    await new Promise(resolve => setTimeout(resolve, 1000));
    const afterMetrics = await this.analyzePerformance(targetId, 'node');
    const after = afterMetrics.find(m => m.metricType === rule.condition.split(' ')[0])?.value || 0;

    return {
      ruleId: rule.id,
      appliedAt: new Date(),
      improvements: [{
        metric: rule.condition.split(' ')[0],
        before,
        after,
        improvement: ((before - after) / before) * 100
      }]
    };
  }

  private async scaleCPUResources(targetId: string, direction: 'up' | 'down'): Promise<void> {
    logger.info(`Scaling CPU resources ${direction} for: ${targetId}`);
    await this.db.query(
      `UPDATE nodes SET cpu_allocation = cpu_allocation ${direction === 'up' ? '+' : '-'} 1 WHERE id = $1`,
      [targetId]
    );
  }

  private async optimizeMemory(targetId: string): Promise<void> {
    logger.info(`Optimizing memory for: ${targetId}`);
    // Clear unused cache, optimize garbage collection, etc.
    await this.redis.del(`cache:${targetId}:*`);
  }

  private async warmCache(targetId: string): Promise<void> {
    logger.info(`Warming cache for: ${targetId}`);
    // Pre-load frequently accessed data
    const frequentQueries = await this.db.query(
      'SELECT query FROM query_stats WHERE target_id = $1 ORDER BY frequency DESC LIMIT 10',
      [targetId]
    );
    // Execute and cache results
  }

  private async adjustConnectionPool(targetId: string): Promise<void> {
    logger.info(`Adjusting connection pool for: ${targetId}`);
    await this.db.query(
      'UPDATE connection_pools SET max_connections = max_connections + 10 WHERE target_id = $1',
      [targetId]
    );
  }

  async createOptimizationRule(rule: Omit<OptimizationRule, 'id'>): Promise<OptimizationRule> {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimizationRule: OptimizationRule = { id, ...rule };

    await this.db.query(
      `INSERT INTO optimization_rules (id, name, condition, action, enabled, priority)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [optimizationRule.id, optimizationRule.name, optimizationRule.condition, 
       optimizationRule.action, optimizationRule.enabled, optimizationRule.priority]
    );

    this.optimizationRules.set(id, optimizationRule);
    return optimizationRule;
  }

  async getPerformanceReport(targetId: string, period: string = '24h'): Promise<any> {
    const metricsKey = `performance:metrics:${targetId}`;
    const metricsData = await this.redis.lrange(metricsKey, 0, -1);
    
    const allMetrics = metricsData.map(data => JSON.parse(data)).flat();
    
    const cpuMetrics = allMetrics.filter(m => m.metricType === 'cpu_usage');
    const memoryMetrics = allMetrics.filter(m => m.metricType === 'memory_usage');
    const responseTimeMetrics = allMetrics.filter(m => m.metricType === 'response_time');

    return {
      targetId,
      period,
      summary: {
        avgCPU: this.calculateAverage(cpuMetrics.map(m => m.value)),
        avgMemory: this.calculateAverage(memoryMetrics.map(m => m.value)),
        avgResponseTime: this.calculateAverage(responseTimeMetrics.map(m => m.value)),
        peakCPU: Math.max(...cpuMetrics.map(m => m.value)),
        peakMemory: Math.max(...memoryMetrics.map(m => m.value))
      },
      recommendations: await this.generateRecommendations(allMetrics)
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async generateRecommendations(metrics: PerformanceMetric[]): Promise<string[]> {
    const recommendations: string[] = [];

    const avgCPU = this.calculateAverage(
      metrics.filter(m => m.metricType === 'cpu_usage').map(m => m.value)
    );
    
    if (avgCPU > 70) {
      recommendations.push('Consider scaling up CPU resources or optimizing application code');
    }

    const avgMemory = this.calculateAverage(
      metrics.filter(m => m.metricType === 'memory_usage').map(m => m.value)
    );
    
    if (avgMemory > 80) {
      recommendations.push('Memory usage is high. Review for memory leaks or consider adding more RAM');
    }

    return recommendations;
  }

  async setPerformanceBaseline(targetId: string): Promise<void> {
    const metrics = await this.analyzePerformance(targetId, 'node');
    
    for (const metric of metrics) {
      this.performanceBaseline.set(`${targetId}:${metric.metricType}`, metric.value);
    }

    await this.redis.set(
      `performance:baseline:${targetId}`,
      JSON.stringify(Array.from(this.performanceBaseline.entries())),
      'EX',
      2592000 // 30 days
    );

    logger.info(`Performance baseline set for: ${targetId}`);
  }

  async compareToBaseline(targetId: string): Promise<any> {
    const baselineData = await this.redis.get(`performance:baseline:${targetId}`);
    if (!baselineData) {
      throw new Error('No baseline found for target');
    }

    const baseline = new Map(JSON.parse(baselineData));
    const currentMetrics = await this.analyzePerformance(targetId, 'node');

    const comparison = currentMetrics.map(metric => {
      const baselineValue = baseline.get(`${targetId}:${metric.metricType}`) || 0;
      const change = ((metric.value - baselineValue) / baselineValue) * 100;

      return {
        metric: metric.metricType,
        baseline: baselineValue,
        current: metric.value,
        change: change.toFixed(2) + '%',
        status: Math.abs(change) < 10 ? 'stable' : change > 0 ? 'degraded' : 'improved'
      };
    });

    return {
      targetId,
      comparisonDate: new Date(),
      metrics: comparison
    };
  }
}

export default PerformanceOptimizationService;
