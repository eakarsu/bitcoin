import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Button,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Refresh as RefreshIcon,
  Psychology as AIIcon
} from '@mui/icons-material';
import { getMarketSentiment } from '../../services/aiApi';

const MarketSentimentCard = () => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSentiment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMarketSentiment();
      setSentiment(data);
    } catch (err) {
      console.error('Sentiment Error:', err);
      setError('Failed to analyze market sentiment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentiment();
  }, []);

  const getSentimentIcon = (sent) => {
    if (!sent) return <TrendingFlat />;
    const s = sent.toLowerCase();
    if (s.includes('bullish')) return <TrendingUp />;
    if (s.includes('bearish')) return <TrendingDown />;
    return <TrendingFlat />;
  };

  const getSentimentColor = (sent) => {
    if (!sent) return 'default';
    const s = sent.toLowerCase();
    if (s.includes('bullish')) return 'success';
    if (s.includes('bearish')) return 'error';
    return 'warning';
  };

  if (loading) {
    return (
      <Card
        sx={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%'
        }}
      >
        <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        sx={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          height: '100%'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error" action={
            <Button size="small" onClick={fetchSentiment}>Retry</Button>
          }>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6" fontWeight="700">
              AI Market Sentiment
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchSentiment}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {sentiment && (
          <>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Chip
                icon={getSentimentIcon(sentiment.sentiment)}
                label={sentiment.sentiment || 'Neutral'}
                color={getSentimentColor(sentiment.sentiment)}
                sx={{ fontSize: '1.1rem', p: 2, height: 'auto' }}
              />
              {sentiment.confidence && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Confidence Level
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <LinearProgress
                      variant="determinate"
                      value={sentiment.confidence}
                      sx={{ flex: 1, height: 8, borderRadius: 1 }}
                    />
                    <Typography variant="body2" fontWeight="600">
                      {sentiment.confidence}%
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* Analysis Section */}
            {sentiment.analysis && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  📊 Analysis
                </Typography>
                {typeof sentiment.analysis === 'object' ? (
                  <Box>
                    {sentiment.analysis.explanation && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {sentiment.analysis.explanation}
                      </Typography>
                    )}
                    {sentiment.analysis.key_trends && Array.isArray(sentiment.analysis.key_trends) && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" fontWeight="600" color="text.secondary">
                          Key Trends:
                        </Typography>
                        <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                          {sentiment.analysis.key_trends.map((trend, idx) => (
                            <li key={idx}>
                              <Typography variant="body2" color="text.secondary">
                                {trend}
                              </Typography>
                            </li>
                          ))}
                        </ul>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {sentiment.analysis}
                  </Typography>
                )}
              </Box>
            )}

            {/* Risk Factors */}
            {sentiment.risks && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" color="error.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  ⚠️ Risk Factors
                </Typography>
                {Array.isArray(sentiment.risks) ? (
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {sentiment.risks.map((risk, idx) => (
                      <li key={idx}>
                        <Typography variant="body2" color="text.secondary">
                          {risk}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {sentiment.risks}
                  </Typography>
                )}
              </Box>
            )}

            {/* Opportunities */}
            {sentiment.opportunities && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="600" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  ✨ Opportunities
                </Typography>
                {Array.isArray(sentiment.opportunities) ? (
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {sentiment.opportunities.map((opp, idx) => (
                      <li key={idx}>
                        <Typography variant="body2" color="text.secondary">
                          {opp}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {sentiment.opportunities}
                  </Typography>
                )}
              </Box>
            )}

            {/* Outlook */}
            {sentiment.outlook && typeof sentiment.outlook === 'object' && (
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1.5 }}>
                  🔮 Market Outlook
                </Typography>
                {sentiment.outlook['24h'] && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight="600" color="text.secondary">
                      24h:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {' '}{sentiment.outlook['24h']}
                    </Typography>
                  </Box>
                )}
                {sentiment.outlook['7d'] && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" fontWeight="600" color="text.secondary">
                      7 Days:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {' '}{sentiment.outlook['7d']}
                    </Typography>
                  </Box>
                )}
                {sentiment.outlook.recommendation && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight="600">
                      Recommendation:
                    </Typography>
                    <Typography variant="body2">
                      {' '}{sentiment.outlook.recommendation}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketSentimentCard;
