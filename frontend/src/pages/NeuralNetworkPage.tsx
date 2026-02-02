import { Beams, Particles } from '../components/react-bits';
import { motion } from 'framer-motion';
import { Badge, StatusDot } from '../components/ui';
import { Network, Zap, Activity } from 'lucide-react';

export function NeuralNetworkPage() {
  return (
    <div className="relative h-full overflow-hidden">
      {/* Background Effect - Beams */}
      <div className="absolute inset-0 z-0">
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
      
      {/* Overlay with Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Particles
          className="absolute inset-0"
          particleCount={60}
          particleBaseSize={2}
          particleColors={['#58a6ff', '#a371f7', '#3fb950']}
          speed={0.5}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-20 h-full p-6 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Network className="h-8 w-8 text-neural-blue" />
            <h1 className="text-3xl font-bold text-neural-text">Neural Network Mesh</h1>
          </div>
          <p className="text-neutral-text-secondary">
            Real-time visualization of your distributed server network
          </p>
        </motion.div>

        {/* Network Stats Cards */}
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
                <p className="text-2xl font-bold text-neural-blue">12</p>
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
                <p className="text-2xl font-bold text-neural-green">47</p>
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

        {/* 3D Visualization Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex-1 bg-neural-panel/60 backdrop-blur-sm border border-neural-border rounded-lg p-6 flex flex-col items-center justify-center"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex p-6 bg-neural-blue/10 rounded-full">
              <Network className="h-16 w-16 text-neural-blue animate-pulse" />
            </div>
            <h3 className="text-xl font-semibold text-neural-text">
              Interactive 3D Network Graph
            </h3>
            <p className="text-neutral-text-secondary max-w-md">
              Full Three.js 3D neural network visualization coming next. 
              Each node will be rendered as a neuron with animated connections based on real-time data flow.
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Badge variant="info">Force-directed layout</Badge>
              <Badge variant="success">Real-time updates</Badge>
              <Badge variant="warning">Interactive nodes</Badge>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

