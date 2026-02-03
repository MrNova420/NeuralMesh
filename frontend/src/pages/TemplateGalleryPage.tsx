import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'game' | 'hosting' | 'platform' | 'database' | 'compute';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
  requirements: {
    cpu: number;
    memory: number;
    disk: number;
    ports: number[];
  };
  estimatedCost: {
    monthly: number;
    hourly: number;
  };
  components: Array<{
    name: string;
    type: string;
    config: Record<string, any>;
  }>;
  features: string[];
  documentation: string;
}

export default function TemplateGalleryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(templates.filter(t => t.category === selectedCategory));
    }
  }, [selectedCategory, templates]);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/templates/list');
      if (response.data.success) {
        setTemplates(response.data.templates);
        setFilteredTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const deployTemplate = async (templateId: string) => {
    setDeploying(true);
    try {
      const response = await api.post(`/templates/${templateId}/deploy`, {
        config: {}
      });
      if (response.data.success) {
        alert(`Template deployed successfully! Deployment ID: ${response.data.deploymentId}`);
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Failed to deploy template:', error);
      alert('Failed to deploy template');
    } finally {
      setDeploying(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'game': return '🎮';
      case 'hosting': return '🌐';
      case 'platform': return '🎯';
      case 'database': return '🗄️';
      case 'compute': return '⚡';
      default: return '📦';
    }
  };

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'game', name: 'Game Servers', count: templates.filter(t => t.category === 'game').length },
    { id: 'hosting', name: 'Web Hosting', count: templates.filter(t => t.category === 'hosting').length },
    { id: 'platform', name: 'Game Platforms', count: templates.filter(t => t.category === 'platform').length },
    { id: 'database', name: 'Databases', count: templates.filter(t => t.category === 'database').length },
    { id: 'compute', name: 'Compute', count: templates.filter(t => t.category === 'compute').length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Template Gallery</h1>
        <p className="text-gray-600">Deploy production-ready servers with one click - 100% FREE on your infrastructure!</p>
        <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💰</span>
            <div>
              <div className="font-bold text-green-700">Self-Hosted = Zero Cost</div>
              <div className="text-sm text-gray-700">
                All templates are completely FREE when deployed on your own NeuralMesh network. 
                No subscriptions, no hosting fees, no hidden charges!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {getCategoryIcon(cat.id)} {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
            onClick={() => setSelectedTemplate(template)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{template.icon}</div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getDifficultyColor(template.difficulty)}`}>
                {template.difficulty}
              </span>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{template.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{template.description}</p>
            
            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">CPU:</span>
                <span>{template.requirements.cpu} cores</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">RAM:</span>
                <span>{template.requirements.memory}GB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Disk:</span>
                <span>{template.requirements.disk}GB</span>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="text-2xl font-bold text-green-600">
                FREE (Self-Hosted)
              </div>
              <div className="text-xs text-gray-500">
                Resource value: ~${template.estimatedCost.monthly}/mo
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{selectedTemplate.icon}</div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTemplate.name}</h2>
                    <p className="text-gray-600">{selectedTemplate.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Requirements */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">CPU Cores</div>
                    <div className="text-xl font-bold">{selectedTemplate.requirements.cpu}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Memory</div>
                    <div className="text-xl font-bold">{selectedTemplate.requirements.memory}GB</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Disk Space</div>
                    <div className="text-xl font-bold">{selectedTemplate.requirements.disk}GB</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Ports</div>
                    <div className="text-xl font-bold">{selectedTemplate.requirements.ports.length}</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Features</h3>
                <ul className="space-y-2">
                  {selectedTemplate.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Components */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Components</h3>
                <div className="space-y-2">
                  {selectedTemplate.components.map((component, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded">
                      <div className="font-semibold">{component.name}</div>
                      <div className="text-sm text-gray-600">Type: {component.type}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Cost Information</h3>
                <div className="bg-green-50 border-2 border-green-500 p-6 rounded-lg mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">🎉</span>
                    <div>
                      <div className="text-2xl font-bold text-green-700">100% FREE</div>
                      <div className="text-sm text-green-600">Self-Hosted on Your Infrastructure</div>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    ✓ No subscription fees<br/>
                    ✓ No hosting charges<br/>
                    ✓ No hidden costs<br/>
                    ✓ Complete control
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Resource Consumption Reference</div>
                  <div className="text-xs text-gray-600 mb-2">
                    If you were to rent equivalent cloud resources:
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">Est. Cloud Monthly</div>
                      <div className="text-lg font-bold text-gray-700">
                        ~${selectedTemplate.estimatedCost.monthly}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500">Est. Cloud Hourly</div>
                      <div className="text-lg font-bold text-gray-700">
                        ~${selectedTemplate.estimatedCost.hourly.toFixed(3)}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    These are reference values only. Using your own NeuralMesh network = $0 cost!
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => deployTemplate(selectedTemplate.id)}
                  disabled={deploying}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {deploying ? 'Deploying...' : 'Deploy Template'}
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No templates found in this category
        </div>
      )}
    </div>
  );
}
