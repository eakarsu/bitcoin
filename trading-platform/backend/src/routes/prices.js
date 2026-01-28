import express from 'express';
import pool from '../config/database.js';
import { getCurrentPrices, fetchHistoricalData } from '../services/priceService.js';

const router = express.Router();

// Get current prices for all tracked symbols (from memory)
router.get('/', async (req, res) => {
  try {
    const prices = await getCurrentPrices();
    res.json(prices);
  } catch (error) {
    console.error('Get current prices error:', error);
    res.status(500).json({ error: 'Failed to fetch current prices' });
  }
});

// Get price history for a symbol
router.get('/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 30 } = req.query;

    const historicalData = await fetchHistoricalData(symbol, parseInt(days));
    res.json(historicalData);
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Legacy endpoint for backwards compatibility
router.get('/current', async (req, res) => {
  try {
    const prices = await getCurrentPrices();
    res.json(prices);
  } catch (error) {
    console.error('Get current prices error:', error);
    res.status(500).json({ error: 'Failed to fetch current prices' });
  }
});

export default router;
