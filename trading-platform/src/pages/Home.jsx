import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Security,
  Analytics,
  ShowChart,
  Notifications,
  ArrowForward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Algorithmic Trading',
      description: 'Advanced AI-powered trading strategies with real-time execution',
      color: 'primary'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Trading Signals',
      description: 'Get actionable trading signals with high confidence predictions',
      color: 'success'
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: 'Advanced Analytics',
      description: 'Comprehensive performance tracking and portfolio analytics',
      color: 'info'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Risk Management',
      description: 'Built-in risk controls and portfolio protection mechanisms',
      color: 'warning'
    },
    {
      icon: <ShowChart sx={{ fontSize: 40 }} />,
      title: 'Market Making',
      description: 'Automated market making with optimal spread calculation',
      color: 'error'
    },
    {
      icon: <Notifications sx={{ fontSize: 40 }} />,
      title: 'Real-time Alerts',
      description: 'Instant notifications for trade execution and signals',
      color: 'secondary'
    }
  ];

  const stats = [
    { value: '$2.5M+', label: 'Total Volume Traded' },
    { value: '10,000+', label: 'Active Users' },
    { value: '73%', label: 'Win Rate' },
    { value: '24/7', label: 'Market Monitoring' }
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: { xs: 8, md: 12 }
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" gutterBottom fontWeight="bold">
                AI-Powered Trading Platform
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                Automate your trading with advanced algorithms and real-time signals
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/algotrader')}
                  sx={{
                    backgroundColor: 'white',
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    '&:hover': { backgroundColor: 'grey.100' }
                  }}
                >
                  Try AlgoTrader Pro
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/signalstream')}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  View Trading Signals
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 4,
                  p: 4
                }}
              >
                <Grid container spacing={3}>
                  {stats.map((stat, index) => (
                    <Grid item xs={6} key={index}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h3" fontWeight="bold">
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Powerful Features
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Everything you need for professional cryptocurrency trading
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 4 }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: 3,
                      backgroundColor: `${feature.color}.light`,
                      color: `${feature.color}.main`,
                      mb: 2
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Applications Section */}
      <Box sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" gutterBottom fontWeight="bold">
              Two Powerful Applications
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Choose the platform that fits your trading style
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': { transform: 'scale(1.03)', boxShadow: 8 }
                }}
                onClick={() => navigate('/algotrader')}
              >
                <CardContent sx={{ p: 4 }}>
                  <Chip label="For Institutions" color="primary" sx={{ mb: 2 }} />
                  <Typography variant="h4" gutterBottom fontWeight="bold">
                    AlgoTrader Pro
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    Professional algorithmic trading and market making platform with advanced portfolio management.
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Real-time portfolio monitoring
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Multiple trading strategies
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Market making capabilities
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Advanced risk analytics
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 3 }}
                    endIcon={<ArrowForward />}
                  >
                    Launch AlgoTrader
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': { transform: 'scale(1.03)', boxShadow: 8 }
                }}
                onClick={() => navigate('/signalstream')}
              >
                <CardContent sx={{ p: 4 }}>
                  <Chip label="For Traders" color="success" sx={{ mb: 2 }} />
                  <Typography variant="h4" gutterBottom fontWeight="bold">
                    SignalStream
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    AI-powered trading signals with real-time notifications and performance tracking.
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Real-time AI trading signals
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Multiple timeframes & assets
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Performance analytics
                    </Typography>
                    <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                      Subscription-based pricing
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    color="success"
                    sx={{ mt: 3 }}
                    endIcon={<ArrowForward />}
                  >
                    View Signals
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent sx={{ textAlign: 'center', py: 6, color: 'white' }}>
            <Typography variant="h3" gutterBottom fontWeight="bold">
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Join thousands of traders using our platform to maximize their returns
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: 'white',
                  color: 'primary.main',
                  px: 4,
                  '&:hover': { backgroundColor: 'grey.100' }
                }}
                onClick={() => navigate('/pricing')}
              >
                View Pricing
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  px: 4,
                  '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                Contact Sales
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default Home;
