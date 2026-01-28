import express from 'express';
import * as aiService from '../services/aiService.js';
import { getCurrentPrices } from '../services/priceService.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all AI routes
router.use(aiRateLimiter);

/**
 * POST /api/ai/assistant
 * AI Trading Assistant Chat
 */
router.post('/assistant', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await aiService.getTradingAssistantResponse(message, context || {});

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Assistant Error:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

/**
 * POST /api/ai/sentiment
 * AI Market Sentiment Analysis
 */
router.post('/sentiment', async (req, res) => {
  try {
    const prices = getCurrentPrices();
    const pricesArray = Array.isArray(prices) ? prices : Object.values(prices);

    const marketData = {
      prices: pricesArray.map(p => ({
        symbol: p.symbol,
        price: p.price,
        change24h: p.change24h,
        volume: p.volume
      })),
      timestamp: new Date().toISOString()
    };

    const sentiment = await aiService.analyzeMarketSentiment(marketData);

    res.json(sentiment);
  } catch (error) {
    console.error('Sentiment Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

/**
 * POST /api/ai/explain-signal
 * AI Signal Explanation
 */
router.post('/explain-signal', async (req, res) => {
  try {
    const { signal } = req.body;

    if (!signal) {
      return res.status(400).json({ error: 'Signal data is required' });
    }

    const explanation = await aiService.explainTradingSignal(signal);

    res.json({
      explanation,
      signal_id: signal.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Signal Explanation Error:', error);
    res.status(500).json({ error: 'Failed to explain signal' });
  }
});

/**
 * POST /api/ai/portfolio-recommendations
 * AI Portfolio Recommendations
 */
router.post('/portfolio-recommendations', async (req, res) => {
  try {
    const { portfolio } = req.body;
    const prices = getCurrentPrices();
    const pricesArray = Array.isArray(prices) ? prices : Object.values(prices);

    if (!portfolio) {
      return res.status(400).json({ error: 'Portfolio data is required' });
    }

    const marketData = {
      prices: pricesArray.map(p => ({
        symbol: p.symbol,
        price: p.price,
        change24h: p.change24h
      }))
    };

    const recommendations = await aiService.getPortfolioRecommendations(portfolio, marketData);

    res.json(recommendations);
  } catch (error) {
    console.error('Portfolio Recommendations Error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * POST /api/ai/risk-analysis
 * AI Risk Analysis
 */
router.post('/risk-analysis', async (req, res) => {
  try {
    const { position } = req.body;
    const prices = getCurrentPrices();
    const pricesArray = Array.isArray(prices) ? prices : Object.values(prices);

    if (!position) {
      return res.status(400).json({ error: 'Position data is required' });
    }

    const marketConditions = {
      prices: pricesArray.map(p => ({
        symbol: p.symbol,
        price: p.price,
        change24h: p.change24h,
        volume: p.volume
      }))
    };

    const riskAnalysis = await aiService.analyzeRisk(position, marketConditions);

    res.json(riskAnalysis);
  } catch (error) {
    console.error('Risk Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze risk' });
  }
});

/**
 * POST /api/ai/pattern-recognition
 * AI Pattern Recognition
 */
router.post('/pattern-recognition', async (req, res) => {
  try {
    const { priceData, symbol } = req.body;

    if (!priceData || !symbol) {
      return res.status(400).json({ error: 'Price data and symbol are required' });
    }

    const patterns = await aiService.recognizePatterns(priceData, symbol);

    res.json(patterns);
  } catch (error) {
    console.error('Pattern Recognition Error:', error);
    res.status(500).json({ error: 'Failed to recognize patterns' });
  }
});

/**
 * POST /api/ai/generate-strategy
 * AI Trading Strategy Generator
 */
router.post('/generate-strategy', async (req, res) => {
  try {
    const { userProfile } = req.body;
    const prices = getCurrentPrices();
    const pricesArray = Array.isArray(prices) ? prices : Object.values(prices);

    const marketConditions = {
      prices: pricesArray.map(p => ({
        symbol: p.symbol,
        price: p.price,
        change24h: p.change24h,
        volume: p.volume
      })),
      timestamp: new Date().toISOString()
    };

    const strategy = await aiService.generateTradingStrategy(
      userProfile || { risk_tolerance: 'medium', experience: 'intermediate' },
      marketConditions
    );

    res.json(strategy);
  } catch (error) {
    console.error('Strategy Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate strategy' });
  }
});

/**
 * POST /api/ai/news-impact
 * AI News Impact Analysis
 */
router.post('/news-impact', async (req, res) => {
  try {
    const { newsItems, portfolio } = req.body;

    if (!newsItems) {
      return res.status(400).json({ error: 'News items are required' });
    }

    const impact = await aiService.analyzeNewsImpact(newsItems, portfolio || {});

    res.json(impact);
  } catch (error) {
    console.error('News Impact Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze news impact' });
  }
});

/**
 * POST /api/ai/price-prediction
 * AI Price Prediction
 */
router.post('/price-prediction', async (req, res) => {
  try {
    const { symbol, technicalData, timeframe } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const prediction = await aiService.explainPricePrediction(
      symbol,
      technicalData || {},
      timeframe || '24h'
    );

    res.json(prediction);
  } catch (error) {
    console.error('Price Prediction Error:', error);
    res.status(500).json({ error: 'Failed to predict price' });
  }
});

/**
 * POST /api/ai/review-trade
 * AI Trade Review
 */
router.post('/review-trade', async (req, res) => {
  try {
    const { trade, outcome } = req.body;

    if (!trade || !outcome) {
      return res.status(400).json({ error: 'Trade and outcome data are required' });
    }

    const review = await aiService.reviewTrade(trade, outcome);

    res.json({
      review,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trade Review Error:', error);
    res.status(500).json({ error: 'Failed to review trade' });
  }
});

export default router;
