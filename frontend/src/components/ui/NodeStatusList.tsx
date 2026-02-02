import { motion } from 'framer-motion';
import { StatusDot } from './StatusDot';
import { Badge } from './Badge';
import { Server, Cpu, HardDrive, Activity } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  type: 'alpha' | 'beta' | 'gamma' | 'delta';
  cpu: number;
  memory: number;
  storage: number;
  uptime: string;
}

interface NodeStatusListProps {
  nodes: Node[];
}

const nodeTypeLabels = {
  alpha: { label: 'Alpha', variant: 'info' as const },
  beta: { label: 'Beta', variant: 'success' as const },
  gamma: { label: 'Gamma', variant: 'warning' as const },
  delta: { label: 'Delta', variant: 'default' as const },
};

export function NodeStatusList({ nodes }: NodeStatusListProps) {
  return (
    <div className="neural-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-neural-text">Node Status</h3>
        <Badge variant="info">{nodes.length} nodes</Badge>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className="flex items-center gap-3 p-3 rounded-lg border border-neural-border hover:border-neural-blue/50 transition-colors"
          >
            <StatusDot status={node.status} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Server className="h-4 w-4 text-neural-blue" />
                <span className="font-medium text-neural-text text-sm">{node.name}</span>
                <Badge {...nodeTypeLabels[node.type]}>{nodeTypeLabels[node.type].label}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-text-secondary">
                <div className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" />
                  <span>{node.cpu}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  <span>{node.memory}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  <span>{node.storage}%</span>
                </div>
                <span>↑ {node.uptime}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
