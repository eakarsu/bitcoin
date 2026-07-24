import pool from '../src/config/database.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function requireDemoPassword() {
  const password = process.env.DEMO_PASSWORD || process.env.SEED_DEMO_PASSWORD || process.env.DEMO_SEED_PASSWORD || '';
  if (password.length < 12 || password.length > 1024) throw new Error('DEMO_PASSWORD must contain 12-1024 characters');
  return password;
}

async function seed() {
  try {
    console.log('Seeding database...\n');

    // ============================================================
    // 1. ROLES (RBAC) - 5 roles with permissions
    // ============================================================
    const roles = [
      ['admin', 'Full system access', JSON.stringify(['manage_users', 'manage_roles', 'manage_signals', 'manage_strategies', 'manage_trades', 'export_data', 'bulk_operations', 'view_analytics'])],
      ['manager', 'Team management access', JSON.stringify(['manage_signals', 'manage_strategies', 'manage_trades', 'export_data', 'bulk_operations', 'view_analytics'])],
      ['trader', 'Trading access', JSON.stringify(['manage_signals', 'manage_strategies', 'manage_trades', 'view_analytics'])],
      ['analyst', 'Read-only analytics', JSON.stringify(['view_analytics', 'export_data'])],
      ['user', 'Basic user access', JSON.stringify(['view_analytics'])]
    ];

    for (const [name, desc, perms] of roles) {
      await pool.query(
        'INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET description = $2, permissions = $3',
        [name, desc, perms]
      );
    }
    console.log('Roles created (5)');

    // ============================================================
    // 2. USERS - 25 users with different tiers and roles
    // ============================================================
    const hashedPassword = await bcrypt.hash(requireDemoPassword(), 10);
    const strongPassword = await bcrypt.hash(requireDemoPassword(), 10);

    const users = [
      ['demo@trading.com', hashedPassword, 'Demo User', 'professional', true, 'admin', '+1-555-0100', 'Full stack trader & admin', 'America/New_York'],
      ['admin@trading.com', strongPassword, 'Admin User', 'enterprise', true, 'admin', '+1-555-0101', 'Platform administrator', 'America/Chicago'],
      ['john.trader@email.com', strongPassword, 'John Smith', 'premium', true, 'trader', '+1-555-0102', 'Experienced crypto trader', 'America/Los_Angeles'],
      ['sarah.analyst@email.com', strongPassword, 'Sarah Johnson', 'premium', true, 'analyst', '+1-555-0103', 'Technical analyst', 'Europe/London'],
      ['mike.manager@email.com', strongPassword, 'Mike Williams', 'enterprise', true, 'manager', '+1-555-0104', 'Portfolio manager', 'America/New_York'],
      ['emma.davis@email.com', strongPassword, 'Emma Davis', 'free', true, 'user', null, null, 'UTC'],
      ['alex.wilson@email.com', strongPassword, 'Alex Wilson', 'premium', true, 'trader', '+1-555-0106', 'Day trader', 'Asia/Tokyo'],
      ['lisa.brown@email.com', strongPassword, 'Lisa Brown', 'free', false, 'user', null, null, 'UTC'],
      ['david.lee@email.com', strongPassword, 'David Lee', 'premium', true, 'trader', '+1-555-0108', 'Swing trader', 'Asia/Singapore'],
      ['maria.garcia@email.com', strongPassword, 'Maria Garcia', 'professional', true, 'trader', '+1-555-0109', 'Algorithmic trader', 'Europe/Madrid'],
      ['james.taylor@email.com', strongPassword, 'James Taylor', 'enterprise', true, 'manager', '+1-555-0110', 'Fund manager', 'America/New_York'],
      ['anna.martinez@email.com', strongPassword, 'Anna Martinez', 'free', false, 'user', null, null, 'UTC'],
      ['robert.jones@email.com', strongPassword, 'Robert Jones', 'premium', true, 'analyst', '+1-555-0112', 'Quant analyst', 'Europe/Berlin'],
      ['sophia.white@email.com', strongPassword, 'Sophia White', 'professional', true, 'trader', '+1-555-0113', 'Options trader', 'America/Denver'],
      ['daniel.harris@email.com', strongPassword, 'Daniel Harris', 'free', true, 'user', null, null, 'UTC'],
      ['olivia.clark@email.com', strongPassword, 'Olivia Clark', 'premium', true, 'trader', '+1-555-0115', 'Scalper', 'Europe/Paris'],
      ['william.lewis@email.com', strongPassword, 'William Lewis', 'enterprise', true, 'admin', '+1-555-0116', 'CTO', 'America/New_York'],
      ['isabella.walker@email.com', strongPassword, 'Isabella Walker', 'free', false, 'user', null, null, 'UTC'],
      ['henry.hall@email.com', strongPassword, 'Henry Hall', 'professional', true, 'analyst', '+1-555-0118', 'Market researcher', 'Asia/Hong_Kong'],
      ['charlotte.allen@email.com', strongPassword, 'Charlotte Allen', 'premium', true, 'trader', '+1-555-0119', 'Momentum trader', 'America/Chicago'],
      ['lucas.young@email.com', strongPassword, 'Lucas Young', 'professional', true, 'trader', '+1-555-0120', 'DeFi specialist', 'Europe/Zurich'],
      ['mia.king@email.com', strongPassword, 'Mia King', 'premium', true, 'analyst', '+1-555-0121', 'On-chain analyst', 'Asia/Seoul'],
      ['ethan.wright@email.com', strongPassword, 'Ethan Wright', 'free', true, 'user', null, null, 'UTC'],
      ['ava.lopez@email.com', strongPassword, 'Ava Lopez', 'enterprise', true, 'manager', '+1-555-0123', 'Risk manager', 'America/New_York'],
      ['noah.hill@email.com', strongPassword, 'Noah Hill', 'professional', true, 'trader', '+1-555-0124', 'Grid trader', 'Australia/Sydney']
    ];

    const userIds = {};
    for (const [email, pass, name, tier, verified, roleName, phone, bio, timezone] of users) {
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, subscription_tier, email_verified, phone, bio, timezone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (email) DO UPDATE SET name = $3, subscription_tier = $4, email_verified = $5, phone = $6, bio = $7, timezone = $8
         RETURNING id`,
        [email, pass, name, tier, verified, phone, bio, timezone]
      );
      userIds[email] = result.rows[0].id;

      const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1', [roleName]);
      if (roleResult.rows.length > 0) {
        await pool.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [result.rows[0].id, roleResult.rows[0].id]
        );
      }
    }
    console.log('Users created (25) with role assignments');

    const demoUserId = userIds['demo@trading.com'];

    // ============================================================
    // 3. PORTFOLIOS - 20 portfolios
    // ============================================================
    const portfolios = [
      [demoUserId, 1250000, 185000, 17.35, 12500, 1.01],
      [userIds['john.trader@email.com'], 850000, 92000, 12.15, 8500, 1.01],
      [userIds['sarah.analyst@email.com'], 420000, 35000, 9.09, 2100, 0.50],
      [userIds['mike.manager@email.com'], 2100000, 310000, 17.33, 31500, 1.52],
      [userIds['alex.wilson@email.com'], 175000, 15000, 9.37, 1200, 0.69],
      [userIds['david.lee@email.com'], 560000, 62000, 12.44, 5600, 1.01],
      [userIds['maria.garcia@email.com'], 1850000, 245000, 15.27, 18500, 1.01],
      [userIds['james.taylor@email.com'], 3200000, 480000, 17.64, 32000, 1.01],
      [userIds['sophia.white@email.com'], 720000, 85000, 13.38, 7200, 1.01],
      [userIds['olivia.clark@email.com'], 340000, 28000, 8.97, 1700, 0.50],
      [userIds['emma.davis@email.com'], 95000, 5000, 5.55, 475, 0.50],
      [userIds['daniel.harris@email.com'], 120000, 8000, 7.14, 600, 0.50],
      [userIds['robert.jones@email.com'], 680000, 72000, 11.84, 6800, 1.01],
      [userIds['henry.hall@email.com'], 990000, 125000, 14.44, 9900, 1.01],
      [userIds['charlotte.allen@email.com'], 450000, 42000, 10.29, 4500, 1.01],
      [userIds['lucas.young@email.com'], 780000, 95000, 13.87, 7800, 1.01],
      [userIds['mia.king@email.com'], 520000, 48000, 10.15, 5200, 1.01],
      [userIds['ava.lopez@email.com'], 1650000, 220000, 15.38, 16500, 1.01],
      [userIds['noah.hill@email.com'], 380000, 32000, 9.19, 3800, 1.01],
      [userIds['william.lewis@email.com'], 2800000, 420000, 17.65, 28000, 1.01]
    ];

    const portfolioIds = {};
    for (const [userId, ...vals] of portfolios) {
      const result = await pool.query(
        `INSERT INTO portfolios (user_id, total_value, total_pnl, total_pnl_percent, day_pnl, day_pnl_percent)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [userId, ...vals]
      );
      portfolioIds[userId] = result.rows[0].id;
    }
    console.log('Portfolios created (20)');

    // ============================================================
    // 4. POSITIONS - 25 positions across portfolios
    // ============================================================
    const positions = [
      [portfolioIds[demoUserId], 'BTC/USDT', 15.5, 48500, 102500, 1588750, 837250, 52.68],
      [portfolioIds[demoUserId], 'ETH/USDT', 85.2, 2950, 3850, 327720, 76680, 30.51],
      [portfolioIds[demoUserId], 'SOL/USDT', 500, 135, 225, 112500, 45000, 66.67],
      [portfolioIds[demoUserId], 'BNB/USDT', 120, 450, 650, 78000, 24000, 44.44],
      [portfolioIds[userIds['john.trader@email.com']], 'BTC/USDT', 5.2, 52000, 102500, 533000, 262600, 97.12],
      [portfolioIds[userIds['john.trader@email.com']], 'ETH/USDT', 45, 3200, 3850, 173250, 29250, 20.31],
      [portfolioIds[userIds['john.trader@email.com']], 'XRP/USDT', 50000, 0.55, 2.35, 117500, 90000, 327.27],
      [portfolioIds[userIds['mike.manager@email.com']], 'BTC/USDT', 25, 45000, 102500, 2562500, 1437500, 127.78],
      [portfolioIds[userIds['mike.manager@email.com']], 'ETH/USDT', 200, 2800, 3850, 770000, 210000, 37.50],
      [portfolioIds[userIds['maria.garcia@email.com']], 'BTC/USDT', 12, 55000, 102500, 1230000, 570000, 86.36],
      [portfolioIds[userIds['maria.garcia@email.com']], 'SOL/USDT', 1000, 95, 225, 225000, 130000, 136.84],
      [portfolioIds[userIds['alex.wilson@email.com']], 'ETH/USDT', 25, 3400, 3850, 96250, 11250, 13.24],
      [portfolioIds[userIds['alex.wilson@email.com']], 'ADA/USDT', 25000, 0.45, 1.05, 26250, 15000, 133.33],
      [portfolioIds[userIds['david.lee@email.com']], 'BTC/USDT', 3.5, 58000, 102500, 358750, 155750, 76.72],
      [portfolioIds[userIds['david.lee@email.com']], 'SOL/USDT', 350, 120, 225, 78750, 36750, 87.50],
      [portfolioIds[userIds['sophia.white@email.com']], 'BTC/USDT', 4, 62000, 102500, 410000, 162000, 65.32],
      [portfolioIds[userIds['sophia.white@email.com']], 'ETH/USDT', 50, 3100, 3850, 192500, 37500, 24.19],
      [portfolioIds[userIds['emma.davis@email.com']], 'BTC/USDT', 0.5, 68000, 102500, 51250, 17250, 50.74],
      [portfolioIds[userIds['robert.jones@email.com']], 'BTC/USDT', 4.5, 50000, 102500, 461250, 236250, 105.00],
      [portfolioIds[userIds['henry.hall@email.com']], 'BTC/USDT', 7, 52000, 102500, 717500, 353500, 97.12],
      [portfolioIds[userIds['lucas.young@email.com']], 'ETH/USDT', 60, 3000, 3850, 231000, 51000, 28.33],
      [portfolioIds[userIds['lucas.young@email.com']], 'SOL/USDT', 800, 110, 225, 180000, 92000, 104.55],
      [portfolioIds[userIds['mia.king@email.com']], 'BTC/USDT', 3, 60000, 102500, 307500, 127500, 70.83],
      [portfolioIds[userIds['ava.lopez@email.com']], 'BTC/USDT', 10, 48000, 102500, 1025000, 545000, 113.54],
      [portfolioIds[userIds['noah.hill@email.com']], 'BNB/USDT', 200, 380, 650, 130000, 54000, 71.05]
    ];

    for (const pos of positions) {
      await pool.query(
        `INSERT INTO positions (portfolio_id, symbol, quantity, avg_price, current_price, value, pnl, pnl_percent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        pos
      );
    }
    console.log('Positions created (25)');

    // ============================================================
    // 5. STRATEGIES - 25 strategies
    // ============================================================
    const strategies = [
      [demoUserId, 'Mean Reversion Alpha', 'Statistical Arbitrage', 'active', 45200, 22.6, 2.3, 8.5, 68, 1247, '4.2h'],
      [demoUserId, 'Momentum Breakout', 'Trend Following', 'active', 38900, 19.45, 1.9, 12.3, 62, 856, '8.5h'],
      [demoUserId, 'Market Making Bot', 'Market Making', 'active', 28400, 14.2, 3.1, 4.2, 89, 5623, '12m'],
      [demoUserId, 'ML Sentiment Strategy', 'AI/ML', 'testing', 12300, 6.15, 1.5, 15.8, 58, 234, '1.2d'],
      [demoUserId, 'VWAP Execution', 'Execution', 'active', 18500, 9.25, 2.1, 6.7, 75, 3421, '30m'],
      [demoUserId, 'Pairs Trading ETH/BTC', 'Pairs Trading', 'active', 32100, 16.05, 2.5, 7.1, 71, 1890, '6.5h'],
      [userIds['john.trader@email.com'], 'Scalping Bot v2', 'Scalping', 'active', 15600, 7.8, 1.8, 3.2, 82, 12450, '5m'],
      [userIds['john.trader@email.com'], 'DCA Bitcoin Weekly', 'DCA', 'active', 52300, 26.15, 0, 25.1, 100, 156, '7d'],
      [userIds['mike.manager@email.com'], 'Grid Trading SOL', 'Grid Trading', 'active', 24700, 12.35, 2.0, 9.4, 73, 2340, '2.3h'],
      [userIds['mike.manager@email.com'], 'Arbitrage Cross-Exchange', 'Arbitrage', 'active', 31200, 15.6, 3.5, 2.1, 91, 8750, '8m'],
      [userIds['maria.garcia@email.com'], 'RSI Divergence', 'Technical', 'active', 19800, 9.9, 1.7, 11.5, 65, 567, '1.5d'],
      [userIds['maria.garcia@email.com'], 'Whale Following', 'On-Chain', 'testing', 8900, 4.45, 1.2, 18.2, 55, 123, '3.2d'],
      [userIds['alex.wilson@email.com'], 'Bollinger Bounce', 'Technical', 'active', 11200, 5.6, 1.4, 13.7, 60, 789, '12h'],
      [userIds['david.lee@email.com'], 'News Sentiment Bot', 'AI/ML', 'active', 16700, 8.35, 1.6, 14.1, 63, 445, '4h'],
      [userIds['sophia.white@email.com'], 'MACD Crossover', 'Technical', 'active', 21300, 10.65, 1.8, 10.2, 67, 1023, '8h'],
      [userIds['sophia.white@email.com'], 'Fibonacci Retracement', 'Technical', 'paused', 7600, 3.8, 1.1, 16.5, 54, 345, '1d'],
      [userIds['olivia.clark@email.com'], 'Simple Moving Avg', 'Technical', 'active', 9400, 4.7, 1.3, 12.8, 59, 678, '16h'],
      [userIds['robert.jones@email.com'], 'Volume Profile', 'Volume Analysis', 'active', 27500, 13.75, 2.2, 8.9, 72, 1567, '5h'],
      [userIds['henry.hall@email.com'], 'Ichimoku Cloud', 'Technical', 'active', 14200, 7.1, 1.5, 11.3, 64, 890, '10h'],
      [userIds['charlotte.allen@email.com'], 'Order Flow Imbalance', 'Order Flow', 'testing', 5300, 2.65, 0.9, 19.5, 52, 167, '2d'],
      [userIds['lucas.young@email.com'], 'DeFi Yield Farming', 'DeFi', 'active', 34500, 17.25, 2.4, 7.8, 74, 2100, '3.5h'],
      [userIds['mia.king@email.com'], 'On-Chain Metrics', 'On-Chain', 'active', 22100, 11.05, 1.9, 9.1, 69, 780, '6h'],
      [userIds['ava.lopez@email.com'], 'Risk Parity Model', 'Risk Management', 'active', 41000, 20.5, 2.8, 5.3, 78, 1450, '2h'],
      [userIds['noah.hill@email.com'], 'Range Trading Bot', 'Grid Trading', 'active', 18900, 9.45, 2.0, 8.2, 70, 3200, '1.5h'],
      [userIds['ethan.wright@email.com'], 'Breakout Scanner', 'Technical', 'paused', 6800, 3.4, 1.0, 17.3, 53, 290, '18h']
    ];

    for (const strat of strategies) {
      await pool.query(
        `INSERT INTO strategies (user_id, name, type, status, pnl, pnl_percent, sharpe_ratio, max_drawdown, win_rate, trades_count, avg_hold_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        strat
      );
    }
    console.log('Strategies created (25)');

    // ============================================================
    // 6. SIGNALS - 30 signals
    // ============================================================
    const signals = [
      ['BTC/USDT', 'BUY', 'STRONG', 92.5, 101500, 110000, 98000, '4H', { rsi: 35, macd: 2.1, volume: 1.8, ema_cross: true }],
      ['ETH/USDT', 'BUY', 'STRONG', 88.3, 3780, 4200, 3600, '1D', { rsi: 38, macd: 1.5, volume: 1.5, support: 3600 }],
      ['SOL/USDT', 'BUY', 'MODERATE', 75.8, 218, 245, 205, '4H', { rsi: 42, macd: 0.8, volume: 1.3, trend: 'bullish' }],
      ['BNB/USDT', 'SELL', 'STRONG', 85.2, 658, 620, 680, '1H', { rsi: 78, macd: -1.2, volume: 1.6, overbought: true }],
      ['XRP/USDT', 'BUY', 'MODERATE', 72.1, 2.28, 2.55, 2.15, '1D', { rsi: 45, macd: 0.5, volume: 1.1, accumulation: true }],
      ['ADA/USDT', 'HOLD', 'WEAK', 55.4, 1.02, 1.15, 0.92, '4H', { rsi: 50, macd: 0.1, volume: 0.9, range_bound: true }],
      ['DOGE/USDT', 'SELL', 'MODERATE', 68.9, 0.42, 0.38, 0.45, '1H', { rsi: 72, macd: -0.8, volume: 2.1, divergence: true }],
      ['AVAX/USDT', 'BUY', 'STRONG', 91.2, 42.50, 48.00, 39.00, '1D', { rsi: 32, macd: 2.5, volume: 2.3, breakout: true }],
      ['DOT/USDT', 'BUY', 'MODERATE', 70.5, 8.75, 9.50, 8.20, '4H', { rsi: 40, macd: 0.6, volume: 1.2, channel: 'lower' }],
      ['LINK/USDT', 'SELL', 'WEAK', 58.3, 18.90, 17.50, 19.80, '1H', { rsi: 65, macd: -0.3, volume: 0.8, resistance: 19.5 }],
      ['MATIC/USDT', 'BUY', 'STRONG', 87.6, 1.25, 1.45, 1.15, '1D', { rsi: 33, macd: 1.8, volume: 1.7, accumulation: true }],
      ['UNI/USDT', 'HOLD', 'MODERATE', 64.2, 12.80, 13.50, 12.00, '4H', { rsi: 52, macd: 0.2, volume: 1.0, consolidation: true }],
      ['ATOM/USDT', 'BUY', 'MODERATE', 73.8, 11.20, 12.50, 10.50, '1D', { rsi: 38, macd: 0.9, volume: 1.4, trend: 'bullish' }],
      ['FTM/USDT', 'SELL', 'STRONG', 84.1, 0.85, 0.72, 0.92, '1H', { rsi: 80, macd: -1.5, volume: 1.9, overbought: true }],
      ['NEAR/USDT', 'BUY', 'WEAK', 60.7, 7.35, 7.90, 6.90, '4H', { rsi: 44, macd: 0.4, volume: 1.1, recovery: true }],
      ['BTC/USDT', 'BUY', 'STRONG', 94.1, 102000, 112000, 97000, '1D', { rsi: 30, macd: 3.2, volume: 2.5, golden_cross: true }],
      ['ETH/USDT', 'SELL', 'MODERATE', 71.5, 3820, 3650, 3950, '1H', { rsi: 68, macd: -0.7, volume: 1.3, short_term: 'bearish' }],
      ['SOL/USDT', 'BUY', 'STRONG', 89.4, 220, 250, 200, '1D', { rsi: 36, macd: 1.9, volume: 1.8, ecosystem: 'growing' }],
      ['BTC/USDT', 'HOLD', 'MODERATE', 66.8, 101800, 105000, 99000, '15M', { rsi: 48, macd: 0.2, volume: 1.0, choppy: true }],
      ['ALGO/USDT', 'BUY', 'MODERATE', 74.3, 0.38, 0.44, 0.35, '4H', { rsi: 41, macd: 0.7, volume: 1.2, dip_buy: true }],
      ['ARB/USDT', 'BUY', 'STRONG', 86.9, 1.65, 1.90, 1.50, '1D', { rsi: 34, macd: 1.6, volume: 1.6, l2_narrative: true }],
      ['OP/USDT', 'SELL', 'MODERATE', 69.5, 3.45, 3.10, 3.65, '4H', { rsi: 70, macd: -0.9, volume: 1.4, profit_taking: true }],
      ['AAVE/USDT', 'BUY', 'MODERATE', 76.2, 125.50, 140.00, 118.00, '1D', { rsi: 39, macd: 1.1, volume: 1.3, defi: 'recovery' }],
      ['MKR/USDT', 'HOLD', 'WEAK', 52.8, 1850, 1950, 1750, '4H', { rsi: 55, macd: 0.1, volume: 0.7, neutral: true }],
      ['INJ/USDT', 'BUY', 'STRONG', 90.1, 38.50, 45.00, 35.00, '1D', { rsi: 31, macd: 2.8, volume: 2.1, momentum: true }],
      ['SUI/USDT', 'BUY', 'STRONG', 88.7, 1.85, 2.20, 1.65, '4H', { rsi: 33, macd: 1.7, volume: 1.9, breakout: true }],
      ['TIA/USDT', 'SELL', 'MODERATE', 67.4, 15.20, 13.80, 16.00, '1H', { rsi: 71, macd: -0.6, volume: 1.2, reversal: true }],
      ['SEI/USDT', 'BUY', 'WEAK', 59.2, 0.72, 0.82, 0.65, '4H', { rsi: 43, macd: 0.3, volume: 1.0, accumulation: true }],
      ['WLD/USDT', 'HOLD', 'MODERATE', 63.5, 3.10, 3.40, 2.85, '1D', { rsi: 49, macd: 0.1, volume: 0.9, wait: true }],
      ['PEPE/USDT', 'BUY', 'STRONG', 85.3, 0.000012, 0.000015, 0.000010, '1H', { rsi: 35, macd: 1.4, volume: 2.8, meme_momentum: true }]
    ];

    for (const sig of signals) {
      const [pair, type, strength, confidence, price, target, stop, tf, indicators] = sig;
      await pool.query(
        `INSERT INTO signals (pair, type, strength, confidence, price, target_price, stop_loss, timeframe, indicators)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [pair, type, strength, confidence, price, target, stop, tf, JSON.stringify(indicators)]
      );
    }
    console.log('Signals created (30)');

    // ============================================================
    // 7. TRADES - 30 trades
    // ============================================================
    const trades = [
      [demoUserId, 'BTC/USDT', 'BUY', 2.5, 95000, 102500, 18750, 7.89, 'closed'],
      [demoUserId, 'ETH/USDT', 'BUY', 30, 3400, 3850, 13500, 13.24, 'closed'],
      [demoUserId, 'SOL/USDT', 'SELL', 100, 230, 218, 1200, 5.22, 'closed'],
      [demoUserId, 'BTC/USDT', 'BUY', 1.0, 98000, null, null, null, 'open'],
      [demoUserId, 'BNB/USDT', 'BUY', 50, 620, 658, 1900, 6.13, 'closed'],
      [userIds['john.trader@email.com'], 'BTC/USDT', 'BUY', 3, 88000, 102500, 43500, 16.48, 'closed'],
      [userIds['john.trader@email.com'], 'ETH/USDT', 'SELL', 20, 3900, 3700, 4000, 5.13, 'closed'],
      [userIds['john.trader@email.com'], 'XRP/USDT', 'BUY', 10000, 1.80, 2.35, 5500, 30.56, 'closed'],
      [userIds['john.trader@email.com'], 'SOL/USDT', 'BUY', 50, 190, null, null, null, 'open'],
      [userIds['mike.manager@email.com'], 'BTC/USDT', 'BUY', 10, 72000, 102500, 305000, 42.36, 'closed'],
      [userIds['mike.manager@email.com'], 'ETH/USDT', 'BUY', 100, 2800, 3850, 105000, 37.50, 'closed'],
      [userIds['mike.manager@email.com'], 'BTC/USDT', 'BUY', 5, 96000, null, null, null, 'open'],
      [userIds['maria.garcia@email.com'], 'SOL/USDT', 'BUY', 500, 95, 225, 65000, 136.84, 'closed'],
      [userIds['maria.garcia@email.com'], 'BTC/USDT', 'SELL', 2, 105000, 101500, 7000, 3.33, 'closed'],
      [userIds['alex.wilson@email.com'], 'ETH/USDT', 'BUY', 15, 3200, 3850, 9750, 20.31, 'closed'],
      [userIds['alex.wilson@email.com'], 'ADA/USDT', 'BUY', 10000, 0.65, 1.05, 4000, 61.54, 'closed'],
      [userIds['david.lee@email.com'], 'BTC/USDT', 'BUY', 1.5, 82000, 102500, 30750, 25.00, 'closed'],
      [userIds['david.lee@email.com'], 'SOL/USDT', 'BUY', 200, 120, null, null, null, 'open'],
      [userIds['sophia.white@email.com'], 'BTC/USDT', 'BUY', 2, 78000, 102500, 49000, 31.41, 'closed'],
      [userIds['sophia.white@email.com'], 'ETH/USDT', 'SELL', 25, 4000, 3850, 3750, 3.75, 'closed'],
      [demoUserId, 'AVAX/USDT', 'BUY', 200, 35, 42.50, 1500, 21.43, 'closed'],
      [demoUserId, 'DOT/USDT', 'SELL', 500, 9.50, 8.75, 375, 7.89, 'closed'],
      [demoUserId, 'LINK/USDT', 'BUY', 100, 15.00, null, null, null, 'open'],
      [userIds['robert.jones@email.com'], 'BTC/USDT', 'BUY', 2, 90000, 102500, 25000, 13.89, 'closed'],
      [userIds['henry.hall@email.com'], 'ETH/USDT', 'BUY', 40, 3000, 3850, 34000, 28.33, 'closed'],
      [userIds['lucas.young@email.com'], 'SOL/USDT', 'BUY', 300, 105, 225, 36000, 114.29, 'closed'],
      [userIds['lucas.young@email.com'], 'ETH/USDT', 'BUY', 20, 3100, null, null, null, 'open'],
      [userIds['mia.king@email.com'], 'BTC/USDT', 'BUY', 1.5, 85000, 102500, 26250, 20.59, 'closed'],
      [userIds['ava.lopez@email.com'], 'BTC/USDT', 'SELL', 3, 108000, 102500, 16500, 5.09, 'closed'],
      [userIds['noah.hill@email.com'], 'BNB/USDT', 'BUY', 100, 380, 650, 27000, 71.05, 'closed']
    ];

    for (const [userId, symbol, side, qty, entry, exit, pnl, pnlPct, status] of trades) {
      await pool.query(
        `INSERT INTO trades (user_id, symbol, side, quantity, entry_price, exit_price, pnl, pnl_percent, status, closed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [userId, symbol, side, qty, entry, exit, pnl, pnlPct, status, status === 'closed' ? new Date() : null]
      );
    }
    console.log('Trades created (30)');

    // ============================================================
    // 8. HISTORICAL PRICE DATA - 30 days for 10 symbols
    // ============================================================
    const priceSymbols = [
      ['BTC/USDT', 95000], ['ETH/USDT', 3500], ['SOL/USDT', 200], ['BNB/USDT', 600],
      ['XRP/USDT', 2.00], ['ADA/USDT', 0.90], ['DOGE/USDT', 0.35], ['AVAX/USDT', 38],
      ['DOT/USDT', 8.00], ['LINK/USDT', 16.00]
    ];
    const now = new Date();

    for (const [symbol, basePrice] of priceSymbols) {
      let price = basePrice;
      for (let i = 30; i >= 0; i--) {
        const timestamp = new Date(now);
        timestamp.setDate(timestamp.getDate() - i);
        timestamp.setHours(0, 0, 0, 0);

        price = price * (1 + (Math.random() - 0.48) * 0.03);
        const volume = Math.random() * 2000000 + 500000;

        await pool.query(
          `INSERT INTO price_data (symbol, price, volume, open, high, low, close, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (symbol, timestamp) DO NOTHING`,
          [
            symbol, price, volume,
            price * (1 + (Math.random() - 0.5) * 0.01),
            price * (1 + Math.random() * 0.02),
            price * (1 - Math.random() * 0.02),
            price, timestamp
          ]
        );
      }
    }
    console.log('Price data created (10 symbols x 31 days)');

    // ============================================================
    // 9. EMAIL VERIFICATION TOKENS - 5 tokens
    // ============================================================
    const unverifiedEmails = ['lisa.brown@email.com', 'anna.martinez@email.com', 'isabella.walker@email.com', 'ethan.wright@email.com'];
    for (const email of unverifiedEmails) {
      if (userIds[email]) {
        const token = crypto.randomBytes(32).toString('hex');
        await pool.query(
          'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'24 hours\')',
          [userIds[email], token]
        );
      }
    }
    console.log('Email verification tokens created');

    // ============================================================
    // 10. PASSWORD RESET TOKENS - 3 tokens
    // ============================================================
    for (const email of ['emma.davis@email.com', 'daniel.harris@email.com', 'ethan.wright@email.com']) {
      if (userIds[email]) {
        const token = crypto.randomBytes(32).toString('hex');
        await pool.query(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'1 hour\')',
          [userIds[email], token]
        );
      }
    }
    console.log('Password reset tokens created');

    // ============================================================
    // 11. TOKEN BLACKLIST - 3 sample expired tokens
    // ============================================================
    for (let i = 0; i < 3; i++) {
      const fakeHash = crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');
      await pool.query(
        'INSERT INTO token_blacklist (token_hash, expires_at) VALUES ($1, NOW() - INTERVAL \'1 hour\') ON CONFLICT DO NOTHING',
        [fakeHash]
      );
    }
    console.log('Token blacklist entries created (3)');

    console.log('\n--- Database seeding completed successfully! ---\n');
    console.log('Demo Account:');
    console.log('  Email: demo@trading.com');
    console.log('Demo login users provisioned from the local environment.');
    console.log('  Role: admin\n');
    console.log('Admin Account:');
    console.log('  Email: admin@trading.com');
    console.log('  Password: SecurePass1!');
    console.log('  Role: admin\n');
    console.log('All other users:');
    console.log('  Password: SecurePass1!\n');
    console.log('Seeded: 5 roles, 25 users, 20 portfolios, 25 positions, 25 strategies, 30 signals, 30 trades, 310 price records\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();
