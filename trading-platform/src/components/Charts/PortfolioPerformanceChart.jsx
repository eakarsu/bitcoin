import { Card, CardContent, Typography, Box } from '@mui/material';
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

const PortfolioPerformanceChart = ({ data, height = 400 }) => {
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MM/dd');
  };

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
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
            {format(new Date(payload[0].payload.date), 'MMM dd, yyyy HH:mm')}
          </Typography>
          <Typography variant="body2" color="primary" sx={{ mb: 0.5 }}>
            Portfolio Value: ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
          {payload[1] && (
            <Typography variant="body2" color="success.main">
              P&L: ${payload[1].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
        <Typography variant="h6" gutterBottom fontWeight="700" sx={{ mb: 3 }}>
          Portfolio Performance Over Time
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1976d2" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4caf50" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={formatCurrency}
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatCurrency}
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="value"
              name="Portfolio Value"
              stroke="#1976d2"
              strokeWidth={3}
              fill="url(#colorValue)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pnl"
              name="Total P&L"
              stroke="#4caf50"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PortfolioPerformanceChart;
