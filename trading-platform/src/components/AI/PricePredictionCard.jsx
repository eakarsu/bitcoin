import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Grid
} from '@mui/material';
import {
  Psychology as AIIcon,
  TrendingUp,
  TrendingDown,
  ShowChart,
  FiberManualRecord as BulletIcon,
  CheckCircle,
  Warning,
  TrendingFlat,
  Speed
} from '@mui/icons-material';
import { getPricePrediction } from '../../services/aiApi';
import { TRADING_PAIRS } from '../../constants/coins';

const PricePredictionCard = ({ currentPrices }) => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('24h');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const coins = TRADING_PAIRS;
  const timeframes = ['24h', '7d', '30d'];

  const fetchPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const currentPrice = currentPrices?.[selectedSymbol]?.price || 0;
      const technicalData = {
        current_price: currentPrice,
        change_24h: currentPrices?.[selectedSymbol]?.change24h || 0,
        volume: currentPrices?.[selectedSymbol]?.volume || 0
      };

      const data = await getPricePrediction(selectedSymbol, technicalData, timeframe);
      setPrediction(data);
    } catch (err) {
      console.error('Prediction Error:', err);
      setError('Failed to get AI price prediction');
    } finally {
      setLoading(false);
    }
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AIIcon color="primary" />
          <Typography variant="h6" fontWeight="700">
            AI Price Prediction
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Coin</InputLabel>
            <Select
              value={selectedSymbol}
              label="Coin"
              onChange={(e) => setSelectedSymbol(e.target.value)}
            >
              {coins.map(coin => (
                <MenuItem key={`price-pred-${coin}`} value={coin}>{coin}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
            >
              {timeframes.map(tf => (
                <MenuItem key={`price-pred-tf-${tf}`} value={tf}>{tf}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={fetchPrediction}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <ShowChart />}
        >
          {loading ? 'Analyzing...' : 'Get AI Prediction'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

{prediction && !loading && (
          <Box sx={{ mt: 3 }}>
            {/* Handle nested prediction object or direct structure */}
            {(() => {
              const predData = prediction.prediction || prediction;
              const hasScenarios = predData.low_scenario !== undefined ||
                                   predData.bearish !== undefined ||
                                   predData.bear_case !== undefined;

              // Extract scenarios from various possible formats
              const lowScenario = predData.low_scenario || predData.bearish || predData.bear_case;
              const midScenario = predData.mid_scenario || predData.base_case || predData.neutral || predData.expected;
              const highScenario = predData.high_scenario || predData.bullish || predData.bull_case;

              return (
                <>
                  {hasScenarios && (lowScenario || midScenario || highScenario) && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
                        Price Scenarios for {timeframe}
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2, mb: 2 }}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                          <TrendingDown />
                          <Typography variant="caption" display="block" color="error.dark">
                            Bear Case
                          </Typography>
                          <Typography variant="h6" fontWeight="600">
                            ${lowScenario ? parseFloat(lowScenario).toLocaleString() : 'N/A'}
                          </Typography>
                          {prediction.probabilities?.low && (
                            <Typography variant="caption" color="error.dark">
                              {prediction.probabilities.low}%
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                          <ShowChart />
                          <Typography variant="caption" display="block" color="primary.dark">
                            Base Case
                          </Typography>
                          <Typography variant="h6" fontWeight="600">
                            ${midScenario ? parseFloat(midScenario).toLocaleString() : 'N/A'}
                          </Typography>
                          {prediction.probabilities?.mid && (
                            <Typography variant="caption" color="primary.dark">
                              {prediction.probabilities.mid}%
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                          <TrendingUp />
                          <Typography variant="caption" display="block" color="success.dark">
                            Bull Case
                          </Typography>
                          <Typography variant="h6" fontWeight="600">
                            ${highScenario ? parseFloat(highScenario).toLocaleString() : 'N/A'}
                          </Typography>
                          {prediction.probabilities?.high && (
                            <Typography variant="caption" color="success.dark">
                              {prediction.probabilities.high}%
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </>
                  )}

                  {prediction.confidence_level && (
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2" fontWeight="600">
                        Confidence Level:
                      </Typography>
                      <Chip
                        label={`${(parseFloat(prediction.confidence_level) * 100).toFixed(0)}%`}
                        color="primary"
                        size="medium"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  )}

                  {prediction.analysis && (
                    <Box sx={{ mb: 2 }}>
                      {(() => {
                        // Parse analysis if it's a string
                        let analysisData = prediction.analysis;
                        if (typeof prediction.analysis === 'string') {
                          try {
                            analysisData = JSON.parse(prediction.analysis);
                          } catch {
                            // If parsing fails, display as text
                            return (
                              <Box>
                                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                                  AI Analysis
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {prediction.analysis}
                                </Typography>
                              </Box>
                            );
                          }
                        }

                        return (
                          <Box>
                            <Typography variant="h6" fontWeight="700" sx={{ mb: 2 }}>
                              AI Analysis
                            </Typography>

                            {/* Key Factors */}
                            {analysisData.key_factors && Array.isArray(analysisData.key_factors) && (
                              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.main', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                  <CheckCircle color="primary" fontSize="small" />
                                  <Typography variant="subtitle2" fontWeight="600" color="primary.main">
                                    Key Factors
                                  </Typography>
                                </Box>
                                <List dense>
                                  {analysisData.key_factors.map((factor, idx) => (
                                    <ListItem key={idx} sx={{ py: 0.5 }}>
                                      <ListItemIcon sx={{ minWidth: 28 }}>
                                        <BulletIcon sx={{ fontSize: 8, color: 'primary.main' }} />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={factor}
                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Paper>
                            )}

                            {/* Technical Indicators */}
                            {analysisData.technical_indicators && (
                              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                  <Speed color="info" fontSize="small" />
                                  <Typography variant="subtitle2" fontWeight="600" color="info.main">
                                    Technical Indicators
                                  </Typography>
                                </Box>
                                <Grid container spacing={2}>
                                  {analysisData.technical_indicators.support_levels && (
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        Support Levels
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {analysisData.technical_indicators.support_levels.map((level, idx) => (
                                          <Chip key={idx} label={`$${level.toLocaleString()}`} size="small" color="success" variant="outlined" />
                                        ))}
                                      </Box>
                                    </Grid>
                                  )}
                                  {analysisData.technical_indicators.resistance_levels && (
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        Resistance Levels
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                        {analysisData.technical_indicators.resistance_levels.map((level, idx) => (
                                          <Chip key={idx} label={`$${level.toLocaleString()}`} size="small" color="error" variant="outlined" />
                                        ))}
                                      </Box>
                                    </Grid>
                                  )}
                                  {analysisData.technical_indicators.moving_averages && (
                                    <Grid item xs={12}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        Moving Averages
                                      </Typography>
                                      <Typography variant="body2">
                                        {analysisData.technical_indicators.moving_averages}
                                      </Typography>
                                    </Grid>
                                  )}
                                  {analysisData.technical_indicators.volume_analysis && (
                                    <Grid item xs={12}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                        Volume Analysis
                                      </Typography>
                                      <Typography variant="body2">
                                        {analysisData.technical_indicators.volume_analysis}
                                      </Typography>
                                    </Grid>
                                  )}
                                </Grid>
                              </Paper>
                            )}

                            {/* Catalysts */}
                            {analysisData.catalysts && Array.isArray(analysisData.catalysts) && (
                              <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                  <TrendingUp color="success" fontSize="small" />
                                  <Typography variant="subtitle2" fontWeight="600" color="success.main">
                                    Catalysts to Watch
                                  </Typography>
                                </Box>
                                <List dense>
                                  {analysisData.catalysts.map((catalyst, idx) => (
                                    <ListItem key={idx} sx={{ py: 0.5 }}>
                                      <ListItemIcon sx={{ minWidth: 28 }}>
                                        <BulletIcon sx={{ fontSize: 8, color: 'success.main' }} />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={catalyst}
                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Paper>
                            )}

                            {/* Risk Factors */}
                            {analysisData.risk_factors && Array.isArray(analysisData.risk_factors) && (
                              <Paper elevation={0} sx={{ p: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.main', borderRadius: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                  <Warning color="warning" fontSize="small" />
                                  <Typography variant="subtitle2" fontWeight="600" color="warning.main">
                                    Risk Factors
                                  </Typography>
                                </Box>
                                <List dense>
                                  {analysisData.risk_factors.map((risk, idx) => (
                                    <ListItem key={idx} sx={{ py: 0.5 }}>
                                      <ListItemIcon sx={{ minWidth: 28 }}>
                                        <BulletIcon sx={{ fontSize: 8, color: 'warning.main' }} />
                                      </ListItemIcon>
                                      <ListItemText
                                        primary={risk}
                                        primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </Paper>
                            )}
                          </Box>
                        );
                      })()}
                    </Box>
                  )}

                  {/* Fallback: If prediction is just a string */}
                  {typeof predData === 'string' && (
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {predData}
                    </Typography>
                  )}

                  {/* Display any additional fields */}
                  {!hasScenarios && !prediction.analysis && typeof predData === 'object' && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                        Prediction Results
                      </Typography>
                      <Typography variant="body2" color="text.secondary" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {JSON.stringify(predData, null, 2)}
                      </Typography>
                    </Box>
                  )}
                </>
              );
            })()}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PricePredictionCard;
