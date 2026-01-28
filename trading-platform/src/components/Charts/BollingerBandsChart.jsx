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
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { TRADING_PAIRS } from '../../constants/coins';

const BollingerBandsChart = ({ currentPrices, height = 400 }) => {
  const [selectedCoin, setSelectedCoin] = useState('BTC/USDT');
  const [chartData, setChartData] = useState([]);

  const coins = TRADING_PAIRS;

  useEffect(() => {
    const generateBBData = () => {
      const data = [];
      const periods = 40;
      const currentPrice = currentPrices?.[selectedCoin]?.price || 100000;
      const bbPeriod = 20;
      const stdDevMultiplier = 2;

      // Generate price data first
      const prices = [];
      let price = currentPrice * 0.96;
      for (let i = 0; i < periods; i++) {
        const change = (Math.random() - 0.48) * 0.02;
        price = price * (1 + change);
        prices.push(price);
      }

      // Calculate Bollinger Bands
      for (let i = 0; i < periods; i++) {
        const date = new Date();
        date.setHours(date.getHours() - (periods - i));

        let middleBand = null;
        let upperBand = null;
        let lowerBand = null;

        if (i >= bbPeriod - 1) {
          // Calculate SMA (Middle Band)
          const slice = prices.slice(i - bbPeriod + 1, i + 1);
          const sma = slice.reduce((a, b) => a + b, 0) / bbPeriod;

          // Calculate Standard Deviation
          const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
          const variance = squaredDiffs.reduce((a, b) => a + b, 0) / bbPeriod;
          const stdDev = Math.sqrt(variance);

          middleBand = sma;
          upperBand = sma + (stdDevMultiplier * stdDev);
          lowerBand = sma - (stdDevMultiplier * stdDev);
        }

        data.push({
          date: date.toISOString(),
          price: parseFloat(prices[i].toFixed(2)),
          middleBand: middleBand ? parseFloat(middleBand.toFixed(2)) : null,
          upperBand: upperBand ? parseFloat(upperBand.toFixed(2)) : null,
          lowerBand: lowerBand ? parseFloat(lowerBand.toFixed(2)) : null,
          bandwidth: upperBand && lowerBand ? parseFloat(((upperBand - lowerBand) / middleBand * 100).toFixed(2)) : null
        });
      }

      return data;
    };

    setChartData(generateBBData());
  }, [selectedCoin, currentPrices]);

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MM/dd HH:mm');
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
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 2,
            border: 2,
            borderColor: 'divider',
            borderRadius: 2,
            boxShadow: 3,
            minWidth: 220
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {format(new Date(data.date), 'MMM dd, HH:mm')}
          </Typography>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
            Price: ${data.price?.toLocaleString()}
          </Typography>
          {data.upperBand && (
            <>
              <Typography variant="body2" color="error.main">
                Upper Band: ${data.upperBand.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="primary.main">
                Middle Band (SMA20): ${data.middleBand.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="success.main">
                Lower Band: ${data.lowerBand.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Bandwidth: {data.bandwidth}%
              </Typography>
            </>
          )}
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
            Bollinger Bands (20, 2)
          </Typography>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Coin</InputLabel>
            <Select
              value={selectedCoin}
              label="Coin"
              onChange={(e) => setSelectedCoin(e.target.value)}
            >
              {coins.map(coin => (
                <MenuItem key={`bb-${coin}`} value={coin}>{coin}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#1976d2" stopOpacity={0.05} />
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
              tickFormatter={formatPrice}
              stroke="#666"
              style={{ fontSize: '11px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="upperBand"
              stroke="transparent"
              fill="url(#colorBB)"
              fillOpacity={0.3}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="lowerBand"
              stroke="transparent"
              fill="url(#colorBB)"
              fillOpacity={0.3}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="upperBand"
              stroke="#f44336"
              strokeWidth={2}
              dot={false}
              name="Upper Band"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="middleBand"
              stroke="#1976d2"
              strokeWidth={2}
              dot={false}
              name="Middle Band (SMA20)"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="lowerBand"
              stroke="#4caf50"
              strokeWidth={2}
              dot={false}
              name="Lower Band"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#ff9800"
              strokeWidth={3}
              dot={false}
              name="Price"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BollingerBandsChart;
