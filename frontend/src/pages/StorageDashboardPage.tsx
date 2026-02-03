import { useState, useEffect } from 'react';
import api from '../services/api';

interface StorageNode {
  id: string;
  name: string;
  capacity: number;
  used: number;
  available: number;
  status: string;
}

interface StorageVolume {
  id: string;
  name: string;
  size: number;
  used: number;
  filesystem: string;
  mountPoint: string;
}

interface StoragePool {
  id: string;
  name: string;
  totalCapacity: number;
  usedCapacity: number;
  nodes: number;
  redundancy: string;
}

export default function StorageDashboardPage() {
  const [pools, setPools] = useState<StoragePool[]>([]);
  const [volumes, setVolumes] = useState<StorageVolume[]>([]);
  const [nodes, setNodes] = useState<StorageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [poolsRes, volumesRes, nodesRes] = await Promise.all([
        api.get('/storage/pools'),
        api.get('/storage/volumes'),
        api.get('/storage/nodes')
      ]);
      setPools(poolsRes.data || []);
      setVolumes(volumesRes.data || []);
      setNodes(nodesRes.data || []);
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getUsagePercent = (used: number, total: number) => {
    return ((used / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
            Storage Dashboard
          </h1>
          <p className="text-gray-400">Manage distributed storage across your neural mesh network</p>
        </div>

        {/* Storage Pools */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Storage Pools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map(pool => (
              <div
                key={pool.id}
                onClick={() => setSelectedPool(pool.id)}
                className={`bg-gray-800 rounded-lg p-6 cursor-pointer transition-all hover:bg-gray-750 ${
                  selectedPool === pool.id ? 'ring-2 ring-cyan-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{pool.name}</h3>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">
                    {pool.redundancy}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Capacity</span>
                    <span>{formatBytes(pool.totalCapacity)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Used</span>
                    <span>{formatBytes(pool.usedCapacity)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full transition-all"
                      style={{ width: `${getUsagePercent(pool.usedCapacity, pool.totalCapacity)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{getUsagePercent(pool.usedCapacity, pool.totalCapacity)}% used</span>
                    <span>{pool.nodes} nodes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Volumes */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Volumes</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Used
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Filesystem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Mount Point
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Usage
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {volumes.map(volume => (
                  <tr key={volume.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{volume.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatBytes(volume.size)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatBytes(volume.used)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{volume.filesystem}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{volume.mountPoint}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-700 rounded-full h-2 mr-2">
                          <div
                            className="bg-cyan-500 h-2 rounded-full"
                            style={{ width: `${getUsagePercent(volume.used, volume.size)}%` }}
                          ></div>
                        </div>
                        <span>{getUsagePercent(volume.used, volume.size)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Storage Nodes */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Storage Nodes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {nodes.map(node => (
              <div key={node.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{node.name}</h3>
                  <span className={`w-3 h-3 rounded-full ${
                    node.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity</span>
                    <span>{formatBytes(node.capacity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Available</span>
                    <span className="text-green-400">{formatBytes(node.available)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-cyan-500 h-2 rounded-full"
                      style={{ width: `${getUsagePercent(node.used, node.capacity)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg font-medium transition-colors">
            Create Volume
          </button>
          <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
            Add Storage Node
          </button>
          <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
            Create Snapshot
          </button>
        </div>
      </div>
    </div>
  );
}
