-- AI Enhancements Schema
-- This migration adds tables for AI prediction tracking, recommendation history,
-- feedback, alerts, backtesting, and automated trading

-- ============================================================================
-- AI Prediction History & Accuracy Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_predictions (
  id SERIAL PRIMARY KEY,
  prediction_type VARCHAR(50) NOT NULL, -- 'price', 'sentiment', 'pattern', etc.
  symbol VARCHAR(20),
  timeframe VARCHAR(20), -- '24h', '7d', '30d'
  prediction_data JSONB NOT NULL, -- Stores the full prediction
  predicted_value DECIMAL(20, 8), -- For numeric predictions
  predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- When we can check accuracy

  -- Actual outcome (filled in later)
  actual_value DECIMAL(20, 8),
  actual_data JSONB,
  verified_at TIMESTAMP,

  -- Accuracy metrics
  accuracy_score DECIMAL(5, 2), -- 0-100
  error_margin DECIMAL(10, 2),
  is_accurate BOOLEAN,

  -- Metadata
  model_version VARCHAR(50),
  confidence DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_predictions_symbol ON ai_predictions(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_expires_at ON ai_predictions(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_verified ON ai_predictions(verified_at);

-- ============================================================================
-- AI Recommendation History
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_recommendations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'portfolio', 'strategy', 'trade', 'risk'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  recommendation_data JSONB NOT NULL, -- Full recommendation details

  -- User interaction
  viewed_at TIMESTAMP,
  acted_on BOOLEAN DEFAULT FALSE,
  action_taken VARCHAR(50), -- 'accepted', 'rejected', 'modified'
  action_at TIMESTAMP,
  action_notes TEXT,

  -- Outcome tracking
  outcome_status VARCHAR(50), -- 'pending', 'successful', 'failed', 'neutral'
  outcome_data JSONB,
  outcome_recorded_at TIMESTAMP,

  -- Metadata
  confidence DECIMAL(5, 2),
  priority INTEGER DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_created ON ai_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_priority ON ai_recommendations(priority DESC);

-- ============================================================================
-- AI Feedback System
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) NOT NULL, -- 'prediction', 'recommendation', 'assistant', 'signal'
  reference_type VARCHAR(50) NOT NULL, -- 'prediction', 'recommendation', 'message'
  reference_id INTEGER, -- ID of the referenced item

  -- Feedback data
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_helpful BOOLEAN,
  is_accurate BOOLEAN,
  feedback_text TEXT,
  feedback_tags VARCHAR(50)[], -- Array of tags like ['inaccurate', 'helpful', 'confusing']

  -- Context
  context_data JSONB,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_reference ON ai_feedback(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);

-- ============================================================================
-- AI-Powered Alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'price_anomaly', 'whale_activity', 'pattern_detected', 'risk_warning'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Alert data
  symbol VARCHAR(20),
  alert_data JSONB NOT NULL,
  ai_analysis TEXT,
  recommended_actions TEXT[],

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP,
  is_acted_on BOOLEAN DEFAULT FALSE,
  action_taken TEXT,

  -- Timing
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_alerts_user ON ai_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_type ON ai_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_severity ON ai_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_read ON ai_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_ai_alerts_triggered ON ai_alerts(triggered_at DESC);

-- ============================================================================
-- Backtesting Results
-- ============================================================================

CREATE TABLE IF NOT EXISTS backtest_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  strategy_name VARCHAR(255) NOT NULL,
  strategy_data JSONB NOT NULL,

  -- Backtest parameters
  symbol VARCHAR(20),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  initial_capital DECIMAL(20, 8) NOT NULL,

  -- Results
  final_capital DECIMAL(20, 8),
  total_return DECIMAL(10, 2), -- Percentage
  total_trades INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  win_rate DECIMAL(5, 2),

  -- Performance metrics
  sharpe_ratio DECIMAL(10, 4),
  max_drawdown DECIMAL(10, 2),
  avg_profit_per_trade DECIMAL(20, 8),
  avg_loss_per_trade DECIMAL(20, 8),
  profit_factor DECIMAL(10, 4),

  -- Detailed results
  trade_history JSONB,
  equity_curve JSONB,
  metrics JSONB,

  -- AI Analysis
  ai_insights TEXT,
  improvement_suggestions TEXT[],

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_backtest_user ON backtest_results(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_symbol ON backtest_results(symbol);
CREATE INDEX IF NOT EXISTS idx_backtest_created ON backtest_results(created_at DESC);

-- ============================================================================
-- Automated Trading Bots
-- ============================================================================

CREATE TABLE IF NOT EXISTS trading_bots (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Bot configuration
  strategy_type VARCHAR(50) NOT NULL, -- 'dca', 'grid', 'momentum', 'ai_generated'
  strategy_config JSONB NOT NULL,
  symbols VARCHAR(20)[],

  -- Risk parameters
  max_position_size DECIMAL(20, 8),
  max_daily_loss DECIMAL(20, 8),
  stop_loss_percentage DECIMAL(5, 2),
  take_profit_percentage DECIMAL(5, 2),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'inactive', -- 'inactive', 'active', 'paused', 'error'
  is_enabled BOOLEAN DEFAULT FALSE,
  is_paper_trading BOOLEAN DEFAULT TRUE,

  -- Performance
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  total_profit DECIMAL(20, 8) DEFAULT 0,
  total_loss DECIMAL(20, 8) DEFAULT 0,
  current_drawdown DECIMAL(10, 2) DEFAULT 0,

  -- Operational data
  last_trade_at TIMESTAMP,
  last_error TEXT,
  last_error_at TIMESTAMP,
  started_at TIMESTAMP,
  stopped_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trading_bots_user ON trading_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_bots_status ON trading_bots(status);
CREATE INDEX IF NOT EXISTS idx_trading_bots_enabled ON trading_bots(is_enabled);

-- ============================================================================
-- Bot Trade History
-- ============================================================================

CREATE TABLE IF NOT EXISTS bot_trades (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES trading_bots(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Trade details
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL, -- 'buy', 'sell'
  quantity DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  total_value DECIMAL(20, 8) NOT NULL,

  -- Trade execution
  order_type VARCHAR(20) NOT NULL, -- 'market', 'limit'
  status VARCHAR(20) NOT NULL, -- 'pending', 'executed', 'cancelled', 'failed'
  is_paper_trade BOOLEAN DEFAULT TRUE,

  -- P&L
  entry_price DECIMAL(20, 8),
  exit_price DECIMAL(20, 8),
  profit_loss DECIMAL(20, 8),
  profit_loss_percentage DECIMAL(10, 2),

  -- AI reasoning
  signal_type VARCHAR(50),
  ai_confidence DECIMAL(5, 2),
  reasoning TEXT,

  -- Timing
  signal_at TIMESTAMP,
  executed_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bot_trades_bot ON bot_trades(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_trades_user ON bot_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_trades_symbol ON bot_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_bot_trades_created ON bot_trades(created_at DESC);

-- ============================================================================
-- Social Sentiment Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_sentiment (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'twitter', 'reddit', 'news'

  -- Sentiment metrics
  sentiment_score DECIMAL(5, 2) NOT NULL, -- -100 to +100
  volume INTEGER, -- Number of mentions
  engagement INTEGER, -- Likes, comments, etc.

  -- Sentiment breakdown
  positive_percentage DECIMAL(5, 2),
  negative_percentage DECIMAL(5, 2),
  neutral_percentage DECIMAL(5, 2),

  -- Top keywords/topics
  trending_topics TEXT[],
  keywords TEXT[],

  -- Sample data
  sample_posts JSONB,

  -- AI analysis
  ai_summary TEXT,
  impact_prediction VARCHAR(50), -- 'bullish', 'bearish', 'neutral'

  -- Timing
  time_period VARCHAR(20), -- '1h', '24h', '7d'
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_social_sentiment_symbol ON social_sentiment(symbol);
CREATE INDEX IF NOT EXISTS idx_social_sentiment_source ON social_sentiment(source);
CREATE INDEX IF NOT EXISTS idx_social_sentiment_collected ON social_sentiment(collected_at DESC);

-- ============================================================================
-- Whale Activity Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS whale_activity (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,

  -- Transaction details
  transaction_hash VARCHAR(255),
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  amount DECIMAL(30, 8) NOT NULL,
  amount_usd DECIMAL(20, 2),

  -- Activity type
  activity_type VARCHAR(50) NOT NULL, -- 'large_transfer', 'exchange_deposit', 'exchange_withdrawal'
  from_label VARCHAR(100), -- 'Binance', 'Unknown Wallet', etc.
  to_label VARCHAR(100),

  -- Market impact
  price_at_time DECIMAL(20, 8),
  price_change_5m DECIMAL(10, 2),
  price_change_1h DECIMAL(10, 2),
  volume_spike BOOLEAN,

  -- AI analysis
  ai_analysis TEXT,
  impact_prediction VARCHAR(50), -- 'bullish', 'bearish', 'neutral'
  confidence DECIMAL(5, 2),

  -- Alert generated
  alert_generated BOOLEAN DEFAULT FALSE,
  alert_id INTEGER REFERENCES ai_alerts(id),

  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_whale_activity_symbol ON whale_activity(symbol);
CREATE INDEX IF NOT EXISTS idx_whale_activity_type ON whale_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_whale_activity_detected ON whale_activity(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_whale_activity_amount ON whale_activity(amount_usd DESC);

-- ============================================================================
-- Asset Correlation Data
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_correlations (
  id SERIAL PRIMARY KEY,
  symbol_a VARCHAR(20) NOT NULL,
  symbol_b VARCHAR(20) NOT NULL,

  -- Correlation metrics
  correlation_coefficient DECIMAL(5, 4), -- -1 to +1
  time_period VARCHAR(20) NOT NULL, -- '24h', '7d', '30d', '90d'

  -- Statistical data
  covariance DECIMAL(20, 10),
  beta DECIMAL(10, 6),
  r_squared DECIMAL(5, 4),

  -- Price movement sync
  directional_agreement DECIMAL(5, 2), -- Percentage of time moving in same direction
  avg_lag_time INTEGER, -- Average lag in minutes

  -- AI insights
  correlation_strength VARCHAR(20), -- 'very_strong', 'strong', 'moderate', 'weak', 'very_weak'
  trading_implications TEXT,

  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(symbol_a, symbol_b, time_period, calculated_at)
);

CREATE INDEX IF NOT EXISTS idx_asset_correlations_symbols ON asset_correlations(symbol_a, symbol_b);
CREATE INDEX IF NOT EXISTS idx_asset_correlations_period ON asset_correlations(time_period);
CREATE INDEX IF NOT EXISTS idx_asset_correlations_calculated ON asset_correlations(calculated_at DESC);

-- ============================================================================
-- Anomaly Detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS price_anomalies (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,

  -- Anomaly details
  anomaly_type VARCHAR(50) NOT NULL, -- 'price_spike', 'volume_surge', 'pattern_break', 'correlation_break'
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'

  -- Metrics
  current_value DECIMAL(20, 8),
  expected_value DECIMAL(20, 8),
  deviation_percentage DECIMAL(10, 2),
  z_score DECIMAL(10, 4),

  -- Context
  context_data JSONB,
  historical_comparison JSONB,

  -- AI analysis
  ai_explanation TEXT,
  predicted_impact TEXT,
  recommended_actions TEXT[],
  confidence DECIMAL(5, 2),

  -- Alert
  alert_generated BOOLEAN DEFAULT FALSE,
  alert_id INTEGER REFERENCES ai_alerts(id),

  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT,
  resolved_at TIMESTAMP,

  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_anomalies_symbol ON price_anomalies(symbol);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_type ON price_anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_severity ON price_anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_detected ON price_anomalies(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_resolved ON price_anomalies(is_resolved);

-- ============================================================================
-- AI Performance Metrics (Aggregated)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL, -- 'prediction_accuracy', 'recommendation_success', 'user_satisfaction'
  time_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metrics
  total_count INTEGER DEFAULT 0,
  successful_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2),

  -- Detailed metrics
  metrics_data JSONB,

  -- Breakdown by category
  by_category JSONB, -- {'price_prediction': 85.5, 'sentiment': 78.2, ...}

  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(metric_type, time_period, period_start)
);

CREATE INDEX IF NOT EXISTS idx_ai_performance_type ON ai_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_ai_performance_period ON ai_performance_metrics(period_start DESC);

-- ============================================================================
-- Views for Easy Querying
-- ============================================================================

-- View for pending predictions that need verification
CREATE OR REPLACE VIEW pending_predictions AS
SELECT
  id,
  prediction_type,
  symbol,
  timeframe,
  predicted_value,
  predicted_at,
  expires_at,
  confidence
FROM ai_predictions
WHERE verified_at IS NULL
  AND expires_at <= CURRENT_TIMESTAMP
ORDER BY expires_at ASC;

-- View for AI recommendation success rate
CREATE OR REPLACE VIEW recommendation_success_rate AS
SELECT
  recommendation_type,
  COUNT(*) as total,
  SUM(CASE WHEN acted_on THEN 1 ELSE 0 END) as acted_on_count,
  SUM(CASE WHEN outcome_status = 'successful' THEN 1 ELSE 0 END) as successful_count,
  ROUND(AVG(confidence), 2) as avg_confidence,
  ROUND(
    100.0 * SUM(CASE WHEN outcome_status = 'successful' THEN 1 ELSE 0 END) /
    NULLIF(SUM(CASE WHEN outcome_status IS NOT NULL THEN 1 ELSE 0 END), 0),
    2
  ) as success_rate
FROM ai_recommendations
GROUP BY recommendation_type;

-- View for active bots performance
CREATE OR REPLACE VIEW active_bots_performance AS
SELECT
  tb.id,
  tb.user_id,
  tb.name,
  tb.status,
  tb.total_trades,
  tb.winning_trades,
  ROUND(100.0 * tb.winning_trades / NULLIF(tb.total_trades, 0), 2) as win_rate,
  tb.total_profit,
  tb.total_loss,
  (tb.total_profit - tb.total_loss) as net_profit,
  tb.last_trade_at,
  tb.started_at
FROM trading_bots tb
WHERE tb.is_enabled = TRUE
ORDER BY net_profit DESC;

-- View for recent AI alerts
CREATE OR REPLACE VIEW recent_ai_alerts AS
SELECT
  id,
  user_id,
  alert_type,
  severity,
  title,
  message,
  symbol,
  is_read,
  triggered_at
FROM ai_alerts
WHERE triggered_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  AND is_dismissed = FALSE
ORDER BY triggered_at DESC;

-- ============================================================================
-- Trigger Functions for Updated_At
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_ai_predictions_updated_at BEFORE UPDATE ON ai_predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON ai_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_backtest_results_updated_at BEFORE UPDATE ON backtest_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_bots_updated_at BEFORE UPDATE ON trading_bots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- End of Migration
-- ============================================================================
