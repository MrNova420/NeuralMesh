/**
 * Advanced Analytics Service
 * Provides comprehensive analytics and insights across the platform
 */

interface AnalyticsData {
  timestamp: number;
  metric: string;
  value: number;
  tags: Record<string, string>;
}

interface ResourceTrend {
  resource: string;
  current: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
  prediction: number;
}

interface UsageReport {
  period: string;
  totalCpu: number;
  totalMemory: number;
  totalDisk: number;
  totalNetwork: number;
  cost: number;
  efficiency: number;
}

class AdvancedAnalyticsService {
  private metricsBuffer: AnalyticsData[] = [];
  private readonly BUFFER_SIZE = 10000;
  private readonly AGGREGATION_INTERVAL = 60000; // 1 minute

  constructor() {
    this.startAggregation();
  }

  /**
   * Record a metric data point
   */
  async recordMetric(metric: string, value: number, tags: Record<string, string> = {}) {
    const data: AnalyticsData = {
      timestamp: Date.now(),
      metric,
      value,
      tags,
    };

    this.metricsBuffer.push(data);

    // Keep buffer size manageable
    if (this.metricsBuffer.length > this.BUFFER_SIZE) {
      this.metricsBuffer = this.metricsBuffer.slice(-this.BUFFER_SIZE);
    }

    return data;
  }

  /**
   * Get metrics for a specific time range
   */
  async getMetrics(metric: string, startTime: number, endTime: number) {
    return this.metricsBuffer.filter(
      (m) => m.metric === metric && m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Calculate resource trends
   */
  async getResourceTrends(resource: string, hours: number = 24): Promise<ResourceTrend> {
    const startTime = Date.now() - hours * 3600000;
    const metrics = await this.getMetrics(resource, startTime, Date.now());

    if (metrics.length === 0) {
      return {
        resource,
        current: 0,
        average: 0,
        trend: 'stable',
        prediction: 0,
      };
    }

    const values = metrics.map((m) => m.value);
    const current = values[values.length - 1];
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    // Simple trend calculation
    const recentAvg = values.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, values.length);
    const olderAvg = values.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, values.length);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg * 1.1) trend = 'up';
    else if (recentAvg < olderAvg * 0.9) trend = 'down';

    // Simple linear prediction
    const prediction = trend === 'up' ? current * 1.1 : trend === 'down' ? current * 0.9 : current;

    return { resource, current, average, trend, prediction };
  }

  /**
   * Generate usage report
   */
  async generateUsageReport(startTime: number, endTime: number): Promise<UsageReport> {
    const period = `${new Date(startTime).toLocaleDateString()} - ${new Date(endTime).toLocaleDateString()}`;

    const cpuMetrics = await this.getMetrics('cpu', startTime, endTime);
    const memoryMetrics = await this.getMetrics('memory', startTime, endTime);
    const diskMetrics = await this.getMetrics('disk', startTime, endTime);
    const networkMetrics = await this.getMetrics('network', startTime, endTime);

    const totalCpu = cpuMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalDisk = diskMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalNetwork = networkMetrics.reduce((sum, m) => sum + m.value, 0);

    // Calculate cost (example pricing)
    const cost = (totalCpu * 0.01 + totalMemory * 0.005 + totalDisk * 0.001 + totalNetwork * 0.0001) / 1000;

    // Calculate efficiency (example metric)
    const efficiency = Math.min(100, (totalCpu + totalMemory + totalDisk) / 300 * 100);

    return {
      period,
      totalCpu,
      totalMemory,
      totalDisk,
      totalNetwork,
      cost,
      efficiency,
    };
  }

  /**
   * Get top resource consumers
   */
  async getTopConsumers(metric: string, limit: number = 10) {
    const recentTime = Date.now() - 3600000; // Last hour
    const metrics = await this.getMetrics(metric, recentTime, Date.now());

    // Group by tags (e.g., nodeId, serverId)
    const consumers: Record<string, { total: number; count: number }> = {};

    metrics.forEach((m) => {
      const key = m.tags.nodeId || m.tags.serverId || 'unknown';
      if (!consumers[key]) {
        consumers[key] = { total: 0, count: 0 };
      }
      consumers[key].total += m.value;
      consumers[key].count += 1;
    });

    // Convert to array and sort
    return Object.entries(consumers)
      .map(([id, data]) => ({
        id,
        average: data.total / data.count,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  /**
   * Detect anomalies in metrics
   */
  async detectAnomalies(metric: string, threshold: number = 2) {
    const recentTime = Date.now() - 3600000; // Last hour
    const metrics = await this.getMetrics(metric, recentTime, Date.now());

    if (metrics.length < 10) return [];

    const values = metrics.map((m) => m.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Find anomalies (values beyond threshold standard deviations)
    return metrics.filter((m) => Math.abs(m.value - mean) > threshold * stdDev);
  }

  /**
   * Calculate correlation between two metrics
   */
  async calculateCorrelation(metric1: string, metric2: string, hours: number = 24) {
    const startTime = Date.now() - hours * 3600000;
    const m1 = await this.getMetrics(metric1, startTime, Date.now());
    const m2 = await this.getMetrics(metric2, startTime, Date.now());

    if (m1.length < 2 || m2.length < 2) return 0;

    // Simple correlation calculation
    const values1 = m1.map((m) => m.value);
    const values2 = m2.map((m) => m.value);
    const n = Math.min(values1.length, values2.length);

    const mean1 = values1.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const mean2 = values2.slice(0, n).reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      numerator += diff1 * diff2;
      denom1 += diff1 * diff1;
      denom2 += diff2 * diff2;
    }

    return numerator / Math.sqrt(denom1 * denom2) || 0;
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData() {
    const now = Date.now();
    const lastHour = now - 3600000;

    const [cpuTrend, memoryTrend, diskTrend, networkTrend] = await Promise.all([
      this.getResourceTrends('cpu', 24),
      this.getResourceTrends('memory', 24),
      this.getResourceTrends('disk', 24),
      this.getResourceTrends('network', 24),
    ]);

    const topCpuConsumers = await this.getTopConsumers('cpu', 5);
    const cpuAnomalies = await this.detectAnomalies('cpu');

    return {
      trends: {
        cpu: cpuTrend,
        memory: memoryTrend,
        disk: diskTrend,
        network: networkTrend,
      },
      topConsumers: {
        cpu: topCpuConsumers,
      },
      anomalies: {
        cpu: cpuAnomalies.length,
      },
      timestamp: now,
    };
  }

  /**
   * Start periodic aggregation
   */
  private startAggregation() {
    setInterval(() => {
      this.aggregateMetrics();
    }, this.AGGREGATION_INTERVAL);
  }

  /**
   * Aggregate old metrics to save memory
   */
  private aggregateMetrics() {
    // This would typically aggregate old metrics into summary statistics
    // For now, we just ensure buffer doesn't grow indefinitely
    if (this.metricsBuffer.length > this.BUFFER_SIZE * 0.9) {
      console.log('Aggregating metrics...');
      // Keep only recent metrics
      const cutoff = Date.now() - 86400000; // 24 hours
      this.metricsBuffer = this.metricsBuffer.filter((m) => m.timestamp > cutoff);
    }
  }
}

export default new AdvancedAnalyticsService();
