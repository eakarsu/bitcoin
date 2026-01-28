-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_value DECIMAL(18, 2) DEFAULT 0,
  total_pnl DECIMAL(18, 2) DEFAULT 0,
  total_pnl_percent DECIMAL(10, 4) DEFAULT 0,
  day_pnl DECIMAL(18, 2) DEFAULT 0,
  day_pnl_percent DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Positions table
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(50) NOT NULL,
  quantity DECIMAL(18, 8) NOT NULL,
  avg_price DECIMAL(18, 2) NOT NULL,
  current_price DECIMAL(18, 2) NOT NULL,
  value DECIMAL(18, 2) NOT NULL,
  pnl DECIMAL(18, 2) NOT NULL,
  pnl_percent DECIMAL(10, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Strategies table
CREATE TABLE IF NOT EXISTS strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  pnl DECIMAL(18, 2) DEFAULT 0,
  pnl_percent DECIMAL(10, 4) DEFAULT 0,
  sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
  max_drawdown DECIMAL(10, 4) DEFAULT 0,
  win_rate DECIMAL(10, 4) DEFAULT 0,
  trades_count INTEGER DEFAULT 0,
  avg_hold_time VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Signals table
CREATE TABLE IF NOT EXISTS signals (
  id SERIAL PRIMARY KEY,
  pair VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,
  strength VARCHAR(20) NOT NULL,
  confidence DECIMAL(10, 2) NOT NULL,
  price DECIMAL(18, 2) NOT NULL,
  target_price DECIMAL(18, 2),
  stop_loss DECIMAL(18, 2),
  timeframe VARCHAR(10) NOT NULL,
  indicators JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Trades table
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  strategy_id INTEGER REFERENCES strategies(id) ON DELETE SET NULL,
  signal_id INTEGER REFERENCES signals(id) ON DELETE SET NULL,
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity DECIMAL(18, 8) NOT NULL,
  entry_price DECIMAL(18, 2) NOT NULL,
  exit_price DECIMAL(18, 2),
  pnl DECIMAL(18, 2),
  pnl_percent DECIMAL(10, 4),
  status VARCHAR(20) DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Price Data table (for historical prices)
CREATE TABLE IF NOT EXISTS price_data (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(50) NOT NULL,
  price DECIMAL(18, 2) NOT NULL,
  volume DECIMAL(18, 2),
  open DECIMAL(18, 2),
  high DECIMAL(18, 2),
  low DECIMAL(18, 2),
  close DECIMAL(18, 2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(symbol, timestamp)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_price_data_symbol ON price_data(symbol);
CREATE INDEX IF NOT EXISTS idx_price_data_timestamp ON price_data(timestamp);
