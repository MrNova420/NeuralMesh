import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (() => {
    try {
      const url = new URL(window.location.href);
      url.port = '3001';
      return url.origin;
    } catch {
      return 'http://localhost:3001';
    }
  })();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    console.error(`🔴 API Error:`, error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login', data),
  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refreshToken }),
  refreshToken: (refreshToken: string) =>
    api.post('/api/auth/refresh', { refreshToken }),

  // Nodes
  getAllNodes: () => api.get('/api/nodes'),
  getNodeById: (id: string) => api.get(`/api/nodes/${id}`),

  // Metrics
  getMetrics: () => api.get('/api/metrics'),
  getNodeMetrics: (nodeId: string) => api.get(`/api/metrics/${nodeId}`),

  // Status
  getStatus: () => api.get('/api/status'),

  // Actions
  restartNode: (nodeId: string) => api.post('/api/actions/restart', { nodeId }),
  shutdownNode: (nodeId: string) => api.post('/api/actions/shutdown', { nodeId }),
  disconnectNode: (nodeId: string) => api.post('/api/actions/disconnect', { nodeId }),
  getActionHistory: (nodeId: string) => api.get(`/api/actions/history/${nodeId}`),

  // Analytics
  getHealthScores: () => api.get('/api/analytics/health'),
  getNodeInsights: (nodeId: string) => api.get(`/api/analytics/insights/${nodeId}`),
  getRecommendations: () => api.get('/api/analytics/recommendations'),

  // Servers
  getAllServers: () => api.get('/api/servers'),
  getServerById: (id: string) => api.get(`/api/servers/${id}`),
  createServer: (data: any) => api.post('/api/servers', data),
  updateServer: (id: string, data: any) => api.patch(`/api/servers/${id}`, data),
  deleteServer: (id: string) => api.delete(`/api/servers/${id}`),
  startServer: (id: string) => api.post(`/api/servers/${id}/start`),
  stopServer: (id: string) => api.post(`/api/servers/${id}/stop`),
  restartServer: (id: string) => api.post(`/api/servers/${id}/restart`),
  getServerTemplates: () => api.get('/api/servers/templates/list'),

  // Device Transformation
  analyzeDevice: (nodeId: string) => api.get(`/api/devices/${nodeId}/capabilities`),
  getTransformationProfiles: () => api.get('/api/devices/transformation/profiles'),
  startTransformation: (nodeId: string, profileId: string) =>
    api.post(`/api/devices/${nodeId}/transform`, { profileId }),
  getTransformationStatus: (nodeId: string) =>
    api.get(`/api/devices/${nodeId}/transformation/status`),

  // Mesh Control
  getMeshTopology: () => api.get('/api/mesh/topology'),
  distributeWorkload: (type: string, resources: any) =>
    api.post('/api/mesh/workload/distribute', { type, resources }),
  getWorkloadStatus: (id: string) => api.get(`/api/mesh/workload/${id}`),
  getAllWorkloads: () => api.get('/api/mesh/workload'),

  // Containers
  getAllContainers: (nodeId?: string) => api.get('/api/containers', { params: { nodeId } }),
  getContainerById: (id: string) => api.get(`/api/containers/${id}`),
  createContainer: (data: any) => api.post('/api/containers', data),
  startContainer: (id: string) => api.post(`/api/containers/${id}/start`),
  stopContainer: (id: string) => api.post(`/api/containers/${id}/stop`),
  restartContainer: (id: string) => api.post(`/api/containers/${id}/restart`),
  removeContainer: (id: string, force?: boolean) => 
    api.delete(`/api/containers/${id}`, { params: { force } }),
  getContainerLogs: (id: string, tail?: number) => 
    api.get(`/api/containers/${id}/logs`, { params: { tail } }),
  getContainerStats: (id: string, limit?: number) => 
    api.get(`/api/containers/${id}/stats`, { params: { limit } }),
  execContainerCommand: (id: string, command: string[]) => 
    api.post(`/api/containers/${id}/exec`, { command }),
  getContainerImages: () => api.get('/api/containers/images/list'),
  pullContainerImage: (name: string, tag?: string) => 
    api.post('/api/containers/images/pull', { name, tag }),
  getContainerTemplates: () => api.get('/api/containers/templates/list'),

  // Cloud
  getAllProviders: () => api.get('/api/cloud/providers'),
  getProviderById: (id: string) => api.get(`/api/cloud/providers/${id}`),
  addProvider: (data: any) => api.post('/api/cloud/providers', data),
  updateProvider: (id: string, data: any) => api.patch(`/api/cloud/providers/${id}`, data),
  testProviderConnection: (id: string) => api.post(`/api/cloud/providers/${id}/test`),
  getProviderInstanceTypes: (id: string) => api.get(`/api/cloud/providers/${id}/types`),
  getAllCloudInstances: (providerId?: string) => 
    api.get('/api/cloud/instances', { params: { providerId } }),
  getCloudInstanceById: (id: string) => api.get(`/api/cloud/instances/${id}`),
  createCloudInstance: (providerId: string, data: any) => 
    api.post('/api/cloud/instances', { providerId, ...data }),
  startCloudInstance: (id: string) => api.post(`/api/cloud/instances/${id}/start`),
  stopCloudInstance: (id: string) => api.post(`/api/cloud/instances/${id}/stop`),
  terminateCloudInstance: (id: string) => api.delete(`/api/cloud/instances/${id}`),

  // Server Capabilities
  getAllClusters: () => api.get('/api/capabilities/clusters'),
  getClusterById: (id: string) => api.get(`/api/capabilities/clusters/${id}`),
  createCluster: (data: any) => api.post('/api/capabilities/clusters', data),
  updateCluster: (id: string, data: any) => api.patch(`/api/capabilities/clusters/${id}`, data),
  deleteCluster: (id: string) => api.delete(`/api/capabilities/clusters/${id}`),
  getAllHealthChecks: () => api.get('/api/capabilities/health'),
  getHealthCheck: (serverId: string) => api.get(`/api/capabilities/health/${serverId}`),
  performHealthCheck: (serverId: string) => api.post(`/api/capabilities/health/${serverId}/check`),
  getBackupConfigs: (serverId?: string) => 
    api.get('/api/capabilities/backups/configs', { params: { serverId } }),
  createBackupConfig: (data: any) => api.post('/api/capabilities/backups/configs', data),
  performBackup: (configId: string) => api.post(`/api/capabilities/backups/perform/${configId}`),
  getBackups: (serverId: string) => api.get(`/api/capabilities/backups/${serverId}`),
  restoreBackup: (backupId: string) => api.post(`/api/capabilities/backups/${backupId}/restore`),
  getDeploymentTemplates: () => api.get('/api/capabilities/templates'),
  deployTemplate: (templateId: string, data: any) => 
    api.post(`/api/capabilities/templates/${templateId}/deploy`, data),
};

export default apiService;
