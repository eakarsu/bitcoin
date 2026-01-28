import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = 60000; // 60 seconds

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/enhancements`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// PREDICTION TRACKING
// ============================================================================

export async function getPredictionStats(timeframe = '30d') {
  const response = await api.get('/predictions/stats', {
    params: { timeframe }
  });
  return response.data;
}

export async function getRecentPredictions(limit = 50) {
  const response = await api.get('/predictions/recent', {
    params: { limit }
  });
  return response.data;
}

export async function verifyPredictions() {
  const response = await api.post('/predictions/verify');
  return response.data;
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export async function getUserRecommendations(userId = 1, limit = 20) {
  const response = await api.get('/recommendations', {
    params: { userId, limit }
  });
  return response.data;
}

export async function recordRecommendationAction(recommendationId, action, notes = null) {
  const response = await api.post(`/recommendations/${recommendationId}/action`, {
    action,
    notes
  });
  return response.data;
}

export async function recordRecommendationOutcome(recommendationId, status, data = null) {
  const response = await api.post(`/recommendations/${recommendationId}/outcome`, {
    status,
    data
  });
  return response.data;
}

// ============================================================================
// SOCIAL SENTIMENT
// ============================================================================

export async function getSocialSentiment(symbol, period = '24h') {
  const response = await api.get(`/sentiment/${symbol}`, {
    params: { period }
  });
  return response.data;
}

export async function getAggregatedSentiment(symbol) {
  const response = await api.get(`/sentiment/${symbol}/aggregated`);
  return response.data;
}

export async function collectSentiments() {
  const response = await api.post('/sentiment/collect');
  return response.data;
}

// ============================================================================
// WHALE ACTIVITY
// ============================================================================

export async function getWhaleActivity(symbol = null, limit = 50) {
  const response = await api.get('/whale-activity', {
    params: { symbol, limit }
  });
  return response.data;
}

export async function getWhaleActivityStats(symbol, period = '24h') {
  const response = await api.get(`/whale-activity/${symbol}/stats`, {
    params: { period }
  });
  return response.data;
}

export async function monitorWhaleActivity() {
  const response = await api.post('/whale-activity/monitor');
  return response.data;
}

// ============================================================================
// CORRELATIONS
// ============================================================================

export async function getAssetCorrelation(symbolA, symbolB, period = '30d') {
  const response = await api.get(`/correlations/${symbolA}/${symbolB}`, {
    params: { period }
  });
  return response.data;
}

export async function calculateCorrelationMatrix(symbols, period = '30d') {
  const response = await api.post('/correlations/matrix', {
    symbols,
    period
  });
  return response.data;
}

export async function getHighlyCorrelatedAssets(threshold = 0.7, period = '30d') {
  const response = await api.get('/correlations/high', {
    params: { threshold, period }
  });
  return response.data;
}

export async function getPortfolioCorrelationRisk(portfolio) {
  const response = await api.post('/correlations/portfolio-risk', {
    portfolio
  });
  return response.data;
}

// ============================================================================
// TRADING BOTS
// ============================================================================

export async function getUserBots(userId = 1) {
  const response = await api.get('/bots', {
    params: { userId }
  });
  return response.data;
}

export async function createBot(botData) {
  const response = await api.post('/bots', botData);
  return response.data;
}

export async function updateBot(botId, updates) {
  const response = await api.put(`/bots/${botId}`, updates);
  return response.data;
}

export async function deleteBot(botId) {
  const response = await api.delete(`/bots/${botId}`);
  return response.data;
}

export async function startBot(botId) {
  const response = await api.post(`/bots/${botId}/start`);
  return response.data;
}

export async function stopBot(botId) {
  const response = await api.post(`/bots/${botId}/stop`);
  return response.data;
}

export async function getBotPerformance(botId) {
  const response = await api.get(`/bots/${botId}/performance`);
  return response.data;
}

export async function getBotTrades(botId, limit = 50) {
  const response = await api.get(`/bots/${botId}/trades`, {
    params: { limit }
  });
  return response.data;
}

export async function executeBots() {
  const response = await api.post('/bots/execute');
  return response.data;
}
