import axios from 'axios';
import pool from '../config/database.js';
import * as aiService from './aiService.js';
import { getCurrentPrices } from './priceService.js';

/**
 * Fetch whale transactions from Whale Alert API
 */
export async function fetchWhaleTransactions() {
  if (!process.env.WHALE_ALERT_API_KEY) {
    console.warn('Whale Alert API key not configured');
    return [];
  }

  try {
    const response = await axios.get('https://api.whale-alert.io/v1/transactions', {
      params: {
        api_key: process.env.WHALE_ALERT_API_KEY,
        min_value: 1000000, // Minimum $1M transactions
        limit: 100
      }
    });

    const transactions = response.data.transactions || [];
    return transactions;
  } catch (error) {
    console.error('Error fetching whale transactions:', error.message);
    return [];
  }
}

/**
 * Detect whale activity from on-chain data (simulation)
 * In production, this would connect to blockchain nodes or use services like Etherscan, Blockchain.info, etc.
 */
export async function detectWhaleActivity(symbol) {
  try {
    // Simulate whale detection
    // In production, you would:
    // 1. Connect to blockchain APIs (Etherscan, BscScan, etc.)
    // 2. Monitor large transactions in real-time
    // 3. Track exchange wallet movements

    const whaleTransactions = await simulateWhaleDetection(symbol);

    const prices = getCurrentPrices();
    const currentPrice = prices.find(p => p.symbol === symbol);

    for (const transaction of whaleTransactions) {
      await processWhaleTransaction(transaction, currentPrice);
    }

    return whaleTransactions.length;
  } catch (error) {
    console.error('Error detecting whale activity:', error);
    throw error;
  }
}

/**
 * Simulate whale detection (for demo purposes)
 * Replace with real blockchain API integration
 */
async function simulateWhaleDetection(symbol) {
  // This is a simulation - in production, use real blockchain data
  const random = Math.random();

  if (random < 0.2) {
    // 20% chance of detecting whale activity
    const activityTypes = ['large_transfer', 'exchange_deposit', 'exchange_withdrawal'];
    const labels = ['Binance', 'Coinbase', 'Kraken', 'Unknown Wallet', 'Whale Wallet'];

    return [{
      symbol,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      fromAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      toAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      amount: Math.random() * 10000 + 1000, // 1000-11000 units
      activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
      fromLabel: labels[Math.floor(Math.random() * labels.length)],
      toLabel: labels[Math.floor(Math.random() * labels.length)],
    }];
  }

  return [];
}

/**
 * Process a whale transaction
 */
async function processWhaleTransaction(transaction, priceData) {
  try {
    const { symbol, amount, activityType, fromLabel, toLabel } = transaction;

    if (!priceData) {
      console.warn(`No price data for ${symbol}`);
      return;
    }

    const amountUSD = amount * priceData.price;

    // Analyze with AI
    const analysis = await analyzeWhaleTransaction({
      ...transaction,
      amountUSD,
      currentPrice: priceData.price,
      priceChange24h: priceData.change24h,
      volume24h: priceData.volume24h,
    });

    // Store in database
    await storeWhaleActivity({
      symbol,
      transactionHash: transaction.transactionHash,
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount,
      amountUSD,
      activityType,
      fromLabel,
      toLabel,
      priceAtTime: priceData.price,
      aiAnalysis: analysis.analysis,
      impactPrediction: analysis.impactPrediction,
      confidence: analysis.confidence,
    });

    // Generate alert if significant
    if (amountUSD > 5000000 || analysis.confidence > 80) {
      await generateWhaleAlert({
        symbol,
        transaction,
        amountUSD,
        analysis,
      });
    }

    return analysis;
  } catch (error) {
    console.error('Error processing whale transaction:', error);
    throw error;
  }
}

/**
 * Analyze whale transaction with AI
 */
async function analyzeWhaleTransaction(data) {
  try {
    const prompt = `Analyze this large cryptocurrency transaction (whale activity):

Symbol: ${data.symbol}
Amount: ${data.amount.toFixed(2)} ${data.symbol} ($${data.amountUSD.toLocaleString()})
Activity Type: ${data.activityType}
From: ${data.fromLabel || 'Unknown'}
To: ${data.toLabel || 'Unknown'}
Current Price: $${data.currentPrice}
24h Change: ${data.priceChange24h}%
24h Volume: $${data.volume24h}

Provide analysis in JSON format:
{
  "analysis": "<Detailed analysis of what this transaction means>",
  "impactPrediction": "<bullish|bearish|neutral>",
  "confidence": <0-100>,
  "reasoning": "<Why this prediction>",
  "timeframe": "<immediate|short-term|long-term>",
  "marketImplications": "<What traders should watch for>"
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are a cryptocurrency whale activity analyst. Analyze large transactions and predict their market impact. Return ONLY valid JSON.'
      },
      { role: 'user', content: prompt }
    ];

    const response = await aiService.callOpenRouter(messages, 'anthropic/claude-3.5-sonnet', 0.4, false);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error analyzing whale transaction:', error);
    return {
      analysis: 'Unable to analyze transaction',
      impactPrediction: 'neutral',
      confidence: 0,
      reasoning: 'Analysis failed',
      timeframe: 'unknown',
      marketImplications: 'Monitor market closely'
    };
  }
}

/**
 * Store whale activity in database
 */
async function storeWhaleActivity(data) {
  try {
    const result = await pool.query(
      `INSERT INTO whale_activity (
        symbol,
        transaction_hash,
        from_address,
        to_address,
        amount,
        amount_usd,
        activity_type,
        from_label,
        to_label,
        price_at_time,
        ai_analysis,
        impact_prediction,
        confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id`,
      [
        data.symbol,
        data.transactionHash,
        data.fromAddress,
        data.toAddress,
        data.amount,
        data.amountUSD,
        data.activityType,
        data.fromLabel,
        data.toLabel,
        data.priceAtTime,
        data.aiAnalysis,
        data.impactPrediction,
        data.confidence,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error storing whale activity:', error);
    throw error;
  }
}

/**
 * Generate alert for significant whale activity
 */
async function generateWhaleAlert(data) {
  try {
    const { symbol, transaction, amountUSD, analysis } = data;

    const severity = amountUSD > 50000000 ? 'critical' :
                     amountUSD > 10000000 ? 'high' :
                     amountUSD > 5000000 ? 'medium' : 'low';

    const activityLabels = {
      'large_transfer': '🐋 Large Transfer Detected',
      'exchange_deposit': '📥 Large Exchange Deposit',
      'exchange_withdrawal': '📤 Large Exchange Withdrawal',
    };

    const title = activityLabels[transaction.activityType] || '🐋 Whale Activity Detected';

    const message = `A large ${symbol} transaction of $${amountUSD.toLocaleString()} has been detected.

From: ${transaction.fromLabel || 'Unknown Wallet'}
To: ${transaction.toLabel || 'Unknown Wallet'}
Amount: ${transaction.amount.toFixed(2)} ${symbol}

AI Prediction: ${analysis.impactPrediction.toUpperCase()}
Confidence: ${analysis.confidence}%

${analysis.reasoning}`;

    const result = await pool.query(
      `INSERT INTO ai_alerts (
        user_id,
        alert_type,
        severity,
        title,
        message,
        symbol,
        alert_data,
        ai_analysis,
        recommended_actions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        null, // Broadcast to all users (or implement user-specific alerts)
        'whale_activity',
        severity,
        title,
        message,
        symbol,
        JSON.stringify(transaction),
        analysis.analysis,
        [analysis.marketImplications],
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error generating whale alert:', error);
    throw error;
  }
}

/**
 * Get recent whale activity
 */
export async function getRecentWhaleActivity(symbol = null, limit = 50) {
  try {
    const query = symbol
      ? `SELECT * FROM whale_activity WHERE symbol = $1 ORDER BY detected_at DESC LIMIT $2`
      : `SELECT * FROM whale_activity ORDER BY detected_at DESC LIMIT $1`;

    const params = symbol ? [symbol, limit] : [limit];

    const result = await pool.query(query, params);

    return result.rows;
  } catch (error) {
    console.error('Error getting recent whale activity:', error);
    throw error;
  }
}

/**
 * Get whale activity statistics
 */
export async function getWhaleActivityStats(symbol, timePeriod = '24h') {
  try {
    const interval = timePeriod === '24h' ? '24 hours' : '7 days';

    const result = await pool.query(
      `SELECT
        COUNT(*) as total_transactions,
        SUM(amount_usd) as total_value,
        AVG(amount_usd) as avg_transaction_value,
        COUNT(CASE WHEN activity_type = 'exchange_deposit' THEN 1 END) as deposits,
        COUNT(CASE WHEN activity_type = 'exchange_withdrawal' THEN 1 END) as withdrawals,
        COUNT(CASE WHEN impact_prediction = 'bullish' THEN 1 END) as bullish_signals,
        COUNT(CASE WHEN impact_prediction = 'bearish' THEN 1 END) as bearish_signals
       FROM whale_activity
       WHERE symbol = $1
       AND detected_at >= NOW() - INTERVAL '${interval}'`,
      [symbol]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const data = result.rows[0];

    return {
      symbol,
      timePeriod,
      totalTransactions: parseInt(data.total_transactions),
      totalValue: parseFloat(data.total_value || 0),
      avgTransactionValue: parseFloat(data.avg_transaction_value || 0),
      deposits: parseInt(data.deposits),
      withdrawals: parseInt(data.withdrawals),
      netFlow: parseInt(data.deposits) - parseInt(data.withdrawals),
      bullishSignals: parseInt(data.bullish_signals),
      bearishSignals: parseInt(data.bearish_signals),
      sentiment: parseInt(data.bullish_signals) > parseInt(data.bearish_signals) ? 'bullish' : 'bearish'
    };
  } catch (error) {
    console.error('Error getting whale activity stats:', error);
    throw error;
  }
}

/**
 * Monitor whale activity continuously
 */
export async function monitorWhaleActivity() {
  const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'];

  for (const symbol of symbols) {
    try {
      await detectWhaleActivity(symbol);
    } catch (error) {
      console.error(`Error monitoring ${symbol}:`, error);
    }
  }

  console.log('✅ Whale activity monitoring completed');
}
