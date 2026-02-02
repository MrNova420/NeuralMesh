import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge, StatusDot } from '../ui';
import ElectricBorder from '../react-bits/ElectricBorder';
import type { FC } from 'react';

interface NodeDetailModalProps {
  node: {
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
    platform: {
      os: string;
      arch: string;
      hostname: string;
    };
    location: {
      region: string;
      ip: string;
    };
    connections: string[];
    uptime: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: 'restart' | 'shutdown' | 'disconnect') => void;
}

export const NodeDetailModal: FC<NodeDetailModalProps> = ({ node, isOpen, onClose, onAction }) => {
  if (!node) return null;

  const formatBytes = (bytes: number) => {
    const gb = bytes / 1024 / 1024 / 1024;
    if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`;
    return `${gb.toFixed(2)} GB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative bg-neural-bg-secondary border border-neural-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ElectricBorder />

              {/* Header */}
              <div className="sticky top-0 bg-neural-bg-secondary/95 backdrop-blur-md border-b border-neural-border p-6 z-10">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">
                      {node.type === 'alpha' ? '🖥️' : node.type === 'beta' ? '💻' : node.type === 'gamma' ? '📱' : '🔌'}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-neural-text mb-1">{node.name}</h2>
                      <div className="flex items-center gap-2">
                        <StatusDot status={node.status} size="sm" />
                        <span className="text-sm text-neutral-text-secondary">
                          {node.platform.hostname} • {node.location.ip}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-neutral-text-secondary hover:text-neural-text transition-colors text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Type" value={node.type.toUpperCase()} />
                  <StatCard label="Status" value={node.status} />
                  <StatCard label="Uptime" value={formatUptime(node.uptime)} />
                  <StatCard label="Connections" value={node.connections.length} />
                </div>

                {/* System Specs */}
                <Section title="System Specifications">
                  <div className="grid md:grid-cols-2 gap-4">
                    <SpecCard
                      icon="💻"
                      title="CPU"
                      details={[
                        `${node.specs.cpu.cores} cores`,
                        node.specs.cpu.model,
                        `${node.specs.cpu.usage.toFixed(1)}% usage`,
                      ]}
                      usage={node.specs.cpu.usage}
                    />
                    <SpecCard
                      icon="🧠"
                      title="Memory"
                      details={[
                        formatBytes(node.specs.memory.total),
                        `${formatBytes(node.specs.memory.used)} used`,
                        `${node.specs.memory.usage.toFixed(1)}% usage`,
                      ]}
                      usage={node.specs.memory.usage}
                    />
                    <SpecCard
                      icon="💾"
                      title="Storage"
                      details={[
                        formatBytes(node.specs.storage.total),
                        `${formatBytes(node.specs.storage.used)} used`,
                        `${node.specs.storage.usage.toFixed(1)}% usage`,
                      ]}
                      usage={node.specs.storage.usage}
                    />
                    <SpecCard
                      icon="🌐"
                      title="Network"
                      details={[
                        `↓ ${node.specs.network.rx.toFixed(1)} MB/s`,
                        `↑ ${node.specs.network.tx.toFixed(1)} MB/s`,
                        `Total: ${(node.specs.network.rx + node.specs.network.tx).toFixed(1)} MB/s`,
                      ]}
                    />
                  </div>
                </Section>

                {/* Platform Info */}
                <Section title="Platform Information">
                  <div className="grid md:grid-cols-3 gap-4">
                    <InfoItem label="Operating System" value={node.platform.os} />
                    <InfoItem label="Architecture" value={node.platform.arch} />
                    <InfoItem label="Region" value={node.location.region} />
                  </div>
                </Section>

                {/* Connections */}
                {node.connections.length > 0 && (
                  <Section title="Connected Nodes">
                    <div className="flex flex-wrap gap-2">
                      {node.connections.map((conn) => (
                        <Badge key={conn} variant="default">
                          {conn}
                        </Badge>
                      ))}
                    </div>
                  </Section>
                )}

                {/* Actions */}
                <Section title="Actions">
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" size="sm" onClick={() => onAction?.('restart')}>
                      🔄 Restart Agent
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => onAction?.('disconnect')}>
                      🔌 Disconnect
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => onAction?.('shutdown')}>
                      ⚠️ Shutdown Node
                    </Button>
                  </div>
                </Section>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const StatCard: FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-3 bg-neural-bg rounded-lg border border-neural-border">
    <p className="text-xs text-neutral-text-secondary mb-1">{label}</p>
    <p className="text-lg font-bold text-neural-text">{value}</p>
  </div>
);

const Section: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-neural-text mb-3">{title}</h3>
    {children}
  </div>
);

const SpecCard: FC<{ icon: string; title: string; details: string[]; usage?: number }> = ({
  icon,
  title,
  details,
  usage,
}) => (
  <div className="p-4 bg-neural-bg rounded-lg border border-neural-border">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-2xl">{icon}</span>
      <h4 className="font-semibold text-neural-text">{title}</h4>
    </div>
    <div className="space-y-1 mb-3">
      {details.map((detail, i) => (
        <p key={i} className="text-sm text-neutral-text-secondary">
          {detail}
        </p>
      ))}
    </div>
    {usage !== undefined && (
      <div className="h-2 bg-neural-bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${usage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${
            usage > 80 ? 'bg-neural-red' : usage > 60 ? 'bg-neural-yellow' : 'bg-neural-green'
          }`}
        />
      </div>
    )}
  </div>
);

const InfoItem: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-neutral-text-secondary mb-1">{label}</p>
    <p className="text-sm font-medium text-neural-text">{value}</p>
  </div>
);
