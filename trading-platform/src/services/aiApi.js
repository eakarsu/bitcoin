import api from './api';

// AI calls can take longer, so we increase the timeout to 60 seconds
const AI_TIMEOUT = 60000;

/**
 * AI Trading Assistant
 */
export const getTradingAssistance = async (message, context = {}) => {
  const response = await api.post('/api/ai/assistant', { message, context }, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI Market Sentiment Analysis
 */
export const getMarketSentiment = async () => {
  const response = await api.post('/api/ai/sentiment', {}, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI Signal Explanation
 */
export const explainSignal = async (signal) => {
  const response = await api.post('/api/ai/explain-signal', { signal }, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI Portfolio Recommendations
 */
export const getPortfolioRecommendations = async (portfolio) => {
  const response = await api.post('/api/ai/portfolio-recommendations', { portfolio }, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI Risk Analysis
 */
export const getRiskAnalysis = async (position) => {
  const response = await api.post('/api/ai/risk-analysis', { position }, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI Pattern Recognition
 */
export const recognizePatterns = async (priceData, symbol) => {
  const response = await api.post('/api/ai/pattern-recognition', { priceData, symbol }, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI Trading Strategy Generator
 */
export const generateStrategy = async (userProfile) => {
  const response = await api.post('/api/ai/generate-strategy', { userProfile }, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI News Impact Analysis
 */
export const analyzeNewsImpact = async (newsItems, portfolio) => {
  const response = await api.post('/api/ai/news-impact', { newsItems, portfolio }, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI Price Prediction
 */
export const getPricePrediction = async (symbol, technicalData, timeframe) => {
  const response = await api.post('/api/ai/price-prediction', { symbol, technicalData, timeframe }, { timeout: AI_TIMEOUT });
  return response.data;
};

/**
 * AI Trade Review
 */
export const reviewTrade = async (trade, outcome) => {
  const response = await api.post('/api/ai/review-trade', { trade, outcome }, { timeout: AI_TIMEOUT });
  return response.data;
};
