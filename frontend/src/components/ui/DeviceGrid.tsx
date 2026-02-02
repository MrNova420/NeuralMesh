import { motion } from 'framer-motion';
import { Badge } from './Badge';
import { StatusDot } from './StatusDot';
import type { FC } from 'react';

interface Node {
  id: string;
  name: string;
  type: 'alpha' | 'beta' | 'gamma' | 'delta';
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  specs: {
    cpu: { cores: number; usage: number };
    memory: { usage: number };
    storage: { usage: number };
  };
  platform: {
    os: string;
    hostname: string;
  };
}

interface DeviceGridProps {
  nodes: Node[];
  onNodeClick?: (nodeId: string) => void;
}

const typeColors = {
  alpha: 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/50',
  beta: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50',
  gamma: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50',
  delta: 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50',
};

const typeIcons = {
  alpha: '🖥️',
  beta: '💻',
  gamma: '📱',
  delta: '🔌',
};

export const DeviceGrid: FC<DeviceGridProps> = ({ nodes, onNodeClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {nodes.map((node, index) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className={`relative p-4 rounded-lg border backdrop-blur-sm cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
            typeColors[node.type]
          }`}
          onClick={() => onNodeClick?.(node.id)}
        >
          {/* Status indicator */}
          <div className="absolute top-3 right-3">
            <StatusDot status={node.status} size="sm" />
          </div>

          {/* Type icon */}
          <div className="text-3xl mb-2">{typeIcons[node.type]}</div>

          {/* Node info */}
          <h3 className="text-lg font-semibold text-neural-text mb-1 truncate">
            {node.name}
          </h3>
          <p className="text-xs text-neutral-text-secondary mb-3 truncate">
            {node.platform.hostname} • {node.platform.os}
          </p>

          {/* Type badge */}
          <div className="mb-3">
            <Badge variant={node.type === 'alpha' ? 'info' : node.type === 'gamma' ? 'success' : 'default'}>
              {node.type.toUpperCase()}
            </Badge>
          </div>

          {/* Metrics bars */}
          <div className="space-y-2">
            <MetricBar label="CPU" value={node.specs.cpu.usage} cores={node.specs.cpu.cores} />
            <MetricBar label="MEM" value={node.specs.memory.usage} />
            <MetricBar label="DSK" value={node.specs.storage.usage} />
          </div>

          {/* Hover effect overlay */}
          <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
        </motion.div>
      ))}
    </div>
  );
};

interface MetricBarProps {
  label: string;
  value: number;
  cores?: number;
}

const MetricBar: FC<MetricBarProps> = ({ label, value, cores }) => {
  const color = value > 80 ? 'bg-neural-red' : value > 60 ? 'bg-neural-yellow' : 'bg-neural-green';

  return (
    <div>
      <div className="flex justify-between text-xs text-neutral-text-secondary mb-1">
        <span>
          {label}
          {cores && <span className="ml-1">({cores}c)</span>}
        </span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-neural-bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
};
