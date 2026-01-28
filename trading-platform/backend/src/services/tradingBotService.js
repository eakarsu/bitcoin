import pool from '../config/database.js';
import { getCurrentPrices } from './priceService.js';
import * as aiService from './aiService.js';

/**
 * Create a new trading bot
 */
export async function createTradingBot(botData) {
  const {
    userId,
    name,
    description,
    strategyType,
    strategyConfig,
    symbols,
    maxPositionSize,
    maxDailyLoss,
    stopLossPercentage,
    takeProfitPercentage,
    isPaperTrading = true,
  } = botData;

  try {
    const result = await pool.query(
      `INSERT INTO trading_bots (
        user_id,
        name,
        description,
        strategy_type,
        strategy_config,
        symbols,
        max_position_size,
        max_daily_loss,
        stop_loss_percentage,
        take_profit_percentage,
        is_paper_trading,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'inactive')
      RETURNING *`,
      [
        userId,
        name,
        description,
        strategyType,
        JSON.stringify(strategyConfig),
        symbols,
        maxPositionSize,
        maxDailyLoss,
        stopLossPercentage,
        takeProfitPercentage,
        isPaperTrading,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error creating trading bot:', error);
    throw error;
  }
}

/**
 * Start a trading bot
 */
export async function startBot(botId) {
  try {
    await pool.query(
      `UPDATE trading_bots
       SET is_enabled = true,
           status = 'active',
           started_at = NOW()
       WHERE id = $1`,
      [botId]
    );

    console.log(`✅ Bot ${botId} started`);
    return { success: true };
  } catch (error) {
    console.error('Error starting bot:', error);
    throw error;
  }
}

/**
 * Stop a trading bot
 */
export async function stopBot(botId) {
  try {
    await pool.query(
      `UPDATE trading_bots
       SET is_enabled = false,
           status = 'inactive',
           stopped_at = NOW()
       WHERE id = $1`,
      [botId]
    );

    console.log(`🛑 Bot ${botId} stopped`);
    return { success: true };
  } catch (error) {
    console.error('Error stopping bot:', error);
    throw error;
  }
}

/**
 * Execute bot trading logic
 */
export async function executeBotTrades() {
  try {
    // Get all active bots
    const result = await pool.query(
      `SELECT * FROM trading_bots WHERE is_enabled = true AND status = 'active'`
    );

    const activeBots = result.rows;

    if (activeBots.length === 0) {
      return { executed: 0 };
    }

    console.log(`⚡ Executing trades for ${activeBots.length} active bots`);

    let totalTrades = 0;

    for (const bot of activeBots) {
      try {
        const trades = await executeBotStrategy(bot);
        totalTrades += trades;
      } catch (error) {
        console.error(`Error executing bot ${bot.id}:`, error);
        await recordBotError(bot.id, error.message);
      }
    }

    return { executed: totalTrades };
  } catch (error) {
    console.error('Error executing bot trades:', error);
    throw error;
  }
}

/**
 * Execute a specific bot's strategy
 */
async function executeBotStrategy(bot) {
  const { id, strategy_type, strategy_config, symbols, max_daily_loss, current_drawdown } = bot;

  // Check daily loss limit
  if (current_drawdown >= max_daily_loss) {
    console.log(`⚠️  Bot ${id} has reached daily loss limit`);
    await pauseBot(id, 'Daily loss limit reached');
    return 0;
  }

  const prices = getCurrentPrices();
  let tradesExecuted = 0;

  for (const symbol of symbols) {
    const priceData = prices.find(p => p.symbol === symbol);

    if (!priceData) {
      continue;
    }

    // Generate trading signal with AI
    const signal = await generateTradingSignal(bot, symbol, priceData);

    if (signal.action !== 'hold') {
      await executeTrade(bot, signal);
      tradesExecuted++;
    }
  }

  return tradesExecuted;
}

/**
 * Generate trading signal with AI
 */
async function generateTradingSignal(bot, symbol, priceData) {
  try {
    const prompt = `As a trading bot, analyze this market data and decide on a trading action:

Symbol: ${symbol}
Current Price: $${priceData.price}
24h Change: ${priceData.change24h}%
24h Volume: $${priceData.volume24h}
24h High: $${priceData.high24h}
24h Low: $${priceData.low24h}

Bot Strategy: ${bot.strategy_type}
Strategy Config: ${JSON.stringify(bot.strategy_config)}
Stop Loss: ${bot.stop_loss_percentage}%
Take Profit: ${bot.take_profit_percentage}%

Provide a trading decision in JSON format:
{
  "action": "<buy|sell|hold>",
  "confidence": <0-100>,
  "reasoning": "<1-2 sentence explanation>",
  "positionSize": <percentage of max position, 0-100>,
  "expectedPriceTarget": <target price if buying/selling>
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an AI trading bot. Make data-driven trading decisions. Return ONLY valid JSON.'
      },
      { role: 'user', content: prompt }
    ];

    const response = await aiService.callOpenRouter(messages, 'anthropic/claude-3.5-sonnet', 0.3, false);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { action: 'hold', confidence: 0, reasoning: 'Failed to generate signal' };
    }

    const signal = JSON.parse(jsonMatch[0]);

    return {
      ...signal,
      symbol,
      price: priceData.price,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error generating trading signal:', error);
    return { action: 'hold', confidence: 0, reasoning: 'Error generating signal' };
  }
}

/**
 * Execute a trade
 */
async function executeTrade(bot, signal) {
  try {
    const quantity = (bot.max_position_size * (signal.positionSize / 100)) / signal.price;
    const totalValue = quantity * signal.price;

    const result = await pool.query(
      `INSERT INTO bot_trades (
        bot_id,
        user_id,
        symbol,
        side,
        quantity,
        price,
        total_value,
        order_type,
        status,
        is_paper_trade,
        signal_type,
        ai_confidence,
        reasoning,
        signal_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id`,
      [
        bot.id,
        bot.user_id,
        signal.symbol,
        signal.action,
        quantity,
        signal.price,
        totalValue,
        'market',
        'executed',
        bot.is_paper_trading,
        bot.strategy_type,
        signal.confidence,
        signal.reasoning,
      ]
    );

    // Update bot stats
    await pool.query(
      `UPDATE trading_bots
       SET total_trades = total_trades + 1,
           last_trade_at = NOW()
       WHERE id = $1`,
      [bot.id]
    );

    console.log(`✅ Executed ${signal.action} trade for ${signal.symbol} (Bot ${bot.id})`);

    return result.rows[0];
  } catch (error) {
    console.error('Error executing trade:', error);
    throw error;
  }
}

/**
 * Pause bot due to error or limit
 */
async function pauseBot(botId, reason) {
  await pool.query(
    `UPDATE trading_bots
     SET status = 'paused',
         last_error = $1,
         last_error_at = NOW()
     WHERE id = $2`,
    [reason, botId]
  );
}

/**
 * Record bot error
 */
async function recordBotError(botId, errorMessage) {
  await pool.query(
    `UPDATE trading_bots
     SET last_error = $1,
         last_error_at = NOW(),
         status = 'error'
     WHERE id = $2`,
    [errorMessage, botId]
  );
}

/**
 * Get user's trading bots
 */
export async function getUserBots(userId) {
  try {
    const result = await pool.query(
      `SELECT * FROM trading_bots WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(bot => ({
      ...bot,
      strategy_config: bot.strategy_config,
    }));
  } catch (error) {
    console.error('Error getting user bots:', error);
    throw error;
  }
}

/**
 * Get bot performance
 */
export async function getBotPerformance(botId) {
  try {
    const result = await pool.query(
      `SELECT
        COUNT(*) as total_trades,
        COUNT(CASE WHEN profit_loss > 0 THEN 1 END) as winning_trades,
        SUM(profit_loss) as total_profit_loss,
        AVG(profit_loss) as avg_profit_loss,
        MAX(profit_loss) as best_trade,
        MIN(profit_loss) as worst_trade
       FROM bot_trades
       WHERE bot_id = $1
       AND closed_at IS NOT NULL`,
      [botId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error getting bot performance:', error);
    throw error;
  }
}

/**
 * Get bot trade history
 */
export async function getBotTradeHistory(botId, limit = 50) {
  try {
    const result = await pool.query(
      `SELECT * FROM bot_trades
       WHERE bot_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [botId, limit]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting bot trade history:', error);
    throw error;
  }
}

/**
 * Update bot configuration
 */
export async function updateBot(botId, updates) {
  const {
    name,
    description,
    strategyConfig,
    maxPositionSize,
    maxDailyLoss,
    stopLossPercentage,
    takeProfitPercentage,
  } = updates;

  try {
    const result = await pool.query(
      `UPDATE trading_bots
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           strategy_config = COALESCE($3, strategy_config),
           max_position_size = COALESCE($4, max_position_size),
           max_daily_loss = COALESCE($5, max_daily_loss),
           stop_loss_percentage = COALESCE($6, stop_loss_percentage),
           take_profit_percentage = COALESCE($7, take_profit_percentage),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name,
        description,
        strategyConfig ? JSON.stringify(strategyConfig) : null,
        maxPositionSize,
        maxDailyLoss,
        stopLossPercentage,
        takeProfitPercentage,
        botId,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error updating bot:', error);
    throw error;
  }
}

/**
 * Delete trading bot
 */
export async function deleteBot(botId) {
  try {
    await pool.query('DELETE FROM trading_bots WHERE id = $1', [botId]);
    return { success: true };
  } catch (error) {
    console.error('Error deleting bot:', error);
    throw error;
  }
}
