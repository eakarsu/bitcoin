import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
  Chip,
  Stack,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  TrendingUp,
  CheckCircle,
  ShowChart,
  Timeline
} from '@mui/icons-material';
import StatsCard from '../../components/shared/StatsCard';
import SignalCard from '../../components/shared/SignalCard';
import { connectSocket, getSignals, getCurrentPrices } from '../../services/api';
import PriceChart from '../../components/Charts/PriceChart';
import CandlestickChart from '../../components/Charts/CandlestickChart';
import TechnicalIndicatorsChart from '../../components/Charts/TechnicalIndicatorsChart';
import VolumeAnalysisChart from '../../components/Charts/VolumeAnalysisChart';
import MovingAveragesChart from '../../components/Charts/MovingAveragesChart';
import BollingerBandsChart from '../../components/Charts/BollingerBandsChart';
import MarketDepthChart from '../../components/Charts/MarketDepthChart';
import { AIChatFab } from '../../components/AI/AIChatAssistant';
import MarketSentimentCard from '../../components/AI/MarketSentimentCard';
import SignalExplanationDialog from '../../components/AI/SignalExplanationDialog';
import PricePredictionCard from '../../components/AI/PricePredictionCard';

const SignalStreamDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState([]);
  const [filteredSignals, setFilteredSignals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterTimeframe, setFilterTimeframe] = useState('ALL');
  const [tabValue, setTabValue] = useState(0);
  const [priceData, setPriceData] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [signalDialogOpen, setSignalDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch signals and prices from backend
        const [signalsRes, pricesRes] = await Promise.all([
          getSignals(),
          getCurrentPrices()
        ]);

        // Convert signals to expected format
        const formattedSignals = signalsRes.map(signal => ({
          id: signal.id,
          pair: signal.pair,
          type: signal.type,
          strength: signal.strength,
          confidence: signal.confidence,
          price: signal.price,
          targetPrice: signal.target_price,
          stopLoss: signal.stop_loss,
          timeframe: signal.timeframe,
          timestamp: signal.created_at,
          indicators: signal.indicators
        }));

        setSignals(formattedSignals);

        // Convert prices array to object
        const pricesMap = {};
        pricesRes.forEach(p => {
          pricesMap[p.symbol] = p;
        });
        setCurrentPrices(pricesMap);

        // Initialize price chart with BTC data
        const btcPrice = pricesMap['BTC/USDT']?.price || 100000;
        const initialData = [];
        for (let i = 29; i >= 0; i--) {
          const timestamp = new Date();
          timestamp.setMinutes(timestamp.getMinutes() - i * 2);
          initialData.push({
            date: timestamp.toISOString(),
            price: btcPrice * (1 + (Math.random() - 0.5) * 0.01),
            volume: Math.random() * 1000000000 + 500000000
          });
        }
        setPriceData(initialData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();

    // Connect to WebSocket for real-time signal updates
    const socket = connectSocket();

    socket.on('new-signal', (newSignal) => {
      const formattedSignal = {
        id: newSignal.id || Date.now(),
        pair: newSignal.pair,
        type: newSignal.type,
        strength: newSignal.strength,
        confidence: newSignal.confidence,
        price: newSignal.price,
        targetPrice: newSignal.target_price,
        stopLoss: newSignal.stop_loss,
        timeframe: newSignal.timeframe,
        timestamp: newSignal.created_at || new Date().toISOString(),
        indicators: newSignal.indicators
      };

      setSignals(prev => [formattedSignal, ...prev].slice(0, 50));
    });

    socket.on('prices-batch', (prices) => {
      const pricesMap = {};
      prices.forEach(p => {
        pricesMap[p.symbol] = p;
      });
      setCurrentPrices(pricesMap);

      // Update price chart with BTC data
      const btcPrice = pricesMap['BTC/USDT'];
      if (btcPrice) {
        setPriceData(prev => {
          const newData = [...prev, {
            date: new Date().toISOString(),
            price: btcPrice.price,
            volume: btcPrice.volume
          }];
          return newData.slice(-30);
        });
      }
    });

    return () => {
      if (socket) {
        socket.off('new-signal');
        socket.off('prices-batch');
      }
    };
  }, []);

  useEffect(() => {
    let filtered = signals;

    // Remove duplicates - keep only the latest signal per pair (regardless of type)
    const uniqueSignals = [];
    const seen = new Set();

    filtered.forEach(signal => {
      const key = signal.pair; // Only use pair, not type
      if (!seen.has(key)) {
        seen.add(key);
        uniqueSignals.push(signal);
      }
    });

    filtered = uniqueSignals;

    // Filter by signal type
    if (filterType !== 'ALL') {
      filtered = filtered.filter(s => s.type === filterType);
    }

    // Filter by timeframe
    if (filterTimeframe !== 'ALL') {
      filtered = filtered.filter(s => s.timeframe === filterTimeframe);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.pair.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tab
    if (tabValue === 1) {
      // Active signals - last 24 hours
      filtered = filtered.filter(s => {
        const age = Date.now() - new Date(s.timestamp).getTime();
        return age < 24 * 60 * 60 * 1000;
      });
    }

    setFilteredSignals(filtered);
  }, [signals, searchTerm, filterType, filterTimeframe, tabValue]);

  // Calculate stats
  const stats = {
    totalSignals: signals.length,
    buySignals: signals.filter(s => s.type === 'BUY').length,
    sellSignals: signals.filter(s => s.type === 'SELL').length,
    avgConfidence: (signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length || 0).toFixed(1),
    highConfidence: signals.filter(s => s.confidence > 80).length
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header Section */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography
          variant="h3"
          gutterBottom
          fontWeight="700"
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Trading Signals Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
          AI-powered real-time trading signals with advanced technical analysis
        </Typography>
      </Box>

      {/* AI Insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <MarketSentimentCard />
        </Grid>
        <Grid item xs={12} md={6}>
          <PricePredictionCard currentPrices={currentPrices} />
        </Grid>
      </Grid>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Signals Today"
            value={stats.totalSignals}
            icon={Timeline}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Buy Signals"
            value={stats.buySignals}
            icon={TrendingUp}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Average Confidence"
            value={`${stats.avgConfidence}%`}
            icon={CheckCircle}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="High Confidence"
            value={stats.highConfidence}
            icon={ShowChart}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Advanced Market Chart with Coin Selection */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <CandlestickChart currentPrices={currentPrices} height={450} />
        </Grid>
      </Grid>

      {/* Technical Indicators */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <TechnicalIndicatorsChart currentPrices={currentPrices} height={400} />
        </Grid>
      </Grid>

      {/* Advanced Technical Analysis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <MovingAveragesChart currentPrices={currentPrices} height={400} />
        </Grid>
        <Grid item xs={12} md={6}>
          <BollingerBandsChart currentPrices={currentPrices} height={400} />
        </Grid>
      </Grid>

      {/* Volume & Market Depth */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <VolumeAnalysisChart currentPrices={currentPrices} height={350} />
        </Grid>
        <Grid item xs={12} md={6}>
          <MarketDepthChart currentPrices={currentPrices} height={350} />
        </Grid>
      </Grid>

      {/* Filters and Tabs */}
      <Card
        sx={{
          mb: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 3,
          overflow: 'visible'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2.5} alignItems="stretch">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Search by trading pair..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                select
                fullWidth
                size="medium"
                label="Signal Type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                  }
                }}
              >
                <MenuItem value="ALL">All Types</MenuItem>
                <MenuItem value="BUY">Buy Signals</MenuItem>
                <MenuItem value="SELL">Sell Signals</MenuItem>
                <MenuItem value="HOLD">Hold Signals</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2.5}>
              <TextField
                select
                fullWidth
                size="medium"
                label="Timeframe"
                value={filterTimeframe}
                onChange={(e) => setFilterTimeframe(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'grey.50'
                  }
                }}
              >
                <MenuItem value="ALL">All Timeframes</MenuItem>
                <MenuItem value="1H">1 Hour</MenuItem>
                <MenuItem value="4H">4 Hours</MenuItem>
                <MenuItem value="1D">1 Day</MenuItem>
                <MenuItem value="1W">1 Week</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('ALL');
                  setFilterTimeframe('ALL');
                }}
                sx={{
                  height: '56px',
                  borderRadius: 2,
                  borderWidth: 2,
                  fontWeight: 600,
                  '&:hover': {
                    borderWidth: 2
                  }
                }}
              >
                Clear All Filters
              </Button>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, borderBottom: 2, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  minHeight: 48
                }
              }}
            >
              <Tab label={`All Signals (${signals.length})`} />
              <Tab label={`Active Last 24h`} />
            </Tabs>
          </Box>
        </CardContent>
      </Card>

      {/* Signal Cards Grid */}
      {filteredSignals.length > 0 ? (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {filteredSignals.map((signal) => (
            <Grid item xs={12} sm={6} lg={4} key={signal.id}>
              <Box
                onClick={() => {
                  setSelectedSignal(signal);
                  setSignalDialogOpen(true);
                }}
                sx={{ cursor: 'pointer' }}
              >
                <SignalCard signal={signal} />
              </Box>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card
          sx={{
            mb: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: 3
          }}
        >
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <ShowChart sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom fontWeight="600">
                No signals found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '400px', mx: 'auto' }}>
                Try adjusting your filters or wait for new signals to be generated
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Subscription Prompt */}
      <Card
        sx={{
          mt: 6,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 10px 40px rgba(102, 126, 234, 0.3)',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <Box sx={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" gutterBottom fontWeight="700" sx={{ mb: 2 }}>
              Unlock Premium Features
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.95, maxWidth: '600px', mx: 'auto', fontWeight: 400 }}>
              Get unlimited signals, real-time API access, advanced analytics, and priority support
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: '#667eea',
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 3,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              View Pricing Plans
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* AI Chat Assistant FAB */}
      <AIChatFab context={{ prices: currentPrices }} />

      {/* AI Signal Explanation Dialog */}
      <SignalExplanationDialog
        open={signalDialogOpen}
        onClose={() => setSignalDialogOpen(false)}
        signal={selectedSignal}
      />
    </Container>
  );
};

export default SignalStreamDashboard;
