import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Input, Badge, StatusDot } from '../components/ui';
import { Beams, GlassSurface, SpotlightCard, BounceCards, GlitchText, CountUp } from '../components/react-bits';
import type { FC } from 'react';
import { apiService } from '../services/api';

export function SettingsPage() {
  const [serverUrl, setServerUrl] = useState('ws://localhost:3001');
  const [updateInterval, setUpdateInterval] = useState('2');
  const [maxNodes, setMaxNodes] = useState('100');
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [systemStatus, setSystemStatus] = useState<{
    totalNodes: number;
    activeNodes: number;
    totalConnections: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
    totalStorage: number;
    networkThroughput: number;
    health: 'healthy' | 'warning' | 'critical';
  } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    console.log('Settings saved:', {
      serverUrl,
      updateInterval,
      maxNodes,
      theme,
      notifications,
      autoReconnect,
    });
    alert('Settings saved successfully!');
  };

  useEffect(() => {
    const fetchStatus = async () => {
      setLoadingStatus(true);
      setError(null);
      try {
        const res = await apiService.getSystemStatus();
        setSystemStatus(res.data);
      } catch (e) {
        setError('Failed to load system status');
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, []);

  const bounceCards = useMemo(
    () => [
      {
        title: 'Total Nodes',
        value: systemStatus ? systemStatus.totalNodes : '--',
        accent: '#58a6ff',
      },
      {
        title: 'Active',
        value: systemStatus ? systemStatus.activeNodes : '--',
        accent: '#3fb950',
      },
      {
        title: 'Connections',
        value: systemStatus ? systemStatus.totalConnections : '--',
        accent: '#a371f7',
      },
    ],
    [systemStatus]
  );

  return (
    <div className="relative min-h-full overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-30">
        <Beams beamNumber={12} beamWidth={1.2} beamHeight={18} speed={1.5} />
      </div>

      <div className="relative z-10 p-6 space-y-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-3xl font-bold text-neural-text mb-2">Settings</h1>
          <p className="text-neutral-text-secondary">Configure your NeuralMesh environment</p>
        </motion.div>

        {/* Live Status */}
        <GlassSurface className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <StatusDot status={systemStatus?.health || 'warning'} size="md" />
                <h2 className="text-lg font-semibold text-neural-text">Live System Status</h2>
              </div>
              <p className="text-sm text-neutral-text-secondary">
                Pulled from backend /api/status (real metrics only)
              </p>
            </div>
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
          {loadingStatus && <p className="text-neutral-text-secondary text-sm">Loading status...</p>}
          {error && <p className="text-neural-red text-sm">{error}</p>}
          {systemStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SpotlightCard
                title="CPU Avg"
                value={<CountUp value={systemStatus.avgCpuUsage} suffix="%" />}
                subtitle="Across live nodes"
                accent="#58a6ff"
              />
              <SpotlightCard
                title="Memory Avg"
                value={<CountUp value={systemStatus.avgMemoryUsage} suffix="%" />}
                subtitle="Current usage"
                accent="#a371f7"
              />
              <SpotlightCard
                title="Storage"
                value={<GlitchText text={`${systemStatus.totalStorage} TB`} />}
                subtitle="Aggregate real storage"
                accent="#3fb950"
              />
              <SpotlightCard
                title="Throughput"
                value={<CountUp value={systemStatus.networkThroughput} suffix=" MB/s" />}
                subtitle="Network rx+tx"
                accent="#f0a500"
              />
            </div>
          )}
        </GlassSurface>

        <BounceCards cards={bounceCards} />

        {/* Connection Settings */}
        <SettingsSection title="Connection" icon="🔌">
          <SettingRow label="Server URL" description="WebSocket server endpoint">
            <Input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="ws://localhost:3001"
              className="max-w-md"
            />
          </SettingRow>

          <SettingRow label="Update Interval" description="Metrics update frequency (seconds)">
            <Input
              type="number"
              value={updateInterval}
              onChange={(e) => setUpdateInterval(e.target.value)}
              placeholder="2"
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow label="Auto Reconnect" description="Automatically reconnect on connection loss">
            <Toggle enabled={autoReconnect} onChange={setAutoReconnect} />
          </SettingRow>
        </SettingsSection>

        {/* Node Management */}
        <SettingsSection title="Node Management" icon="🖥️">
          <SettingRow label="Max Nodes" description="Maximum number of nodes allowed">
            <Input
              type="number"
              value={maxNodes}
              onChange={(e) => setMaxNodes(e.target.value)}
              placeholder="100"
              className="max-w-xs"
            />
          </SettingRow>

          <SettingRow
            label="Node Health Threshold"
            description="CPU/Memory threshold for warnings (%)"
          >
            <div className="flex gap-2">
              <Input placeholder="Warning (70)" className="max-w-32" defaultValue="70" />
              <Input placeholder="Critical (90)" className="max-w-32" defaultValue="90" />
            </div>
          </SettingRow>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications" icon="🔔">
          <SettingRow label="Enable Notifications" description="Show alerts for node events">
            <Toggle enabled={notifications} onChange={setNotifications} />
          </SettingRow>

          <SettingRow label="Alert Types" description="Choose which events trigger alerts">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">Node Join</Badge>
              <Badge variant="warning">Node Warning</Badge>
              <Badge variant="danger">Node Critical</Badge>
              <Badge variant="info">Deployment</Badge>
            </div>
          </SettingRow>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance" icon="🎨">
          <SettingRow label="Theme" description="Application color scheme">
            <div className="flex gap-2">
              <ThemeButton
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
                label="Dark"
              />
              <ThemeButton
                active={theme === 'light'}
                onClick={() => setTheme('light')}
                label="Light"
              />
              <ThemeButton
                active={theme === 'auto'}
                onClick={() => setTheme('auto')}
                label="Auto"
              />
            </div>
          </SettingRow>

          <SettingRow label="Animation Effects" description="Enable background animations">
            <Toggle enabled={true} onChange={() => {}} />
          </SettingRow>
        </SettingsSection>

        {/* Performance */}
        <SettingsSection title="Performance" icon="⚡">
          <SettingRow label="Data Retention" description="How long to keep historical metrics">
            <select className="px-3 py-2 bg-neural-bg border border-neural-border rounded-md text-neural-text">
              <option>1 Hour</option>
              <option>6 Hours</option>
              <option selected>24 Hours</option>
              <option>7 Days</option>
              <option>30 Days</option>
            </select>
          </SettingRow>

          <SettingRow label="3D Rendering Quality" description="Neural network visualization quality">
            <select className="px-3 py-2 bg-neural-bg border border-neural-border rounded-md text-neural-text">
              <option>Low (Better Performance)</option>
              <option selected>Medium</option>
              <option>High (Better Quality)</option>
            </select>
          </SettingRow>
        </SettingsSection>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="primary" onClick={handleSave}>
            💾 Save Settings
          </Button>
          <Button variant="secondary">🔄 Reset to Defaults</Button>
          <Button variant="danger">⚠️ Clear All Data</Button>
        </div>

        {/* System Info */}
        <SettingsSection title="System Information" icon="ℹ️">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <InfoItem label="Version" value="0.1.0" />
            <InfoItem label="Backend" value="Bun + Hono" />
            <InfoItem label="Frontend" value="React 19 + Vite" />
            <InfoItem label="Agent" value="Rust 1.93.0" />
            <InfoItem label="WebSocket" value="Socket.IO 4.8" />
            <InfoItem label="Database" value="Not configured" />
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

const SettingsSection: FC<{ title: string; icon: string; children: React.ReactNode }> = ({
  title,
  icon,
  children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="neural-card space-y-4"
  >
    <h2 className="text-xl font-semibold text-neural-text flex items-center gap-2">
      <span className="text-2xl">{icon}</span>
      {title}
    </h2>
    <div className="space-y-6">{children}</div>
  </motion.div>
);

const SettingRow: FC<{ label: string; description: string; children: React.ReactNode }> = ({
  label,
  description,
  children,
}) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-neural-border last:border-0 last:pb-0">
    <div className="flex-1">
      <h3 className="text-neural-text font-medium mb-1">{label}</h3>
      <p className="text-sm text-neutral-text-secondary">{description}</p>
    </div>
    <div className="md:flex-shrink-0">{children}</div>
  </div>
);

const Toggle: FC<{ enabled: boolean; onChange: (enabled: boolean) => void }> = ({
  enabled,
  onChange,
}) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative w-12 h-6 rounded-full transition-colors ${
      enabled ? 'bg-neural-green' : 'bg-neural-border'
    }`}
  >
    <motion.div
      animate={{ x: enabled ? 24 : 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 bg-white rounded-full"
    />
  </button>
);

const ThemeButton: FC<{ active: boolean; onClick: () => void; label: string }> = ({
  active,
  onClick,
  label,
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

const InfoItem: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-neutral-text-secondary mb-1">{label}</p>
    <p className="text-neural-text font-medium">{value}</p>
  </div>
);
