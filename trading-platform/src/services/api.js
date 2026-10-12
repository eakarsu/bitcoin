import axios from 'axios';
import { io } from 'socket.io-client';

// API Configuration
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : '');
const WS_URL = import.meta.env.VITE_WS_URL ?? (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tradingTenant = localStorage.getItem('tradingTenant');
  if (tradingTenant) config.headers['x-tenant-id'] = tradingTenant;
  return config;
});

// Socket.IO connection
let socket = null;

export function connectSocket() {
  if (!socket) {
    socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('✓ Connected to real-time updates');
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from real-time updates');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// API Functions

// Legacy list endpoints return paginated objects; their dashboard callers need rows.
export const listRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  throw new TypeError('The list API returned no row array.');
};

// Auth
export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password });
  if (response.data.token) {
    localStorage.setItem('token', response.data.token);
  }
  return response.data;
};

export const register = async (email, password, name) => {
  const response = await api.post('/api/auth/register', { email, password, name });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  disconnectSocket();
};

// Prices
export const getCurrentPrices = async () => {
  const response = await api.get('/api/prices');
  return listRows(response.data);
};

// Portfolio
export const getPortfolio = async () => {
  const response = await api.get('/api/portfolio');
  return response.data;
};

export const getPositions = async () => {
  const response = await api.get('/api/portfolio/positions');
  return listRows(response.data);
};

// Strategies
export const getStrategies = async () => {
  const response = await api.get('/api/strategies');
  return listRows(response.data);
};

export const createStrategy = async (strategy) => {
  const response = await api.post('/api/strategies', strategy);
  return response.data;
};

export const updateStrategy = async (id, updates) => {
  const response = await api.put(`/api/strategies/${id}`, updates);
  return response.data;
};

// Signals
export const getSignals = async () => {
  const response = await api.get('/api/signals');
  return listRows(response.data);
};

export const getActiveSignals = async () => {
  const response = await api.get('/api/signals/active');
  return listRows(response.data);
};

// Trades
export const getTrades = async () => {
  const response = await api.get('/api/trades');
  return listRows(response.data);
};

export const bootstrapTradingTenant = async (tenantKey, name) => {
  const response = await api.post('/api/v2/trading/bootstrap', { tenantKey, name });
  localStorage.setItem('tradingTenant', tenantKey);
  return response.data;
};

export const getTradingDashboard = async () => {
  const response = await api.get('/api/v2/trading/dashboard');
  if (!Array.isArray(response.data?.accounts) || !Array.isArray(response.data?.orders)) {
    throw new TypeError('The trading dashboard response is missing account or order rows.');
  }
  return response.data;
};

export const createPaperAccount = async (payload) => {
  const response = await api.post('/api/v2/trading/accounts', payload);
  return response.data;
};

export const submitPaperOrder = async (payload) => {
  const response = await api.post('/api/v2/trading/orders', payload);
  return response.data;
};

export const simulatePaperOrder = async (orderId, payload) => {
  const response = await api.post(`/api/v2/trading/orders/${orderId}/simulate`, payload);
  return response.data;
};

export const setPaperKillSwitch = async (accountId, payload) => {
  const response = await api.post(`/api/v2/trading/accounts/${accountId}/kill-switch`, payload);
  return response.data;
};

export const getTradingAuditExport = async () => {
  const response = await api.get('/api/v2/trading/audit-export');
  return response.data;
};

// Historical Data
export const getHistoricalData = async (symbol, days = 30) => {
  const response = await api.get(`/api/prices/historical/${symbol}`, {
    params: { days }
  });
  return response.data;
};

export default api;
