import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get signals with pagination, search, filter, sort
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      type,
      timeframe,
      strength,
      status,
      sort_by = 'created_at',
      sort_order = 'DESC',
      min_confidence,
      max_confidence
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND pair ILIKE $${params.length}`;
    }

    if (type && type !== 'ALL') {
      params.push(type);
      whereClause += ` AND type = $${params.length}`;
    }

    if (timeframe && timeframe !== 'ALL') {
      params.push(timeframe);
      whereClause += ` AND timeframe = $${params.length}`;
    }

    if (strength && strength !== 'ALL') {
      params.push(strength);
      whereClause += ` AND strength = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (min_confidence) {
      params.push(parseFloat(min_confidence));
      whereClause += ` AND confidence >= $${params.length}`;
    }

    if (max_confidence) {
      params.push(parseFloat(max_confidence));
      whereClause += ` AND confidence <= $${params.length}`;
    }

    const allowedSorts = ['created_at', 'pair', 'type', 'strength', 'confidence', 'price', 'timeframe'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count
    const countResult = await pool.query(`SELECT COUNT(*) FROM signals ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Get data
    params.push(parseInt(limit));
    params.push(offset);
    const result = await pool.query(
      `SELECT * FROM signals ${whereClause}
       ORDER BY ${sortCol} ${sortDir}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
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

// Update signal
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, strength, confidence, price, target_price, stop_loss, timeframe, status } = req.body;

    const result = await pool.query(
      `UPDATE signals SET
        type = COALESCE($1, type),
        strength = COALESCE($2, strength),
        confidence = COALESCE($3, confidence),
        price = COALESCE($4, price),
        target_price = COALESCE($5, target_price),
        stop_loss = COALESCE($6, stop_loss),
        timeframe = COALESCE($7, timeframe),
        status = COALESCE($8, status),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [type, strength, confidence, price, target_price, stop_loss, timeframe, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update signal error:', error);
    res.status(500).json({ error: 'Failed to update signal' });
  }
});

// Delete signal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM signals WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    res.json({ message: 'Signal deleted', id: parseInt(id) });
  } catch (error) {
    console.error('Delete signal error:', error);
    res.status(500).json({ error: 'Failed to delete signal' });
  }
});

// Bulk delete signals
router.post('/bulk/delete', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }

    const result = await pool.query(
      'DELETE FROM signals WHERE id = ANY($1) RETURNING id',
      [ids]
    );

    res.json({ message: `${result.rowCount} signals deleted`, deleted: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// Bulk update signals
router.post('/bulk/update', authenticate, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }

    const allowedFields = ['status', 'type', 'strength'];
    const setClauses = [];
    const params = [ids];

    for (const [key, value] of Object.entries(updates || {})) {
      if (allowedFields.includes(key)) {
        params.push(value);
        setClauses.push(`${key} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClauses.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE signals SET ${setClauses.join(', ')} WHERE id = ANY($1) RETURNING *`,
      params
    );

    res.json({ message: `${result.rowCount} signals updated`, data: result.rows });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Bulk update failed' });
  }
});

// CSV export
router.get('/export/csv', async (req, res) => {
  try {
    const { type, timeframe, strength, status } = req.query;
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (type && type !== 'ALL') { params.push(type); whereClause += ` AND type = $${params.length}`; }
    if (timeframe && timeframe !== 'ALL') { params.push(timeframe); whereClause += ` AND timeframe = $${params.length}`; }
    if (strength && strength !== 'ALL') { params.push(strength); whereClause += ` AND strength = $${params.length}`; }
    if (status && status !== 'ALL') { params.push(status); whereClause += ` AND status = $${params.length}`; }

    const result = await pool.query(
      `SELECT id, pair, type, strength, confidence, price, target_price, stop_loss, timeframe, status, created_at
       FROM signals ${whereClause} ORDER BY created_at DESC`,
      params
    );

    const headers = ['ID', 'Pair', 'Type', 'Strength', 'Confidence', 'Price', 'Target Price', 'Stop Loss', 'Timeframe', 'Status', 'Created At'];
    const csvRows = [headers.join(',')];

    for (const row of result.rows) {
      csvRows.push([
        row.id, row.pair, row.type, row.strength, row.confidence, row.price,
        row.target_price, row.stop_loss, row.timeframe, row.status, row.created_at
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=signals.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// PDF export (HTML-based)
router.get('/export/pdf', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM signals ORDER BY created_at DESC LIMIT 100'
    );

    const html = `
      <!DOCTYPE html>
      <html><head><title>Signals Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #667eea; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
        th { background: #667eea; color: white; }
        tr:nth-child(even) { background: #f9f9f9; }
        .meta { color: #666; font-size: 12px; margin-bottom: 10px; }
      </style></head><body>
      <h1>Trading Signals Report</h1>
      <p class="meta">Generated: ${new Date().toISOString()} | Total: ${result.rows.length} signals</p>
      <table>
        <tr><th>ID</th><th>Pair</th><th>Type</th><th>Strength</th><th>Confidence</th><th>Price</th><th>Target</th><th>Stop Loss</th><th>Timeframe</th><th>Status</th></tr>
        ${result.rows.map(r => `<tr>
          <td>${r.id}</td><td>${r.pair}</td><td>${r.type}</td><td>${r.strength}</td>
          <td>${r.confidence}%</td><td>$${r.price}</td><td>$${r.target_price || '-'}</td>
          <td>$${r.stop_loss || '-'}</td><td>${r.timeframe}</td><td>${r.status}</td>
        </tr>`).join('')}
      </table></body></html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=signals-report.html');
    res.send(html);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Export failed' });
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
