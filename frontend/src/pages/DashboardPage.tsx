import { useState, useEffect, useMemo } from 'react';
import { ActivityFeed, QuickActions, NodeStatusList, MetricChart } from '../components/ui';
import { motion } from 'framer-motion';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiService } from '../services/api';
import { BounceCards, SpotlightCard, Aurora } from '../components/react-bits';
import { Cpu, Server, ActivitySquare } from 'lucide-react';

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

  const { isConnected, on, off, emit } = useWebSocket({
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

      if (data.nodes.length === 0) {
        return;
      }

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
      off('nodes:update', handleNodesUpdate);
      off('nodes:initial', handleNodesUpdate);
    };
  }, [on, off]);

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

  const totals = nodes.length || 1; // avoid division by zero when no nodes yet
  const totalStorageBytes = nodes.reduce((sum, n) => sum + (n.specs.storage?.total ?? 0), 0);
  const totalStorageTB = nodes.length ? totalStorageBytes / Math.pow(1024, 4) : 0;

  const stats = {
    totalNodes: nodes.length,
    activeConnections: nodes.reduce((sum, n) => sum + n.connections.length, 0),
    cpuUsage: Math.round(nodes.reduce((sum, n) => sum + n.specs.cpu.usage, 0) / totals),
    memoryUsage: Math.round(nodes.reduce((sum, n) => sum + n.specs.memory.usage, 0) / totals),
    totalStorage: nodes.length ? `${totalStorageTB.toFixed(2)} TB` : '0 TB',
    networkThroughput: nodes.length
      ? `${nodes.reduce((sum, n) => sum + n.specs.network.rx + n.specs.network.tx, 0).toFixed(2)} MB/s`
      : '0 MB/s',
  };

  const bounceCards = useMemo(
    () => [
      {
        title: 'Live Nodes',
        value: stats.totalNodes,
        icon: <Server className="h-5 w-5 text-neural-green" />,
        accent: '#3fb950',
      },
      {
        title: 'CPU Avg',
        value: `${stats.cpuUsage}%`,
        icon: <Cpu className="h-5 w-5 text-neural-blue" />,
        accent: '#58a6ff',
      },
      {
        title: 'Memory Avg',
        value: `${stats.memoryUsage}%`,
        icon: <ActivitySquare className="h-5 w-5 text-neural-purple" />,
        accent: '#a371f7',
      },
    ],
    [stats]
  );

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

  const activities = nodes.map((n, i) => ({
    id: `${n.id}-${i}`,
    type: 'node_join' as const,
    message: `${n.name} • CPU ${Math.round(n.specs.cpu.usage)}% • MEM ${Math.round(n.specs.memory.usage)}%`,
    timestamp: new Date(),
    status: n.status,
  }));

  return (
    <div className="relative overflow-hidden min-h-full">
      <Aurora className="absolute inset-0 opacity-40" />
      <div className="relative p-6 space-y-6">
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

        <BounceCards cards={bounceCards} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SpotlightCard
            title="CPU Load"
            subtitle="Average across live nodes"
            value={`${stats.cpuUsage}%`}
            accent="#58a6ff"
          />
          <SpotlightCard
            title="Memory Load"
            subtitle="Average utilization"
            value={`${stats.memoryUsage}%`}
            accent="#a371f7"
          />
          <SpotlightCard
            title="Network"
            subtitle="Aggregate throughput"
            value={stats.networkThroughput}
            accent="#3fb950"
          />
        </div>

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
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}
