import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface OptimizationSettings {
  cpuGovernor: 'performance' | 'balanced' | 'powersave';
  ioScheduler: 'mq-deadline' | 'kyber' | 'none';
  networkBufferSize: number;
  memorySwappiness: number;
  cacheSize: number;
  maxConnections: number;
}

interface OptimizationSuggestion {
  type: 'resource' | 'performance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  savings?: number;
}

export default function OptimizationPage() {
  const [settings, setSettings] = useState<OptimizationSettings>({
    cpuGovernor: 'balanced',
    ioScheduler: 'mq-deadline',
    networkBufferSize: 262144,
    memorySwappiness: 60,
    cacheSize: 128,
    maxConnections: 1000,
  });

  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([
    {
      type: 'resource',
      title: 'Right-size instances',
      description: '3 servers are using only 30% of allocated resources. Downsizing could free up 120GB RAM for other uses.',
      impact: 'high',
      savings: 120
    },
    {
      type: 'performance',
      title: 'Enable caching',
      description: 'Add Redis caching to reduce database load by 60%',
      impact: 'high'
    },
    {
      type: 'resource',
      title: 'Clean up unused containers',
      description: '15 stopped containers are using 45GB of disk space',
      impact: 'medium'
    },
    {
      type: 'resource',
      title: 'Consolidate workloads',
      description: '2 underutilized servers can be merged, freeing 85GB RAM and 4 CPU cores',
      impact: 'high',
      savings: 85
    },
    {
      type: 'performance',
      title: 'Optimize database queries',
      description: '12 slow queries detected. Adding indexes could improve response time by 70%',
      impact: 'high'
    }
  ]);

  const [autoOptimize, setAutoOptimize] = useState(false);
  const [applying, setApplying] = useState(false);

  const applySettings = async () => {
    setApplying(true);
    try {
      // In a real implementation, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Optimization settings applied successfully!');
    } catch (error) {
      console.error('Failed to apply settings:', error);
      alert('Failed to apply settings');
    } finally {
      setApplying(false);
    }
  };

  const applyAutoOptimization = async () => {
    if (confirm('Enable automatic optimization? This will apply recommended settings automatically.')) {
      setAutoOptimize(!autoOptimize);
      alert(`Automatic optimization ${!autoOptimize ? 'enabled' : 'disabled'}`);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'resource': return '📦';
      case 'performance': return '⚡';
      default: return '💡';
    }
  };

  const totalSavings = suggestions
    .filter(s => s.savings)
    .reduce((sum, s) => sum + (s.savings || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Optimization Dashboard</h1>
        <p className="text-gray-600">Control and optimize your infrastructure performance - maximize your free self-hosted setup!</p>
        <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <div className="font-bold text-purple-700">Optimization = Better Resource Usage</div>
              <div className="text-sm text-gray-700">
                Since you're self-hosting, "savings" means freeing up resources for other uses. 
                Use your hardware more efficiently!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Resources Freed</div>
          <div className="text-3xl font-bold text-green-600">{totalSavings}GB</div>
          <div className="text-xs text-gray-500 mt-1">From optimization</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Suggestions</div>
          <div className="text-3xl font-bold text-blue-600">{suggestions.length}</div>
          <div className="text-xs text-gray-500 mt-1">Active recommendations</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Efficiency Score</div>
          <div className="text-3xl font-bold text-purple-600">78%</div>
          <div className="text-xs text-gray-500 mt-1">Good performance</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Auto Optimize</div>
          <div className="text-3xl font-bold text-orange-600">
            {autoOptimize ? 'ON' : 'OFF'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Automatic tuning</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-6">Performance Controls</h2>
          
          <div className="space-y-6">
            {/* CPU Governor */}
            <div>
              <label className="block text-sm font-semibold mb-2">CPU Governor</label>
              <select
                value={settings.cpuGovernor}
                onChange={(e) => setSettings({...settings, cpuGovernor: e.target.value as any})}
                className="w-full p-2 border rounded"
              >
                <option value="performance">Performance (highest speed)</option>
                <option value="balanced">Balanced (recommended)</option>
                <option value="powersave">Power Save (lowest cost)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {settings.cpuGovernor === 'performance' && 'Maximum CPU frequency for best performance'}
                {settings.cpuGovernor === 'balanced' && 'Balances performance and power consumption'}
                {settings.cpuGovernor === 'powersave' && 'Reduces power consumption and costs'}
              </p>
            </div>

            {/* I/O Scheduler */}
            <div>
              <label className="block text-sm font-semibold mb-2">I/O Scheduler</label>
              <select
                value={settings.ioScheduler}
                onChange={(e) => setSettings({...settings, ioScheduler: e.target.value as any})}
                className="w-full p-2 border rounded"
              >
                <option value="mq-deadline">MQ-Deadline (balanced)</option>
                <option value="kyber">Kyber (latency-focused)</option>
                <option value="none">None (throughput-focused)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Controls how disk I/O operations are scheduled
              </p>
            </div>

            {/* Network Buffer */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Network Buffer Size: {(settings.networkBufferSize / 1024).toFixed(0)}KB
              </label>
              <input
                type="range"
                min="65536"
                max="524288"
                step="65536"
                value={settings.networkBufferSize}
                onChange={(e) => setSettings({...settings, networkBufferSize: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>64KB</span>
                <span>512KB</span>
              </div>
            </div>

            {/* Memory Swappiness */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Memory Swappiness: {settings.memorySwappiness}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.memorySwappiness}
                onChange={(e) => setSettings({...settings, memorySwappiness: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Less swap</span>
                <span>More swap</span>
              </div>
            </div>

            {/* Cache Size */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Cache Size: {settings.cacheSize}MB
              </label>
              <input
                type="range"
                min="64"
                max="1024"
                step="64"
                value={settings.cacheSize}
                onChange={(e) => setSettings({...settings, cacheSize: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>64MB</span>
                <span>1GB</span>
              </div>
            </div>

            {/* Max Connections */}
            <div>
              <label className="block text-sm font-semibold mb-2">
                Max Connections: {settings.maxConnections}
              </label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={settings.maxConnections}
                onChange={(e) => setSettings({...settings, maxConnections: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>100</span>
                <span>10,000</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={applySettings}
              disabled={applying}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {applying ? 'Applying...' : 'Apply Settings'}
            </button>
            <button
              onClick={() => setSettings({
                cpuGovernor: 'balanced',
                ioScheduler: 'mq-deadline',
                networkBufferSize: 262144,
                memorySwappiness: 60,
                cacheSize: 128,
                maxConnections: 1000,
              })}
              className="px-4 py-2 border border-gray-300 rounded font-semibold hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Optimization Suggestions */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Optimization Suggestions</h2>
            <button
              onClick={applyAutoOptimization}
              className={`px-4 py-2 rounded font-semibold ${
                autoOptimize
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Auto-Optimize: {autoOptimize ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="space-y-4">
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getTypeIcon(suggestion.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{suggestion.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getImpactColor(suggestion.impact)}`}>
                        {suggestion.impact} impact
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    {suggestion.savings && (
                      <div className="text-green-600 font-semibold text-sm">
                        📦 Free up {suggestion.savings}GB resources
                      </div>
                    )}
                    <button className="mt-2 text-blue-600 text-sm font-semibold hover:underline">
                      Apply Suggestion →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="font-semibold mb-1">💡 Pro Tip</div>
            <p className="text-sm text-gray-700">
              Enable auto-optimization to automatically apply low-risk optimizations. 
              You'll be notified before any major changes are made.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-bold mb-3">💚 Self-Hosted = 100% Free</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="font-semibold">Better Resource Usage</div>
            <div className="text-sm text-gray-600">
              Free up unused resources for new workloads and better performance
            </div>
          </div>
          <div>
            <div className="font-semibold">Maximum Efficiency</div>
            <div className="text-sm text-gray-600">
              Get more from your existing hardware with intelligent optimization
            </div>
          </div>
          <div>
            <div className="font-semibold">Full Control</div>
            <div className="text-sm text-gray-600">
              Your infrastructure, your rules - optimize however you want
            </div>
          </div>
        </div>
        <div className="bg-white bg-opacity-70 rounded p-3 text-sm">
          <strong>Remember:</strong> You're self-hosting on your own NeuralMesh network. There are NO subscription fees, 
          NO hosting charges, and NO hidden costs. Optimization helps you use your hardware more efficiently!
        </div>
      </div>
    </div>
  );
}
