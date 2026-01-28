import express from 'express';
import * as predictionService from '../services/predictionTrackingService.js';
import * as socialSentimentService from '../services/socialSentimentService.js';
import * as whaleService from '../services/whaleActivityService.js';
import * as correlationService from '../services/correlationService.js';
import * as botService from '../services/tradingBotService.js';
import { aiRateLimiter, strictRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ============================================================================
// PREDICTION TRACKING
// ============================================================================

/**
 * GET /api/enhancements/predictions/stats
 * Get prediction accuracy statistics
 */
router.get('/predictions/stats', aiRateLimiter, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const stats = await predictionService.getPredictionStats(timeframe);

    res.json({
      success: true,
      timeframe,
      stats
    });
  } catch (error) {
    console.error('Error getting prediction stats:', error);
    res.status(500).json({ error: 'Failed to get prediction stats' });
  }
});

/**
 * GET /api/enhancements/predictions/recent
 * Get recent predictions
 */
router.get('/predictions/recent', aiRateLimiter, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const predictions = await predictionService.getRecentPredictions(parseInt(limit));

    res.json({
      success: true,
      count: predictions.length,
      predictions
    });
  } catch (error) {
    console.error('Error getting recent predictions:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

/**
 * POST /api/enhancements/predictions/verify
 * Manually trigger prediction verification
 */
router.post('/predictions/verify', strictRateLimiter, async (req, res) => {
  try {
    const verified = await predictionService.verifyPendingPredictions();

    res.json({
      success: true,
      verified
    });
  } catch (error) {
    console.error('Error verifying predictions:', error);
    res.status(500).json({ error: 'Failed to verify predictions' });
  }
});

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

/**
 * GET /api/enhancements/recommendations
 * Get user recommendations
 */
router.get('/recommendations', aiRateLimiter, async (req, res) => {
  try {
    const { userId = 1, limit = 20 } = req.query;
    const recommendations = await predictionService.getUserRecommendations(
      parseInt(userId),
      parseInt(limit)
    );

    res.json({
      success: true,
      count: recommendations.length,
      recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

/**
 * POST /api/enhancements/recommendations/:id/action
 * Record user action on recommendation
 */
router.post('/recommendations/:id/action', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    await predictionService.recordRecommendationAction(parseInt(id), action, notes);

    res.json({ success: true });
  } catch (error) {
    console.error('Error recording recommendation action:', error);
    res.status(500).json({ error: 'Failed to record action' });
  }
});

/**
 * POST /api/enhancements/recommendations/:id/outcome
 * Record recommendation outcome
 */
router.post('/recommendations/:id/outcome', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, data } = req.body;

    await predictionService.recordRecommendationOutcome(parseInt(id), status, data);

    res.json({ success: true });
  } catch (error) {
    console.error('Error recording recommendation outcome:', error);
    res.status(500).json({ error: 'Failed to record outcome' });
  }
});

// ============================================================================
// SOCIAL SENTIMENT
// ============================================================================

/**
 * GET /api/enhancements/sentiment/:symbol
 * Get social sentiment for a symbol
 */
router.get('/sentiment/:symbol', aiRateLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '24h' } = req.query;

    const sentiment = await socialSentimentService.getSocialSentiment(
      symbol.toUpperCase(),
      period
    );

    res.json({
      success: true,
      symbol,
      period,
      sentiment
    });
  } catch (error) {
    console.error('Error getting sentiment:', error);
    res.status(500).json({ error: 'Failed to get sentiment' });
  }
});

/**
 * GET /api/enhancements/sentiment/:symbol/aggregated
 * Get aggregated sentiment from all sources
 */
router.get('/sentiment/:symbol/aggregated', aiRateLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;

    const sentiment = await socialSentimentService.getAggregatedSentiment(
      symbol.toUpperCase()
    );

    res.json({
      success: true,
      symbol,
      sentiment
    });
  } catch (error) {
    console.error('Error getting aggregated sentiment:', error);
    res.status(500).json({ error: 'Failed to get sentiment' });
  }
});

/**
 * POST /api/enhancements/sentiment/collect
 * Manually trigger sentiment collection
 */
router.post('/sentiment/collect', strictRateLimiter, async (req, res) => {
  try {
    const results = await socialSentimentService.collectAllSentiments();

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error collecting sentiments:', error);
    res.status(500).json({ error: 'Failed to collect sentiments' });
  }
});

// ============================================================================
// WHALE ACTIVITY
// ============================================================================

/**
 * GET /api/enhancements/whale-activity
 * Get recent whale activity
 */
router.get('/whale-activity', aiRateLimiter, async (req, res) => {
  try {
    const { symbol, limit = 50 } = req.query;

    const activity = await whaleService.getRecentWhaleActivity(
      symbol ? symbol.toUpperCase() : null,
      parseInt(limit)
    );

    res.json({
      success: true,
      count: activity.length,
      activity
    });
  } catch (error) {
    console.error('Error getting whale activity:', error);
    res.status(500).json({ error: 'Failed to get whale activity' });
  }
});

/**
 * GET /api/enhancements/whale-activity/:symbol/stats
 * Get whale activity statistics for a symbol
 */
router.get('/whale-activity/:symbol/stats', aiRateLimiter, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '24h' } = req.query;

    const stats = await whaleService.getWhaleActivityStats(
      symbol.toUpperCase(),
      period
    );

    res.json({
      success: true,
      symbol,
      period,
      stats
    });
  } catch (error) {
    console.error('Error getting whale stats:', error);
    res.status(500).json({ error: 'Failed to get whale stats' });
  }
});

/**
 * POST /api/enhancements/whale-activity/monitor
 * Manually trigger whale monitoring
 */
router.post('/whale-activity/monitor', strictRateLimiter, async (req, res) => {
  try {
    await whaleService.monitorWhaleActivity();

    res.json({ success: true });
  } catch (error) {
    console.error('Error monitoring whale activity:', error);
    res.status(500).json({ error: 'Failed to monitor whale activity' });
  }
});

// ============================================================================
// CORRELATIONS
// ============================================================================

/**
 * GET /api/enhancements/correlations/:symbolA/:symbolB
 * Get correlation between two assets
 */
router.get('/correlations/:symbolA/:symbolB', aiRateLimiter, async (req, res) => {
  try {
    const { symbolA, symbolB } = req.params;
    const { period = '30d' } = req.query;

    const correlation = await correlationService.calculateAssetCorrelation(
      symbolA.toUpperCase(),
      symbolB.toUpperCase(),
      period
    );

    // Store in database
    await correlationService.storeCorrelation(correlation);

    res.json({
      success: true,
      correlation
    });
  } catch (error) {
    console.error('Error calculating correlation:', error);
    res.status(500).json({ error: 'Failed to calculate correlation' });
  }
});

/**
 * POST /api/enhancements/correlations/matrix
 * Calculate correlation matrix for multiple assets
 */
router.post('/correlations/matrix', aiRateLimiter, async (req, res) => {
  try {
    const { symbols, period = '30d' } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length < 2) {
      return res.status(400).json({ error: 'At least 2 symbols required' });
    }

    const matrix = await correlationService.calculateCorrelationMatrix(
      symbols.map(s => s.toUpperCase()),
      period
    );

    res.json({
      success: true,
      matrix
    });
  } catch (error) {
    console.error('Error calculating correlation matrix:', error);
    res.status(500).json({ error: 'Failed to calculate matrix' });
  }
});

/**
 * GET /api/enhancements/correlations/high
 * Find highly correlated assets
 */
router.get('/correlations/high', aiRateLimiter, async (req, res) => {
  try {
    const { threshold = 0.7, period = '30d' } = req.query;

    const correlations = await correlationService.findHighlyCorrelatedAssets(
      parseFloat(threshold),
      period
    );

    res.json({
      success: true,
      threshold,
      period,
      count: correlations.length,
      correlations
    });
  } catch (error) {
    console.error('Error finding correlated assets:', error);
    res.status(500).json({ error: 'Failed to find correlated assets' });
  }
});

/**
 * POST /api/enhancements/correlations/portfolio-risk
 * Calculate portfolio correlation risk
 */
router.post('/correlations/portfolio-risk', aiRateLimiter, async (req, res) => {
  try {
    const { portfolio } = req.body;

    if (!portfolio || !Array.isArray(portfolio)) {
      return res.status(400).json({ error: 'Portfolio array required' });
    }

    const risk = await correlationService.getPortfolioCorrelationRisk(portfolio);

    res.json({
      success: true,
      risk
    });
  } catch (error) {
    console.error('Error calculating portfolio risk:', error);
    res.status(500).json({ error: 'Failed to calculate portfolio risk' });
  }
});

// ============================================================================
// TRADING BOTS
// ============================================================================

/**
 * GET /api/enhancements/bots
 * Get user's trading bots
 */
router.get('/bots', aiRateLimiter, async (req, res) => {
  try {
    const { userId = 1 } = req.query;

    const bots = await botService.getUserBots(parseInt(userId));

    res.json({
      success: true,
      count: bots.length,
      bots
    });
  } catch (error) {
    console.error('Error getting bots:', error);
    res.status(500).json({ error: 'Failed to get bots' });
  }
});

/**
 * POST /api/enhancements/bots
 * Create a new trading bot
 */
router.post('/bots', aiRateLimiter, async (req, res) => {
  try {
    const bot = await botService.createTradingBot(req.body);

    res.json({
      success: true,
      bot
    });
  } catch (error) {
    console.error('Error creating bot:', error);
    res.status(500).json({ error: 'Failed to create bot' });
  }
});

/**
 * PUT /api/enhancements/bots/:id
 * Update a trading bot
 */
router.put('/bots/:id', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const bot = await botService.updateBot(parseInt(id), req.body);

    res.json({
      success: true,
      bot
    });
  } catch (error) {
    console.error('Error updating bot:', error);
    res.status(500).json({ error: 'Failed to update bot' });
  }
});

/**
 * DELETE /api/enhancements/bots/:id
 * Delete a trading bot
 */
router.delete('/bots/:id', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    await botService.deleteBot(parseInt(id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bot:', error);
    res.status(500).json({ error: 'Failed to delete bot' });
  }
});

/**
 * POST /api/enhancements/bots/:id/start
 * Start a trading bot
 */
router.post('/bots/:id/start', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    await botService.startBot(parseInt(id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({ error: 'Failed to start bot' });
  }
});

/**
 * POST /api/enhancements/bots/:id/stop
 * Stop a trading bot
 */
router.post('/bots/:id/stop', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    await botService.stopBot(parseInt(id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});

/**
 * GET /api/enhancements/bots/:id/performance
 * Get bot performance metrics
 */
router.get('/bots/:id/performance', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;

    const performance = await botService.getBotPerformance(parseInt(id));

    res.json({
      success: true,
      performance
    });
  } catch (error) {
    console.error('Error getting bot performance:', error);
    res.status(500).json({ error: 'Failed to get bot performance' });
  }
});

/**
 * GET /api/enhancements/bots/:id/trades
 * Get bot trade history
 */
router.get('/bots/:id/trades', aiRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;

    const trades = await botService.getBotTradeHistory(parseInt(id), parseInt(limit));

    res.json({
      success: true,
      count: trades.length,
      trades
    });
  } catch (error) {
    console.error('Error getting bot trades:', error);
    res.status(500).json({ error: 'Failed to get bot trades' });
  }
});

/**
 * POST /api/enhancements/bots/execute
 * Manually trigger bot execution
 */
router.post('/bots/execute', strictRateLimiter, async (req, res) => {
  try {
    const result = await botService.executeBotTrades();

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error executing bots:', error);
    res.status(500).json({ error: 'Failed to execute bots' });
  }
});

export default router;
