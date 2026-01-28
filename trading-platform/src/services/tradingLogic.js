// Trading algorithms and signal generation logic

// Technical indicator calculations
export const calculateRSI = (prices, period = 14) => {
  if (prices.length < period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
};

// Simple Moving Average
export const calculateSMA = (prices, period) => {
  if (prices.length < period) return prices[prices.length - 1];
  const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
};

// Exponential Moving Average
export const calculateEMA = (prices, period) => {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
};

// MACD calculation
export const calculateMACD = (prices) => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  return {
    macd,
    signal: macd * 0.9, // Simplified signal line
    histogram: macd * 0.1
  };
};

// Bollinger Bands
export const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);

  const variance = slice.reduce((sum, price) => {
    return sum + Math.pow(price - sma, 2);
  }, 0) / period;

  const standardDeviation = Math.sqrt(variance);

  return {
    upper: sma + (standardDeviation * stdDev),
    middle: sma,
    lower: sma - (standardDeviation * stdDev)
  };
};

// Signal generation based on multiple indicators
export const generateTradingSignal = (priceData, indicators = {}) => {
  const prices = priceData.map(d => d.price);
  const currentPrice = prices[prices.length - 1];

  // Calculate indicators
  const rsi = indicators.rsi || calculateRSI(prices);
  const macd = indicators.macd || calculateMACD(prices);
  const bb = calculateBollingerBands(prices);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  // Scoring system
  let score = 0;
  const signals = [];

  // RSI signals
  if (rsi < 30) {
    score += 2;
    signals.push('RSI Oversold');
  } else if (rsi > 70) {
    score -= 2;
    signals.push('RSI Overbought');
  }

  // MACD signals
  if (macd.macd > macd.signal) {
    score += 1;
    signals.push('MACD Bullish');
  } else {
    score -= 1;
    signals.push('MACD Bearish');
  }

  // Bollinger Bands signals
  if (currentPrice < bb.lower) {
    score += 1;
    signals.push('Below Lower BB');
  } else if (currentPrice > bb.upper) {
    score -= 1;
    signals.push('Above Upper BB');
  }

  // Moving Average signals
  if (sma50 > sma200) {
    score += 1;
    signals.push('Golden Cross');
  } else if (sma50 < sma200) {
    score -= 1;
    signals.push('Death Cross');
  }

  // Generate signal
  let type = 'HOLD';
  let strength = 'WEAK';
  let confidence = 50;

  if (score >= 3) {
    type = 'BUY';
    strength = score >= 4 ? 'STRONG' : 'MODERATE';
    confidence = Math.min(95, 70 + score * 5);
  } else if (score <= -3) {
    type = 'SELL';
    strength = score <= -4 ? 'STRONG' : 'MODERATE';
    confidence = Math.min(95, 70 + Math.abs(score) * 5);
  } else {
    confidence = 50 + Math.abs(score) * 5;
  }

  return {
    type,
    strength,
    confidence,
    score,
    indicators: {
      rsi: rsi.toFixed(2),
      macd: macd.macd.toFixed(2),
      bb: {
        upper: bb.upper.toFixed(2),
        middle: bb.middle.toFixed(2),
        lower: bb.lower.toFixed(2)
      },
      sma50: sma50.toFixed(2),
      sma200: sma200.toFixed(2)
    },
    signals
  };
};

// Market making spread calculation
export const calculateOptimalSpread = (volatility, volume, inventory) => {
  // Higher volatility = wider spread
  // Higher volume = tighter spread
  // Large inventory = adjust spread to reduce inventory

  const baseSpread = 0.05; // 5 basis points
  const volatilityFactor = Math.min(volatility * 2, 5);
  const volumeFactor = Math.max(1 - (volume / 1e9), 0.5);
  const inventoryFactor = 1 + (Math.abs(inventory) / 100);

  const spread = baseSpread * volatilityFactor * volumeFactor * inventoryFactor;

  return {
    spread: spread.toFixed(4),
    bidAdjustment: inventory > 0 ? -0.01 : 0.01,
    askAdjustment: inventory > 0 ? 0.01 : -0.01
  };
};

// Risk management
export const calculatePositionSize = (capital, riskPercent, stopLossPercent) => {
  const riskAmount = capital * (riskPercent / 100);
  const positionSize = riskAmount / (stopLossPercent / 100);

  return {
    positionSize: positionSize.toFixed(2),
    riskAmount: riskAmount.toFixed(2),
    maxLoss: (capital * riskPercent / 100).toFixed(2)
  };
};

// Portfolio optimization (simplified Markowitz)
export const optimizePortfolio = (assets) => {
  // Simple equal-weight optimization with risk adjustment
  const totalRisk = assets.reduce((sum, asset) => sum + (asset.volatility || 1), 0);

  return assets.map(asset => ({
    symbol: asset.symbol,
    currentWeight: asset.weight || 0,
    optimalWeight: ((1 / (asset.volatility || 1)) / totalRisk * 100).toFixed(2),
    expectedReturn: (asset.return || 0).toFixed(2),
    risk: (asset.volatility || 0).toFixed(2)
  }));
};

// Sentiment analysis (mock - would use NLP in production)
export const analyzeSentiment = (text) => {
  const bullishWords = ['bullish', 'moon', 'pump', 'buy', 'long', 'gains', 'profit', 'surge'];
  const bearishWords = ['bearish', 'dump', 'sell', 'short', 'loss', 'crash', 'drop', 'fall'];

  const words = text.toLowerCase().split(/\s+/);
  let bullishCount = 0;
  let bearishCount = 0;

  words.forEach(word => {
    if (bullishWords.some(bw => word.includes(bw))) bullishCount++;
    if (bearishWords.some(bw => word.includes(bw))) bearishCount++;
  });

  const total = bullishCount + bearishCount;
  if (total === 0) return { sentiment: 'neutral', score: 0.5 };

  const score = (bullishCount / total);
  let sentiment = 'neutral';

  if (score > 0.6) sentiment = 'bullish';
  else if (score < 0.4) sentiment = 'bearish';

  return {
    sentiment,
    score,
    bullishCount,
    bearishCount
  };
};

// Backtesting engine
export const backtest = (strategy, historicalData, initialCapital = 10000) => {
  let capital = initialCapital;
  let position = null;
  const trades = [];

  historicalData.forEach((dataPoint, index) => {
    if (index < 50) return; // Need enough data for indicators

    const signal = generateTradingSignal(historicalData.slice(0, index + 1));

    // Entry logic
    if (!position && signal.type === 'BUY' && signal.strength !== 'WEAK') {
      position = {
        entry: dataPoint.price,
        quantity: capital * 0.95 / dataPoint.price,
        entryDate: dataPoint.date
      };
    }

    // Exit logic
    if (position && (signal.type === 'SELL' || index === historicalData.length - 1)) {
      const pnl = (dataPoint.price - position.entry) * position.quantity;
      capital += pnl;

      trades.push({
        entry: position.entry,
        exit: dataPoint.price,
        pnl,
        pnlPercent: (pnl / (position.entry * position.quantity)) * 100,
        duration: new Date(dataPoint.date) - new Date(position.entryDate)
      });

      position = null;
    }
  });

  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl <= 0);

  return {
    finalCapital: capital.toFixed(2),
    totalReturn: ((capital - initialCapital) / initialCapital * 100).toFixed(2),
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: ((winningTrades.length / trades.length) * 100).toFixed(2),
    avgWin: (winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length || 0).toFixed(2),
    avgLoss: (losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length || 0).toFixed(2),
    trades
  };
};
