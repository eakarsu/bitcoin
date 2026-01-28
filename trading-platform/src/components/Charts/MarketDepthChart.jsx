import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TRADING_PAIRS } from '../../constants/coins';

const MarketDepthChart = ({ currentPrices, height = 350 }) => {
  const [selectedCoin, setSelectedCoin] = useState('BTC/USDT');
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [] });

  const coins = TRADING_PAIRS;

  useEffect(() => {
    const generateOrderBook = () => {
      const currentPrice = currentPrices?.[selectedCoin]?.price || 100000;
      const bids = [];
      const asks = [];
      const levels = 30;
      const spread = currentPrice * 0.001; // 0.1% spread

      let cumulativeBidVolume = 0;
      let cumulativeAskVolume = 0;

      // Generate bid orders (buy orders below current price)
      for (let i = 0; i < levels; i++) {
        const priceLevel = currentPrice - spread - (i * currentPrice * 0.0005);
        const volume = (Math.random() * 5 + 1) * (levels - i) / levels; // More volume closer to current price
        cumulativeBidVolume += volume;

        bids.push({
          price: parseFloat(priceLevel.toFixed(2)),
          volume: parseFloat(volume.toFixed(4)),
          cumulative: parseFloat(cumulativeBidVolume.toFixed(4)),
          type: 'bid'
        });
      }

      // Generate ask orders (sell orders above current price)
      for (let i = 0; i < levels; i++) {
        const priceLevel = currentPrice + spread + (i * currentPrice * 0.0005);
        const volume = (Math.random() * 5 + 1) * (levels - i) / levels;
        cumulativeAskVolume += volume;

        asks.push({
          price: parseFloat(priceLevel.toFixed(2)),
          volume: parseFloat(volume.toFixed(4)),
          cumulative: parseFloat(cumulativeAskVolume.toFixed(4)),
          type: 'ask'
        });
      }

      return {
        bids: bids.reverse(),
        asks,
        midPrice: currentPrice
      };
    };

    const data = generateOrderBook();
    setOrderBookData(data);
  }, [selectedCoin, currentPrices]);

  const chartData = [...orderBookData.bids, ...orderBookData.asks];
  const midPrice = orderBookData.midPrice || 100000;

  const formatPrice = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
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
          <Typography variant="body2" fontWeight="bold" color={data.type === 'bid' ? 'success.main' : 'error.main'}>
            {data.type === 'bid' ? 'BID' : 'ASK'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Price: ${data.price.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            Volume: {data.volume.toFixed(4)}
          </Typography>
          <Typography variant="body2" fontWeight="600">
            Cumulative: {data.cumulative.toFixed(4)}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const totalBidVolume = orderBookData.bids.reduce((sum, bid) => sum + bid.volume, 0);
  const totalAskVolume = orderBookData.asks.reduce((sum, ask) => sum + ask.volume, 0);
  const bidAskRatio = totalAskVolume > 0 ? (totalBidVolume / totalAskVolume).toFixed(2) : 0;

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
            Market Depth (Order Book)
          </Typography>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Coin</InputLabel>
            <Select
              value={selectedCoin}
              label="Coin"
              onChange={(e) => setSelectedCoin(e.target.value)}
            >
              {coins.map(coin => (
                <MenuItem key={`depth-${coin}`} value={coin}>{coin}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Mid Price</Typography>
            <Typography variant="body1" fontWeight="600">${midPrice.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Bids</Typography>
            <Typography variant="body1" fontWeight="600" color="success.main">
              {totalBidVolume.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Asks</Typography>
            <Typography variant="body1" fontWeight="600" color="error.main">
              {totalAskVolume.toFixed(2)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Bid/Ask Ratio</Typography>
            <Typography variant="body1" fontWeight="600" color="primary.main">
              {bidAskRatio}
            </Typography>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4caf50" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#4caf50" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorAsk" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f44336" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#f44336" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="price"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatPrice}
              stroke="#666"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              stroke="#666"
              style={{ fontSize: '11px' }}
              label={{ value: 'Cumulative Volume', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={midPrice} stroke="#666" strokeWidth={2} strokeDasharray="5 5" />
            <Area
              type="stepAfter"
              data={orderBookData.bids}
              dataKey="cumulative"
              stroke="#4caf50"
              strokeWidth={2}
              fill="url(#colorBid)"
              name="Bids"
            />
            <Area
              type="stepAfter"
              data={orderBookData.asks}
              dataKey="cumulative"
              stroke="#f44336"
              strokeWidth={2}
              fill="url(#colorAsk)"
              name="Asks"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MarketDepthChart;
