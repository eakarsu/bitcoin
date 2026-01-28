import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const AssetAllocationChart = ({ positions, height = 350 }) => {
  // Prepare data from positions
  const data = positions.map(pos => ({
    name: pos.symbol,
    value: pos.value || (pos.quantity * (pos.currentPrice || pos.current_price)),
    quantity: pos.quantity
  }));

  const COLORS = [
    '#1976d2', // Blue - BTC
    '#42a5f5', // Light Blue - ETH
    '#ab47bc', // Purple - SOL
    '#ffa726', // Orange - BNB
    '#66bb6a', // Green - XRP
    '#ef5350'  // Red - ADA
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
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
          <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="primary">
            Value: ${data.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data.payload.quantity} units
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {((data.value / data.payload.total) * 100).toFixed(1)}% of portfolio
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map(item => ({ ...item, total }));

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
          Asset Allocation
        </Typography>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={dataWithTotal}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value, entry) => (
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {value} - ${entry.payload.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default AssetAllocationChart;
