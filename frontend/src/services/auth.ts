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
};

export default apiService;
