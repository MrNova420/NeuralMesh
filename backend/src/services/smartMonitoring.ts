import { nodeService } from './nodeService';
import { logger } from '../utils/logger';
import type { Node } from '../types';

interface MetricSnapshot {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkRx: number;
  networkTx: number;
}

interface NodeHealthScore {
  nodeId: string;
  score: number; // 0-100
  factors: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
    uptime: number;
  };
  prediction: 'stable' | 'degrading' | 'critical';
}

interface AnomalyDetection {
  nodeId: string;
  metric: string;
  currentValue: number;
  expectedRange: { min: number; max: number };
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

class SmartMonitoringService {
  private metricsHistory: Map<string, MetricSnapshot[]> = new Map();
  private readonly historySize = 100; // Keep last 100 snapshots per node
  private readonly anomalyThreshold = 2.5; // Standard deviations
  
  // Collect metrics snapshot for a node
  collectMetrics(node: Node): void {
    const snapshot: MetricSnapshot = {
      timestamp: Date.now(),
      cpuUsage: node.specs.cpu.usage,
      memoryUsage: node.specs.memory.usage,
      storageUsage: node.specs.storage.usage,
      networkRx: node.specs.network.rx,
      networkTx: node.specs.network.tx,
    };

    if (!this.metricsHistory.has(node.id)) {
      this.metricsHistory.set(node.id, []);
    }

    const history = this.metricsHistory.get(node.id)!;
    history.push(snapshot);

    // Keep only last N snapshots
    if (history.length > this.historySize) {
      history.shift();
    }
  }

  // Calculate health score for a node
  calculateHealthScore(node: Node): NodeHealthScore {
    const history = this.metricsHistory.get(node.id) || [];
    
    // Calculate individual factor scores (0-100, where 100 is best)
    const cpuScore = Math.max(0, 100 - node.specs.cpu.usage);
    const memoryScore = Math.max(0, 100 - node.specs.memory.usage);
    const storageScore = Math.max(0, 100 - node.specs.storage.usage);
    
    // Network score based on consistency (lower variance = better)
    const networkScore = this.calculateNetworkScore(history);
    
    // Uptime score (longer uptime = better, up to 30 days)
    const maxUptime = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
    const uptimeScore = Math.min(100, (node.uptime / maxUptime) * 100);

    // Weighted overall score
    const score = Math.round(
      cpuScore * 0.3 +
      memoryScore * 0.3 +
      storageScore * 0.2 +
      networkScore * 0.1 +
      uptimeScore * 0.1
    );

    // Predict trend
    const prediction = this.predictTrend(history, node);

    return {
      nodeId: node.id,
      score,
      factors: {
        cpu: Math.round(cpuScore),
        memory: Math.round(memoryScore),
        storage: Math.round(storageScore),
        network: Math.round(networkScore),
        uptime: Math.round(uptimeScore),
      },
      prediction,
    };
  }

  // Detect anomalies in node metrics
  detectAnomalies(node: Node): AnomalyDetection[] {
    const history = this.metricsHistory.get(node.id);
    if (!history || history.length < 10) {
      return []; // Need at least 10 data points
    }

    const anomalies: AnomalyDetection[] = [];

    // Check CPU usage
    const cpuAnomaly = this.detectMetricAnomaly(
      history.map(h => h.cpuUsage),
      node.specs.cpu.usage,
      'cpu'
    );
    if (cpuAnomaly) {
      anomalies.push({ ...cpuAnomaly, nodeId: node.id });
    }

    // Check memory usage
    const memoryAnomaly = this.detectMetricAnomaly(
      history.map(h => h.memoryUsage),
      node.specs.memory.usage,
      'memory'
    );
    if (memoryAnomaly) {
      anomalies.push({ ...memoryAnomaly, nodeId: node.id });
    }

    // Check storage usage
    const storageAnomaly = this.detectMetricAnomaly(
      history.map(h => h.storageUsage),
      node.specs.storage.usage,
      'storage'
    );
    if (storageAnomaly) {
      anomalies.push({ ...storageAnomaly, nodeId: node.id });
    }

    return anomalies;
  }

  // Get resource optimization recommendations
  getOptimizationRecommendations(node: Node): string[] {
    const recommendations: string[] = [];
    const health = this.calculateHealthScore(node);

    if (health.factors.cpu < 50) {
      recommendations.push('Consider upgrading CPU or redistributing workload');
    }

    if (health.factors.memory < 50) {
      recommendations.push('Memory usage is high - consider increasing RAM or optimizing applications');
    }

    if (health.factors.storage < 30) {
      recommendations.push('Storage is critically low - cleanup or expand storage capacity urgently');
    }

    if (health.prediction === 'degrading') {
      recommendations.push('Performance is degrading - investigate and address issues soon');
    }

    if (health.prediction === 'critical') {
      recommendations.push('URGENT: System health is critical - immediate action required');
    }

    // Check for underutilization
    if (node.specs.cpu.usage < 20 && node.specs.memory.usage < 30) {
      recommendations.push('Node is underutilized - consider consolidating workloads');
    }

    return recommendations;
  }

  // Calculate network score based on variance
  private calculateNetworkScore(history: MetricSnapshot[]): number {
    if (history.length < 2) return 100;

    const rxValues = history.map(h => h.networkRx);
    const txValues = history.map(h => h.networkTx);

    const rxVariance = this.calculateVariance(rxValues);
    const txVariance = this.calculateVariance(txValues);

    // Lower variance = more stable = better score
    // Normalize variance to 0-100 scale (arbitrary scaling)
    const rxScore = Math.max(0, 100 - Math.sqrt(rxVariance) / 10);
    const txScore = Math.max(0, 100 - Math.sqrt(txVariance) / 10);

    return (rxScore + txScore) / 2;
  }

  // Predict trend based on historical data
  private predictTrend(history: MetricSnapshot[], node: Node): 'stable' | 'degrading' | 'critical' {
    if (history.length < 5) return 'stable';

    // Get recent trend (last 5 snapshots)
    const recentHistory = history.slice(-5);
    
    // Calculate average rates of change
    const cpuTrend = this.calculateTrend(recentHistory.map(h => h.cpuUsage));
    const memoryTrend = this.calculateTrend(recentHistory.map(h => h.memoryUsage));
    const storageTrend = this.calculateTrend(recentHistory.map(h => h.storageUsage));

    // If any critical metric is increasing rapidly
    if (cpuTrend > 5 || memoryTrend > 5 || storageTrend > 3) {
      return 'critical';
    }

    // If metrics are increasing moderately
    if (cpuTrend > 2 || memoryTrend > 2 || storageTrend > 1) {
      return 'degrading';
    }

    // Check current state
    if (node.specs.cpu.usage > 90 || node.specs.memory.usage > 90 || node.specs.storage.usage > 95) {
      return 'critical';
    }

    return 'stable';
  }

  // Detect anomaly in a metric
  private detectMetricAnomaly(
    history: number[],
    currentValue: number,
    metric: string
  ): Omit<AnomalyDetection, 'nodeId'> | null {
    const mean = this.calculateMean(history);
    const stdDev = Math.sqrt(this.calculateVariance(history));

    const min = mean - this.anomalyThreshold * stdDev;
    const max = mean + this.anomalyThreshold * stdDev;

    if (currentValue < min || currentValue > max) {
      const deviation = Math.abs(currentValue - mean) / stdDev;
      
      let severity: 'low' | 'medium' | 'high' = 'low';
      if (deviation > 4) severity = 'high';
      else if (deviation > 3) severity = 'medium';

      return {
        metric,
        currentValue,
        expectedRange: { min: Math.max(0, min), max: Math.min(100, max) },
        severity,
        timestamp: new Date(),
      };
    }

    return null;
  }

  // Calculate mean
  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  // Calculate variance
  private calculateVariance(values: number[]): number {
    const mean = this.calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  // Calculate trend (average rate of change)
  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
      totalChange += values[i] - values[i - 1];
    }

    return totalChange / (values.length - 1);
  }

  // Periodic monitoring task
  async runMonitoringCycle(): Promise<void> {
    try {
      const nodes = await nodeService.getAllNodes();

      for (const node of nodes) {
        if (node.status === 'offline') continue;

        // Collect metrics
        this.collectMetrics(node);

        // Detect anomalies
        const anomalies = this.detectAnomalies(node);
        
        if (anomalies.length > 0) {
          logger.warn(`Anomalies detected for node ${node.name}:`, anomalies);
          // Could trigger alerts here
        }

        // Check health score
        const health = this.calculateHealthScore(node);
        
        if (health.score < 50) {
          logger.warn(`Low health score for node ${node.name}:`, health);
        }

        if (health.prediction === 'critical') {
          logger.error(`Critical prediction for node ${node.name} - immediate action needed`);
        }
      }
    } catch (error) {
      logger.error('Error in monitoring cycle:', error);
    }
  }

  // Get all health scores
  async getAllHealthScores(): Promise<NodeHealthScore[]> {
    const nodes = await nodeService.getAllNodes();
    return nodes
      .filter(node => node.status !== 'offline')
      .map(node => this.calculateHealthScore(node));
  }

  // Get node-specific insights
  async getNodeInsights(nodeId: string): Promise<{
    health: NodeHealthScore;
    anomalies: AnomalyDetection[];
    recommendations: string[];
  } | null> {
    const node = await nodeService.getNodeById(nodeId);
    if (!node) return null;

    return {
      health: this.calculateHealthScore(node),
      anomalies: this.detectAnomalies(node),
      recommendations: this.getOptimizationRecommendations(node),
    };
  }
}

export const smartMonitoring = new SmartMonitoringService();

// Start monitoring cycle (every 10 seconds)
setInterval(() => {
  smartMonitoring.runMonitoringCycle();
}, 10000);
