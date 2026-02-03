import { Pool } from 'pg';
import Redis from 'ioredis';
import logger from '../utils/logger';

interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels: Record<string, string>;
}

interface PrometheusConfig {
  endpoint: string;
  scrapeInterval: number;
  retention: string;
}

interface GrafanaConfig {
  url: string;
  apiKey: string;
  orgId: number;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  notificationChannels: string[];
}

export class MonitoringIntegrationService {
  private db: Pool;
  private redis: Redis;
  private prometheusConfig: PrometheusConfig;
  private grafanaConfig: GrafanaConfig;
  private metrics: Map<string, MetricData[]>;
  private alertRules: Map<string, AlertRule>;

  constructor(db: Pool, redis: Redis) {
    this.db = db;
    this.redis = redis;
    this.metrics = new Map();
    this.alertRules = new Map();
    
    this.prometheusConfig = {
      endpoint: process.env.PROMETHEUS_ENDPOINT || 'http://localhost:9090',
      scrapeInterval: 15,
      retention: '30d'
    };

    this.grafanaConfig = {
      url: process.env.GRAFANA_URL || 'http://localhost:3000',
      apiKey: process.env.GRAFANA_API_KEY || '',
      orgId: 1
    };
  }

  async setupPrometheusIntegration(): Promise<void> {
    try {
      logger.info('Setting up Prometheus integration');
      
      // Create Prometheus configuration
      const config = {
        global: {
          scrape_interval: `${this.prometheusConfig.scrapeInterval}s`,
          evaluation_interval: '15s',
        },
        scrape_configs: [
          {
            job_name: 'neuralmesh-backend',
            static_configs: [
              {
                targets: ['localhost:3000'],
                labels: { service: 'backend' }
              }
            ]
          },
          {
            job_name: 'neuralmesh-frontend',
            static_configs: [
              {
                targets: ['localhost:5173'],
                labels: { service: 'frontend' }
              }
            ]
          },
          {
            job_name: 'neuralmesh-agents',
            static_configs: [
              {
                targets: ['localhost:8080'],
                labels: { service: 'agents' }
              }
            ]
          }
        ]
      };

      await this.redis.set('prometheus:config', JSON.stringify(config));
      logger.info('Prometheus integration setup complete');
    } catch (error) {
      logger.error('Failed to setup Prometheus integration:', error);
      throw error;
    }
  }

  async setupGrafanaIntegration(): Promise<void> {
    try {
      logger.info('Setting up Grafana integration');
      
      // Create Grafana dashboards
      const dashboards = [
        {
          title: 'NeuralMesh Overview',
          panels: [
            { title: 'System CPU', type: 'graph', metric: 'system_cpu_usage' },
            { title: 'Memory Usage', type: 'graph', metric: 'system_memory_usage' },
            { title: 'Network Traffic', type: 'graph', metric: 'network_bytes_total' },
            { title: 'Active Nodes', type: 'stat', metric: 'node_count_active' }
          ]
        },
        {
          title: 'Node Performance',
          panels: [
            { title: 'Node CPU', type: 'graph', metric: 'node_cpu_usage' },
            { title: 'Node Memory', type: 'graph', metric: 'node_memory_usage' },
            { title: 'Node Disk I/O', type: 'graph', metric: 'node_disk_io' },
            { title: 'Node Network', type: 'graph', metric: 'node_network_usage' }
          ]
        },
        {
          title: 'Application Metrics',
          panels: [
            { title: 'Request Rate', type: 'graph', metric: 'http_requests_total' },
            { title: 'Response Time', type: 'graph', metric: 'http_request_duration' },
            { title: 'Error Rate', type: 'graph', metric: 'http_errors_total' },
            { title: 'Active Connections', type: 'stat', metric: 'active_connections' }
          ]
        }
      ];

      for (const dashboard of dashboards) {
        await this.createGrafanaDashboard(dashboard);
      }

      logger.info('Grafana integration setup complete');
    } catch (error) {
      logger.error('Failed to setup Grafana integration:', error);
      throw error;
    }
  }

  async createGrafanaDashboard(dashboard: any): Promise<void> {
    const dashboardData = {
      dashboard: {
        title: dashboard.title,
        panels: dashboard.panels.map((panel: any, index: number) => ({
          id: index + 1,
          title: panel.title,
          type: panel.type,
          targets: [
            {
              expr: panel.metric,
              refId: 'A'
            }
          ],
          gridPos: { x: (index % 2) * 12, y: Math.floor(index / 2) * 8, w: 12, h: 8 }
        })),
        schemaVersion: 26,
        version: 0
      },
      overwrite: true
    };

    await this.redis.set(
      `grafana:dashboard:${dashboard.title}`,
      JSON.stringify(dashboardData)
    );
  }

  async collectMetrics(): Promise<MetricData[]> {
    try {
      const metrics: MetricData[] = [];
      
      // System metrics
      const systemMetrics = await this.getSystemMetrics();
      metrics.push(...systemMetrics);

      // Node metrics
      const nodeMetrics = await this.getNodeMetrics();
      metrics.push(...nodeMetrics);

      // Application metrics
      const appMetrics = await this.getApplicationMetrics();
      metrics.push(...appMetrics);

      // Store metrics in Redis for quick access
      await this.redis.setex(
        'metrics:latest',
        300,
        JSON.stringify(metrics)
      );

      return metrics;
    } catch (error) {
      logger.error('Failed to collect metrics:', error);
      throw error;
    }
  }

  async getSystemMetrics(): Promise<MetricData[]> {
    const metrics: MetricData[] = [];
    const timestamp = new Date();

    // Simulate system metrics (in real implementation, would use system APIs)
    metrics.push({
      name: 'system_cpu_usage',
      value: Math.random() * 100,
      timestamp,
      labels: { host: 'main-server' }
    });

    metrics.push({
      name: 'system_memory_usage',
      value: Math.random() * 100,
      timestamp,
      labels: { host: 'main-server' }
    });

    metrics.push({
      name: 'system_disk_usage',
      value: Math.random() * 100,
      timestamp,
      labels: { host: 'main-server', device: '/dev/sda1' }
    });

    return metrics;
  }

  async getNodeMetrics(): Promise<MetricData[]> {
    const nodes = await this.db.query('SELECT * FROM nodes WHERE status = $1', ['active']);
    const metrics: MetricData[] = [];
    const timestamp = new Date();

    for (const node of nodes.rows) {
      metrics.push({
        name: 'node_cpu_usage',
        value: Math.random() * 100,
        timestamp,
        labels: { node_id: node.id, node_name: node.name }
      });

      metrics.push({
        name: 'node_memory_usage',
        value: Math.random() * 100,
        timestamp,
        labels: { node_id: node.id, node_name: node.name }
      });
    }

    return metrics;
  }

  async getApplicationMetrics(): Promise<MetricData[]> {
    const metrics: MetricData[] = [];
    const timestamp = new Date();

    // Get request metrics
    const requests = await this.redis.get('metrics:requests:total');
    metrics.push({
      name: 'http_requests_total',
      value: parseInt(requests || '0', 10),
      timestamp,
      labels: { service: 'backend' }
    });

    // Get error metrics
    const errors = await this.redis.get('metrics:errors:total');
    metrics.push({
      name: 'http_errors_total',
      value: parseInt(errors || '0', 10),
      timestamp,
      labels: { service: 'backend' }
    });

    return metrics;
  }

  async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    try {
      const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const alertRule: AlertRule = { id, ...rule };

      await this.db.query(
        `INSERT INTO alert_rules (id, name, condition, threshold, duration, severity, notification_channels)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          alertRule.id,
          alertRule.name,
          alertRule.condition,
          alertRule.threshold,
          alertRule.duration,
          alertRule.severity,
          JSON.stringify(alertRule.notificationChannels)
        ]
      );

      this.alertRules.set(id, alertRule);
      logger.info(`Alert rule created: ${alertRule.name}`);

      return alertRule;
    } catch (error) {
      logger.error('Failed to create alert rule:', error);
      throw error;
    }
  }

  async evaluateAlertRules(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      
      for (const [id, rule] of this.alertRules) {
        const relevantMetrics = metrics.filter(m => 
          m.name === rule.condition.split(' ')[0]
        );

        for (const metric of relevantMetrics) {
          if (this.evaluateCondition(metric.value, rule.condition, rule.threshold)) {
            await this.triggerAlert(rule, metric);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to evaluate alert rules:', error);
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    if (condition.includes('>')) {
      return value > threshold;
    } else if (condition.includes('<')) {
      return value < threshold;
    } else if (condition.includes('==')) {
      return value === threshold;
    }
    return false;
  }

  async triggerAlert(rule: AlertRule, metric: MetricData): Promise<void> {
    logger.warn(`Alert triggered: ${rule.name}`, {
      metric: metric.name,
      value: metric.value,
      threshold: rule.threshold,
      severity: rule.severity
    });

    await this.db.query(
      `INSERT INTO alerts (rule_id, metric_name, metric_value, threshold, severity, triggered_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [rule.id, metric.name, metric.value, rule.threshold, rule.severity, new Date()]
    );

    // Send notifications
    for (const channel of rule.notificationChannels) {
      await this.sendNotification(channel, rule, metric);
    }
  }

  async sendNotification(channel: string, rule: AlertRule, metric: MetricData): Promise<void> {
    // Implementation would send to actual notification channels (email, Slack, etc.)
    logger.info(`Notification sent to ${channel}`, {
      alert: rule.name,
      metric: metric.name,
      value: metric.value
    });
  }

  async getMetricHistory(metricName: string, startTime: Date, endTime: Date): Promise<MetricData[]> {
    const cacheKey = `metrics:history:${metricName}:${startTime.getTime()}:${endTime.getTime()}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // In real implementation, would query time-series database
    const metrics: MetricData[] = [];
    await this.redis.setex(cacheKey, 300, JSON.stringify(metrics));
    
    return metrics;
  }

  async getMetricsSnapshot(): Promise<Record<string, any>> {
    const metrics = await this.collectMetrics();
    
    return {
      timestamp: new Date(),
      system: metrics.filter(m => m.name.startsWith('system_')),
      nodes: metrics.filter(m => m.name.startsWith('node_')),
      application: metrics.filter(m => m.name.startsWith('http_')),
      total_metrics: metrics.length
    };
  }
}

export default MonitoringIntegrationService;
