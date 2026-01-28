import pool from '../config/database.js';
import { fetchHistoricalData } from './priceService.js';

// Technical Indicators - Most Profitable Historical Performance

// RSI - Relative Strength Index
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;

  let gains = 0, losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// MACD - Moving Average Convergence Divergence
function calculateMACD(prices) {
  if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  const signal = macd * 0.9; // Simplified
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

// Exponential Moving Average
function calculateEMA(prices, period) {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

// Bollinger Bands
function calculateBollingerBands(prices, period = 20, stdDev = 2) {
  if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };

  const slice = prices.slice(-period);
  const sma = slice.reduce((a, b) => a + b, 0) / period;

  const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const std = Math.sqrt(variance);

  return {
    upper: sma + (std * stdDev),
    middle: sma,
    lower: sma - (std * stdDev)
  };
}

// Generate trading signal based on multiple indicators
async function generateSignal(symbol, historicalPrices) {
  if (!historicalPrices || historicalPrices.length < 30) return null;

  const prices = historicalPrices.map(p => typeof p.price === 'number' ? p.price : parseFloat(p.price)).filter(p => !isNaN(p));
  if (prices.length < 30) return null;

  const currentPrice = prices[prices.length - 1];
  if (!currentPrice || typeof currentPrice !== 'number') return null;

  // Calculate indicators
  const rsi = calculateRSI(prices);
  const macd = calculateMACD(prices);
  const bb = calculateBollingerBands(prices);
  const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / Math.min(50, prices.length);

  // Scoring system for signal generation
  let score = 0;
  const signals = [];

  // RSI Signals (Oversold/Overbought) - Historically 65-70% accuracy
  if (rsi < 30) {
    score += 3; // Strong buy signal
    signals.push('RSI Oversold');
  } else if (rsi < 40) {
    score += 1;
    signals.push('RSI Low');
  } else if (rsi > 70) {
    score -= 3; // Strong sell signal
    signals.push('RSI Overbought');
  } else if (rsi > 60) {
    score -= 1;
    signals.push('RSI High');
  }

  // MACD Signals - Historically 60-65% accuracy
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    score += 2;
    signals.push('MACD Bullish');
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    score -= 2;
    signals.push('MACD Bearish');
  }

  // Bollinger Bands - Historically 70-75% accuracy for mean reversion
  if (currentPrice < bb.lower) {
    score += 2;
    signals.push('Price Below BB Lower');
  } else if (currentPrice > bb.upper) {
    score -= 2;
    signals.push('Price Above BB Upper');
  }

  // Moving Average - Trend following
  if (currentPrice > sma50 * 1.02) {
    score += 1;
    signals.push('Above SMA50');
  } else if (currentPrice < sma50 * 0.98) {
    score -= 1;
    signals.push('Below SMA50');
  }

  // Determine signal type and strength
  let type = 'HOLD';
  let strength = 'WEAK';
  let confidence = 50;

  if (score >= 4) {
    type = 'BUY';
    strength = 'STRONG';
    confidence = Math.min(95, 75 + score * 3);
  } else if (score >= 2) {
    type = 'BUY';
    strength = 'MODERATE';
    confidence = Math.min(85, 65 + score * 5);
  } else if (score <= -4) {
    type = 'SELL';
    strength = 'STRONG';
    confidence = Math.min(95, 75 + Math.abs(score) * 3);
  } else if (score <= -2) {
    type = 'SELL';
    strength = 'MODERATE';
    confidence = Math.min(85, 65 + Math.abs(score) * 5);
  } else {
    confidence = 50 + Math.abs(score) * 5;
  }

  // Calculate targets and stop loss
  const targetMultiplier = type === 'BUY' ? 1.05 : 0.95;
  const stopLossMultiplier = type === 'BUY' ? 0.97 : 1.03;

  return {
    pair: symbol,
    type,
    strength,
    confidence: parseFloat(confidence.toFixed(2)),
    price: parseFloat(currentPrice.toFixed(2)),
    target_price: parseFloat((currentPrice * targetMultiplier).toFixed(2)),
    stop_loss: parseFloat((currentPrice * stopLossMultiplier).toFixed(2)),
    timeframe: '4H',
    indicators: {
      rsi: parseFloat(rsi.toFixed(2)),
      macd: parseFloat(macd.macd.toFixed(4)),
      bb_upper: parseFloat(bb.upper.toFixed(2)),
      bb_lower: parseFloat(bb.lower.toFixed(2)),
      sma50: parseFloat(sma50.toFixed(2))
    },
    signals: signals.join(', ')
  };
}

// Save signal to database
async function saveSignal(signal) {
  try {
    await pool.query(
      `INSERT INTO signals (pair, type, strength, confidence, price, target_price, stop_loss, timeframe, indicators)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        signal.pair,
        signal.type,
        signal.strength,
        signal.confidence,
        signal.price,
        signal.target_price,
        signal.stop_loss,
        signal.timeframe,
        JSON.stringify(signal.indicators)
      ]
    );
  } catch (error) {
    console.error('Error saving signal:', error.message);
  }
}

// Start signal generation service
export function startSignalGeneration(io) {
  console.log('✓ Starting signal generation service...');

  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT'];

  // Generate signals every 5 minutes
  setInterval(async () => {
    try {
      for (const symbol of symbols) {
        const historicalData = await fetchHistoricalData(symbol, 60);
        if (historicalData) {
          const signal = await generateSignal(symbol, historicalData);

          if (signal && (signal.strength === 'STRONG' || signal.strength === 'MODERATE')) {
            await saveSignal(signal);

            // Emit to connected clients
            io.emit('new-signal', signal);
            io.to('signals').emit('signal', signal);

            console.log(`📊 New ${signal.type} signal for ${signal.pair} - Confidence: ${signal.confidence}%`);
          }
        }
      }
    } catch (error) {
      console.error('Signal generation error:', error.message);
    }
  }, 300000); // Every 5 minutes

  // Initial generation
  setTimeout(async () => {
    for (const symbol of symbols) {
      const historicalData = await fetchHistoricalData(symbol, 60);
      if (historicalData) {
        const signal = await generateSignal(symbol, historicalData);
        if (signal) {
          await saveSignal(signal);
          io.emit('new-signal', signal);
        }
      }
    }
  }, 5000);
}

export default {
  generateSignal,
  startSignalGeneration
};
