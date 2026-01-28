import { Box, Container, Grid, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import PerformanceMetricsCard from '../../components/AI/PerformanceMetricsCard';
import RecommendationHistoryCard from '../../components/AI/RecommendationHistoryCard';
import WhaleActivityCard from '../../components/AI/WhaleActivityCard';
import TradingBotsCard from '../../components/AI/TradingBotsCard';
import MarketSentimentCard from '../../components/AI/MarketSentimentCard';
import PricePredictionCard from '../../components/AI/PricePredictionCard';

export default function AIAnalyticsDashboard() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" fontWeight="bold">
            🤖 AI Analytics & Automation
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph>
          Comprehensive AI-powered analytics, performance tracking, and automated trading management.
        </Typography>

        <Grid container spacing={3}>
          {/* AI Performance Metrics */}
          <Grid item xs={12}>
            <PerformanceMetricsCard />
          </Grid>

          {/* Trading Bots Management */}
          <Grid item xs={12}>
            <TradingBotsCard />
          </Grid>

          {/* Current AI Features */}
          <Grid item xs={12} md={6}>
            <MarketSentimentCard />
          </Grid>

          <Grid item xs={12} md={6}>
            <PricePredictionCard />
          </Grid>

          {/* Whale Activity */}
          <Grid item xs={12} md={6}>
            <WhaleActivityCard />
          </Grid>

          {/* Recommendation History */}
          <Grid item xs={12} md={6}>
            <RecommendationHistoryCard />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
