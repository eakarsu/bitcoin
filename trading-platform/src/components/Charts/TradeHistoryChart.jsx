import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell
} from 'recharts';
import { format } from 'date-fns';

const TradeHistoryChart = ({ height = 350 }) => {
  // Generate mock trade history data
  const generateTradeData = () => {
    const data = [];
    const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];
    const basePrice = 100000;

    for (let i = 0; i < 50; i++) {
      const date = new Date();
      date.setHours(date.getHours() - (50 - i) * 2);

      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const type = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const price = basePrice * (0.95 + Math.random() * 0.1);
      const quantity = Math.random() * 0.5 + 0.1;
      const value = price * quantity;
      const profit = type === 'SELL' ? (Math.random() - 0.3) * value * 0.1 : 0;

      data.push({
        date: date.getTime(),
        dateStr: date.toISOString(),
        symbol,
        type,
        price: parseFloat(price.toFixed(2)),
        quantity: parseFloat(quantity.toFixed(4)),
        value: parseFloat(value.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        profitPercent: parseFloat((profit / value * 100).toFixed(2)),
        size: Math.abs(profit) / 100 + 50 // Size for scatter plot
      });
    }

    return data.sort((a, b) => a.date - b.date);
  };

  const tradeData = generateTradeData();

  const formatDate = (timestamp) => {
    return format(new Date(timestamp), 'MM/dd HH:mm');
  };

  const formatPrice = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
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
            minWidth: 220
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {format(new Date(data.dateStr), 'MMM dd, yyyy HH:mm')}
          </Typography>
          <Typography variant="body2" fontWeight="600" color={data.type === 'BUY' ? 'success.main' : 'error.main'}>
            {data.type} {data.symbol}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Price: ${data.price.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            Quantity: {data.quantity}
          </Typography>
          <Typography variant="body2">
            Value: ${data.value.toLocaleString()}
          </Typography>
          {data.type === 'SELL' && (
            <Typography
              variant="body2"
              fontWeight="600"
              color={data.profit >= 0 ? 'success.main' : 'error.main'}
              sx={{ mt: 0.5 }}
            >
              P/L: ${data.profit.toLocaleString()} ({data.profitPercent >= 0 ? '+' : ''}{data.profitPercent}%)
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="700">
            Trade History & Performance
          </Typography>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', gap: 3 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Trades</Typography>
            <Typography variant="h6" fontWeight="600">{tradeData.length}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Total P/L</Typography>
            <Typography
              variant="h6"
              fontWeight="600"
              color={tradeData.reduce((sum, t) => sum + t.profit, 0) >= 0 ? 'success.main' : 'error.main'}
            >
              ${tradeData.reduce((sum, t) => sum + t.profit, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Win Rate</Typography>
            <Typography variant="h6" fontWeight="600" color="primary.main">
              {((tradeData.filter(t => t.profit > 0).length / tradeData.filter(t => t.type === 'SELL').length) * 100).toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDate}
              stroke="#666"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              dataKey="price"
              type="number"
              tickFormatter={formatPrice}
              stroke="#666"
              style={{ fontSize: '11px' }}
            />
            <ZAxis dataKey="size" range={[50, 400]} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={tradeData.filter(t => t.type === 'BUY')} fill="#4caf50" name="Buy">
              {tradeData.filter(t => t.type === 'BUY').map((entry, index) => (
                <Cell key={`buy-${index}`} fill="#4caf50" fillOpacity={0.7} />
              ))}
            </Scatter>
            <Scatter data={tradeData.filter(t => t.type === 'SELL')} fill="#f44336" name="Sell">
              {tradeData.filter(t => t.type === 'SELL').map((entry, index) => (
                <Cell
                  key={`sell-${index}`}
                  fill={entry.profit >= 0 ? '#2196f3' : '#f44336'}
                  fillOpacity={0.7}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
            <Typography variant="caption">Buy Orders</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#2196f3' }} />
            <Typography variant="caption">Profitable Sells</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
            <Typography variant="caption">Loss Sells</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradeHistoryChart;
