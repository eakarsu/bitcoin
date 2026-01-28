// Mock data generation for trading platforms

// Generate realistic price data
export const generatePriceData = (days = 30, startPrice = 50000) => {
  const data = [];
  let price = startPrice;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Random walk with drift
    const change = (Math.random() - 0.48) * 0.02; // Slight upward bias
    price = price * (1 + change);

    data.push({
      date: date.toISOString(),
      price: parseFloat(price.toFixed(2)),
      volume: Math.random() * 1000000 + 500000,
      open: price * (1 + (Math.random() - 0.5) * 0.01),
      high: price * (1 + Math.random() * 0.015),
      low: price * (1 - Math.random() * 0.015),
      close: price
    });
  }

  return data;
};

// Trading pairs
export const tradingPairs = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', price: 52347.82, change24h: 2.34, volume: 28.5e9 },
  { symbol: 'ETH/USDT', name: 'Ethereum', price: 3234.56, change24h: -1.23, volume: 15.2e9 },
  { symbol: 'SOL/USDT', name: 'Solana', price: 142.34, change24h: 5.67, volume: 2.1e9 },
  { symbol: 'BNB/USDT', name: 'Binance Coin', price: 598.23, change24h: 1.89, volume: 1.8e9 },
  { symbol: 'XRP/USDT', name: 'Ripple', price: 0.6234, change24h: -3.45, volume: 1.5e9 },
  { symbol: 'ADA/USDT', name: 'Cardano', price: 0.5823, change24h: 0.92, volume: 890e6 },
];

// Generate trading signals
export const generateSignals = (count = 10) => {
  const types = ['BUY', 'SELL', 'HOLD'];
  const strengths = ['STRONG', 'MODERATE', 'WEAK'];
  const timeframes = ['1H', '4H', '1D', '1W'];

  return tradingPairs.slice(0, count).map((pair, index) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const strength = strengths[Math.floor(Math.random() * strengths.length)];
    const confidence = Math.random() * 30 + 70; // 70-100%

    return {
      id: index + 1,
      pair: pair.symbol,
      type,
      strength,
      confidence: parseFloat(confidence.toFixed(2)),
      price: pair.price,
      targetPrice: type === 'BUY' ? pair.price * (1 + Math.random() * 0.1) : pair.price * (1 - Math.random() * 0.1),
      stopLoss: type === 'BUY' ? pair.price * (1 - Math.random() * 0.05) : pair.price * (1 + Math.random() * 0.05),
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      indicators: {
        rsi: Math.random() * 100,
        macd: (Math.random() - 0.5) * 100,
        volume: Math.random() * 2,
        sentiment: Math.random()
      }
    };
  });
};

// Portfolio data
export const portfolioData = {
  totalValue: 1250000,
  totalPnL: 185000,
  totalPnLPercent: 17.35,
  dayPnL: 12500,
  dayPnLPercent: 1.01,
  positions: [
    {
      symbol: 'BTC/USDT',
      quantity: 15.5,
      avgPrice: 48500,
      currentPrice: 52347.82,
      value: 811390.21,
      pnl: 59640.21,
      pnlPercent: 7.93
    },
    {
      symbol: 'ETH/USDT',
      quantity: 85.2,
      avgPrice: 2950,
      currentPrice: 3234.56,
      value: 275585.31,
      pnl: 24248.71,
      pnlPercent: 9.65
    },
    {
      symbol: 'SOL/USDT',
      quantity: 500,
      avgPrice: 135,
      currentPrice: 142.34,
      value: 71170,
      pnl: 3670,
      pnlPercent: 5.43
    }
  ]
};

// Trading strategies
export const strategies = [
  {
    id: 1,
    name: 'Mean Reversion Alpha',
    type: 'Statistical Arbitrage',
    status: 'active',
    pnl: 45200,
    pnlPercent: 22.6,
    sharpeRatio: 2.3,
    maxDrawdown: 8.5,
    winRate: 68,
    trades: 1247,
    avgHoldTime: '4.2h'
  },
  {
    id: 2,
    name: 'Momentum Breakout',
    type: 'Trend Following',
    status: 'active',
    pnl: 38900,
    pnlPercent: 19.45,
    sharpeRatio: 1.9,
    maxDrawdown: 12.3,
    winRate: 62,
    trades: 856,
    avgHoldTime: '8.5h'
  },
  {
    id: 3,
    name: 'Market Making Bot',
    type: 'Market Making',
    status: 'active',
    pnl: 28400,
    pnlPercent: 14.2,
    sharpeRatio: 3.1,
    maxDrawdown: 4.2,
    winRate: 89,
    trades: 5623,
    avgHoldTime: '12m'
  },
  {
    id: 4,
    name: 'ML Sentiment Strategy',
    type: 'AI/ML',
    status: 'testing',
    pnl: 12300,
    pnlPercent: 6.15,
    sharpeRatio: 1.5,
    maxDrawdown: 15.8,
    winRate: 58,
    trades: 234,
    avgHoldTime: '1.2d'
  }
];

// Market making metrics
export const marketMakingMetrics = {
  totalOrders: 15234,
  activeOrders: 48,
  filledOrders: 14892,
  canceledOrders: 294,
  avgSpread: 0.08,
  inventoryValue: 485000,
  inventoryRisk: 'Low',
  dailyVolume: 12.5e6,
  revenueToday: 8420
};

// Subscription tiers
export const subscriptionTiers = [
  {
    name: 'Starter',
    price: 49,
    interval: 'month',
    features: [
      'Up to 50 signals per day',
      'Basic technical indicators',
      'Email notifications',
      'Community access',
      '24h signal delay'
    ],
    popular: false
  },
  {
    name: 'Professional',
    price: 149,
    interval: 'month',
    features: [
      'Unlimited signals',
      'Advanced AI predictions',
      'Real-time notifications',
      'API access (1000 calls/day)',
      'Priority support',
      'Custom alerts',
      'Backtesting tools'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 499,
    interval: 'month',
    features: [
      'Everything in Professional',
      'Unlimited API calls',
      'White-label options',
      'Custom ML models',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment option'
    ],
    popular: false
  }
];

// Performance metrics
export const performanceMetrics = [
  { month: 'Jan', profit: 12400, trades: 324, winRate: 65 },
  { month: 'Feb', profit: 18200, trades: 412, winRate: 68 },
  { month: 'Mar', profit: 15600, trades: 389, winRate: 64 },
  { month: 'Apr', profit: 22100, trades: 456, winRate: 71 },
  { month: 'May', profit: 19800, trades: 423, winRate: 69 },
  { month: 'Jun', profit: 25300, trades: 498, winRate: 73 }
];
