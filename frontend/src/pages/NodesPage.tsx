import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DeviceGrid, NodeDetailModal, Button, Input } from '../components/ui';
import Particles from '../components/react-bits/Particles';
import { GlassSurface, Dock } from '../components/react-bits';
import { Server, Cpu, Wifi } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiService } from '../services/api';

type NodeType = 'alpha' | 'beta' | 'gamma' | 'delta';
type NodeStatus = 'healthy' | 'warning' | 'critical' | 'offline';

interface MeshNode {
  id: string;
  name: string;
  type: NodeType;
  status: NodeStatus;
  connections: string[];
  platform: { hostname: string };
  location: { ip: string };
}

export function NodesPage() {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [filteredNodes, setFilteredNodes] = useState<MeshNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<MeshNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'alpha' | 'beta' | 'gamma' | 'delta'>('all');
  const [loading, setLoading] = useState(true);

  const { isConnected, on, off, emit } = useWebSocket({
    onConnect: () => {
      emit('nodes:subscribe');
    },
  });

  // Fetch initial nodes
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const response = await apiService.getAllNodes();
        setNodes(response.data.nodes);
        setFilteredNodes(response.data.nodes);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch nodes:', err);
        setLoading(false);
      }
    };

    fetchNodes();
  }, []);

  // Apply search and type filters
  const applyFilters = (nodeList: MeshNode[], query: string, type: 'all' | NodeType) => {
    let filtered = nodeList;

    if (type !== 'all') {
      filtered = filtered.filter((node) => node.type === type);
    }

    if (query) {
      filtered = filtered.filter(
        (node) =>
          node.name.toLowerCase().includes(query.toLowerCase()) ||
          node.platform.hostname.toLowerCase().includes(query.toLowerCase()) ||
          node.location.ip.includes(query)
      );
    }

    setFilteredNodes(filtered);
  };

  // Listen for real-time updates
  useEffect(() => {
    const handleNodesUpdate = (data: { nodes: MeshNode[] }) => {
      setNodes(data.nodes);
      applyFilters(data.nodes, searchQuery, filterType);
    };

    on('nodes:update', handleNodesUpdate);
    on('nodes:initial', handleNodesUpdate);
    return () => {
      off('nodes:update', handleNodesUpdate);
      off('nodes:initial', handleNodesUpdate);
    };
  }, [on, off, searchQuery, filterType]);

  useEffect(() => {
    applyFilters(nodes, searchQuery, filterType);
  }, [searchQuery, filterType, nodes]);

  const handleNodeClick = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) setSelectedNode(node);
  };

  const handleNodeAction = (action: 'restart' | 'shutdown' | 'disconnect') => {
    console.log(`Action ${action} on node:`, selectedNode?.id);
    // TODO: Implement actions via API
    setSelectedNode(null);
  };

  const stats = {
    total: nodes.length,
    alpha: nodes.filter((n) => n.type === 'alpha').length,
    beta: nodes.filter((n) => n.type === 'beta').length,
    gamma: nodes.filter((n) => n.type === 'gamma').length,
    delta: nodes.filter((n) => n.type === 'delta').length,
    healthy: nodes.filter((n) => n.status === 'healthy').length,
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-neural-blue border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-neural-text">Loading nodes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      <Particles particleCount={30} className="absolute inset-0 pointer-events-none" />

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassSurface className="p-4 border border-neural-border/60">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-bold text-neural-text">Nodes</h1>
                <p className="text-neutral-text-secondary">
                  Manage and monitor all connected devices
                  {isConnected && <span className="ml-2 text-neural-green">● Live</span>}
                </p>
              </div>
              <Button variant="primary" size="sm">
                + Add Node
              </Button>
            </div>
          </GlassSurface>
        </motion.div>

        {/* Stats Bar */}
        <GlassSurface className="p-4 border border-neural-border/60 flex flex-wrap gap-4">
          <StatBadge label="Total" value={stats.total} color="blue" />
          <StatBadge label="Alpha" value={stats.alpha} color="blue" />
          <StatBadge label="Beta" value={stats.beta} color="purple" />
          <StatBadge label="Gamma" value={stats.gamma} color="green" />
          <StatBadge label="Delta" value={stats.delta} color="orange" />
          <StatBadge label="Healthy" value={stats.healthy} color="green" />
        </GlassSurface>

        {/* Filters */}
        <GlassSurface className="p-4 border border-neural-border/60 flex flex-wrap gap-4">
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-64"
          />
          <div className="flex gap-2">
            <FilterButton
              active={filterType === 'all'}
              onClick={() => setFilterType('all')}
              label="All"
            />
            <FilterButton
              active={filterType === 'alpha'}
              onClick={() => setFilterType('alpha')}
              label="Alpha"
            />
            <FilterButton
              active={filterType === 'beta'}
              onClick={() => setFilterType('beta')}
              label="Beta"
            />
            <FilterButton
              active={filterType === 'gamma'}
              onClick={() => setFilterType('gamma')}
              label="Gamma"
            />
            <FilterButton
              active={filterType === 'delta'}
              onClick={() => setFilterType('delta')}
              label="Delta"
            />
          </div>
        </GlassSurface>

        {/* Device Grid */}
        <GlassSurface className="p-2 border border-neural-border/60">
          {filteredNodes.length > 0 ? (
            <DeviceGrid nodes={filteredNodes} onNodeClick={handleNodeClick} />
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-text-secondary text-lg">No nodes found</p>
              <p className="text-neutral-text-secondary text-sm mt-2">
                {searchQuery || filterType !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first node to get started'}
              </p>
            </div>
          )}
        </GlassSurface>
      </div>

      {/* Node Detail Modal */}
      <NodeDetailModal
        node={selectedNode}
        isOpen={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        onAction={handleNodeAction}
      />

      <Dock
        items={[
          {
             icon: <Server className="h-5 w-5 text-neural-green" />,
             label: 'Nodes',
             onClick: () => window.location.assign('/nodes'),
           },
           {
             icon: <Cpu className="h-5 w-5 text-neural-blue" />,
             label: 'Metrics',
             onClick: () => window.location.assign('/'),
           },
          {
            icon: <Wifi className="h-5 w-5 text-neural-purple" />,
            label: isConnected ? 'Live' : 'Reconnect',
            onClick: () => emit('nodes:subscribe'),
          },
        ]}
      />
    </div>
  );
}

const StatBadge = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const colorClasses = {
    blue: 'text-neural-blue',
    purple: 'text-neural-purple',
    green: 'text-neural-green',
    orange: 'text-neural-yellow',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-neutral-text-secondary">{label}:</span>
      <span className={`text-lg font-bold ${colorClasses[color as keyof typeof colorClasses]}`}>
        {value}
      </span>
    </div>
  );
};

const FilterButton = ({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
      active
        ? 'bg-neural-blue text-white'
        : 'bg-neural-bg-secondary text-neutral-text-secondary hover:bg-neural-border'
    }`}
  >
    {label}
  </button>
);
