import { useState, useEffect } from 'react';
import api from '../services/api';

interface SystemMetric {
  timestamp: number;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  lastCheck: number;
  responseTime: number;
}

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  service: string;
  message: string;
}

export default function AdvancedMonitoringPage() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    if (autoRefresh) {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      const [metricsRes, servicesRes, logsRes] = await Promise.all([
        api.get('/metrics/system'),
        api.get('/status/services'),
        api.get('/logs/recent')
      ]);
      setMetrics(metricsRes.data || []);
      setServices(servicesRes.data || []);
      setLogs(logsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20';
      case 'degraded': return 'text-yellow-400 bg-yellow-500/20';
      case 'down': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'warn': return 'text-yellow-400 bg-yellow-500/20';
      case 'info': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const filteredLogs = selectedLogLevel === 'all' 
    ? logs 
    : logs.filter(log => log.level === selectedLogLevel);

  const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Advanced Monitoring
            </h1>
            <p className="text-gray-400">Real-time system metrics and service health</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Auto-refresh</span>
            </label>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>

        {/* System Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">CPU Usage</span>
              <svg className="w-5 h-5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold mb-2">{latestMetrics?.cpu.toFixed(1) || 0}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${latestMetrics?.cpu || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Memory Usage</span>
              <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"></path>
                <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"></path>
                <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold mb-2">{latestMetrics?.memory.toFixed(1) || 0}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{ width: `${latestMetrics?.memory || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Disk Usage</span>
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold mb-2">{latestMetrics?.disk.toFixed(1) || 0}%</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${latestMetrics?.disk || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Network</span>
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold mb-2">{latestMetrics?.network.toFixed(0) || 0} Mbps</div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((latestMetrics?.network || 0) / 10, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Service Health */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Service Health</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Uptime</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Response Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Last Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {services.map(service => (
                  <tr key={service.name} className="hover:bg-gray-750">
                    <td className="px-6 py-4 text-sm font-medium">{service.name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{formatUptime(service.uptime)}</td>
                    <td className="px-6 py-4 text-sm">{service.responseTime}ms</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(service.lastCheck).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Logs */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">System Logs</h2>
            <select
              value={selectedLogLevel}
              onChange={(e) => setSelectedLogLevel(e.target.value)}
              className="px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
            {filteredLogs.map(log => (
              <div key={log.id} className="mb-2 p-3 bg-gray-750 rounded hover:bg-gray-700 transition-colors">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{log.service}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300">{log.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
