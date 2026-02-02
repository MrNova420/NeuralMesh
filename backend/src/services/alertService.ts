export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  title: string;
  message: string;
  nodeId?: string;
  nodeName?: string;
  timestamp: Date;
  read: boolean;
}

export class AlertService {
  private alerts: Alert[] = [];
  private maxAlerts = 100;

  generateId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createAlert(
    type: Alert['type'],
    title: string,
    message: string,
    nodeId?: string,
    nodeName?: string
  ): Alert {
    const alert: Alert = {
      id: this.generateId(),
      type,
      title,
      message,
      nodeId,
      nodeName,
      timestamp: new Date(),
      read: false,
    };

    this.alerts.unshift(alert);

    // Keep only last N alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    return alert;
  }

  getAll(): Alert[] {
    return this.alerts;
  }

  getUnread(): Alert[] {
    return this.alerts.filter((a) => !a.read);
  }

  markAsRead(id: string): void {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) alert.read = true;
  }

  markAllAsRead(): void {
    this.alerts.forEach((a) => (a.read = false));
  }

  clear(): void {
    this.alerts = [];
  }

  // Auto-generate alerts based on node metrics
  checkNodeHealth(node: any): Alert | null {
    const { specs, name, id } = node;

    // Critical CPU
    if (specs.cpu.usage > 95) {
      return this.createAlert(
        'critical',
        'Critical CPU Usage',
        `${name} CPU usage at ${specs.cpu.usage.toFixed(1)}%`,
        id,
        name
      );
    }

    // Critical Memory
    if (specs.memory.usage > 95) {
      return this.createAlert(
        'critical',
        'Critical Memory Usage',
        `${name} memory usage at ${specs.memory.usage.toFixed(1)}%`,
        id,
        name
      );
    }

    // Warning CPU
    if (specs.cpu.usage > 80) {
      return this.createAlert(
        'warning',
        'High CPU Usage',
        `${name} CPU usage at ${specs.cpu.usage.toFixed(1)}%`,
        id,
        name
      );
    }

    // Warning Memory
    if (specs.memory.usage > 80) {
      return this.createAlert(
        'warning',
        'High Memory Usage',
        `${name} memory usage at ${specs.memory.usage.toFixed(1)}%`,
        id,
        name
      );
    }

    // Critical Storage
    if (specs.storage.usage > 95) {
      return this.createAlert(
        'critical',
        'Critical Storage Usage',
        `${name} storage usage at ${specs.storage.usage.toFixed(1)}%`,
        id,
        name
      );
    }

    return null;
  }
}

export const alertService = new AlertService();
