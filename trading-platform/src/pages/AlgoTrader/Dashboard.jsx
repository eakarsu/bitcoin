import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  ShowChart,
  Speed,
  PlayArrow,
  Pause,
  Refresh
} from '@mui/icons-material';
import StatsCard from '../../components/shared/StatsCard';
import PriceChart from '../../components/Charts/PriceChart';
import AssetAllocationChart from '../../components/Charts/AssetAllocationChart';
import PortfolioPerformanceChart from '../../components/Charts/PortfolioPerformanceChart';
import CandlestickChart from '../../components/Charts/CandlestickChart';
import StrategyComparisonChart from '../../components/Charts/StrategyComparisonChart';
import TechnicalIndicatorsChart from '../../components/Charts/TechnicalIndicatorsChart';
import VolumeAnalysisChart from '../../components/Charts/VolumeAnalysisChart';
import MovingAveragesChart from '../../components/Charts/MovingAveragesChart';
import BollingerBandsChart from '../../components/Charts/BollingerBandsChart';
import TradeHistoryChart from '../../components/Charts/TradeHistoryChart';
import MarketDepthChart from '../../components/Charts/MarketDepthChart';
import { AIChatFab } from '../../components/AI/AIChatAssistant';
import MarketSentimentCard from '../../components/AI/MarketSentimentCard';
import PortfolioRecommendationsCard from '../../components/AI/PortfolioRecommendationsCard';
import PricePredictionCard from '../../components/AI/PricePredictionCard';
import StrategyGeneratorDialog from '../../components/AI/StrategyGeneratorDialog';
import { connectSocket, getPortfolio, getPositions, getStrategies, getCurrentPrices } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';

const AlgoTraderDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [priceData, setPriceData] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [positions, setPositions] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [currentPrices, setCurrentPrices] = useState({});
  const [strategyDialogOpen, setStrategyDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch initial data
        const [portfolioRes, positionsRes, strategiesRes, pricesRes] = await Promise.all([
          getPortfolio(),
          getPositions(),
          getStrategies(),
          getCurrentPrices()
        ]);

        setPortfolio(portfolioRes);
        setPositions(positionsRes);
        setStrategies(strategiesRes);

        // Convert prices array to object for easy lookup
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

    // Connect to WebSocket for real-time updates
    const socket = connectSocket();

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
        socket.off('prices-batch');
      }
    };
  }, []);

  const handleStrategyToggle = (id) => {
    setStrategies(prev =>
      prev.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s)
    );
  };

  const handleRefresh = async () => {
    try {
      const [portfolioRes, positionsRes, strategiesRes] = await Promise.all([
        getPortfolio(),
        getPositions(),
        getStrategies()
      ]);
      setPortfolio(portfolioRes);
      setPositions(positionsRes);
      setStrategies(strategiesRes);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Calculate updated position values with real-time prices
  const updatedPositions = positions.map(pos => {
    const currentPrice = currentPrices[pos.symbol]?.price || pos.current_price;
    const value = pos.quantity * currentPrice;
    const pnl = value - (pos.quantity * pos.avg_price);
    const pnlPercent = ((currentPrice - pos.avg_price) / pos.avg_price * 100).toFixed(2);

    return {
      ...pos,
      currentPrice,
      value,
      pnl,
      pnlPercent: parseFloat(pnlPercent)
    };
  });

  // Calculate portfolio totals
  const totalValue = updatedPositions.reduce((sum, pos) => sum + pos.value, 0);
  const totalPnL = updatedPositions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPnLPercent = portfolio ? ((totalValue - (portfolio.total_value - portfolio.total_pnl)) / (portfolio.total_value - portfolio.total_pnl) * 100).toFixed(2) : 0;

  // Mock performance data (can be fetched from backend later)
  const performanceMetrics = [
    { month: 'Jan', profit: 45000 },
    { month: 'Feb', profit: 38000 },
    { month: 'Mar', profit: 52000 },
    { month: 'Apr', profit: 61000 },
    { month: 'May', profit: 55000 },
    { month: 'Jun', profit: 70000 }
  ];

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
            background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2
          }}
        >
          Algorithmic Trading Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '800px', mx: 'auto' }}>
          Real-time portfolio monitoring, strategy management, and performance analytics
        </Typography>
      </Box>

      {/* AI Strategy Generator Button */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<ShowChart />}
          onClick={() => setStrategyDialogOpen(true)}
          sx={{ fontWeight: 600 }}
        >
          Generate AI Strategy
        </Button>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Portfolio Value"
            value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            change={portfolio?.day_pnl || 0}
            changePercent={portfolio?.day_pnl_percent || 0}
            icon={AccountBalance}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total P&L"
            value={`$${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            changePercent={parseFloat(totalPnLPercent)}
            icon={TrendingUp}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Strategies"
            value={strategies.filter(s => s.status === 'active').length}
            icon={Speed}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="BTC Price"
            value={`$${(currentPrices['BTC/USDT']?.price || 100000).toLocaleString()}`}
            changePercent={currentPrices['BTC/USDT']?.change24h || 0}
            icon={ShowChart}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Advanced Price Chart with Coin Selection */}
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

      {/* AI Insights */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <MarketSentimentCard />
        </Grid>
        <Grid item xs={12} md={6}>
          <PricePredictionCard currentPrices={currentPrices} />
        </Grid>
      </Grid>

      {/* Portfolio Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <PortfolioPerformanceChart
            data={priceData.map((item, index) => ({
              date: item.date,
              value: totalValue > 0 ? totalValue * (0.95 + (index / priceData.length) * 0.1) : 1000000,
              pnl: totalPnL > 0 ? totalPnL * (index / priceData.length) : 0
            }))}
            height={400}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          {updatedPositions.length > 0 && (
            <AssetAllocationChart positions={updatedPositions} height={350} />
          )}
        </Grid>
      </Grid>

      {/* AI Portfolio Recommendations */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <PortfolioRecommendationsCard portfolio={portfolio} />
        </Grid>
      </Grid>

      {/* Strategy Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          {strategies.length > 0 && (
            <StrategyComparisonChart strategies={strategies} height={350} />
          )}
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

      {/* Trade History */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <TradeHistoryChart height={350} />
        </Grid>
      </Grid>

      {/* Active Strategies Table */}
      <Card
        sx={{
          mb: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              Active Trading Strategies
            </Typography>
            <Tooltip title="Refresh strategies">
              <IconButton size="small" onClick={handleRefresh}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Strategy</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>P&L</strong></TableCell>
                  <TableCell align="right"><strong>Sharpe</strong></TableCell>
                  <TableCell align="right"><strong>Win Rate</strong></TableCell>
                  <TableCell align="right"><strong>Trades</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {strategies.length > 0 ? strategies.map((strategy) => (
                  <TableRow key={strategy.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {strategy.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {strategy.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={strategy.status}
                        color={strategy.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={strategy.pnl > 0 ? 'success.main' : 'error.main'}
                      >
                        ${parseFloat(strategy.pnl).toLocaleString()} ({strategy.pnl_percent > 0 ? '+' : ''}{strategy.pnl_percent}%)
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {strategy.sharpe_ratio}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {strategy.win_rate}%
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {strategy.trades_count}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={strategy.status === 'active' ? 'Pause' : 'Resume'}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleStrategyToggle(strategy.id)}
                        >
                          {strategy.status === 'active' ? <Pause /> : <PlayArrow />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No strategies found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Portfolio Positions */}
      <Card
        sx={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Open Positions
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Asset</strong></TableCell>
                  <TableCell align="right"><strong>Quantity</strong></TableCell>
                  <TableCell align="right"><strong>Avg Price</strong></TableCell>
                  <TableCell align="right"><strong>Current Price</strong></TableCell>
                  <TableCell align="right"><strong>Value</strong></TableCell>
                  <TableCell align="right"><strong>P&L</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {updatedPositions.length > 0 ? updatedPositions.map((position, index) => (
                  <TableRow key={`position-${index}-${position.symbol}`} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {position.symbol}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {position.quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        ${parseFloat(position.avg_price).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium" color="primary.main">
                        ${parseFloat(position.currentPrice).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        ${position.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={position.pnl > 0 ? 'success.main' : 'error.main'}
                      >
                        ${position.pnl.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({position.pnlPercent > 0 ? '+' : ''}{position.pnlPercent}%)
                      </Typography>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No positions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* AI Chat Assistant FAB */}
      <AIChatFab context={{ prices: currentPrices, portfolio }} />

      {/* AI Strategy Generator Dialog */}
      <StrategyGeneratorDialog
        open={strategyDialogOpen}
        onClose={() => setStrategyDialogOpen(false)}
      />
    </Container>
  );
};

export default AlgoTraderDashboard;
