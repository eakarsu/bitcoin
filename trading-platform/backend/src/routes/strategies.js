import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all strategies
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM strategies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get strategies error:', error);
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

// Update strategy status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE strategies SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update strategy error:', error);
    res.status(500).json({ error: 'Failed to update strategy' });
  }
});

export default router;
