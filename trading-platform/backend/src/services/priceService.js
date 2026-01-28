import pool from '../config/database.js';

// Real current prices (as of today)
const CURRENT_REAL_PRICES = {
  'BTC/USDT': 100000,  // Bitcoin ~$100K
  'ETH/USDT': 3800,    // Ethereum ~$3.8K
  'SOL/USDT': 220,     // Solana ~$220
  'BNB/USDT': 650,     // BNB ~$650
  'XRP/USDT': 2.50,    // XRP ~$2.50
  'ADA/USDT': 1.05     // Cardano ~$1.05
};

// Store latest prices in memory
const latestPrices = {};

// Initialize prices with current real values
Object.keys(CURRENT_REAL_PRICES).forEach(symbol => {
  latestPrices[symbol] = {
    symbol,
    price: CURRENT_REAL_PRICES[symbol],
    volume: Math.random() * 1000000000 + 500000000,
    change24h: (Math.random() - 0.5) * 10, // ±5%
    high24h: CURRENT_REAL_PRICES[symbol] * 1.05,
    low24h: CURRENT_REAL_PRICES[symbol] * 0.95
  };
});

// Simulate realistic price movements
function updatePrices(io) {
  Object.keys(latestPrices).forEach(symbol => {
    const current = latestPrices[symbol];

    // Realistic volatility based on asset
    let volatility = 0.0005; // 0.05% default
    if (symbol.includes('BTC')) volatility = 0.0003; // BTC less volatile
    else if (symbol.includes('SOL') || symbol.includes('ADA')) volatility = 0.001; // Altcoins more volatile

    // Random walk with mean reversion
    const change = (Math.random() - 0.49) * volatility; // Slight upward bias
    const newPrice = current.price * (1 + change);

    latestPrices[symbol] = {
      ...current,
      price: parseFloat(newPrice.toFixed(symbol.includes('XRP') || symbol.includes('ADA') ? 4 : 2)),
      volume: current.volume * (0.98 + Math.random() * 0.04),
      high24h: Math.max(current.high24h, newPrice),
      low24h: Math.min(current.low24h, newPrice)
    };

    // Save to database
    savePriceData(latestPrices[symbol]);
  });

  // Emit batch update (single efficient update with all prices)
  io.emit('prices-batch', Object.values(latestPrices));

  // Also emit individual updates for specific subscriptions
  Object.values(latestPrices).forEach(price => {
    io.to(`price:${price.symbol}`).emit('price', price);
  });
}

// Get current prices
export async function getCurrentPrices() {
  return Object.values(latestPrices);
}

// Fetch historical data
export async function fetchHistoricalData(symbol, days = 30) {
  try {
    const result = await pool.query(
      `SELECT timestamp, price FROM price_data
       WHERE symbol = $1
       AND timestamp > NOW() - INTERVAL '${days} days'
       ORDER BY timestamp ASC`,
      [symbol]
    );

    if (result.rows.length > 0) {
      return result.rows;
    }

    // Generate mock historical data based on current price
    const mockData = [];
    const now = new Date();
    const currentPrice = latestPrices[symbol]?.price || CURRENT_REAL_PRICES[symbol];

    for (let i = days; i >= 0; i--) {
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - i);
      const randomFactor = 0.9 + Math.random() * 0.2; // ±10% variation
      const price = currentPrice * randomFactor;

      mockData.push({ timestamp, price });
    }

    return mockData;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    return [];
  }
}

// Save price to database
async function savePriceData(priceData) {
  try {
    await pool.query(
      `INSERT INTO price_data (symbol, price, volume, open, high, low, close)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (symbol, timestamp) DO UPDATE
       SET price = EXCLUDED.price, volume = EXCLUDED.volume`,
      [
        priceData.symbol,
        priceData.price,
        priceData.volume,
        priceData.price * 0.998,
        priceData.high24h || priceData.price * 1.01,
        priceData.low24h || priceData.price * 0.99,
        priceData.price
      ]
    );
  } catch (error) {
    // Ignore duplicate timestamp errors
    if (!error.message.includes('duplicate key')) {
      console.error('Error saving price data:', error.message);
    }
  }
}

// Start real-time price updates
export function startPriceUpdates(io) {
  console.log('✓ Starting real-time price updates (from $100K BTC)...');

  // Log initial prices
  Object.entries(latestPrices).forEach(([symbol, data]) => {
    console.log(`📊 ${symbol}: $${data.price.toLocaleString()} (${data.change24h > 0 ? '+' : ''}${data.change24h.toFixed(2)}%)`);
  });

  // Update prices every 2 seconds for realistic real-time feel
  setInterval(() => {
    updatePrices(io);
  }, 2000);

  // Initial emit
  io.emit('prices-batch', Object.values(latestPrices));
}

export default {
  getCurrentPrices,
  fetchHistoricalData,
  startPriceUpdates
};
