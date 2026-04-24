import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get trades with pagination, search, filter, sort
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      symbol,
      side,
      status,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND symbol ILIKE $${params.length}`;
    }

    if (symbol && symbol !== 'ALL') {
      params.push(symbol);
      whereClause += ` AND symbol = $${params.length}`;
    }

    if (side && side !== 'ALL') {
      params.push(side);
      whereClause += ` AND side = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const allowedSorts = ['created_at', 'symbol', 'side', 'quantity', 'entry_price', 'exit_price', 'pnl', 'status'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await pool.query(`SELECT COUNT(*) FROM trades ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit));
    params.push(offset);
    const result = await pool.query(
      `SELECT * FROM trades ${whereClause}
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
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Get trade by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM trades WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get trade error:', error);
    res.status(500).json({ error: 'Failed to fetch trade' });
  }
});

// Update trade
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { exit_price, pnl, pnl_percent, status } = req.body;

    const result = await pool.query(
      `UPDATE trades SET
        exit_price = COALESCE($1, exit_price),
        pnl = COALESCE($2, pnl),
        pnl_percent = COALESCE($3, pnl_percent),
        status = COALESCE($4, status),
        closed_at = CASE WHEN $4 = 'closed' THEN NOW() ELSE closed_at END
       WHERE id = $5 RETURNING *`,
      [exit_price, pnl, pnl_percent, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ error: 'Failed to update trade' });
  }
});

// Delete trade
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM trades WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    res.json({ message: 'Trade deleted', id: parseInt(id) });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ error: 'Failed to delete trade' });
  }
});

// Bulk delete
router.post('/bulk/delete', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    const result = await pool.query('DELETE FROM trades WHERE id = ANY($1) RETURNING id', [ids]);
    res.json({ message: `${result.rowCount} trades deleted`, deleted: result.rows.map(r => r.id) });
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

    const allowedFields = ['status'];
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

    const result = await pool.query(
      `UPDATE trades SET ${setClauses.join(', ')} WHERE id = ANY($1) RETURNING *`,
      params
    );
    res.json({ message: `${result.rowCount} trades updated`, data: result.rows });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ error: 'Bulk update failed' });
  }
});

// CSV export
router.get('/export/csv', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trades ORDER BY created_at DESC');
    const headers = ['ID', 'Symbol', 'Side', 'Quantity', 'Entry Price', 'Exit Price', 'PnL', 'PnL %', 'Status', 'Opened', 'Closed'];
    const csvRows = [headers.join(',')];

    for (const r of result.rows) {
      csvRows.push([r.id, r.symbol, r.side, r.quantity, r.entry_price, r.exit_price || '', r.pnl || '', r.pnl_percent || '', r.status, r.opened_at, r.closed_at || ''].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=trades.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// PDF export
router.get('/export/pdf', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trades ORDER BY created_at DESC');
    const html = `<!DOCTYPE html><html><head><title>Trades Report</title>
    <style>body{font-family:Arial,sans-serif;margin:20px}h1{color:#667eea}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}th{background:#667eea;color:white}tr:nth-child(even){background:#f9f9f9}.meta{color:#666;font-size:12px}</style></head><body>
    <h1>Trade History Report</h1>
    <p class="meta">Generated: ${new Date().toISOString()} | Total: ${result.rows.length}</p>
    <table><tr><th>Symbol</th><th>Side</th><th>Qty</th><th>Entry</th><th>Exit</th><th>PnL</th><th>Status</th></tr>
    ${result.rows.map(r => `<tr><td>${r.symbol}</td><td>${r.side}</td><td>${r.quantity}</td><td>$${r.entry_price}</td><td>${r.exit_price ? '$' + r.exit_price : '-'}</td><td>${r.pnl ? '$' + r.pnl : '-'}</td><td>${r.status}</td></tr>`).join('')}
    </table></body></html>`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', 'attachment; filename=trades-report.html');
    res.send(html);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
