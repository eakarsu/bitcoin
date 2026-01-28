import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Speed,
  Timeline
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const SignalCard = ({ signal }) => {
  const getSignalColor = (type) => {
    switch (type) {
      case 'BUY':
        return 'success';
      case 'SELL':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'STRONG':
        return 'error';
      case 'MODERATE':
        return 'warning';
      default:
        return 'info';
    }
  };

  const SignalIcon = signal.type === 'BUY' ? TrendingUp : signal.type === 'SELL' ? TrendingDown : Remove;

  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {signal.pair}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDistanceToNow(new Date(signal.timestamp), { addSuffix: true })}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${getSignalColor(signal.type)}.light`,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <SignalIcon sx={{ color: `${getSignalColor(signal.type)}.main` }} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={signal.type}
            color={getSignalColor(signal.type)}
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
          <Chip
            label={signal.strength}
            color={getStrengthColor(signal.strength)}
            size="small"
          />
          <Chip
            icon={<Speed />}
            label={signal.timeframe}
            size="small"
            variant="outlined"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Confidence
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {parseFloat(signal.confidence || 0).toFixed(0)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={parseFloat(signal.confidence || 0)}
            sx={{
              height: 8,
              borderRadius: 1,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: parseFloat(signal.confidence || 0) > 80 ? 'success.main' : parseFloat(signal.confidence || 0) > 60 ? 'warning.main' : 'error.main'
              }
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Current Price:
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              ${parseFloat(signal.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Target:
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="success.main">
              ${parseFloat(signal.targetPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Stop Loss:
            </Typography>
            <Typography variant="body2" fontWeight="medium" color="error.main">
              ${parseFloat(signal.stopLoss || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
        </Box>

        {signal.indicators && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Timeline fontSize="small" />
              RSI: {parseFloat(signal.indicators.rsi || 0).toFixed(0)} | MACD: {parseFloat(signal.indicators.macd || 0) > 0 ? '+' : ''}{parseFloat(signal.indicators.macd || 0).toFixed(2)}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SignalCard;
