import { useState, useEffect } from 'react';
import { StatsGrid, ActivityFeed, QuickActions, NodeStatusList, MetricChart } from '../components/ui';
import { motion } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiService } from '../services/api';

interface NodeData {
  id: string;
  name: string;
  type: 'alpha' | 'beta' | 'gamma' | 'delta';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  specs: {
    cpu: { cores: number; usage: number; model: string };
    memory: { total: number; used: number; usage: number };
    storage: { total: number; used: number; usage: number };
    network: { rx: number; tx: number };
  };
  connections: string[];
  uptime: number;
}

export function DashboardPage() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const [networkHistory, setNetworkHistory] = useState<number[]>([]);

  const { isConnected, on, emit } = useWebSocket({
    onConnect: () => {
      console.log('✅ Connected to real-time updates');
      emit('nodes:subscribe');
    },
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiService.getAllNodes();
        setNodes(response.data.nodes);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch nodes:', err);
        setError('Failed to connect to backend');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleNodesUpdate = (data: { nodes: NodeData[]; timestamp: string }) => {
      console.log('📊 Received node updates:', data.timestamp);
      setNodes(data.nodes);

      // Update metrics history
      const avgCpu = data.nodes.reduce((sum, n) => sum + n.specs.cpu.usage, 0) / data.nodes.length;
      const avgMemory = data.nodes.reduce((sum, n) => sum + n.specs.memory.usage, 0) / data.nodes.length;
      const totalNetwork = data.nodes.reduce((sum, n) => sum + n.specs.network.rx + n.specs.network.tx, 0);

      setCpuHistory(prev => [...prev.slice(-19), avgCpu]);
      setMemoryHistory(prev => [...prev.slice(-19), avgMemory]);
      setNetworkHistory(prev => [...prev.slice(-19), totalNetwork]);
    };

    on('nodes:update', handleNodesUpdate);
    on('nodes:initial', handleNodesUpdate);

    return () => {
      // Cleanup listeners
    };
  }, [on]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-neural-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neural-text">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <p className="text-neural-red text-lg mb-2">⚠️ Connection Error</p>
          <p className="text-neutral-text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-neural-blue text-white rounded-md hover:bg-neural-blue/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalNodes: nodes.length,
    activeConnections: nodes.reduce((sum, n) => sum + n.connections.length, 0),
    cpuUsage: Math.round(nodes.reduce((sum, n) => sum + n.specs.cpu.usage, 0) / nodes.length),
    memoryUsage: Math.round(nodes.reduce((sum, n) => sum + n.specs.memory.usage, 0) / nodes.length),
    totalStorage: `${Math.round(nodes.reduce((sum, n) => sum + n.specs.storage.total, 0) / 1000000)}TB`,
    networkThroughput: `${Math.round(nodes.reduce((sum, n) => sum + n.specs.network.rx + n.specs.network.tx, 0))}MB/s`,
  };

  const nodesList = nodes.map(n => ({
    id: n.id,
    name: n.name,
    status: n.status,
    type: n.type,
    cpu: n.specs.cpu.usage,
    memory: n.specs.memory.usage,
    storage: n.specs.storage.usage,
    uptime: formatUptime(n.uptime),
  }));

  const activities = [
    {
      id: '1',
      type: 'optimization' as 'node_join' | 'node_leave' | 'deployment' | 'alert' | 'optimization',
      message: `Real-time updates ${isConnected ? 'active' : 'inactive'}`,
      timestamp: new Date(),
      status: (isConnected ? 'healthy' : 'warning') as 'healthy' | 'warning' | 'critical' | 'offline',
    },
    {
      id: '2',
      type: 'deployment' as 'node_join' | 'node_leave' | 'deployment' | 'alert' | 'optimization',
      message: `Connected to ${nodes.length} nodes`,
      timestamp: new Date(Date.now() - 5000),
      status: 'healthy' as 'healthy' | 'warning' | 'critical' | 'offline',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-neural-text">Dashboard</h1>
            <p className="text-neutral-text-secondary">
              Monitor your neural mesh network in real-time
              {isConnected && <span className="ml-2 text-neural-green">● Live</span>}
            </p>
          </div>
        </div>
      </motion.div>

      <StatsGrid data={stats} />
      <QuickActions />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {cpuHistory.length > 0 && (
          <MetricChart
            title="CPU Usage (%)"
            data={cpuHistory}
            color="#58a6ff"
            height={120}
          />
        )}
        {memoryHistory.length > 0 && (
          <MetricChart
            title="Memory Usage (%)"
            data={memoryHistory}
            color="#a371f7"
            height={120}
          />
        )}
        {networkHistory.length > 0 && (
          <MetricChart
            title="Network (MB/s)"
            data={networkHistory}
            color="#3fb950"
            height={120}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={activities} />
        <NodeStatusList nodes={nodesList} />
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}
