import axios from 'axios';
import pool from '../config/database.js';
import * as aiService from './aiService.js';
import snoowrap from 'snoowrap';

/**
 * Fetch Reddit sentiment for a cryptocurrency
 */
export async function fetchRedditSentiment(symbol) {
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.warn('Reddit API credentials not configured');
    return null;
  }

  try {
    const reddit = new snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT || 'TradingPlatform/1.0',
      clientId: process.env.REDDIT_CLIENT_ID,
      clientSecret: process.env.REDDIT_CLIENT_SECRET,
      refreshToken: process.env.REDDIT_REFRESH_TOKEN,
    });

    // Search relevant subreddits
    const subreddits = ['cryptocurrency', 'CryptoMarkets', 'Bitcoin', 'ethereum', 'CryptoCurrency'];
    const searchTerm = getSearchTerm(symbol);

    const posts = [];
    for (const subreddit of subreddits) {
      try {
        const results = await reddit
          .getSubreddit(subreddit)
          .search({ query: searchTerm, time: 'day', limit: 10 });

        posts.push(...results);
      } catch (err) {
        console.error(`Error fetching from r/${subreddit}:`, err.message);
      }
    }

    if (posts.length === 0) {
      return null;
    }

    // Analyze sentiment with AI
    const sentiment = await analyzeSocialPosts(posts, symbol, 'reddit');

    return sentiment;
  } catch (error) {
    console.error('Error fetching Reddit sentiment:', error);
    return null;
  }
}

/**
 * Fetch Twitter sentiment (placeholder - requires Twitter API v2)
 */
export async function fetchTwitterSentiment(symbol) {
  if (!process.env.TWITTER_BEARER_TOKEN) {
    console.warn('Twitter API credentials not configured');
    return null;
  }

  try {
    const searchTerm = getSearchTerm(symbol);
    const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
      },
      params: {
        query: `${searchTerm} -is:retweet lang:en`,
        max_results: 100,
        'tweet.fields': 'created_at,public_metrics',
      }
    });

    const tweets = response.data.data || [];

    if (tweets.length === 0) {
      return null;
    }

    // Analyze sentiment with AI
    const sentiment = await analyzeSocialPosts(tweets, symbol, 'twitter');

    return sentiment;
  } catch (error) {
    console.error('Error fetching Twitter sentiment:', error.message);
    return null;
  }
}

/**
 * Get search term for symbol
 */
function getSearchTerm(symbol) {
  const symbolMap = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'BNB': 'Binance',
    'XRP': 'Ripple',
    'ADA': 'Cardano',
    'DOGE': 'Dogecoin',
    'MATIC': 'Polygon',
  };

  return symbolMap[symbol] || symbol;
}

/**
 * Analyze social media posts with AI
 */
async function analyzeSocialPosts(posts, symbol, source) {
  try {
    // Prepare sample posts for AI analysis
    const samplePosts = posts.slice(0, 20).map(post => {
      if (source === 'reddit') {
        return {
          title: post.title,
          text: post.selftext?.substring(0, 500),
          score: post.score,
          comments: post.num_comments,
        };
      } else if (source === 'twitter') {
        return {
          text: post.text?.substring(0, 500),
          likes: post.public_metrics?.like_count,
          retweets: post.public_metrics?.retweet_count,
        };
      }
    });

    const prompt = `Analyze the following social media ${source} posts about ${symbol} cryptocurrency and provide a comprehensive sentiment analysis.

Posts:
${JSON.stringify(samplePosts, null, 2)}

Provide your analysis in the following JSON format:
{
  "sentimentScore": <number from -100 (very bearish) to +100 (very bullish)>,
  "volume": <number of posts analyzed>,
  "positivePercentage": <percentage 0-100>,
  "negativePercentage": <percentage 0-100>,
  "neutralPercentage": <percentage 0-100>,
  "trendingTopics": [<array of top 5 topics/themes mentioned>],
  "keywords": [<array of top 10 keywords>],
  "aiSummary": "<2-3 sentence summary of overall sentiment>",
  "impactPrediction": "<bullish|bearish|neutral>"
}`;

    const messages = [
      { role: 'system', content: 'You are a social media sentiment analysis expert. Analyze cryptocurrency-related posts and provide detailed sentiment metrics. Return ONLY valid JSON, no markdown or additional text.' },
      { role: 'user', content: prompt }
    ];

    const response = await aiService.callOpenRouter(messages, 'anthropic/claude-3.5-sonnet', 0.3, false);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Calculate engagement (source-specific)
    const engagement = posts.reduce((sum, post) => {
      if (source === 'reddit') {
        return sum + (post.score || 0) + (post.num_comments || 0);
      } else if (source === 'twitter') {
        return sum + (post.public_metrics?.like_count || 0) + (post.public_metrics?.retweet_count || 0);
      }
      return sum;
    }, 0);

    return {
      symbol,
      source,
      sentimentScore: analysis.sentimentScore,
      volume: posts.length,
      engagement,
      positivePercentage: analysis.positivePercentage,
      negativePercentage: analysis.negativePercentage,
      neutralPercentage: analysis.neutralPercentage,
      trendingTopics: analysis.trendingTopics,
      keywords: analysis.keywords,
      samplePosts: samplePosts.slice(0, 5),
      aiSummary: analysis.aiSummary,
      impactPrediction: analysis.impactPrediction,
      timePeriod: '24h',
    };
  } catch (error) {
    console.error('Error analyzing social posts:', error);
    return null;
  }
}

/**
 * Store social sentiment in database
 */
export async function storeSocialSentiment(sentimentData) {
  try {
    const result = await pool.query(
      `INSERT INTO social_sentiment (
        symbol,
        source,
        sentiment_score,
        volume,
        engagement,
        positive_percentage,
        negative_percentage,
        neutral_percentage,
        trending_topics,
        keywords,
        sample_posts,
        ai_summary,
        impact_prediction,
        time_period
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        sentimentData.symbol,
        sentimentData.source,
        sentimentData.sentimentScore,
        sentimentData.volume,
        sentimentData.engagement,
        sentimentData.positivePercentage,
        sentimentData.negativePercentage,
        sentimentData.neutralPercentage,
        sentimentData.trendingTopics,
        sentimentData.keywords,
        JSON.stringify(sentimentData.samplePosts),
        sentimentData.aiSummary,
        sentimentData.impactPrediction,
        sentimentData.timePeriod,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error storing social sentiment:', error);
    throw error;
  }
}

/**
 * Get recent social sentiment for a symbol
 */
export async function getSocialSentiment(symbol, timePeriod = '24h') {
  try {
    const result = await pool.query(
      `SELECT *
       FROM social_sentiment
       WHERE symbol = $1
       AND collected_at >= NOW() - INTERVAL '${timePeriod === '24h' ? '24 hours' : '7 days'}'
       ORDER BY collected_at DESC`,
      [symbol]
    );

    return result.rows.map(row => ({
      ...row,
      sample_posts: row.sample_posts,
    }));
  } catch (error) {
    console.error('Error getting social sentiment:', error);
    throw error;
  }
}

/**
 * Get aggregated sentiment across all sources
 */
export async function getAggregatedSentiment(symbol) {
  try {
    const result = await pool.query(
      `SELECT
        symbol,
        AVG(sentiment_score) as avg_sentiment_score,
        SUM(volume) as total_volume,
        SUM(engagement) as total_engagement,
        AVG(positive_percentage) as avg_positive,
        AVG(negative_percentage) as avg_negative,
        AVG(neutral_percentage) as avg_neutral,
        ARRAY_AGG(DISTINCT t) as all_topics
       FROM social_sentiment,
       UNNEST(trending_topics) as t
       WHERE symbol = $1
       AND collected_at >= NOW() - INTERVAL '24 hours'
       GROUP BY symbol`,
      [symbol]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const data = result.rows[0];

    return {
      symbol: data.symbol,
      avgSentimentScore: parseFloat(data.avg_sentiment_score || 0).toFixed(2),
      totalVolume: parseInt(data.total_volume || 0),
      totalEngagement: parseInt(data.total_engagement || 0),
      avgPositive: parseFloat(data.avg_positive || 0).toFixed(2),
      avgNegative: parseFloat(data.avg_negative || 0).toFixed(2),
      avgNeutral: parseFloat(data.avg_neutral || 0).toFixed(2),
      trendingTopics: data.all_topics.slice(0, 10),
      overall: data.avg_sentiment_score > 20 ? 'bullish' : data.avg_sentiment_score < -20 ? 'bearish' : 'neutral'
    };
  } catch (error) {
    console.error('Error getting aggregated sentiment:', error);
    throw error;
  }
}

/**
 * Collect sentiment for all major cryptocurrencies
 */
export async function collectAllSentiments() {
  const symbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'];
  const results = [];

  for (const symbol of symbols) {
    try {
      // Fetch from Reddit
      const redditSentiment = await fetchRedditSentiment(symbol);
      if (redditSentiment) {
        await storeSocialSentiment(redditSentiment);
        results.push({ symbol, source: 'reddit', success: true });
      }

      // Fetch from Twitter (if configured)
      const twitterSentiment = await fetchTwitterSentiment(symbol);
      if (twitterSentiment) {
        await storeSocialSentiment(twitterSentiment);
        results.push({ symbol, source: 'twitter', success: true });
      }

      // Wait to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error collecting sentiment for ${symbol}:`, error);
      results.push({ symbol, success: false, error: error.message });
    }
  }

  return results;
}
