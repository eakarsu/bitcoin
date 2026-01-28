import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, ToggleButtonGroup, ToggleButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
  ComposedChart,
  Line,
  Bar,
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

const CandlestickChart = ({ currentPrices, height = 450 }) => {
  const [selectedCoin, setSelectedCoin] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1H');
  const [chartData, setChartData] = useState([]);

  const coins = TRADING_PAIRS;
  const timeframes = ['15M', '1H', '4H', '1D', '1W'];

  useEffect(() => {
    // Generate mock OHLC data based on current price
    const generateOHLCData = () => {
      const currentPrice = currentPrices[selectedCoin]?.price || 100000;
      const data = [];
      const periods = timeframe === '15M' ? 96 : timeframe === '1H' ? 48 : timeframe === '4H' ? 30 : timeframe === '1D' ? 30 : 12;

      let price = currentPrice * 0.95; // Start 5% lower

      for (let i = 0; i < periods; i++) {
        const change = (Math.random() - 0.5) * (currentPrice * 0.02);
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) * (1 + Math.random() * 0.01);
        const low = Math.min(open, close) * (1 - Math.random() * 0.01);
        const volume = Math.random() * 1000000 + 500000;

        const date = new Date();
        if (timeframe === '15M') date.setMinutes(date.getMinutes() - (periods - i) * 15);
        else if (timeframe === '1H') date.setHours(date.getHours() - (periods - i));
        else if (timeframe === '4H') date.setHours(date.getHours() - (periods - i) * 4);
        else if (timeframe === '1D') date.setDate(date.getDate() - (periods - i));
        else date.setDate(date.getDate() - (periods - i) * 7);

        data.push({
          date: date.toISOString(),
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume: parseFloat(volume.toFixed(0))
        });

        price = close;
      }

      return data;
    };

    setChartData(generateOHLCData());
  }, [selectedCoin, timeframe, currentPrices]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (timeframe === '15M' || timeframe === '1H') {
      return format(date, 'HH:mm');
    } else if (timeframe === '4H') {
      return format(date, 'MM/dd HH:mm');
    }
    return format(date, 'MM/dd');
  };

  const formatPrice = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isGreen = data.close >= data.open;

      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 2,
            border: 2,
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: 3,
            minWidth: 200
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {format(new Date(data.date), 'MMM dd, yyyy HH:mm')}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Open:</Typography>
            <Typography variant="caption" fontWeight="600">${data.open.toLocaleString()}</Typography>

            <Typography variant="caption" color="text.secondary">High:</Typography>
            <Typography variant="caption" fontWeight="600" color="success.main">${data.high.toLocaleString()}</Typography>

            <Typography variant="caption" color="text.secondary">Low:</Typography>
            <Typography variant="caption" fontWeight="600" color="error.main">${data.low.toLocaleString()}</Typography>

            <Typography variant="caption" color="text.secondary">Close:</Typography>
            <Typography variant="caption" fontWeight="600" color={isGreen ? 'success.main' : 'error.main'}>
              ${data.close.toLocaleString()}
            </Typography>

            <Typography variant="caption" color="text.secondary">Volume:</Typography>
            <Typography variant="caption" fontWeight="600">${(data.volume / 1e6).toFixed(2)}M</Typography>
          </Box>
        </Box>
      );
    }
    return null;
  };

  const CandleShape = (props) => {
    const { x, y, width, height, payload } = props;
    const isGreen = payload.close >= payload.open;
    const color = isGreen ? '#4caf50' : '#f44336';

    const high = payload.high;
    const low = payload.low;
    const open = payload.open;
    const close = payload.close;

    // Calculate y positions
    const yScale = props.yScale;
    const highY = yScale(high);
    const lowY = yScale(low);
    const openY = yScale(open);
    const closeY = yScale(close);

    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={highY}
          x2={x + width / 2}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x}
          y={Math.min(openY, closeY)}
          width={width}
          height={Math.abs(closeY - openY) || 1}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
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
            Price Chart - {selectedCoin}
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Coin</InputLabel>
              <Select
                value={selectedCoin}
                label="Coin"
                onChange={(e) => setSelectedCoin(e.target.value)}
              >
                {coins.map(coin => (
                  <MenuItem key={`candlestick-${coin}`} value={coin}>{coin}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup
              value={timeframe}
              exclusive
              onChange={(e, newValue) => newValue && setTimeframe(newValue)}
              size="small"
            >
              {timeframes.map(tf => (
                <ToggleButton key={`candlestick-tf-${tf}`} value={tf} sx={{ px: 2 }}>
                  {tf}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              yAxisId="price"
              orientation="right"
              tickFormatter={formatPrice}
              stroke="#666"
              style={{ fontSize: '11px' }}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              tickFormatter={(value) => `${(value / 1e6).toFixed(1)}M`}
              stroke="#666"
              style={{ fontSize: '11px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill="url(#colorVolume)"
              opacity={0.3}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="high"
              stroke="transparent"
              dot={false}
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="low"
              stroke="transparent"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default CandlestickChart;
