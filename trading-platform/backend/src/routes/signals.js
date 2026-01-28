import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all signals (most recent per pair)
router.get('/', async (req, res) => {
  try {
    const { type, timeframe, limit = 20 } = req.query;

    // Get only the most recent signal for each pair+type combination
    let query = `
      SELECT DISTINCT ON (pair, type) *
      FROM signals
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `;
    const params = [];

    if (type && type !== 'ALL') {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    if (timeframe && timeframe !== 'ALL') {
      params.push(timeframe);
      query += ` AND timeframe = $${params.length}`;
    }

    query += ` ORDER BY pair, type, created_at DESC`;

    params.push(parseInt(limit));
    query += ` LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get signals error:', error);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

// Get signal by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM signals WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get signal error:', error);
    res.status(500).json({ error: 'Failed to fetch signal' });
  }
});

// Get signal statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_signals,
        COUNT(*) FILTER (WHERE type = 'BUY') as buy_signals,
        COUNT(*) FILTER (WHERE type = 'SELL') as sell_signals,
        AVG(confidence) as avg_confidence,
        COUNT(*) FILTER (WHERE confidence > 80) as high_confidence
      FROM signals
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
