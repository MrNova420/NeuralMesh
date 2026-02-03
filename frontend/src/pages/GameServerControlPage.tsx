import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface GameServer {
  id: string;
  name: string;
  game: string;
  status: string;
  version: string;
  players: number;
  maxPlayers: number;
}

interface Player {
  name: string;
  ip: string;
  playtime: number;
  online: boolean;
}

const GameServerControlPage: React.FC = () => {
  const [servers, setServers] = useState<GameServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [console, setConsole] = useState<string>('');
  const [command, setCommand] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [mods, setMods] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('console');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    if (selectedServer) {
      loadServerData();
    }
  }, [selectedServer, activeTab]);

  const loadServers = async () => {
    try {
      // Load game servers from template deployments
      const response = await api.get('/servers');
      const gameServers = response.data.filter((s: any) => 
        s.type && ['minecraft', 'csgo', 'valheim', 'ark', 'rust'].includes(s.type.toLowerCase())
      );
      setServers(gameServers);
      if (gameServers.length > 0 && !selectedServer) {
        setSelectedServer(gameServers[0].id);
      }
    } catch (error) {
      console.error('Failed to load servers:', error);
    }
  };

  const loadServerData = async () => {
    if (!selectedServer) return;
    
    setLoading(true);
    try {
      switch (activeTab) {
        case 'console':
          const consoleData = await api.get(`/gameservers/${selectedServer}/console`);
          setConsole(consoleData.data.output || '');
          break;
        case 'players':
          const playersData = await api.get(`/gameservers/${selectedServer}/players`);
          setPlayers(playersData.data || []);
          break;
        case 'files':
          const filesData = await api.get(`/gameservers/${selectedServer}/files`);
          setFiles(filesData.data || []);
          break;
        case 'mods':
          const modsData = await api.get(`/gameservers/${selectedServer}/mods`);
          setMods(modsData.data || []);
          break;
      }
    } catch (error) {
      console.error(`Failed to load ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const sendCommand = async () => {
    if (!selectedServer || !command) return;
    
    try {
      await api.post(`/gameservers/${selectedServer}/console/command`, { command });
      setCommand('');
      // Reload console
      setTimeout(loadServerData, 500);
    } catch (error) {
      console.error('Failed to send command:', error);
    }
  };

  const kickPlayer = async (playerName: string) => {
    if (!selectedServer) return;
    
    try {
      await api.post(`/gameservers/${selectedServer}/players/${playerName}/kick`, {
        reason: 'Kicked by admin'
      });
      loadServerData();
    } catch (error) {
      console.error('Failed to kick player:', error);
    }
  };

  const server = servers.find(s => s.id === selectedServer);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Game Server Control Panel
        </h1>

        {/* Server Selector */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Server
          </label>
          <select
            value={selectedServer || ''}
            onChange={(e) => setSelectedServer(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.game}) - {s.players}/{s.maxPlayers} players
              </option>
            ))}
          </select>
        </div>

        {server && (
          <>
            {/* Server Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                <div className="text-2xl font-bold text-green-600">{server.status}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Players</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {server.players}/{server.maxPlayers}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Version</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{server.version}</div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">Game</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{server.game}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-4 px-4" aria-label="Tabs">
                  {['console', 'players', 'files', 'mods', 'config', 'backups'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-3 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-600 dark:text-gray-400">Loading...</div>
                  </div>
                ) : (
                  <>
                    {activeTab === 'console' && (
                      <div>
                        <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm mb-4 h-96 overflow-y-auto">
                          <pre>{console || 'Console output will appear here...'}</pre>
                        </div>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendCommand()}
                            placeholder="Enter command..."
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <button
                            onClick={sendCommand}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'players' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Online Players ({players.length})
                        </h3>
                        <div className="space-y-2">
                          {players.length > 0 ? players.map((player, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{player.name}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {player.ip} • Playtime: {Math.floor(player.playtime / 60)}m
                                </div>
                              </div>
                              <button
                                onClick={() => kickPlayer(player.name)}
                                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                              >
                                Kick
                              </button>
                            </div>
                          )) : (
                            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                              No players online
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'files' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          File Browser
                        </h3>
                        <div className="text-gray-600 dark:text-gray-400">
                          File management interface - browse, edit, upload, download files
                        </div>
                      </div>
                    )}

                    {activeTab === 'mods' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Mods & Plugins ({mods.length})
                        </h3>
                        <div className="text-gray-600 dark:text-gray-400">
                          Mod management - install, uninstall, enable, disable mods
                        </div>
                      </div>
                    )}

                    {activeTab === 'config' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Configuration Editor
                        </h3>
                        <div className="text-gray-600 dark:text-gray-400">
                          Edit server configuration files
                        </div>
                      </div>
                    )}

                    {activeTab === 'backups' && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Backup Management
                        </h3>
                        <div className="text-gray-600 dark:text-gray-400">
                          Create, restore, and manage server backups
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GameServerControlPage;
