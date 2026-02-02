import { useState } from 'react';
import { Beams, Particles } from '../components/react-bits';
import { NeuralGraph3D } from '../components/neural';
import { motion } from 'framer-motion';
import { Badge, StatusDot, Button } from '../components/ui';
import { Network, Zap, Activity, Maximize2, Minimize2 } from 'lucide-react';

// Mock node data
const mockNodes = [
  {
    id: 'n1',
    name: 'alpha-server-01',
    type: 'alpha' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n2', 'n3', 'n4'],
  },
  {
    id: 'n2',
    name: 'alpha-server-02',
    type: 'alpha' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n1', 'n5', 'n6'],
  },
  {
    id: 'n3',
    name: 'beta-server-01',
    type: 'beta' as const,
    status: 'warning' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n1', 'n7', 'n8'],
  },
  {
    id: 'n4',
    name: 'gamma-mobile-01',
    type: 'gamma' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n1', 'n9'],
  },
  {
    id: 'n5',
    name: 'gamma-mobile-02',
    type: 'gamma' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n2', 'n10'],
  },
  {
    id: 'n6',
    name: 'delta-pi-01',
    type: 'delta' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n2', 'n11'],
  },
  {
    id: 'n7',
    name: 'beta-server-02',
    type: 'beta' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n3', 'n12'],
  },
  {
    id: 'n8',
    name: 'gamma-mobile-03',
    type: 'gamma' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n3'],
  },
  {
    id: 'n9',
    name: 'delta-pi-02',
    type: 'delta' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n4'],
  },
  {
    id: 'n10',
    name: 'delta-pi-03',
    type: 'delta' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n5'],
  },
  {
    id: 'n11',
    name: 'gamma-mobile-04',
    type: 'gamma' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n6'],
  },
  {
    id: 'n12',
    name: 'alpha-server-03',
    type: 'alpha' as const,
    status: 'healthy' as const,
    position: [0, 0, 0] as [number, number, number],
    connections: ['n7', 'n1'],
  },
];

export function NeuralNetworkPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const selectedNodeData = mockNodes.find((n) => n.id === selectedNode);

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
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-neural-panel/80 backdrop-blur-sm border border-neural-blue/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-neural-blue/20 rounded-lg">
                  <Network className="h-6 w-6 text-neural-blue" />
                </div>
                <div>
                  <p className="text-sm text-neutral-text-secondary">Total Nodes</p>
                  <p className="text-2xl font-bold text-neural-blue">{mockNodes.length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-neural-panel/80 backdrop-blur-sm border border-neural-green/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-neural-green/20 rounded-lg">
                  <Zap className="h-6 w-6 text-neural-green" />
                </div>
                <div>
                  <p className="text-sm text-neutral-text-secondary">Active Connections</p>
                  <p className="text-2xl font-bold text-neural-green">
                    {mockNodes.reduce((sum, n) => sum + n.connections.length, 0)}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="bg-neural-panel/80 backdrop-blur-sm border border-neural-purple/30 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-neural-purple/20 rounded-lg">
                  <Activity className="h-6 w-6 text-neural-purple" />
                </div>
                <div>
                  <p className="text-sm text-neutral-text-secondary">Network Health</p>
                  <div className="flex items-center gap-2">
                    <StatusDot status="healthy" size="md" />
                    <p className="text-2xl font-bold text-neural-purple">Optimal</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* 3D Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className={`flex-1 bg-neural-panel/60 backdrop-blur-sm border border-neural-border rounded-lg overflow-hidden ${
            isFullscreen ? 'h-screen' : ''
          }`}
        >
          <NeuralGraph3D nodes={mockNodes} onNodeClick={handleNodeClick} />

          {/* Node Detail Panel */}
          {selectedNodeData && (
            <div className="absolute bottom-6 left-6 bg-neural-panel/95 backdrop-blur-sm border border-neural-border rounded-lg p-4 max-w-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-neural-text">{selectedNodeData.name}</h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-neutral-text-secondary hover:text-neural-text"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <StatusDot status={selectedNodeData.status} size="sm" />
                  <span className="text-neutral-text-secondary">Status:</span>
                  <span className="text-neural-text capitalize">{selectedNodeData.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="info">{selectedNodeData.type.toUpperCase()}</Badge>
                  <span className="text-neutral-text-secondary">
                    {selectedNodeData.connections.length} connections
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Controls hint */}
          <div className="absolute top-4 left-4 bg-neural-panel/95 backdrop-blur-sm border border-neural-border rounded-lg px-3 py-2 text-xs text-neutral-text-secondary">
            🖱️ Click + Drag to rotate • Scroll to zoom • Click nodes for details
          </div>
        </motion.div>
      </div>
    </div>
  );
}


