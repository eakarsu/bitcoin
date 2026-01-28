import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

const StrategyComparisonChart = ({ strategies, height = 350 }) => {
  const data = strategies.map(strategy => ({
    name: strategy.name.length > 20 ? strategy.name.substring(0, 20) + '...' : strategy.name,
    pnl: parseFloat(strategy.pnl) || 0,
    winRate: parseFloat(strategy.win_rate) || 0,
    trades: parseInt(strategy.trades_count) || 0
  }));

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
            boxShadow: 3
          }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
            {payload[0].payload.name}
          </Typography>
          <Typography variant="body2" color={data.pnl >= 0 ? 'success.main' : 'error.main'}>
            P&L: ${data.pnl.toLocaleString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Win Rate: {data.winRate}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Trades: {data.trades}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const getBarColor = (value) => {
    if (value > 0) return '#4caf50';
    if (value < 0) return '#f44336';
    return '#9e9e9e';
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
        <Typography variant="h6" gutterBottom fontWeight="700" sx={{ mb: 3 }}>
          Strategy Performance Comparison
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              stroke="#666"
              style={{ fontSize: '11px' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#666"
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pnl" name="P&L" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.pnl)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default StrategyComparisonChart;
