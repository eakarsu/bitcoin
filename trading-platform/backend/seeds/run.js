import pool from '../src/config/database.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Create demo user
    const hashedPassword = await bcrypt.hash('demo123', 10);

    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, subscription_tier)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      ['demo@trading.com', hashedPassword, 'Demo User', 'professional']
    );

    const userId = userResult.rows[0].id;
    console.log('✓ Demo user created');

    // Create portfolio
    const portfolioResult = await pool.query(
      `INSERT INTO portfolios (user_id, total_value, total_pnl, total_pnl_percent, day_pnl, day_pnl_percent)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [userId, 1250000, 185000, 17.35, 12500, 1.01]
    );

    if (portfolioResult.rows.length > 0) {
      const portfolioId = portfolioResult.rows[0].id;
      console.log('✓ Portfolio created');

      // Create positions
      const positions = [
        ['BTC/USDT', 15.5, 48500, 52347.82, 811390.21, 59640.21, 7.93],
        ['ETH/USDT', 85.2, 2950, 3234.56, 275585.31, 24248.71, 9.65],
        ['SOL/USDT', 500, 135, 142.34, 71170, 3670, 5.43]
      ];

      for (const pos of positions) {
        await pool.query(
          `INSERT INTO positions (portfolio_id, symbol, quantity, avg_price, current_price, value, pnl, pnl_percent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [portfolioId, ...pos]
        );
      }
      console.log('✓ Positions created');
    }

    // Create strategies
    const strategies = [
      ['Mean Reversion Alpha', 'Statistical Arbitrage', 'active', 45200, 22.6, 2.3, 8.5, 68, 1247, '4.2h'],
      ['Momentum Breakout', 'Trend Following', 'active', 38900, 19.45, 1.9, 12.3, 62, 856, '8.5h'],
      ['Market Making Bot', 'Market Making', 'active', 28400, 14.2, 3.1, 4.2, 89, 5623, '12m'],
      ['ML Sentiment Strategy', 'AI/ML', 'testing', 12300, 6.15, 1.5, 15.8, 58, 234, '1.2d']
    ];

    for (const strat of strategies) {
      await pool.query(
        `INSERT INTO strategies (user_id, name, type, status, pnl, pnl_percent, sharpe_ratio, max_drawdown, win_rate, trades_count, avg_hold_time)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT DO NOTHING`,
        [userId, ...strat]
      );
    }
    console.log('✓ Strategies created');

    // Create initial signals
    const signals = [
      ['BTC/USDT', 'BUY', 'STRONG', 87.5, 52347.82, 54500, 50000, '4H'],
      ['ETH/USDT', 'BUY', 'MODERATE', 72.3, 3234.56, 3400, 3100, '1D'],
      ['SOL/USDT', 'SELL', 'WEAK', 65.8, 142.34, 135, 145, '1H'],
      ['BNB/USDT', 'BUY', 'STRONG', 89.2, 598.23, 620, 580, '4H'],
      ['XRP/USDT', 'HOLD', 'MODERATE', 70.1, 0.6234, 0.65, 0.60, '1D']
    ];

    for (const sig of signals) {
      await pool.query(
        `INSERT INTO signals (pair, type, strength, confidence, price, target_price, stop_loss, timeframe, indicators)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [...sig, JSON.stringify({ rsi: 65, macd: 1.5, volume: 1.2 })]
      );
    }
    console.log('✓ Signals created');

    // Create historical price data
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    const now = new Date();

    for (const symbol of symbols) {
      let price = symbol === 'BTC/USDT' ? 50000 : symbol === 'ETH/USDT' ? 3000 : 130;

      for (let i = 30; i >= 0; i--) {
        const timestamp = new Date(now);
        timestamp.setDate(timestamp.getDate() - i);

        price = price * (1 + (Math.random() - 0.48) * 0.02);
        const volume = Math.random() * 1000000 + 500000;

        await pool.query(
          `INSERT INTO price_data (symbol, price, volume, open, high, low, close, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (symbol, timestamp) DO NOTHING`,
          [
            symbol,
            price,
            volume,
            price * (1 + (Math.random() - 0.5) * 0.01),
            price * (1 + Math.random() * 0.015),
            price * (1 - Math.random() * 0.015),
            price,
            timestamp
          ]
        );
      }
    }
    console.log('✓ Price data created');

    console.log('\n✓ Database seeding completed successfully!\n');
    console.log('📧 Demo Account:');
    console.log('   Email: demo@trading.com');
    console.log('   Password: demo123\n');

    process.exit(0);
  } catch (error) {
    console.error('✗ Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
