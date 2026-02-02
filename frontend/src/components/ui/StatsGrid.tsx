import { StatsCard } from './StatsCard';
import { Server, Activity, Zap, HardDrive, Cpu, Network } from 'lucide-react';

interface StatsData {
  totalNodes: number;
  activeConnections: number;
  cpuUsage: number;
  memoryUsage: number;
  totalStorage: string;
  networkThroughput: string;
}

interface StatsGridProps {
  data: StatsData;
}

export function StatsGrid({ data }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <StatsCard
        title="Total Nodes"
        value={data.totalNodes}
        icon={Server}
        color="blue"
        trend={{ value: 8.2, isPositive: true }}
      />
      <StatsCard
        title="Active Connections"
        value={data.activeConnections}
        icon={Network}
        color="green"
        trend={{ value: 12.5, isPositive: true }}
      />
      <StatsCard
        title="CPU Usage"
        value={`${data.cpuUsage}%`}
        icon={Cpu}
        color="yellow"
        trend={{ value: 3.1, isPositive: false }}
      />
      <StatsCard
        title="Memory"
        value={`${data.memoryUsage}%`}
        icon={Activity}
        color="purple"
        trend={{ value: 5.4, isPositive: false }}
      />
      <StatsCard
        title="Storage"
        value={data.totalStorage}
        icon={HardDrive}
        color="cyan"
      />
      <StatsCard
        title="Network"
        value={data.networkThroughput}
        icon={Zap}
        color="green"
        trend={{ value: 15.8, isPositive: true }}
      />
    </div>
  );
}
