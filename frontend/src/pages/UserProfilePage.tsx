import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  permissions: string[];
}

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'apikeys' | 'sessions'>('profile');
  const [showNewApiKey, setShowNewApiKey] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, apiKeysRes, sessionsRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/auth/api-keys'),
        api.get('/auth/sessions')
      ]);
      setProfile(profileRes.data);
      setApiKeys(apiKeysRes.data || []);
      setSessions(sessionsRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newApiKeyName.trim()) return;
    try {
      const res = await api.post('/auth/api-keys', { name: newApiKeyName });
      setApiKeys([...apiKeys, res.data]);
      setNewApiKeyName('');
      setShowNewApiKey(false);
    } catch (error) {
      console.error('Failed to generate API key:', error);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      await api.delete(`/auth/api-keys/${keyId}`);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    } catch (error) {
      console.error('Failed to revoke API key:', error);
    }
  };

  const terminateSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  };

  if (loading || !profile) {
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
            User Profile
          </h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          {(['profile', 'security', 'apikeys', 'sessions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab === 'profile' && 'Profile'}
              {tab === 'security' && 'Security'}
              {tab === 'apikeys' && 'API Keys'}
              {tab === 'sessions' && 'Sessions'}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Username</label>
                  <input
                    type="text"
                    value={profile.username}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <input
                    type="text"
                    value={profile.role}
                    readOnly
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Member Since</label>
                    <div className="text-gray-300">{new Date(profile.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Last Login</label>
                    <div className="text-gray-300">{new Date(profile.lastLogin).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Password</h2>
              <button className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors">
                Change Password
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
              <p className="text-gray-400 mb-4">Add an extra layer of security to your account</p>
              <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                Enable 2FA
              </button>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'apikeys' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">API Keys</h2>
                <button
                  onClick={() => setShowNewApiKey(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
                >
                  Generate New Key
                </button>
              </div>
              
              {showNewApiKey && (
                <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                  <input
                    type="text"
                    placeholder="Key name..."
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-800 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={generateApiKey}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
                    >
                      Generate
                    </button>
                    <button
                      onClick={() => setShowNewApiKey(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{key.name}</h3>
                        <p className="text-sm text-gray-400 font-mono">{key.key}</p>
                      </div>
                      <button
                        onClick={() => revokeApiKey(key.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Revoke
                      </button>
                    </div>
                    <div className="text-xs text-gray-400">
                      Created: {new Date(key.createdAt).toLocaleDateString()} • 
                      Last used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>
              <div className="space-y-3">
                {sessions.map(session => (
                  <div key={session.id} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{session.device}</h3>
                          {session.current && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{session.location}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last active: {new Date(session.lastActive).toLocaleString()}
                        </p>
                      </div>
                      {!session.current && (
                        <button
                          onClick={() => terminateSession(session.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Terminate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
