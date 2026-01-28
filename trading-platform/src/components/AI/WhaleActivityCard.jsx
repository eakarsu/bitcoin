import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { Refresh, TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';
import { getWhaleActivity } from '../../services/enhancementsApi';

export default function WhaleActivityCard() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const data = await getWhaleActivity(null, 20);
      setActivity(data.activity || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching whale activity:', err);
      setError('Failed to load whale activity');
    } finally {
      setLoading(false);
    }
  };

  const getImpactIcon = (prediction) => {
    if (prediction === 'bullish') return <TrendingUp color="success" />;
    if (prediction === 'bearish') return <TrendingDown color="error" />;
    return <TrendingFlat color="action" />;
  };

  const getActivityLabel = (type) => {
    const labels = {
      large_transfer: '🔄 Transfer',
      exchange_deposit: '📥 Deposit',
      exchange_withdrawal: '📤 Withdrawal'
    };
    return labels[type] || type;
  };

  if (loading && activity.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🐋 Whale Activity
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            🐋 Whale Activity
          </Typography>
          <IconButton size="small" onClick={fetchActivity} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {activity.length === 0 ? (
          <Alert severity="info">No recent whale activity detected</Alert>
        ) : (
          <List>
            {activity.slice(0, 10).map((item, index) => (
              <Box key={item.id}>
                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                  <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getImpactIcon(item.impact_prediction)}
                      <Typography variant="subtitle2" fontWeight="bold">
                        {item.symbol}
                      </Typography>
                      <Chip label={getActivityLabel(item.activity_type)} size="small" />
                    </Box>
                    <Typography variant="h6" color="primary">
                      ${(item.amount_usd / 1000000).toFixed(2)}M
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={1}>
                    {item.from_label} → {item.to_label}
                  </Typography>

                  {item.ai_analysis && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {item.ai_analysis.substring(0, 150)}...
                    </Typography>
                  )}

                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    <Chip
                      label={item.impact_prediction}
                      size="small"
                      color={item.impact_prediction === 'bullish' ? 'success' : item.impact_prediction === 'bearish' ? 'error' : 'default'}
                      variant="outlined"
                    />
                    {item.confidence && (
                      <Chip label={`${item.confidence}% confidence`} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Typography variant="caption" color="text.secondary" mt={1}>
                    {new Date(item.detected_at).toLocaleString()}
                  </Typography>
                </ListItem>
                {index < activity.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
