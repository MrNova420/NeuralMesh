import { useState, useEffect } from 'react';
import { StatsGrid, ActivityFeed, QuickActions, NodeStatusList, MetricChart } from '../components/ui';
import { motion } from 'framer-motion';

// Mock data generator
function generateMockData() {
  return {
    stats: {
      totalNodes: 12,
      activeConnections: 47,
      cpuUsage: Math.floor(Math.random() * 30 + 40),
      memoryUsage: Math.floor(Math.random() * 20 + 50),
      totalStorage: '2.4 TB',
      networkThroughput: '847 MB/s',
    },
    activities: [
      {
        id: '1',
        type: 'node_join' as const,
        message: 'Node alpha-server-03 joined the network',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        status: 'healthy' as const,
      },
      {
        id: '2',
        type: 'deployment' as const,
        message: 'Deployed web-api-v2.1.0 to 5 nodes',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: 'healthy' as const,
      },
      {
        id: '3',
        type: 'optimization' as const,
        message: 'Auto-scaled CPU allocation on gamma-mobile-02',
        timestamp: new Date(Date.now() - 28 * 60 * 1000),
        status: 'healthy' as const,
      },
      {
        id: '4',
        type: 'alert' as const,
        message: 'High memory usage on beta-server-01 (85%)',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        status: 'warning' as const,
      },
      {
        id: '5',
        type: 'node_leave' as const,
        message: 'Node delta-pi-05 disconnected (maintenance)',
        timestamp: new Date(Date.now() - 62 * 60 * 1000),
        status: 'offline' as const,
      },
    ],
    nodes: [
      {
        id: 'n1',
        name: 'alpha-server-01',
        status: 'healthy' as const,
        type: 'alpha' as const,
        cpu: 42,
        memory: 68,
        storage: 45,
        uptime: '45d 12h',
      },
      {
        id: 'n2',
        name: 'alpha-server-02',
        status: 'healthy' as const,
        type: 'alpha' as const,
        cpu: 38,
        memory: 52,
        storage: 62,
        uptime: '30d 8h',
      },
      {
        id: 'n3',
        name: 'beta-server-01',
        status: 'warning' as const,
        type: 'beta' as const,
        cpu: 72,
        memory: 85,
        storage: 78,
        uptime: '12d 3h',
      },
      {
        id: 'n4',
        name: 'gamma-mobile-01',
        status: 'healthy' as const,
        type: 'gamma' as const,
        cpu: 28,
        memory: 45,
        storage: 34,
        uptime: '8d 15h',
      },
      {
        id: 'n5',
        name: 'gamma-mobile-02',
        status: 'healthy' as const,
        type: 'gamma' as const,
        cpu: 35,
        memory: 58,
        storage: 42,
        uptime: '5d 22h',
      },
      {
        id: 'n6',
        name: 'delta-pi-03',
        status: 'healthy' as const,
        type: 'delta' as const,
        cpu: 18,
        memory: 32,
        storage: 55,
        uptime: '89d 4h',
      },
    ],
    cpuMetrics: Array.from({ length: 20 }, (_, i) => 
      40 + Math.sin(i * 0.5) * 15 + Math.random() * 10
    ),
    memoryMetrics: Array.from({ length: 20 }, (_, i) => 
      55 + Math.cos(i * 0.3) * 10 + Math.random() * 8
    ),
    networkMetrics: Array.from({ length: 20 }, (_, i) => 
      700 + Math.sin(i * 0.7) * 100 + Math.random() * 50
    ),
  };
}

export function DashboardPage() {
  const [data, setData] = useState(generateMockData());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateMockData());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold text-neural-text mb-2">Dashboard</h1>
        <p className="text-neutral-text-secondary">
          Monitor your neural mesh network in real-time
        </p>
      </motion.div>

      {/* Stats Grid */}
      <StatsGrid data={data.stats} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricChart
          title="CPU Usage (%)"
          data={data.cpuMetrics}
          color="#58a6ff"
          height={120}
        />
        <MetricChart
          title="Memory Usage (%)"
          data={data.memoryMetrics}
          color="#a371f7"
          height={120}
        />
        <MetricChart
          title="Network (MB/s)"
          data={data.networkMetrics}
          color="#3fb950"
          height={120}
        />
      </div>

      {/* Activity Feed and Node Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={data.activities} />
        <NodeStatusList nodes={data.nodes} />
      </div>
    </div>
  );
}

