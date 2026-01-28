import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { TRADING_PAIRS } from '../../constants/coins';

const MovingAveragesChart = ({ currentPrices, height = 400 }) => {
  const [selectedCoin, setSelectedCoin] = useState('BTC/USDT');
  const [chartData, setChartData] = useState([]);

  const coins = TRADING_PAIRS;

  useEffect(() => {
    const generateMAData = () => {
      const data = [];
      const periods = 50;
      const currentPrice = currentPrices?.[selectedCoin]?.price || 100000;

      // Generate price data first
      const prices = [];
      let price = currentPrice * 0.95;
      for (let i = 0; i < periods; i++) {
        const change = (Math.random() - 0.48) * 0.02;
        price = price * (1 + change);
        prices.push(price);
      }

      // Calculate moving averages
      for (let i = 0; i < periods; i++) {
        const date = new Date();
        date.setHours(date.getHours() - (periods - i));

        // Calculate SMA7
        let sma7 = null;
        if (i >= 6) {
          const sum7 = prices.slice(i - 6, i + 1).reduce((a, b) => a + b, 0);
          sma7 = sum7 / 7;
        }

        // Calculate SMA25
        let sma25 = null;
        if (i >= 24) {
          const sum25 = prices.slice(i - 24, i + 1).reduce((a, b) => a + b, 0);
          sma25 = sum25 / 25;
        }

        // Calculate EMA12
        let ema12 = null;
        if (i >= 11) {
          const multiplier = 2 / (12 + 1);
          ema12 = prices[i];
          for (let j = i - 11; j <= i; j++) {
            ema12 = (prices[j] - ema12) * multiplier + ema12;
          }
        }

        // Calculate EMA26
        let ema26 = null;
        if (i >= 25) {
          const multiplier = 2 / (26 + 1);
          ema26 = prices[i];
          for (let j = i - 25; j <= i; j++) {
            ema26 = (prices[j] - ema26) * multiplier + ema26;
          }
        }

        data.push({
          date: date.toISOString(),
          price: parseFloat(prices[i].toFixed(2)),
          sma7: sma7 ? parseFloat(sma7.toFixed(2)) : null,
          sma25: sma25 ? parseFloat(sma25.toFixed(2)) : null,
          ema12: ema12 ? parseFloat(ema12.toFixed(2)) : null,
          ema26: ema26 ? parseFloat(ema26.toFixed(2)) : null
        });
      }

      return data;
    };

    setChartData(generateMAData());
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
            minWidth: 200
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {format(new Date(data.date), 'MMM dd, HH:mm')}
          </Typography>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
            Price: ${data.price?.toLocaleString()}
          </Typography>
          {data.sma7 && (
            <Typography variant="body2" color="primary.main">
              SMA(7): ${data.sma7.toLocaleString()}
            </Typography>
          )}
          {data.sma25 && (
            <Typography variant="body2" color="secondary.main">
              SMA(25): ${data.sma25.toLocaleString()}
            </Typography>
          )}
          {data.ema12 && (
            <Typography variant="body2" color="success.main">
              EMA(12): ${data.ema12.toLocaleString()}
            </Typography>
          )}
          {data.ema26 && (
            <Typography variant="body2" color="warning.main">
              EMA(26): ${data.ema26.toLocaleString()}
            </Typography>
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
            Moving Averages (SMA & EMA)
          </Typography>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Coin</InputLabel>
            <Select
              value={selectedCoin}
              label="Coin"
              onChange={(e) => setSelectedCoin(e.target.value)}
            >
              {coins.map(coin => (
                <MenuItem key={`ma-${coin}`} value={coin}>{coin}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            <Line
              type="monotone"
              dataKey="price"
              stroke="#666"
              strokeWidth={2}
              dot={false}
              name="Price"
            />
            <Line
              type="monotone"
              dataKey="sma7"
              stroke="#1976d2"
              strokeWidth={2}
              dot={false}
              name="SMA(7)"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="sma25"
              stroke="#9c27b0"
              strokeWidth={2}
              dot={false}
              name="SMA(25)"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="ema12"
              stroke="#4caf50"
              strokeWidth={2}
              dot={false}
              name="EMA(12)"
              strokeDasharray="5 5"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="ema26"
              stroke="#ff9800"
              strokeWidth={2}
              dot={false}
              name="EMA(26)"
              strokeDasharray="5 5"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MovingAveragesChart;
