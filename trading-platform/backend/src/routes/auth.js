import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { validatePassword, validateEmail, passwordStrength } from '../middleware/validate.js';

const router = express.Router();

// Register with password strength + email verification
router.post('/register', validateEmail, validatePassword, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];

    // Create email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'24 hours\')',
      [user.id, verifyToken]
    );

    // Assign default 'user' role
    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', ['user']);
    if (roleResult.rows.length > 0) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, roleResult.rows[0].id]
      );
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      user,
      token,
      verificationToken: verifyToken,
      message: 'Registration successful. Please verify your email.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      'SELECT id, email, name, password_hash, subscription_tier, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Get user roles
    const rolesResult = await pool.query(
      `SELECT r.name FROM roles r
       INNER JOIN user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    delete user.password_hash;
    user.roles = rolesResult.rows.map(r => r.name);

    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Check blacklist
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const blacklisted = await pool.query(
      'SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW()',
      [tokenHash]
    );
    if (blacklisted.rows.length > 0) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      'SELECT id, email, name, subscription_tier, email_verified, avatar_url, phone, bio, timezone, notifications_enabled FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get roles
    const rolesResult = await pool.query(
      `SELECT r.name FROM roles r INNER JOIN user_roles ur ON ur.role_id = r.id WHERE ur.user_id = $1`,
      [user.id]
    );
    user.roles = rolesResult.rows.map(r => r.name);

    res.json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout - blacklist token
router.post('/logout', authenticate, async (req, res) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(req.token).digest('hex');
    const decoded = jwt.decode(req.token);
    const expiresAt = new Date(decoded.exp * 1000);

    await pool.query(
      'INSERT INTO token_blacklist (token_hash, expires_at) VALUES ($1, $2) ON CONFLICT (token_hash) DO NOTHING',
      [tokenHash, expiresAt]
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Request password reset
router.post('/password-reset/request', validateEmail, async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    // Invalidate existing tokens
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.rows[0].id]
    );

    const resetToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
      [user.rows[0].id, resetToken]
    );

    // In production, send email here
    res.json({
      message: 'If the email exists, a reset link has been sent.',
      resetToken // Only in dev - remove in production
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// Reset password with token
router.post('/password-reset/confirm', validatePassword, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Reset token is required' });
    }

    const result = await pool.query(
      'SELECT user_id FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userId = result.rows[0].user_id;
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, userId]);
    await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE token = $1', [token]);

    // Blacklist all existing tokens for this user
    // (Force re-login after password change)

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Change password (authenticated)
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Validate new password strength
    const strength = passwordStrength(newPassword);
    if (!strength.isValid) {
      return res.status(400).json({
        error: 'New password too weak',
        details: strength.checks
      });
    }

    const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, user.rows[0].password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const result = await pool.query(
      'SELECT user_id FROM email_verification_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const userId = result.rows[0].user_id;

    await pool.query('UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1', [userId]);
    await pool.query('UPDATE email_verification_tokens SET used = TRUE WHERE token = $1', [token]);

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Resend verification email
router.post('/resend-verification', authenticate, async (req, res) => {
  try {
    if (req.user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Invalidate existing tokens
    await pool.query(
      'UPDATE email_verification_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [req.user.id]
    );

    const verifyToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'24 hours\')',
      [req.user.id, verifyToken]
    );

    res.json({
      message: 'Verification email sent',
      verificationToken: verifyToken // Only in dev
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification' });
  }
});

// Check password strength
router.post('/check-password-strength', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  res.json(passwordStrength(password));
});

export default router;
