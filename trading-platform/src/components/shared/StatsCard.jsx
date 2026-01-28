import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatsCard = ({ title, value, change, changePercent, icon: Icon, color = 'primary' }) => {
  const isPositive = change >= 0;

  return (
    <Card
      sx={{
        height: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', mb: 1.5, color: 'text.primary' }}>
              {value}
            </Typography>
            {(change !== undefined || changePercent !== undefined) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isPositive ? (
                  <TrendingUp sx={{ color: 'success.main', fontSize: 20 }} />
                ) : (
                  <TrendingDown sx={{ color: 'error.main', fontSize: 20 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: isPositive ? 'success.main' : 'error.main',
                    fontWeight: 600
                  }}
                >
                  {isPositive ? '+' : ''}{change}
                  {changePercent && ` (${isPositive ? '+' : ''}${changePercent}%)`}
                </Typography>
              </Box>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                backgroundColor: `${color}.light`,
                borderRadius: 2.5,
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${color === 'primary' ? 'rgba(25, 118, 210, 0.15)' :
                                       color === 'success' ? 'rgba(46, 125, 50, 0.15)' :
                                       color === 'warning' ? 'rgba(237, 108, 2, 0.15)' :
                                       'rgba(2, 136, 209, 0.15)'}`
              }}
            >
              <Icon sx={{ color: `${color}.main`, fontSize: 36 }} />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
