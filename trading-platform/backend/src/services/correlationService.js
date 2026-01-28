import pool from '../config/database.js';
import { getCurrentPrices } from './priceService.js';
import * as aiService from './aiService.js';

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(pricesA, pricesB) {
  const n = Math.min(pricesA.length, pricesB.length);

  if (n < 2) {
    return null;
  }

  const sumA = pricesA.reduce((a, b) => a + b, 0);
  const sumB = pricesB.reduce((a, b) => a + b, 0);
  const sumAB = pricesA.reduce((sum, a, i) => sum + a * pricesB[i], 0);
  const sumA2 = pricesA.reduce((sum, a) => sum + a * a, 0);
  const sumB2 = pricesB.reduce((sum, b) => sum + b * b, 0);

  const numerator = n * sumAB - sumA * sumB;
  const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));

  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Calculate covariance
 */
function calculateCovariance(pricesA, pricesB) {
  const n = Math.min(pricesA.length, pricesB.length);

  if (n < 2) {
    return 0;
  }

  const meanA = pricesA.reduce((a, b) => a + b, 0) / n;
  const meanB = pricesB.reduce((a, b) => a + b, 0) / n;

  const covariance = pricesA.reduce((sum, a, i) => {
    return sum + (a - meanA) * (pricesB[i] - meanB);
  }, 0) / (n - 1);

  return covariance;
}

/**
 * Calculate beta (volatility relative to another asset)
 */
function calculateBeta(pricesA, pricesB) {
  const covariance = calculateCovariance(pricesA, pricesB);

  const meanB = pricesB.reduce((a, b) => a + b, 0) / pricesB.length;
  const variance = pricesB.reduce((sum, b) => sum + Math.pow(b - meanB, 2), 0) / (pricesB.length - 1);

  if (variance === 0) {
    return 0;
  }

  return covariance / variance;
}

/**
 * Calculate R-squared
 */
function calculateRSquared(pricesA, pricesB) {
  const correlation = calculateCorrelation(pricesA, pricesB);
  if (correlation === null) {
    return 0;
  }
  return Math.pow(correlation, 2);
}

/**
 * Calculate directional agreement (% of time moving in same direction)
 */
function calculateDirectionalAgreement(pricesA, pricesB) {
  let agreements = 0;
  const n = Math.min(pricesA.length, pricesB.length);

  for (let i = 1; i < n; i++) {
    const directionA = pricesA[i] > pricesA[i - 1] ? 1 : pricesA[i] < pricesA[i - 1] ? -1 : 0;
    const directionB = pricesB[i] > pricesB[i - 1] ? 1 : pricesB[i] < pricesB[i - 1] ? -1 : 0;

    if (directionA === directionB && directionA !== 0) {
      agreements++;
    }
  }

  return (agreements / (n - 1)) * 100;
}

/**
 * Get correlation strength label
 */
function getCorrelationStrength(coefficient) {
  const abs = Math.abs(coefficient);

  if (abs >= 0.9) return 'very_strong';
  if (abs >= 0.7) return 'strong';
  if (abs >= 0.4) return 'moderate';
  if (abs >= 0.2) return 'weak';
  return 'very_weak';
}

/**
 * Fetch historical prices for correlation analysis
 * This is a simulation - in production, fetch real historical data
 */
async function fetchHistoricalPrices(symbol, timePeriod) {
  // In production, fetch from your database or external API
  // For now, simulate with random walk from current price

  const currentPrices = getCurrentPrices();
  const currentPrice = currentPrices.find(p => p.symbol === symbol);

  if (!currentPrice) {
    return null;
  }

  const periods = {
    '24h': 24,
    '7d': 168,
    '30d': 720,
    '90d': 2160,
  };

  const dataPoints = periods[timePeriod] || 24;
  const prices = [];
  let price = currentPrice.price;

  // Simulate historical prices with random walk
  for (let i = 0; i < dataPoints; i++) {
    const change = (Math.random() - 0.5) * 0.02; // ±1% change
    price = price * (1 + change);
    prices.unshift(price);
  }

  return prices;
}

/**
 * Calculate asset correlation
 */
export async function calculateAssetCorrelation(symbolA, symbolB, timePeriod = '30d') {
  try {
    const pricesA = await fetchHistoricalPrices(symbolA, timePeriod);
    const pricesB = await fetchHistoricalPrices(symbolB, timePeriod);

    if (!pricesA || !pricesB) {
      throw new Error('Unable to fetch price data');
    }

    const correlation = calculateCorrelation(pricesA, pricesB);
    const covariance = calculateCovariance(pricesA, pricesB);
    const beta = calculateBeta(pricesA, pricesB);
    const rSquared = calculateRSquared(pricesA, pricesB);
    const directionalAgreement = calculateDirectionalAgreement(pricesA, pricesB);
    const correlationStrength = getCorrelationStrength(correlation);

    // Get AI insights
    const aiInsights = await getCorrelationInsights({
      symbolA,
      symbolB,
      correlation,
      correlationStrength,
      beta,
      rSquared,
      directionalAgreement,
      timePeriod,
    });

    return {
      symbolA,
      symbolB,
      timePeriod,
      correlationCoefficient: correlation,
      covariance,
      beta,
      rSquared,
      directionalAgreement,
      correlationStrength,
      tradingImplications: aiInsights,
    };
  } catch (error) {
    console.error('Error calculating correlation:', error);
    throw error;
  }
}

/**
 * Get AI insights on correlation
 */
async function getCorrelationInsights(data) {
  try {
    const prompt = `Analyze the correlation between ${data.symbolA} and ${data.symbolB}:

Correlation Coefficient: ${data.correlation.toFixed(4)}
Correlation Strength: ${data.correlationStrength}
Beta: ${data.beta.toFixed(4)}
R-Squared: ${data.rSquared.toFixed(4)}
Directional Agreement: ${data.directionalAgreement.toFixed(2)}%
Time Period: ${data.timePeriod}

Provide trading implications and insights in 2-3 sentences. How can traders use this correlation information?`;

    const messages = [
      {
        role: 'system',
        content: 'You are a cryptocurrency correlation analyst. Provide concise, actionable trading insights based on correlation data.'
      },
      { role: 'user', content: prompt }
    ];

    const response = await aiService.callOpenRouter(messages, 'anthropic/claude-3.5-sonnet', 0.5, true, 7200);

    return response;
  } catch (error) {
    console.error('Error getting correlation insights:', error);
    return 'Correlation analysis available. Monitor these assets for potential trading opportunities.';
  }
}

/**
 * Store correlation data
 */
export async function storeCorrelation(data) {
  try {
    const result = await pool.query(
      `INSERT INTO asset_correlations (
        symbol_a,
        symbol_b,
        correlation_coefficient,
        time_period,
        covariance,
        beta,
        r_squared,
        directional_agreement,
        correlation_strength,
        trading_implications
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        data.symbolA,
        data.symbolB,
        data.correlationCoefficient,
        data.timePeriod,
        data.covariance,
        data.beta,
        data.rSquared,
        data.directionalAgreement,
        data.correlationStrength,
        data.tradingImplications,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error storing correlation:', error);
    throw error;
  }
}

/**
 * Get recent correlations
 */
export async function getRecentCorrelations(symbolA = null, timePeriod = '30d', limit = 50) {
  try {
    const query = symbolA
      ? `SELECT * FROM asset_correlations
         WHERE (symbol_a = $1 OR symbol_b = $1)
         AND time_period = $2
         ORDER BY calculated_at DESC
         LIMIT $3`
      : `SELECT * FROM asset_correlations
         WHERE time_period = $1
         ORDER BY calculated_at DESC
         LIMIT $2`;

    const params = symbolA ? [symbolA, timePeriod, limit] : [timePeriod, limit];

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    console.error('Error getting correlations:', error);
    throw error;
  }
}

/**
 * Calculate correlation matrix for multiple assets
 */
export async function calculateCorrelationMatrix(symbols, timePeriod = '30d') {
  const matrix = {};
  const correlations = [];

  for (let i = 0; i < symbols.length; i++) {
    matrix[symbols[i]] = {};

    for (let j = 0; j < symbols.length; j++) {
      if (i === j) {
        matrix[symbols[i]][symbols[j]] = 1.0; // Perfect correlation with itself
      } else if (i < j) {
        // Calculate correlation only once for each pair
        try {
          const correlation = await calculateAssetCorrelation(symbols[i], symbols[j], timePeriod);
          matrix[symbols[i]][symbols[j]] = correlation.correlationCoefficient;
          matrix[symbols[j]][symbols[i]] = correlation.correlationCoefficient;

          correlations.push(correlation);

          // Store in database
          await storeCorrelation(correlation);

          // Small delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error calculating ${symbols[i]}-${symbols[j]}:`, error);
          matrix[symbols[i]][symbols[j]] = null;
          matrix[symbols[j]][symbols[i]] = null;
        }
      }
    }
  }

  return {
    matrix,
    correlations,
    symbols,
    timePeriod,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Find highly correlated assets
 */
export async function findHighlyCorrelatedAssets(threshold = 0.7, timePeriod = '30d') {
  try {
    const result = await pool.query(
      `SELECT
        symbol_a,
        symbol_b,
        correlation_coefficient,
        correlation_strength,
        trading_implications,
        calculated_at
       FROM asset_correlations
       WHERE time_period = $1
       AND ABS(correlation_coefficient) >= $2
       AND calculated_at >= NOW() - INTERVAL '7 days'
       ORDER BY ABS(correlation_coefficient) DESC
       LIMIT 20`,
      [timePeriod, threshold]
    );

    return result.rows;
  } catch (error) {
    console.error('Error finding correlated assets:', error);
    throw error;
  }
}

/**
 * Get portfolio correlation risk
 */
export async function getPortfolioCorrelationRisk(portfolio) {
  try {
    const symbols = portfolio.map(p => p.symbol);

    if (symbols.length < 2) {
      return {
        overallRisk: 'low',
        diversificationScore: 100,
        analysis: 'Portfolio has only one asset - no correlation risk.',
      };
    }

    // Get all correlations for portfolio assets
    const correlations = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const result = await pool.query(
          `SELECT correlation_coefficient
           FROM asset_correlations
           WHERE ((symbol_a = $1 AND symbol_b = $2) OR (symbol_a = $2 AND symbol_b = $1))
           AND time_period = '30d'
           ORDER BY calculated_at DESC
           LIMIT 1`,
          [symbols[i], symbols[j]]
        );

        if (result.rows.length > 0) {
          correlations.push({
            pair: `${symbols[i]}-${symbols[j]}`,
            correlation: result.rows[0].correlation_coefficient,
          });
        }
      }
    }

    if (correlations.length === 0) {
      return {
        overallRisk: 'unknown',
        diversificationScore: 50,
        analysis: 'Insufficient correlation data available.',
      };
    }

    // Calculate average absolute correlation
    const avgCorrelation = correlations.reduce((sum, c) => sum + Math.abs(c.correlation), 0) / correlations.length;

    // Diversification score (inverse of correlation)
    const diversificationScore = Math.round((1 - avgCorrelation) * 100);

    // Determine risk level
    let overallRisk;
    if (avgCorrelation >= 0.7) {
      overallRisk = 'high';
    } else if (avgCorrelation >= 0.4) {
      overallRisk = 'medium';
    } else {
      overallRisk = 'low';
    }

    // Find most correlated pairs
    const highestCorrelations = correlations
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .slice(0, 3);

    const analysis = `Portfolio shows ${overallRisk} correlation risk with an average correlation of ${avgCorrelation.toFixed(2)}. ` +
      `Diversification score: ${diversificationScore}/100. ` +
      `Highest correlations: ${highestCorrelations.map(c => `${c.pair} (${c.correlation.toFixed(2)})`).join(', ')}.`;

    return {
      overallRisk,
      diversificationScore,
      avgCorrelation,
      correlations,
      highestCorrelations,
      analysis,
    };
  } catch (error) {
    console.error('Error calculating portfolio correlation risk:', error);
    throw error;
  }
}
