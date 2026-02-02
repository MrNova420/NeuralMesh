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

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`🔴 API Error:`, error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Nodes
  getAllNodes: () => api.get('/api/nodes'),
  getNodeById: (id: string) => api.get(`/api/nodes/${id}`),
  
  // Metrics
  getMetrics: () => api.get('/api/metrics'),
  getNodeMetrics: (nodeId: string) => api.get(`/api/metrics/${nodeId}`),
  
  // Status
  getSystemStatus: () => api.get('/api/status'),
};

export default api;
