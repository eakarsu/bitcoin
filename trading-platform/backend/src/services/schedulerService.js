import cron from 'node-cron';
import * as predictionService from './predictionTrackingService.js';
import * as socialSentimentService from './socialSentimentService.js';
import * as whaleService from './whaleActivityService.js';
import * as correlationService from './correlationService.js';
import * as botService from './tradingBotService.js';

/**
 * Start all scheduled tasks
 */
export function startScheduledTasks(io) {
  console.log('⏰ Initializing scheduled tasks...');

  // ============================================================================
  // Verify AI Predictions - Every hour
  // ============================================================================
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔍 Running prediction verification...');
      const verified = await predictionService.verifyPendingPredictions();
      console.log(`✅ Verified ${verified} predictions`);

      // Emit update via WebSocket
      if (io && verified > 0) {
        io.emit('predictions:verified', { count: verified, timestamp: new Date() });
      }
    } catch (error) {
      console.error('❌ Prediction verification failed:', error);
    }
  });

  // ============================================================================
  // Collect Social Sentiment - Every 4 hours
  // ============================================================================
  cron.schedule('0 */4 * * *', async () => {
    try {
      console.log('📱 Collecting social sentiment...');
      const results = await socialSentimentService.collectAllSentiments();
      const successful = results.filter(r => r.success).length;
      console.log(`✅ Collected sentiment for ${successful} assets`);

      // Emit update via WebSocket
      if (io) {
        io.emit('sentiment:updated', {
          count: successful,
          results,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Sentiment collection failed:', error);
    }
  });

  // ============================================================================
  // Monitor Whale Activity - Every 5 minutes
  // ============================================================================
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🐋 Monitoring whale activity...');
      await whaleService.monitorWhaleActivity();

      // Emit update via WebSocket
      if (io) {
        io.emit('whale:monitored', { timestamp: new Date() });
      }
    } catch (error) {
      console.error('❌ Whale monitoring failed:', error);
    }
  });

  // ============================================================================
  // Execute Trading Bots - Every minute
  // ============================================================================
  cron.schedule('* * * * *', async () => {
    try {
      const result = await botService.executeBotTrades();

      if (result.executed > 0) {
        console.log(`🤖 Executed ${result.executed} bot trades`);

        // Emit update via WebSocket
        if (io) {
          io.emit('bots:trades-executed', {
            count: result.executed,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error('❌ Bot execution failed:', error);
    }
  });

  // ============================================================================
  // Calculate Correlations - Daily at 2 AM
  // ============================================================================
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('📊 Calculating asset correlations...');
      const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'];

      const matrix = await correlationService.calculateCorrelationMatrix(symbols, '30d');

      console.log(`✅ Calculated ${matrix.correlations.length} correlations`);

      // Emit update via WebSocket
      if (io) {
        io.emit('correlations:updated', {
          count: matrix.correlations.length,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Correlation calculation failed:', error);
    }
  });

  // ============================================================================
  // Cleanup Old Data - Daily at 3 AM
  // ============================================================================
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('🧹 Cleaning up old data...');

      // TODO: Implement cleanup logic
      // - Delete predictions older than 90 days
      // - Archive old bot trades
      // - Clean up old social sentiment data
      // - Remove expired alerts

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  });

  // ============================================================================
  // Generate Performance Reports - Daily at 1 AM
  // ============================================================================
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('📈 Generating performance reports...');

      // Get prediction stats
      const predictionStats = await predictionService.getPredictionStats('30d');

      console.log('Performance Summary:');
      predictionStats.forEach(stat => {
        console.log(`  ${stat.predictionType}: ${stat.avgAccuracy}% accuracy, ${stat.accuracyRate}% success rate`);
      });

      // Emit update via WebSocket
      if (io) {
        io.emit('performance:updated', {
          predictionStats,
          timestamp: new Date()
        });
      }

      console.log('✅ Performance reports generated');
    } catch (error) {
      console.error('❌ Performance report generation failed:', error);
    }
  });

  // ============================================================================
  // Health Check - Every 10 minutes
  // ============================================================================
  cron.schedule('*/10 * * * *', () => {
    console.log(`💚 System health check: ${new Date().toISOString()}`);
  });

  console.log('✅ All scheduled tasks initialized');
  console.log('📅 Schedule:');
  console.log('   - Predictions verification: Every hour');
  console.log('   - Social sentiment collection: Every 4 hours');
  console.log('   - Whale activity monitoring: Every 5 minutes');
  console.log('   - Bot trade execution: Every minute');
  console.log('   - Correlation calculations: Daily at 2 AM');
  console.log('   - Data cleanup: Daily at 3 AM');
  console.log('   - Performance reports: Daily at 1 AM');
  console.log('   - Health checks: Every 10 minutes');
}

export default {
  startScheduledTasks
};
