import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get default demo portfolio (for non-authenticated access)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM portfolios
      WHERE user_id = (SELECT id FROM users WHERE email = 'demo@trading.com' LIMIT 1)
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Get positions for demo user
router.get('/positions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pos.* FROM positions pos
      INNER JOIN portfolios p ON p.id = pos.portfolio_id
      WHERE p.user_id = (SELECT id FROM users WHERE email = 'demo@trading.com' LIMIT 1)
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Get portfolio by user ID (for authenticated users)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get portfolio
    const portfolioResult = await pool.query(
      'SELECT * FROM portfolios WHERE user_id = $1',
      [userId]
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    const portfolio = portfolioResult.rows[0];

    // Get positions
    const positionsResult = await pool.query(
      'SELECT * FROM positions WHERE portfolio_id = $1',
      [portfolio.id]
    );

    portfolio.positions = positionsResult.rows;

    res.json(portfolio);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

export default router;
