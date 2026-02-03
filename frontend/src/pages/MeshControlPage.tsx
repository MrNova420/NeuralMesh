import { useState, useEffect } from 'react';
import { apiService } from '../services/auth';

interface MeshNode {
  id: string;
  name: string;
  type: string;
  role: string;
  status: string;
  capabilities: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
}

interface MeshCluster {
  id: string;
  name: string;
  nodes: string[];
  role: string;
  resources: {
    totalCpu: number;
    totalMemory: number;
    totalStorage: number;
    utilization: number;
  };
}

export default function MeshControlPage() {
  const [topology, setTopology] = useState<any>(null);
  const [workloads, setWorkloads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [workloadType, setWorkloadType] = useState<string>('compute');
  const [workloadResources, setWorkloadResources] = useState({
    cpu: 4,
    memory: 8,
    storage: 100,
  });

  useEffect(() => {
    fetchTopology();
    fetchWorkloads();
  }, []);

  const fetchTopology = async () => {
    try {
      const response = await apiService.getMeshTopology();
      setTopology(response.data.topology);
    } catch (error) {
      console.error('Failed to fetch topology:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkloads = async () => {
    try {
      const response = await apiService.getAllWorkloads();
      setWorkloads(response.data.workloads);
    } catch (error) {
      console.error('Failed to fetch workloads:', error);
    }
  };

  const distributeWorkload = async () => {
    try {
      await apiService.distributeWorkload(workloadType, workloadResources);
      setShowDistributeModal(false);
      fetchWorkloads();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to distribute workload');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master': return 'bg-purple-600';
      case 'worker': return 'bg-blue-600';
      case 'edge': return 'bg-green-600';
      case 'gateway': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-blue-500';
      case 'pending': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-gray-400">Loading mesh topology...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Neural Mesh Control</h1>
            <p className="text-gray-400">Visualize and control your distributed neural mesh network</p>
          </div>
          <button
            onClick={() => setShowDistributeModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Distribute Workload
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="text-3xl font-bold text-purple-500">{topology?.stats?.totalNodes || 0}</div>
            <div className="text-gray-400 text-sm mt-1">Total Nodes</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="text-3xl font-bold text-blue-500">{topology?.stats?.totalClusters || 0}</div>
            <div className="text-gray-400 text-sm mt-1">Clusters</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="text-3xl font-bold text-green-500">{topology?.stats?.totalConnections || 0}</div>
            <div className="text-gray-400 text-sm mt-1">Connections</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <div className="text-3xl font-bold text-yellow-500">
              {topology?.stats?.avgLatency?.toFixed(1) || 0}ms
            </div>
            <div className="text-gray-400 text-sm mt-1">Avg Latency</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Nodes */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h2 className="text-2xl font-semibold mb-4">Mesh Nodes</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {topology?.nodes?.map((node: MeshNode) => (
                <div
                  key={node.id}
                  className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{node.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">{node.type}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(node.role)}`}>
                      {node.role}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs mt-3">
                    <div>
                      <div className="text-gray-500">CPU</div>
                      <div className="font-medium">{node.capabilities.cpu}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">RAM</div>
                      <div className="font-medium">{node.capabilities.memory.toFixed(0)}GB</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Storage</div>
                      <div className="font-medium">{node.capabilities.storage.toFixed(0)}GB</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Network</div>
                      <div className="font-medium">{node.capabilities.bandwidth}Mbps</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clusters */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h2 className="text-2xl font-semibold mb-4">Mesh Clusters</h2>
            <div className="space-y-4">
              {topology?.clusters?.map((cluster: MeshCluster) => (
                <div
                  key={cluster.id}
                  className="bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{cluster.name}</h3>
                    <span className="text-xs text-gray-400 capitalize">{cluster.role}</span>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Utilization</span>
                      <span>{cluster.resources.utilization.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                        style={{ width: `${cluster.resources.utilization}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Total CPU</div>
                      <div className="font-medium">{cluster.resources.totalCpu}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total RAM</div>
                      <div className="font-medium">{cluster.resources.totalMemory.toFixed(0)}GB</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Nodes</div>
                      <div className="font-medium">{cluster.nodes.length}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Workloads */}
        <div className="mt-8 bg-gray-800/50 rounded-lg border border-gray-700 p-6">
          <h2 className="text-2xl font-semibold mb-4">Distributed Workloads</h2>
          {workloads.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No workloads distributed yet</p>
          ) : (
            <div className="space-y-3">
              {workloads.map((workload) => (
                <div key={workload.workloadId} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">Workload {workload.workloadId}</h3>
                      <p className="text-xs text-gray-400 capitalize">{workload.type}</p>
                    </div>
                    <span className={`text-sm font-medium capitalize ${getStatusColor(workload.status)}`}>
                      {workload.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Resources: {workload.resources.cpu} CPU, {workload.resources.memory}GB RAM
                    {workload.resources.storage && `, ${workload.resources.storage}GB Storage`}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Distributed across {workload.assignments.length} nodes
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribute Modal */}
        {showDistributeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Distribute Workload</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Workload Type</label>
                  <select
                    value={workloadType}
                    onChange={(e) => setWorkloadType(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="compute">Compute</option>
                    <option value="storage">Storage</option>
                    <option value="web">Web</option>
                    <option value="database">Database</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">CPU Cores</label>
                  <input
                    type="number"
                    value={workloadResources.cpu}
                    onChange={(e) => setWorkloadResources({ ...workloadResources, cpu: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Memory (GB)</label>
                  <input
                    type="number"
                    value={workloadResources.memory}
                    onChange={(e) => setWorkloadResources({ ...workloadResources, memory: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Storage (GB)</label>
                  <input
                    type="number"
                    value={workloadResources.storage}
                    onChange={(e) => setWorkloadResources({ ...workloadResources, storage: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowDistributeModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={distributeWorkload}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition"
                >
                  Distribute
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
