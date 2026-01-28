import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { TRADING_PAIRS } from '../../constants/coins';

const VolumeAnalysisChart = ({ currentPrices, height = 350 }) => {
  const [selectedCoin, setSelectedCoin] = useState('BTC/USDT');
  const [chartData, setChartData] = useState([]);

  const coins = TRADING_PAIRS;

  useEffect(() => {
    const generateVolumeData = () => {
      const data = [];
      const periods = 24;
      const currentPrice = currentPrices?.[selectedCoin]?.price || 100000;
      const baseVolume = currentPrice * 1000;

      let prevPrice = currentPrice * 0.98;

      for (let i = 0; i < periods; i++) {
        const date = new Date();
        date.setHours(date.getHours() - (periods - i));

        const priceChange = (Math.random() - 0.5) * 0.02;
        const currentPricePoint = prevPrice * (1 + priceChange);
        const volume = baseVolume * (0.5 + Math.random() * 1.5);
        const buyVolume = volume * (priceChange > 0 ? 0.6 + Math.random() * 0.3 : 0.3 + Math.random() * 0.2);
        const sellVolume = volume - buyVolume;

        data.push({
          date: date.toISOString(),
          volume: parseFloat(volume.toFixed(0)),
          buyVolume: parseFloat(buyVolume.toFixed(0)),
          sellVolume: parseFloat(sellVolume.toFixed(0)),
          price: parseFloat(currentPricePoint.toFixed(2)),
          isUp: priceChange > 0
        });

        prevPrice = currentPricePoint;
      }

      return data;
    };

    setChartData(generateVolumeData());
  }, [selectedCoin, currentPrices]);

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const formatVolume = (value) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(0)}`;
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
          <Typography variant="caption" color="text.secondary">Total Volume:</Typography>
          <Typography variant="body2" fontWeight="600" sx={{ mb: 0.5 }}>
            {formatVolume(data.volume)}
          </Typography>
          <Typography variant="caption" color="success.main">Buy Volume:</Typography>
          <Typography variant="body2" fontWeight="600" color="success.main" sx={{ mb: 0.5 }}>
            {formatVolume(data.buyVolume)} ({(data.buyVolume / data.volume * 100).toFixed(1)}%)
          </Typography>
          <Typography variant="caption" color="error.main">Sell Volume:</Typography>
          <Typography variant="body2" fontWeight="600" color="error.main">
            {formatVolume(data.sellVolume)} ({(data.sellVolume / data.volume * 100).toFixed(1)}%)
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
            Volume Analysis
          </Typography>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Coin</InputLabel>
            <Select
              value={selectedCoin}
              label="Coin"
              onChange={(e) => setSelectedCoin(e.target.value)}
            >
              {coins.map(coin => (
                <MenuItem key={`volume-${coin}`} value={coin}>{coin}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              tickFormatter={formatVolume}
              stroke="#666"
              style={{ fontSize: '11px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isUp ? '#4caf50' : '#f44336'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default VolumeAnalysisChart;
