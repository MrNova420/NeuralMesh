import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Beams, Particles, GlassSurface, SpotlightCard, CountUp } from '../components/react-bits';
import { NeuralGraph3D } from '../components/neural';
import { motion } from 'framer-motion';
import { Badge, StatusDot, Button } from '../components/ui';
import { Network, Activity, Maximize2, Minimize2, HardDrive, Cpu, ActivitySquare } from 'lucide-react';
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
  specs: {
    cpu: { usage: number };
    memory: { usage: number; used?: number };
    storage: { usage: number; used?: number };
    network: { rx: number; tx: number };
  };
  uptime?: number;
}

export function NeuralNetworkPage() {
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { on, off, emit } = useWebSocket({
    onConnect: () => emit('nodes:subscribe'),
  });

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await apiService.getAllNodes();
        setNodes(res.data.nodes);
      } catch (e) {
        console.error('Failed to load nodes', e);
      }
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    const handleNodes = (data: { nodes: MeshNode[] }) => setNodes(data.nodes);
    on('nodes:initial', handleNodes);
    on('nodes:update', handleNodes);
    return () => {
      off('nodes:initial', handleNodes);
      off('nodes:update', handleNodes);
    };
  }, [on, off]);

  const graphNodes = useMemo(
    () =>
      nodes.map((n, idx) => ({
        ...n,
        position: [Math.cos(idx) * 6, Math.sin(idx * 1.3) * 4, Math.sin(idx) * 6] as [
          number,
          number,
          number,
        ],
      })),
    [nodes]
  );

  const selectedNodeData = nodes.find((n) => n.id === selectedNode);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  return (
    <div className="relative h-full overflow-hidden">
      {/* Background Effect - Beams (only when not fullscreen) */}
      {!isFullscreen && (
        <div className="absolute inset-0 z-0 opacity-30">
          <Beams
            beamWidth={1.5}
            beamHeight={20}
            beamNumber={15}
            lightColor="#58a6ff"
            speed={2}
            noiseIntensity={1.5}
            scale={0.25}
            rotation={45}
          />
        </div>
      )}

      {/* Overlay with Particles (only when not fullscreen) */}
      {!isFullscreen && (
        <div className="absolute inset-0 z-10 pointer-events-none opacity-40">
          <Particles
            className="absolute inset-0"
            particleCount={60}
            particleBaseSize={2}
            particleColors={['#58a6ff', '#a371f7', '#3fb950']}
            speed={0.5}
          />
        </div>
      )}

      {/* Content */}
      <div className={`relative z-20 h-full flex flex-col ${isFullscreen ? 'p-0' : 'p-6'}`}>
        {/* Header (hide in fullscreen) */}
        {!isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Network className="h-8 w-8 text-neural-blue" />
                <h1 className="text-3xl font-bold text-neural-text">Neural Network Mesh</h1>
              </div>
              <Button onClick={() => setIsFullscreen(true)} variant="secondary">
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
            </div>
            <p className="text-neutral-text-secondary">
              Interactive 3D visualization of your distributed server network
            </p>
          </motion.div>
        )}

        {/* Fullscreen controls */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-50">
            <Button onClick={() => setIsFullscreen(false)} variant="secondary">
              <Minimize2 className="h-4 w-4 mr-2" />
              Exit Fullscreen
            </Button>
          </div>
        )}

        {/* Network Stats Cards (hide in fullscreen) */}
        {!isFullscreen && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SpotlightCard
              title="Total Nodes"
              subtitle="Live mesh members"
              value={<CountUp value={nodes.length || 0} />}
              accent="#58a6ff"
            />
            <SpotlightCard
              title="Active Connections"
              subtitle="Aggregate links"
              value={<CountUp value={nodes.reduce((sum, n) => sum + n.connections.length, 0)} />}
              accent="#3fb950"
            />
            <SpotlightCard
              title="Network Health"
              subtitle="Status across nodes"
              value={
                <div className="flex items-center gap-2">
                  <StatusDot
                    status={
                      nodes.some((n) => n.status === 'critical')
                        ? 'critical'
                        : nodes.some((n) => n.status === 'warning')
                        ? 'warning'
                        : 'healthy'
                    }
                    size="md"
                  />
                  <span className="text-neural-text">
                    {nodes.some((n) => n.status === 'critical')
                      ? 'Critical'
                      : nodes.some((n) => n.status === 'warning')
                      ? 'Watch'
                      : 'Optimal'}
                  </span>
                </div>
              }
              accent="#a371f7"
            />
          </div>
        )}

        {/* 3D Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={`flex-1 relative overflow-hidden`}
        >
          <GlassSurface
            className={`h-full border border-neural-border/60 ${
              isFullscreen ? 'rounded-none' : 'rounded-lg'
            }`}
          >
            <NeuralGraph3D nodes={graphNodes} onNodeClick={handleNodeClick} />

            {/* Node Detail Panel */}
            {selectedNodeData && (
              <div className="absolute bottom-6 left-6 bg-neural-panel/95 backdrop-blur-sm border border-neural-border rounded-lg p-4 max-w-md space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neural-text">{selectedNodeData.name}</h3>
                    <p className="text-xs text-neutral-text-secondary">
                      {selectedNodeData.connections.length} connections • {formatUptime(selectedNodeData.uptime || 0)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-neutral-text-secondary hover:text-neural-text"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <StatusDot status={selectedNodeData.status} size="sm" />
                  <span className="text-neutral-text-secondary">Status:</span>
                  <span className="text-neural-text capitalize">{selectedNodeData.status}</span>
                  <Badge variant="info">{selectedNodeData.type.toUpperCase()}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MetricChip
                    icon={<Cpu className="h-4 w-4 text-neural-blue" />}
                    label="CPU"
                    value={`${selectedNodeData.specs.cpu.usage.toFixed(1)}%`}
                  />
                  <MetricChip
                    icon={<ActivitySquare className="h-4 w-4 text-neural-purple" />}
                    label="Memory"
                    value={`${selectedNodeData.specs.memory.usage.toFixed(1)}%`}
                    helper={formatBytes(selectedNodeData.specs.memory.used ?? 0)}
                  />
                  <MetricChip
                    icon={<HardDrive className="h-4 w-4 text-neural-green" />}
                    label="Storage"
                    value={`${selectedNodeData.specs.storage.usage.toFixed(1)}%`}
                    helper={formatBytes(selectedNodeData.specs.storage.used ?? 0)}
                  />
                  <MetricChip
                    icon={<Activity className="h-4 w-4 text-neural-orange" />}
                    label="Network"
                    value={`${(selectedNodeData.specs.network.rx + selectedNodeData.specs.network.tx).toFixed(2)} MB/s`}
                    helper={`↓ ${selectedNodeData.specs.network.rx.toFixed(2)} • ↑ ${selectedNodeData.specs.network.tx.toFixed(2)}`}
                  />
                </div>
              </div>
            )}

            {/* Controls hint */}
            <div className="absolute top-4 left-4 bg-neural-panel/95 backdrop-blur-sm border border-neural-border rounded-lg px-3 py-2 text-xs text-neutral-text-secondary">
              🖱️ Click + Drag to rotate • Scroll to zoom • Click nodes for details
            </div>
          </GlassSurface>
        </motion.div>
      </div>
    </div>
  );
}

function MetricChip({
  icon,
  label,
  value,
  helper,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-neural-bg-secondary/80 border border-neural-border">
      <div className="mt-0.5">{icon}</div>
      <div className="space-y-0.5">
        <p className="text-xs text-neutral-text-secondary">{label}</p>
        <p className="text-sm font-semibold text-neural-text">{value}</p>
        {helper && <p className="text-[11px] text-neutral-text-secondary">{helper}</p>}
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
