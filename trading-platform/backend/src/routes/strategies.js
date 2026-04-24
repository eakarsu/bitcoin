import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get strategies with pagination, search, filter, sort
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      type,
      status,
      sort_by = 'created_at',
      sort_order = 'DESC',
      min_pnl,
      max_pnl
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (name ILIKE $${params.length} OR type ILIKE $${params.length})`;
    }

    if (type && type !== 'ALL') {
      params.push(type);
      whereClause += ` AND type = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (min_pnl) {
      params.push(parseFloat(min_pnl));
      whereClause += ` AND pnl >= $${params.length}`;
    }

    if (max_pnl) {
      params.push(parseFloat(max_pnl));
      whereClause += ` AND pnl <= $${params.length}`;
    }

    const allowedSorts = ['created_at', 'name', 'type', 'status', 'pnl', 'pnl_percent', 'sharpe_ratio', 'win_rate', 'trades_count'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await pool.query(`SELECT COUNT(*) FROM strategies ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);
    const result = await pool.query(
      `SELECT * FROM strategies ${whereClause}
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
    console.error('Get strategies error:', error);
    res.status(500).json({ error: 'Failed to fetch strategies' });
  }
});

// Get strategy by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM strategies WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get strategy error:', error);
    res.status(500).json({ error: 'Failed to fetch strategy' });
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

// Update strategy
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, status, pnl, pnl_percent, sharpe_ratio, max_drawdown, win_rate } = req.body;

    const result = await pool.query(
      `UPDATE strategies SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        status = COALESCE($3, status),
        pnl = COALESCE($4, pnl),
        pnl_percent = COALESCE($5, pnl_percent),
        sharpe_ratio = COALESCE($6, sharpe_ratio),
        max_drawdown = COALESCE($7, max_drawdown),
        win_rate = COALESCE($8, win_rate),
        updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [name, type, status, pnl, pnl_percent, sharpe_ratio, max_drawdown, win_rate, id]
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

// Delete strategy
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM strategies WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    res.json({ message: 'Strategy deleted', id: parseInt(id) });
  } catch (error) {
    console.error('Delete strategy error:', error);
    res.status(500).json({ error: 'Failed to delete strategy' });
  }
});

// Bulk delete
router.post('/bulk/delete', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    const result = await pool.query('DELETE FROM strategies WHERE id = ANY($1) RETURNING id', [ids]);
    res.json({ message: `${result.rowCount} strategies deleted`, deleted: result.rows.map(r => r.id) });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// Bulk update
router.post('/bulk/update', authenticate, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }

    const allowedFields = ['status', 'type'];
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
      `UPDATE strategies SET ${setClauses.join(', ')} WHERE id = ANY($1) RETURNING *`,
      params
    );
    res.json({ message: `${result.rowCount} strategies updated`, data: result.rows });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Bulk update failed' });
  }
});

// CSV export
router.get('/export/csv', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM strategies ORDER BY created_at DESC');
    const headers = ['ID', 'Name', 'Type', 'Status', 'PnL', 'PnL %', 'Sharpe Ratio', 'Max Drawdown', 'Win Rate', 'Trades', 'Avg Hold', 'Created'];
    const csvRows = [headers.join(',')];

    for (const r of result.rows) {
      csvRows.push([r.id, `"${r.name}"`, r.type, r.status, r.pnl, r.pnl_percent, r.sharpe_ratio, r.max_drawdown, r.win_rate, r.trades_count, r.avg_hold_time, r.created_at].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=strategies.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// PDF export
router.get('/export/pdf', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM strategies ORDER BY created_at DESC');
    const html = `<!DOCTYPE html><html><head><title>Strategies Report</title>
    <style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#667eea}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#667eea;color:white}tr:nth-child(even){background:#f9f9f9}.meta{color:#666;font-size:12px}</style></head><body>
    <h1>Trading Strategies Report</h1>
    <p class="meta">Generated: ${new Date().toISOString()} | Total: ${result.rows.length}</p>
    <table><tr><th>Name</th><th>Type</th><th>Status</th><th>PnL</th><th>Sharpe</th><th>Win Rate</th><th>Trades</th></tr>
    ${result.rows.map(r => `<tr><td>${r.name}</td><td>${r.type}</td><td>${r.status}</td><td>$${r.pnl}</td><td>${r.sharpe_ratio}</td><td>${r.win_rate}%</td><td>${r.trades_count}</td></tr>`).join('')}
    </table></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=strategies-report.html');
    res.send(html);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
