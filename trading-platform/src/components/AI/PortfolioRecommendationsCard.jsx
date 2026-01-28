import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Psychology as AIIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle,
  Warning,
  TrendingUp,
  FiberManualRecord as BulletIcon,
  AddCircleOutline as AddIcon,
  Task as TaskIcon,
  TrendingDown as RiskIcon
} from '@mui/icons-material';
import { getPortfolioRecommendations } from '../../services/aiApi';

const PortfolioRecommendationsCard = ({ portfolio }) => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    if (!portfolio) {
      setError('No portfolio data available');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching recommendations for portfolio:', portfolio);
      const data = await getPortfolioRecommendations(portfolio);
      console.log('Received recommendations:', data);
      setRecommendations(data);
    } catch (err) {
      console.error('Recommendations Error:', err);
      setError(`Failed to get AI recommendations: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (portfolio) {
      fetchRecommendations();
    }
  }, [portfolio]);

  const getHealthColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Card
        sx={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
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
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Alert severity="error" action={
            <Button size="small" onClick={fetchRecommendations}>Retry</Button>
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
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6" fontWeight="700">
              AI Portfolio Recommendations
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={fetchRecommendations}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

{recommendations && (
          <>
            {/* Portfolio Health Score */}
            {recommendations.portfolio_analysis?.health_score !== undefined && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Portfolio Health Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={recommendations.portfolio_analysis.health_score}
                    color={getHealthColor(recommendations.portfolio_analysis.health_score)}
                    sx={{ flex: 1, height: 10, borderRadius: 1 }}
                  />
                  <Chip
                    label={`${recommendations.portfolio_analysis.health_score}/100`}
                    color={getHealthColor(recommendations.portfolio_analysis.health_score)}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>
            )}

            {/* Concerns */}
            {recommendations.key_observations?.concerns && recommendations.key_observations.concerns.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="warning" fontSize="small" />
                    <Typography fontWeight="600">Portfolio Concerns</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {recommendations.key_observations.concerns.map((concern, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <BulletIcon sx={{ fontSize: 10, color: 'warning.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={concern}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Strengths */}
            {recommendations.key_observations?.strengths && recommendations.key_observations.strengths.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography fontWeight="600">Portfolio Strengths</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {recommendations.key_observations.strengths.map((strength, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <BulletIcon sx={{ fontSize: 10, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={strength}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Risk Assessment */}
            {recommendations.risk_assessment && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RiskIcon color="error" fontSize="small" />
                    <Typography fontWeight="600">Risk Assessment</Typography>
                    {recommendations.risk_assessment.risk_score && (
                      <Chip
                        label={`${recommendations.risk_assessment.risk_score}/100`}
                        size="small"
                        color={getHealthColor(100 - recommendations.risk_assessment.risk_score)}
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {recommendations.risk_assessment.risk_score !== undefined && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                        Risk Level
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={recommendations.risk_assessment.risk_score}
                        color={getHealthColor(100 - recommendations.risk_assessment.risk_score)}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  )}
                  {typeof recommendations.risk_assessment === 'object' && (
                    <Box>
                      {Object.entries(recommendations.risk_assessment).map(([key, value]) => {
                        if (key === 'risk_score') return null;
                        return (
                          <Box key={key} sx={{ mb: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {key.replace(/_/g, ' ')}:
                            </Typography>
                            <Typography variant="body2">
                              {Array.isArray(value) ? (
                                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                                  {value.map((item, idx) => (
                                    <li key={idx}>{String(item)}</li>
                                  ))}
                                </ul>
                              ) : typeof value === 'object' ? (
                                <Box component="span" sx={{ display: 'block', pl: 1 }}>
                                  {Object.entries(value).map(([k, v]) => (
                                    <Typography key={k} variant="caption" display="block">
                                      • {k.replace(/_/g, ' ')}: {String(v)}
                                    </Typography>
                                  ))}
                                </Box>
                              ) : (
                                String(value)
                              )}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Priority Actions */}
            {recommendations.recommendations?.priority_actions && recommendations.recommendations.priority_actions.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp color="primary" fontSize="small" />
                    <Typography fontWeight="600">Priority Actions</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {recommendations.recommendations.priority_actions.map((action, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <BulletIcon sx={{ fontSize: 10, color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={action}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Suggested Allocations */}
            {recommendations.recommendations?.suggested_allocations && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp color="success" fontSize="small" />
                    <Typography fontWeight="600">Suggested Allocations</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {Object.entries(recommendations.recommendations.suggested_allocations).map(([category, value]) => {
                      // Handle both string values ("40%") and object values
                      let displayValue, numericValue;

                      if (typeof value === 'object' && !Array.isArray(value)) {
                        // If it's an object with percentage property
                        displayValue = value.percentage || value.target || Object.values(value)[0] || '0%';
                        numericValue = parseInt(String(displayValue));
                      } else if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                        numericValue = 50;
                      } else {
                        displayValue = value;
                        numericValue = typeof value === 'string' ? parseInt(value) : (typeof value === 'number' ? value : 50);
                      }

                      return (
                        <Box key={category} sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {category.replace(/_/g, ' ')}
                            </Typography>
                            <Chip label={String(displayValue)} size="small" color="primary" variant="outlined" />
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={numericValue}
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Coins to Consider Adding */}
            {recommendations.recommendations?.coins_to_consider_adding && recommendations.recommendations.coins_to_consider_adding.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon color="success" fontSize="small" />
                    <Typography fontWeight="600">Coins to Consider Adding</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {recommendations.recommendations.coins_to_consider_adding.map((coin, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="600">
                          {coin.name}
                        </Typography>
                        <Chip label={coin.symbol} size="small" color="primary" variant="outlined" />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {coin.rationale}
                      </Typography>
                      {coin.allocation && (
                        <Chip label={`Suggested: ${coin.allocation}`} size="small" />
                      )}
                    </Paper>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Risk Management */}
            {recommendations.recommendations?.risk_management && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <RiskIcon color="error" fontSize="small" />
                    <Typography fontWeight="600">Risk Management Guidelines</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    {Object.entries(recommendations.recommendations.risk_management).map(([key, value]) => (
                      <Box key={key} sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize', display: 'block' }}>
                          {key.replace(/_/g, ' ')}
                        </Typography>
                        <Typography variant="body2" fontWeight="500">
                          {Array.isArray(value) ? (
                            <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                              {value.map((item, idx) => (
                                <li key={idx}>{String(item)}</li>
                              ))}
                            </ul>
                          ) : typeof value === 'object' ? (
                            <Box component="span" sx={{ display: 'block', pl: 1 }}>
                              {Object.entries(value).map(([k, v]) => (
                                <Typography key={k} variant="body2" display="block">
                                  • {k.replace(/_/g, ' ')}: {String(v)}
                                </Typography>
                              ))}
                            </Box>
                          ) : (
                            String(value)
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Action Items */}
            {recommendations.action_items && recommendations.action_items.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TaskIcon color="success" fontSize="small" />
                    <Typography fontWeight="600">Action Items</Typography>
                    <Chip label={recommendations.action_items.length} size="small" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {recommendations.action_items.map((item, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Market Outlook */}
            {recommendations.market_outlook && (
              <Box sx={{ mt: 2 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    bgcolor: 'primary.50'
                  }}
                >
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUp fontSize="small" />
                    Market Outlook
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recommendations.market_outlook}
                  </Typography>
                </Paper>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioRecommendationsCard;
