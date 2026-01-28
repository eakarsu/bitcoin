import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Alert,
  Grid,
  Chip
} from '@mui/material';
import { CheckCircle, TrendingUp, TrendingDown } from '@mui/icons-material';
import { getPredictionStats } from '../../services/enhancementsApi';

export default function PerformanceMetricsCard() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getPredictionStats('30d');
      setStats(data.stats || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching prediction stats:', err);
      setError('Failed to load AI performance metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Performance Metrics
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Performance Metrics
          </Typography>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AI Performance Metrics (Last 30 Days)
        </Typography>

        {stats.length === 0 ? (
          <Alert severity="info">No performance data available yet</Alert>
        ) : (
          <Grid container spacing={2}>
            {stats.map((stat) => (
              <Grid item xs={12} md={6} key={stat.predictionType}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    {stat.predictionType.replace('_', ' ').toUpperCase()}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Accuracy
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.avgAccuracy}%
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Success Rate
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.accuracyRate}%
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Total Predictions
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.totalPredictions}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Verified
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.verifiedCount}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Avg Error Margin
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.avgErrorMargin}%
                    </Typography>
                  </Box>

                  <Box mt={2}>
                    <Chip
                      label={parseFloat(stat.avgAccuracy) >= 70 ? 'High Performance' : 'Needs Improvement'}
                      color={parseFloat(stat.avgAccuracy) >= 70 ? 'success' : 'warning'}
                      size="small"
                      icon={parseFloat(stat.avgAccuracy) >= 70 ? <TrendingUp /> : <TrendingDown />}
                    />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
