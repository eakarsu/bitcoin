import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, subscription_tier, email_verified, avatar_url, phone, bio,
              timezone, notifications_enabled, two_factor_enabled, last_login, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get roles
    const rolesResult = await pool.query(
      `SELECT r.name, r.description FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [req.user.id]
    );
    user.roles = rolesResult.rows;

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, bio, timezone, notifications_enabled, avatar_url } = req.body;

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        bio = COALESCE($3, bio),
        timezone = COALESCE($4, timezone),
        notifications_enabled = COALESCE($5, notifications_enabled),
        avatar_url = COALESCE($6, avatar_url),
        updated_at = NOW()
       WHERE id = $7
       RETURNING id, email, name, subscription_tier, email_verified, avatar_url, phone, bio, timezone, notifications_enabled`,
      [name, phone, bio, timezone, notifications_enabled, avatar_url, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Admin: Get all users (with pagination, search, filter, sort)
router.get('/', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      search = '',
      sort_by = 'created_at',
      sort_order = 'DESC',
      subscription_tier,
      email_verified
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let whereClause = 'WHERE 1=1';

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (email ILIKE $${params.length} OR name ILIKE $${params.length})`;
    }

    if (subscription_tier) {
      params.push(subscription_tier);
      whereClause += ` AND subscription_tier = $${params.length}`;
    }

    if (email_verified !== undefined) {
      params.push(email_verified === 'true');
      whereClause += ` AND email_verified = $${params.length}`;
    }

    const allowedSorts = ['created_at', 'name', 'email', 'subscription_tier', 'last_login'];
    const sortCol = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
    const sortDir = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count total
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    params.push(parseInt(limit));
    params.push(offset);
    const result = await pool.query(
      `SELECT id, email, name, subscription_tier, email_verified, last_login, created_at
       FROM users ${whereClause}
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
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
