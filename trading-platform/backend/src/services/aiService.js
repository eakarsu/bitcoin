import axios from 'axios';
import cacheService from './cacheService.js';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Use Claude Sonnet for best quality
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

/**
 * Make a request to OpenRouter AI with caching support
 */
export async function callOpenRouter(messages, model = DEFAULT_MODEL, temperature = 0.7, useCache = true, cacheTTL = 3600) {
  try {
    // Generate cache key if caching is enabled
    let cacheKey = null;
    if (useCache) {
      cacheKey = cacheService.generateKey('ai:openrouter', { messages, model, temperature });

      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log('✅ Returning cached AI response');
        return cached;
      }
    }

    // Make API call
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model,
        messages,
        temperature
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Trading Platform AI'
        }
      }
    );

    const result = response.data.choices[0].message.content;

    // Cache the result if caching is enabled
    if (useCache && cacheKey) {
      await cacheService.set(cacheKey, result, cacheTTL);
    }

    return result;
  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    throw new Error('Failed to get AI response');
  }
}

/**
 * AI Trading Assistant - General chat about trading
 */
export async function getTradingAssistantResponse(userMessage, context = {}) {
  const systemPrompt = `You are an expert cryptocurrency trading assistant with deep knowledge of:
- Technical analysis (RSI, MACD, Bollinger Bands, Moving Averages)
- Market sentiment and trends
- Risk management strategies
- Portfolio diversification
- Trading strategies (day trading, swing trading, HODLing)
- Blockchain technology and crypto fundamentals

Current market context:
${context.prices ? `Current Prices: ${JSON.stringify(context.prices, null, 2)}` : ''}
${context.portfolio ? `User Portfolio: ${JSON.stringify(context.portfolio, null, 2)}` : ''}

Provide helpful, accurate, and actionable trading advice. Be concise but thorough.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];

  return await callOpenRouter(messages);
}

/**
 * AI Market Sentiment Analysis
 */
export async function analyzeMarketSentiment(marketData) {
  const prompt = `Analyze the current cryptocurrency market sentiment based on this data:

${JSON.stringify(marketData, null, 2)}

Provide a comprehensive sentiment analysis including:
1. Overall market sentiment (Bullish/Bearish/Neutral) with confidence score
2. Key drivers and trends
3. Risk factors to watch
4. Opportunities identified
5. Short-term (24h) and medium-term (7d) outlook

Format as JSON with: sentiment, confidence, analysis, risks, opportunities, outlook`;

  const messages = [
    { role: 'system', content: 'You are an expert market analyst specializing in cryptocurrency sentiment analysis.' },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenRouter(messages, DEFAULT_MODEL, 0.5);

  try {
    return JSON.parse(response);
  } catch {
    return { analysis: response };
  }
}

/**
 * AI Signal Explanation
 */
export async function explainTradingSignal(signal) {
  const prompt = `Explain this trading signal in detail:

Signal Type: ${signal.type}
Pair: ${signal.pair}
Confidence: ${signal.confidence}%
Strength: ${signal.strength}
Price: $${signal.price}
Target Price: $${signal.target_price}
Stop Loss: $${signal.stop_loss}
Timeframe: ${signal.timeframe}
Indicators: ${JSON.stringify(signal.indicators || {})}

Provide:
1. Why this signal was generated (technical reasons)
2. What indicators support it
3. Risk/reward ratio
4. Suggested action and position sizing
5. What to watch for

Be specific and educational.`;

  const messages = [
    { role: 'system', content: 'You are an expert technical analyst explaining trading signals to traders.' },
    { role: 'user', content: prompt }
  ];

  return await callOpenRouter(messages);
}

/**
 * AI Portfolio Recommendations
 */
export async function getPortfolioRecommendations(portfolio, marketData) {
  const prompt = `Analyze this cryptocurrency portfolio and provide recommendations:

Portfolio:
${JSON.stringify(portfolio, null, 2)}

Current Market Data:
${JSON.stringify(marketData, null, 2)}

Provide:
1. Portfolio health score (0-100)
2. Diversification analysis
3. Risk assessment
4. Rebalancing recommendations
5. Suggested allocations
6. Coins to consider adding
7. Coins to consider reducing

Format as JSON with scores and detailed recommendations.`;

  const messages = [
    { role: 'system', content: 'You are a professional portfolio manager specializing in cryptocurrency investments.' },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenRouter(messages, DEFAULT_MODEL, 0.6);

  try {
    return JSON.parse(response);
  } catch {
    return { recommendations: response };
  }
}

/**
 * AI Risk Analysis
 */
export async function analyzeRisk(position, marketConditions) {
  const prompt = `Perform a comprehensive risk analysis for this position:

Position:
${JSON.stringify(position, null, 2)}

Market Conditions:
${JSON.stringify(marketConditions, null, 2)}

Analyze:
1. Position risk score (0-100, where 100 is highest risk)
2. Volatility risk
3. Liquidity risk
4. Market correlation risk
5. Suggested stop-loss levels
6. Position sizing recommendation
7. Hedging strategies

Format as JSON with risk_score, analysis, and recommendations.`;

  const messages = [
    { role: 'system', content: 'You are a quantitative risk analyst specializing in cryptocurrency trading risk management.' },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenRouter(messages, DEFAULT_MODEL, 0.5);

  try {
    return JSON.parse(response);
  } catch {
    return { analysis: response };
  }
}

/**
 * AI Pattern Recognition
 */
export async function recognizePatterns(priceData, symbol) {
  const prompt = `Analyze this price data for ${symbol} and identify chart patterns:

Recent Price Data:
${JSON.stringify(priceData.slice(-50), null, 2)}

Identify:
1. Chart patterns (Head & Shoulders, Double Top/Bottom, Triangles, etc.)
2. Support and resistance levels
3. Trend analysis
4. Volume patterns
5. Candlestick patterns
6. Pattern reliability and expected outcome

Format as JSON with patterns array and analysis.`;

  const messages = [
    { role: 'system', content: 'You are an expert technical analyst specializing in chart pattern recognition.' },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenRouter(messages, DEFAULT_MODEL, 0.4);

  try {
    return JSON.parse(response);
  } catch {
    return { patterns: response };
  }
}

/**
 * AI Trading Strategy Generator
 */
export async function generateTradingStrategy(userProfile, marketConditions) {
  const prompt = `Generate a personalized trading strategy:

User Profile:
${JSON.stringify(userProfile, null, 2)}

Market Conditions:
${JSON.stringify(marketConditions, null, 2)}

Create a strategy including:
1. Strategy type (day trading, swing trading, position trading)
2. Entry criteria
3. Exit criteria
4. Risk management rules
5. Position sizing guidelines
6. Timeframe and frequency
7. Expected returns and risks
8. Specific coins to focus on

Format as JSON with complete strategy details.`;

  const messages = [
    { role: 'system', content: 'You are an algorithmic trading strategist creating personalized trading strategies.' },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenRouter(messages, DEFAULT_MODEL, 0.7);

  try {
    return JSON.parse(response);
  } catch {
    return { strategy: response };
  }
}

/**
 * AI News Impact Analysis
 */
export async function analyzeNewsImpact(newsItems, portfolio) {
  const prompt = `Analyze how these news items might impact the portfolio:

News Items:
${JSON.stringify(newsItems, null, 2)}

Portfolio Holdings:
${JSON.stringify(portfolio, null, 2)}

Provide:
1. Impact score for each holding (-100 to +100)
2. Overall portfolio impact
3. Recommended actions
4. Timeline of effects (immediate, short-term, long-term)
5. Related opportunities or risks

Format as JSON with impacts array and summary.`;

  const messages = [
    { role: 'system', content: 'You are a crypto market analyst specializing in news impact analysis.' },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenRouter(messages, DEFAULT_MODEL, 0.6);

  try {
    return JSON.parse(response);
  } catch {
    return { analysis: response };
  }
}

/**
 * AI Price Prediction Explanation
 */
export async function explainPricePrediction(symbol, technicalData, timeframe) {
  const prompt = `Provide a price prediction analysis for ${symbol} over ${timeframe}:

Technical Data:
${JSON.stringify(technicalData, null, 2)}

Analyze:
1. Price prediction range (low, mid, high scenarios)
2. Probability of each scenario
3. Key factors influencing the prediction
4. Technical indicators supporting the prediction
5. Catalysts to watch
6. Risk factors
7. Confidence level

Format as JSON with prediction, probabilities, and detailed analysis.`;

  const messages = [
    { role: 'system', content: 'You are a quantitative analyst providing data-driven price predictions with clear reasoning.' },
    { role: 'user', content: prompt }
  ];

  const response = await callOpenRouter(messages, DEFAULT_MODEL, 0.5);

  try {
    return JSON.parse(response);
  } catch {
    return { prediction: response };
  }
}

/**
 * AI Trade Review and Learning
 */
export async function reviewTrade(trade, outcome) {
  const prompt = `Review this completed trade and provide learning insights:

Trade Details:
${JSON.stringify(trade, null, 2)}

Outcome:
${JSON.stringify(outcome, null, 2)}

Provide:
1. What went right
2. What went wrong
3. Key lessons learned
4. How to improve similar trades
5. Pattern recognition for future trades
6. Psychological factors
7. Risk management evaluation

Be constructive and educational.`;

  const messages = [
    { role: 'system', content: 'You are a trading coach helping traders learn from their trades and improve their skills.' },
    { role: 'user', content: prompt }
  ];

  return await callOpenRouter(messages);
}
