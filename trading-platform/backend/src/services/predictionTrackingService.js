import pool from '../config/database.js';
import { getCurrentPrices } from './priceService.js';

/**
 * Store a new AI prediction for future verification
 */
export async function storePrediction(predictionData) {
  const {
    predictionType,
    symbol,
    timeframe,
    predictionData: data,
    predictedValue,
    expiresAt,
    modelVersion = 'claude-3.5-sonnet',
    confidence
  } = predictionData;

  try {
    const result = await pool.query(
      `INSERT INTO ai_predictions (
        prediction_type,
        symbol,
        timeframe,
        prediction_data,
        predicted_value,
        expires_at,
        model_version,
        confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [predictionType, symbol, timeframe, JSON.stringify(data), predictedValue, expiresAt, modelVersion, confidence]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error storing prediction:', error);
    throw error;
  }
}

/**
 * Verify pending predictions and calculate accuracy
 */
export async function verifyPendingPredictions() {
  try {
    // Get all unverified predictions that have expired
    const result = await pool.query(
      `SELECT * FROM ai_predictions
       WHERE verified_at IS NULL
       AND expires_at <= NOW()
       ORDER BY expires_at ASC
       LIMIT 100`
    );

    const predictions = result.rows;
    const prices = getCurrentPrices();

    let verified = 0;

    for (const prediction of predictions) {
      const actualValue = await getActualValue(prediction, prices);

      if (actualValue !== null) {
        const accuracy = calculateAccuracy(prediction, actualValue);

        await pool.query(
          `UPDATE ai_predictions
           SET actual_value = $1,
               verified_at = NOW(),
               accuracy_score = $2,
               error_margin = $3,
               is_accurate = $4
           WHERE id = $5`,
          [actualValue, accuracy.score, accuracy.errorMargin, accuracy.isAccurate, prediction.id]
        );

        verified++;
      }
    }

    console.log(`✅ Verified ${verified} predictions`);
    return verified;
  } catch (error) {
    console.error('Error verifying predictions:', error);
    throw error;
  }
}

/**
 * Get the actual value for a prediction
 */
async function getActualValue(prediction, currentPrices) {
  const { prediction_type, symbol } = prediction;

  switch (prediction_type) {
    case 'price':
      // Get current price for the symbol
      const priceData = currentPrices.find(p => p.symbol === symbol);
      return priceData ? priceData.price : null;

    case 'sentiment':
      // For sentiment, we'd need to check actual market movement
      // This is a simplified implementation
      const sentimentPrice = currentPrices.find(p => p.symbol === symbol);
      if (!sentimentPrice) return null;
      return sentimentPrice.change24h; // Use 24h change as sentiment indicator

    default:
      return null;
  }
}

/**
 * Calculate prediction accuracy
 */
function calculateAccuracy(prediction, actualValue) {
  const { predicted_value, confidence, prediction_data } = prediction;

  if (!predicted_value || !actualValue) {
    return { score: 0, errorMargin: 100, isAccurate: false };
  }

  // Calculate percentage error
  const errorMargin = Math.abs((actualValue - predicted_value) / predicted_value) * 100;

  // Determine accuracy score (inverse of error, capped at 100)
  let score = Math.max(0, 100 - errorMargin);

  // Consider confidence in the scoring
  if (confidence) {
    score = score * (confidence / 100);
  }

  // Determine if accurate (within 10% error margin)
  const isAccurate = errorMargin <= 10;

  return {
    score: Math.round(score * 100) / 100,
    errorMargin: Math.round(errorMargin * 100) / 100,
    isAccurate
  };
}

/**
 * Get prediction accuracy statistics
 */
export async function getPredictionStats(timeframe = '30d') {
  try {
    const result = await pool.query(
      `SELECT
        prediction_type,
        COUNT(*) as total_predictions,
        COUNT(CASE WHEN verified_at IS NOT NULL THEN 1 END) as verified_count,
        AVG(accuracy_score) as avg_accuracy,
        AVG(confidence) as avg_confidence,
        COUNT(CASE WHEN is_accurate = true THEN 1 END) as accurate_count,
        AVG(error_margin) as avg_error_margin
       FROM ai_predictions
       WHERE created_at >= NOW() - INTERVAL '${timeframe === '7d' ? '7 days' : '30 days'}'
       GROUP BY prediction_type`,
      []
    );

    return result.rows.map(row => ({
      predictionType: row.prediction_type,
      totalPredictions: parseInt(row.total_predictions),
      verifiedCount: parseInt(row.verified_count),
      avgAccuracy: parseFloat(row.avg_accuracy || 0).toFixed(2),
      avgConfidence: parseFloat(row.avg_confidence || 0).toFixed(2),
      accurateCount: parseInt(row.accurate_count),
      accuracyRate: parseFloat((row.accurate_count / row.verified_count) * 100 || 0).toFixed(2),
      avgErrorMargin: parseFloat(row.avg_error_margin || 0).toFixed(2)
    }));
  } catch (error) {
    console.error('Error getting prediction stats:', error);
    throw error;
  }
}

/**
 * Get recent predictions with their accuracy
 */
export async function getRecentPredictions(limit = 50) {
  try {
    const result = await pool.query(
      `SELECT
        id,
        prediction_type,
        symbol,
        timeframe,
        predicted_value,
        actual_value,
        accuracy_score,
        is_accurate,
        confidence,
        predicted_at,
        verified_at,
        expires_at
       FROM ai_predictions
       ORDER BY predicted_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting recent predictions:', error);
    throw error;
  }
}

/**
 * Store AI recommendation
 */
export async function storeRecommendation(recommendationData) {
  const {
    userId,
    recommendationType,
    title,
    description,
    data,
    confidence,
    priority = 0,
    expiresAt
  } = recommendationData;

  try {
    const result = await pool.query(
      `INSERT INTO ai_recommendations (
        user_id,
        recommendation_type,
        title,
        description,
        recommendation_data,
        confidence,
        priority,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [userId, recommendationType, title, description, JSON.stringify(data), confidence, priority, expiresAt]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error storing recommendation:', error);
    throw error;
  }
}

/**
 * Get user recommendations
 */
export async function getUserRecommendations(userId, limit = 20) {
  try {
    const result = await pool.query(
      `SELECT *
       FROM ai_recommendations
       WHERE user_id = $1
       AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY priority DESC, created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => ({
      ...row,
      recommendation_data: row.recommendation_data
    }));
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    throw error;
  }
}

/**
 * Record user action on recommendation
 */
export async function recordRecommendationAction(recommendationId, action, notes = null) {
  try {
    await pool.query(
      `UPDATE ai_recommendations
       SET acted_on = true,
           action_taken = $1,
           action_at = NOW(),
           action_notes = $2
       WHERE id = $3`,
      [action, notes, recommendationId]
    );

    return { success: true };
  } catch (error) {
    console.error('Error recording recommendation action:', error);
    throw error;
  }
}

/**
 * Record recommendation outcome
 */
export async function recordRecommendationOutcome(recommendationId, status, data = null) {
  try {
    await pool.query(
      `UPDATE ai_recommendations
       SET outcome_status = $1,
           outcome_data = $2,
           outcome_recorded_at = NOW()
       WHERE id = $3`,
      [status, JSON.stringify(data), recommendationId]
    );

    return { success: true };
  } catch (error) {
    console.error('Error recording recommendation outcome:', error);
    throw error;
  }
}
