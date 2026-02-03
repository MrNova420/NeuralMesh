import { useState, useEffect } from 'react';
import { apiService } from '../services/auth';

interface Server {
  id: string;
  name: string;
  type: 'vm' | 'container' | 'bare-metal' | 'cloud';
  status: 'creating' | 'running' | 'stopped' | 'error' | 'deleted';
  specs: {
    cpu: number;
    memory: number;
    storage: number;
    os: string;
  };
  createdAt: string;
}

export default function ServersPage() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    fetchServers();
    fetchTemplates();
  }, []);

  const fetchServers = async () => {
    try {
      const response = await apiService.getAllServers();
      setServers(response.data.servers);
    } catch (error) {
      console.error('Failed to fetch servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await apiService.getServerTemplates();
      setTemplates(response.data.templates);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleStartServer = async (id: string) => {
    try {
      await apiService.startServer(id);
      fetchServers();
    } catch (error) {
      console.error('Failed to start server:', error);
    }
  };

  const handleStopServer = async (id: string) => {
    try {
      await apiService.stopServer(id);
      fetchServers();
    } catch (error) {
      console.error('Failed to stop server:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'stopped':
        return 'bg-gray-500';
      case 'creating':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Server Management</h1>
            <p className="text-gray-400">Create and manage your servers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            Create Server
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading servers...</p>
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-400 mb-4">No servers yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition"
            >
              Create Your First Server
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div
                key={server.id}
                className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 hover:border-purple-500/50 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{server.name}</h3>
                    <p className="text-sm text-gray-400 capitalize">{server.type}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`} />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">CPU:</span>
                    <span>{server.specs.cpu} cores</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Memory:</span>
                    <span>{server.specs.memory} GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Storage:</span>
                    <span>{server.specs.storage} GB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">OS:</span>
                    <span>{server.specs.os}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {server.status === 'stopped' && (
                    <button
                      onClick={() => handleStartServer(server.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm transition"
                    >
                      Start
                    </button>
                  )}
                  {server.status === 'running' && (
                    <button
                      onClick={() => handleStopServer(server.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition"
                    >
                      Stop
                    </button>
                  )}
                  <button className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm transition">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Server Modal - Simplified for now */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Create Server</h2>
              <p className="text-gray-400 mb-4">Choose a template to get started</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-700 rounded-lg p-4 hover:border-purple-500 cursor-pointer transition"
                  >
                    <h3 className="font-semibold mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>{template.specs.cpu} CPU, {template.specs.memory}GB RAM</div>
                      <div>{template.specs.storage}GB Storage</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                >
                  Cancel
                </button>
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition">
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
