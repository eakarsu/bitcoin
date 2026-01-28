import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { TRADING_PAIRS } from '../../constants/coins';

const TechnicalIndicatorsChart = ({ currentPrices, height = 400 }) => {
  const [selectedCoin, setSelectedCoin] = useState('BTC/USDT');
  const [chartData, setChartData] = useState([]);

  const coins = TRADING_PAIRS;
  useEffect(() => {
    // Generate technical indicator data based on selected coin
    const generateIndicatorData = () => {
      const indicatorData = [];
      const periods = 30;
      const currentPrice = currentPrices?.[selectedCoin]?.price || 100000;

      // Base RSI and MACD values on price volatility
      const priceScale = currentPrice / 100000; // Normalize to BTC price

      for (let i = 0; i < periods; i++) {
        const date = new Date();
        date.setHours(date.getHours() - (periods - i));

        // Generate realistic RSI (0-100 scale) with trend
        const trend = i / periods; // Upward trend over time
        const rsi = 35 + trend * 30 + (Math.random() - 0.5) * 15; // Oscillates between 30-70

        // Generate MACD based on price scale
        const macdScale = Math.log10(currentPrice) * 10;
        const macd = (Math.random() - 0.5) * macdScale * (1 + trend);
        const signal = macd * 0.85 + (Math.random() - 0.5) * 5;
        const histogram = macd - signal;

        indicatorData.push({
          date: date.toISOString(),
          rsi: Math.max(0, Math.min(100, rsi)),
          macd: parseFloat(macd.toFixed(2)),
          signal: parseFloat(signal.toFixed(2)),
          histogram: Math.abs(histogram),
          histogramPositive: histogram > 0
        });
      }

      return indicatorData;
    };

    setChartData(generateIndicatorData());
  }, [selectedCoin, currentPrices]);

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MM/dd HH:mm');
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 2,
            border: 2,
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {format(new Date(payload[0].payload.date), 'MMM dd, HH:mm')}
          </Typography>
          <Typography variant="body2" color="warning.main">
            RSI: {payload[0].payload.rsi.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="primary.main">
            MACD: {payload[0].payload.macd.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="success.main">
            Signal: {payload[0].payload.signal.toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Histogram: {(payload[0].payload.macd - payload[0].payload.signal).toFixed(2)}
          </Typography>
        </Box>
      );
    }
    return null;
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6" fontWeight="700">
            Technical Indicators - RSI & MACD
          </Typography>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Coin</InputLabel>
            <Select
              value={selectedCoin}
              label="Coin"
              onChange={(e) => setSelectedCoin(e.target.value)}
            >
              {coins.map(coin => (
                <MenuItem key={`ti-${coin}`} value={coin}>{coin}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* RSI Chart */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            RSI (Relative Strength Index)
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRSI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffa726" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ffa726" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666"
                style={{ fontSize: '10px' }}
              />
              <YAxis
                domain={[0, 100]}
                stroke="#666"
                style={{ fontSize: '11px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={70} stroke="#f44336" strokeDasharray="3 3" label="Overbought" />
              <ReferenceLine y={30} stroke="#4caf50" strokeDasharray="3 3" label="Oversold" />
              <Area
                type="monotone"
                dataKey="rsi"
                stroke="#ffa726"
                strokeWidth={2}
                fill="url(#colorRSI)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>

        {/* MACD Chart */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            MACD (Moving Average Convergence Divergence)
          </Typography>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                stroke="#666"
                style={{ fontSize: '10px' }}
              />
              <YAxis
                stroke="#666"
                style={{ fontSize: '11px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="#666" />
              <Line
                type="monotone"
                dataKey="macd"
                stroke="#1976d2"
                strokeWidth={2}
                dot={false}
                name="MACD"
              />
              <Line
                type="monotone"
                dataKey="signal"
                stroke="#4caf50"
                strokeWidth={2}
                dot={false}
                name="Signal"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TechnicalIndicatorsChart;
