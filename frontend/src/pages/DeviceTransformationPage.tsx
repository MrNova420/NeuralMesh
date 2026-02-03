import { useState, useEffect } from 'react';
import { apiService } from '../services/auth';

interface TransformationProfile {
  id: string;
  name: string;
  description: string;
  targetRole: string;
  requirements: {
    minCpuCores: number;
    minMemory: number;
    minStorage: number;
  };
  performance: any;
}

export default function DeviceTransformationPage() {
  const [profiles, setProfiles] = useState<TransformationProfile[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [transformation, setTransformation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (transformation && transformation.status !== 'completed' && transformation.status !== 'failed') {
      interval = setInterval(() => {
        checkTransformationStatus();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [transformation]);

  const fetchProfiles = async () => {
    try {
      const response = await apiService.getTransformationProfiles();
      setProfiles(response.data.profiles);
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
    }
  };

  const checkTransformationStatus = async () => {
    if (!selectedNode) return;
    try {
      const response = await apiService.getTransformationStatus(selectedNode);
      setTransformation(response.data.transformation);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const startTransformation = async () => {
    if (!selectedNode || !selectedProfile) return;
    
    setLoading(true);
    try {
      const response = await apiService.startTransformation(selectedNode, selectedProfile);
      setTransformation(response.data.transformation);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start transformation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'transforming': return 'text-blue-500';
      case 'planning': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '◉';
      case 'failed': return '✗';
      default: return '○';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Device Transformation</h1>
          <p className="text-gray-400">
            Transform any device into a high-performance production server
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transformation Profiles */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h2 className="text-2xl font-semibold mb-4">Transformation Profiles</h2>
            
            <div className="space-y-4 mb-6">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile.id)}
                  className={`p-4 rounded-lg border cursor-pointer transition ${
                    selectedProfile === profile.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{profile.name}</h3>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded capitalize">
                      {profile.targetRole}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{profile.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>CPU: {profile.requirements.minCpuCores}+ cores</span>
                    <span>RAM: {profile.requirements.minMemory}+ GB</span>
                    <span>Storage: {profile.requirements.minStorage}+ GB</span>
                  </div>
                  {profile.performance && (
                    <div className="mt-2 text-xs text-purple-400">
                      {profile.performance.expectedThroughput && (
                        <span>⚡ {profile.performance.expectedThroughput}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Node ID</label>
                <input
                  type="text"
                  value={selectedNode}
                  onChange={(e) => setSelectedNode(e.target.value)}
                  placeholder="node-001"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                onClick={startTransformation}
                disabled={!selectedNode || !selectedProfile || loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Starting...' : 'Start Transformation'}
              </button>
            </div>
          </div>

          {/* Transformation Progress */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h2 className="text-2xl font-semibold mb-4">Transformation Progress</h2>

            {!transformation ? (
              <div className="text-center py-12 text-gray-500">
                Select a profile and start transformation to see progress
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-semibold capitalize ${getStatusColor(transformation.status)}`}>
                    {transformation.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white">{transformation.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-500"
                      style={{ width: `${transformation.progress}%` }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Transformation Steps</h3>
                  <div className="space-y-2">
                    {transformation.steps.map((step: any, index: number) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-2 rounded ${
                          step.status === 'running' ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        <span className={`text-lg ${
                          step.status === 'completed' ? 'text-green-500' :
                          step.status === 'running' ? 'text-blue-500' :
                          step.status === 'failed' ? 'text-red-500' :
                          'text-gray-600'
                        }`}>
                          {getStepIcon(step.status)}
                        </span>
                        <span className="flex-1">{step.name}</span>
                        {step.status === 'running' && (
                          <span className="text-xs text-blue-400 animate-pulse">Running...</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Result */}
                {transformation.result && (
                  <div className={`p-4 rounded-lg ${
                    transformation.result.success
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    <p className={transformation.result.success ? 'text-green-400' : 'text-red-400'}>
                      {transformation.result.message}
                    </p>
                    {transformation.result.success && transformation.result.performanceGain && (
                      <p className="text-sm text-gray-400 mt-2">
                        Performance Gain: +{transformation.result.performanceGain}%
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">🚀 About Device Transformation</h3>
          <p className="text-gray-300">
            Transform any device (including Android phones, Raspberry Pi, IoT devices) into high-performance 
            production servers. The transformation process optimizes hardware, installs necessary software, 
            and configures the system for optimal performance in your chosen role.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-400">
            <li>✓ Real hardware optimization (CPU governor, I/O scheduler, network tuning)</li>
            <li>✓ Production-grade software installation</li>
            <li>✓ Automatic service configuration</li>
            <li>✓ Performance benchmarking and validation</li>
            <li>✓ Support for mobile devices and edge computing</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
