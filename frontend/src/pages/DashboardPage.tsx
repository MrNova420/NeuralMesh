export function DashboardPage() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-neural-text mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Placeholder cards */}
          <div className="neural-card">
            <h3 className="text-lg font-semibold text-neural-text mb-2">Total Nodes</h3>
            <p className="text-4xl font-bold text-neural-blue">12</p>
          </div>
          <div className="neural-card">
            <h3 className="text-lg font-semibold text-neural-text mb-2">Active Connections</h3>
            <p className="text-4xl font-bold text-neural-green">47</p>
          </div>
          <div className="neural-card">
            <h3 className="text-lg font-semibold text-neural-text mb-2">CPU Usage</h3>
            <p className="text-4xl font-bold text-neural-yellow">42%</p>
          </div>
          <div className="neural-card">
            <h3 className="text-lg font-semibold text-neural-text mb-2">Uptime</h3>
            <p className="text-4xl font-bold text-neural-purple">99.9%</p>
          </div>
        </div>
        
        <div className="mt-8 neural-card">
          <h2 className="text-2xl font-bold text-neural-text mb-4">Welcome to NeuralMesh</h2>
          <p className="text-neural-text-secondary">
            Transform any device into production-grade servers with neural network-inspired architecture.
          </p>
        </div>
      </div>
    </div>
  );
}
