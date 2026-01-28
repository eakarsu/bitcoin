# 🚀 Bitcoin Trading Platform - AI Enhancements Setup Guide

This guide will walk you through setting up all the new AI enhancements for your Bitcoin Trading Platform.

---

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL 12+ installed and running
- Redis 6+ installed (optional but recommended for caching)
- API Keys (optional, for external services):
  - Reddit API credentials (for social sentiment)
  - Twitter API bearer token (for social sentiment)
  - Whale Alert API key (for whale tracking)

---

## 🔧 Installation Steps

### Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# The following packages were added:
# - ioredis (Redis client)
# - express-rate-limit (Rate limiting)
# - snoowrap (Reddit API wrapper)
```

### Step 2: Setup Redis (Recommended)

Redis is used for caching AI responses and rate limiting.

#### macOS (using Homebrew):
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Docker:
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

#### Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Step 3: Configure Environment Variables

Your `.env` file has been updated with new configuration. Review and update as needed:

```env
# ======================
# AI Configuration
# ======================

# OpenRouter AI (already configured)
OPENROUTER_API_KEY=your_key_here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                    # Leave empty for local development
REDIS_CACHE_TTL=3600              # Cache TTL in seconds (1 hour)

# AI Rate Limiting
AI_RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
AI_RATE_LIMIT_MAX_REQUESTS=100    # Max requests per window

# Social Media APIs (Optional - leave empty to disable)
TWITTER_BEARER_TOKEN=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=TradingPlatform/1.0

# Whale Alert API (Optional - leave empty to disable)
WHALE_ALERT_API_KEY=
```

### Step 4: Run Database Migration

Run the new migration to create all AI enhancement tables:

```bash
cd backend
npm run migrate
```

This will create the following tables:
- `ai_predictions` - Prediction tracking
- `ai_recommendations` - Recommendation history
- `ai_feedback` - User feedback
- `ai_alerts` - AI-generated alerts
- `backtest_results` - Backtesting results
- `trading_bots` - Trading bot configurations
- `bot_trades` - Bot trade history
- `social_sentiment` - Social sentiment data
- `whale_activity` - Whale transaction tracking
- `asset_correlations` - Correlation data
- `price_anomalies` - Anomaly detection
- `ai_performance_metrics` - Performance tracking

### Step 5: Verify Database Schema

Connect to your PostgreSQL database and verify tables were created:

```bash
psql -U postgres -d trading_platform

# List tables
\dt

# Should see all new tables listed
```

### Step 6: Start the Backend Server

```bash
cd backend
npm run dev
```

You should see:
```
✓ Database connection established
✓ Redis connected successfully
⏰ Scheduled tasks started
🚀 Backend server running on http://localhost:3001
📡 WebSocket server running on ws://localhost:3001
```

---

## 🧪 Testing the Setup

### Test 1: Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Trading Platform API is running"
}
```

### Test 2: Test AI Caching (requires Redis)

```bash
# First request (should hit AI API)
curl -X POST http://localhost:3001/api/ai/sentiment \
  -H "Content-Type: application/json"

# Second request (should return cached result)
curl -X POST http://localhost:3001/api/ai/sentiment \
  -H "Content-Type: application/json"

# Check backend logs - second request should show: "✅ Returning cached AI response"
```

### Test 3: Test Rate Limiting

Run this command 101 times quickly:

```bash
for i in {1..101}; do
  curl -X POST http://localhost:3001/api/ai/sentiment \
    -H "Content-Type: application/json"
done
```

The 101st request should return:
```json
{
  "error": "Too many AI requests",
  "message": "You have exceeded the rate limit for AI endpoints..."
}
```

### Test 4: Test Prediction Tracking

```bash
# Get prediction statistics
curl http://localhost:3001/api/enhancements/predictions/stats?timeframe=30d
```

### Test 5: Test Trading Bot Creation

```bash
curl -X POST http://localhost:3001/api/enhancements/bots \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "name": "Test Bot",
    "description": "My first trading bot",
    "strategyType": "momentum",
    "strategyConfig": {"rsiPeriod": 14},
    "symbols": ["BTC", "ETH"],
    "maxPositionSize": 1000,
    "maxDailyLoss": 100,
    "stopLossPercentage": 5,
    "takeProfitPercentage": 10,
    "isPaperTrading": true
  }'
```

### Test 6: Test Correlation Analysis

```bash
curl http://localhost:3001/api/enhancements/correlations/BTC/ETH?period=30d
```

---

## 🔑 Setting Up External APIs (Optional)

### Reddit API Setup

1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in:
   - **name**: Trading Platform
   - **App type**: Select "script"
   - **description**: Sentiment analysis for trading
   - **about url**: (leave empty)
   - **redirect uri**: http://localhost:3001
4. Click "Create app"
5. Note down:
   - **Client ID**: The string under "personal use script"
   - **Client Secret**: The string labeled "secret"
6. Add to `.env`:
   ```env
   REDDIT_CLIENT_ID=your_client_id
   REDDIT_CLIENT_SECRET=your_client_secret
   REDDIT_USER_AGENT=TradingPlatform/1.0
   ```

### Twitter API Setup

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Create a new project and app
3. Navigate to app settings → Keys and tokens
4. Generate "Bearer Token"
5. Add to `.env`:
   ```env
   TWITTER_BEARER_TOKEN=your_bearer_token
   ```

### Whale Alert API Setup

1. Go to https://whale-alert.io/
2. Sign up for a free API key
3. Add to `.env`:
   ```env
   WHALE_ALERT_API_KEY=your_api_key
   ```

---

## 📊 Scheduled Tasks

The following tasks run automatically:

| Task | Schedule | Description |
|------|----------|-------------|
| Prediction Verification | Every hour | Verifies AI predictions and calculates accuracy |
| Social Sentiment Collection | Every 4 hours | Collects sentiment from Twitter/Reddit |
| Whale Activity Monitoring | Every 5 minutes | Detects large transactions |
| Bot Trade Execution | Every minute | Executes trades for active bots |
| Correlation Calculation | Daily at 2 AM | Calculates asset correlations |
| Data Cleanup | Daily at 3 AM | Cleans up old data |
| Performance Reports | Daily at 1 AM | Generates AI performance reports |
| Health Checks | Every 10 minutes | System health monitoring |

You can view cron job logs in the backend console.

---

## 🎯 API Endpoints Reference

### Prediction Tracking
- `GET /api/enhancements/predictions/stats?timeframe=30d` - Get accuracy stats
- `GET /api/enhancements/predictions/recent?limit=50` - Get recent predictions
- `POST /api/enhancements/predictions/verify` - Manually verify predictions

### Recommendations
- `GET /api/enhancements/recommendations?userId=1&limit=20` - Get user recommendations
- `POST /api/enhancements/recommendations/:id/action` - Record user action
- `POST /api/enhancements/recommendations/:id/outcome` - Record outcome

### Social Sentiment
- `GET /api/enhancements/sentiment/:symbol?period=24h` - Get sentiment for symbol
- `GET /api/enhancements/sentiment/:symbol/aggregated` - Get aggregated sentiment
- `POST /api/enhancements/sentiment/collect` - Manually collect sentiment

### Whale Activity
- `GET /api/enhancements/whale-activity?symbol=BTC&limit=50` - Get whale activity
- `GET /api/enhancements/whale-activity/:symbol/stats?period=24h` - Get stats
- `POST /api/enhancements/whale-activity/monitor` - Manually trigger monitoring

### Correlations
- `GET /api/enhancements/correlations/:symbolA/:symbolB?period=30d` - Get correlation
- `POST /api/enhancements/correlations/matrix` - Calculate correlation matrix
- `GET /api/enhancements/correlations/high?threshold=0.7` - Find highly correlated assets
- `POST /api/enhancements/correlations/portfolio-risk` - Calculate portfolio risk

### Trading Bots
- `GET /api/enhancements/bots?userId=1` - Get user's bots
- `POST /api/enhancements/bots` - Create new bot
- `PUT /api/enhancements/bots/:id` - Update bot
- `DELETE /api/enhancements/bots/:id` - Delete bot
- `POST /api/enhancements/bots/:id/start` - Start bot
- `POST /api/enhancements/bots/:id/stop` - Stop bot
- `GET /api/enhancements/bots/:id/performance` - Get performance metrics
- `GET /api/enhancements/bots/:id/trades?limit=50` - Get trade history
- `POST /api/enhancements/bots/execute` - Manually execute bots

---

## 🐛 Troubleshooting

### Redis Connection Issues

**Error**: `Redis connection error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it:
# macOS:
brew services start redis

# Linux:
sudo systemctl start redis-server

# Docker:
docker start redis
```

### Database Migration Fails

**Error**: `relation "ai_predictions" already exists`

**Solution**: The migration has already been run. No action needed.

If you need to reset:
```bash
# Connect to database
psql -U postgres -d trading_platform

# Drop tables (WARNING: This deletes data!)
DROP TABLE IF EXISTS ai_predictions CASCADE;
DROP TABLE IF EXISTS ai_recommendations CASCADE;
-- ... repeat for all tables

# Then run migration again
npm run migrate
```

### Rate Limiting Too Strict

If you're getting rate limited during development:

**Option 1**: Increase limits in `.env`:
```env
AI_RATE_LIMIT_WINDOW_MS=900000
AI_RATE_LIMIT_MAX_REQUESTS=1000  # Increase this
```

**Option 2**: Clear Redis rate limit data:
```bash
redis-cli KEYS "rl:*" | xargs redis-cli DEL
```

### Social Sentiment Not Working

**Issue**: No sentiment data being collected

**Check**:
1. Are API credentials configured in `.env`?
2. Check backend logs for errors
3. Test API credentials:

```bash
# Test Reddit API
curl -X POST http://localhost:3001/api/enhancements/sentiment/collect
# Check logs for detailed errors
```

### Trading Bots Not Executing

**Issue**: Bots created but not making trades

**Check**:
1. Is the bot started? `POST /api/enhancements/bots/:id/start`
2. Check bot status in database:
   ```sql
   SELECT id, name, status, is_enabled FROM trading_bots;
   ```
3. Check cron job logs - bot execution runs every minute
4. Ensure `is_paper_trading` is `true` for testing

---

## 📈 Monitoring

### Check Redis Stats

```bash
# Connect to Redis CLI
redis-cli

# Get info
INFO stats

# Check cache keys
KEYS "ai:*"

# Get cache size
DBSIZE
```

### Check Cron Job Status

Watch the backend console logs. You should see:
```
🔍 Running prediction verification...
📱 Collecting social sentiment...
🐋 Monitoring whale activity...
🤖 Executed 3 bot trades
💚 System health check: 2025-10-28T...
```

### Check Database Stats

```sql
-- Prediction accuracy
SELECT prediction_type, COUNT(*), AVG(accuracy_score)
FROM ai_predictions
WHERE verified_at IS NOT NULL
GROUP BY prediction_type;

-- Bot performance
SELECT name, total_trades, winning_trades, total_profit
FROM trading_bots;

-- Recent whale activity
SELECT symbol, COUNT(*), SUM(amount_usd)
FROM whale_activity
WHERE detected_at > NOW() - INTERVAL '24 hours'
GROUP BY symbol;
```

---

## 🚦 Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong `REDIS_PASSWORD`
- [ ] Secure all API keys
- [ ] Adjust rate limits for production traffic
- [ ] Setup database backups
- [ ] Setup Redis persistence
- [ ] Configure proper CORS origins
- [ ] Setup error monitoring (e.g., Sentry)
- [ ] Setup uptime monitoring
- [ ] Review and adjust cron schedules
- [ ] Setup SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Setup log rotation
- [ ] Test disaster recovery procedures

---

## 📚 Next Steps

1. **Build Frontend Components** - Create UI for all new features
2. **Setup Monitoring Dashboard** - Visualize AI performance
3. **Implement Remaining Features**:
   - Anomaly detection
   - Backtesting system
   - Alert system
   - Feedback mechanism
4. **Write Tests** - Unit and integration tests
5. **Documentation** - API documentation with Swagger/OpenAPI

---

## 💡 Usage Examples

### Example 1: Creating and Starting a Trading Bot

```javascript
// Create bot
const response = await fetch('http://localhost:3001/api/enhancements/bots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 1,
    name: 'BTC Momentum Strategy',
    description: 'Trades based on RSI momentum',
    strategyType: 'momentum',
    strategyConfig: {
      rsiPeriod: 14,
      oversold: 30,
      overbought: 70
    },
    symbols: ['BTC', 'ETH'],
    maxPositionSize: 5000,
    maxDailyLoss: 500,
    stopLossPercentage: 3,
    takeProfitPercentage: 8,
    isPaperTrading: true
  })
});

const { bot } = await response.json();

// Start bot
await fetch(`http://localhost:3001/api/enhancements/bots/${bot.id}/start`, {
  method: 'POST'
});

// Check performance
const perfResponse = await fetch(
  `http://localhost:3001/api/enhancements/bots/${bot.id}/performance`
);
const { performance } = await perfResponse.json();
console.log(performance);
```

### Example 2: Getting Social Sentiment

```javascript
// Get aggregated sentiment for Bitcoin
const response = await fetch(
  'http://localhost:3001/api/enhancements/sentiment/BTC/aggregated'
);

const { sentiment } = await response.json();

console.log(`Bitcoin sentiment: ${sentiment.overall}`);
console.log(`Sentiment score: ${sentiment.avgSentimentScore}`);
console.log(`Total mentions: ${sentiment.totalVolume}`);
console.log(`Trending topics:`, sentiment.trendingTopics);
```

### Example 3: Analyzing Portfolio Correlation Risk

```javascript
const portfolio = [
  { symbol: 'BTC', amount: 0.5 },
  { symbol: 'ETH', amount: 5 },
  { symbol: 'SOL', amount: 100 }
];

const response = await fetch(
  'http://localhost:3001/api/enhancements/correlations/portfolio-risk',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolio })
  }
);

const { risk } = await response.json();

console.log(`Diversification score: ${risk.diversificationScore}/100`);
console.log(`Overall risk: ${risk.overallRisk}`);
console.log(`Analysis: ${risk.analysis}`);
```

---

## 🆘 Support

For issues or questions:

1. Check this setup guide
2. Review `AI_ENHANCEMENTS_IMPLEMENTATION.md`
3. Check backend console logs
4. Check Redis logs: `redis-cli MONITOR`
5. Check PostgreSQL logs
6. Review service files for inline documentation

---

## 🎉 Success!

If you've completed all steps, you now have:

✅ Redis caching for AI responses
✅ Rate limiting protection
✅ Prediction accuracy tracking
✅ Social sentiment analysis
✅ Whale activity detection
✅ Correlation analysis
✅ Automated trading bots
✅ Scheduled automated tasks
✅ Comprehensive API endpoints

Your Bitcoin Trading Platform is now supercharged with AI! 🚀

---

*Last Updated: 2025-10-28*
