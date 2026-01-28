import { Box, Container, Grid, Typography, Link, IconButton, Divider } from '@mui/material';
import { Twitter, LinkedIn, GitHub, Telegram, Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo(0, 0);
  };

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 6,
        mt: 'auto'
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Trading Platform
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Professional cryptocurrency trading platform powered by AI.
              Make smarter trading decisions with real-time signals,
              automated bots, and advanced analytics.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <Twitter />
              </IconButton>
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <LinkedIn />
              </IconButton>
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <GitHub />
              </IconButton>
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <Telegram />
              </IconButton>
              <IconButton size="small" sx={{ color: 'primary.main' }}>
                <Email />
              </IconButton>
            </Box>
          </Grid>

          {/* Products */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Products
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/algotrader')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              AlgoTrader Pro
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/signalstream')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              SignalStream
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/ai-analytics')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              AI Analytics
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/pricing')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Pricing
            </Link>
          </Grid>

          {/* Features */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Features
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/ai-analytics')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Trading Bots
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/ai-analytics')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              AI Predictions
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/ai-analytics')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Whale Tracking
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/signalstream')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Live Signals
            </Link>
          </Grid>

          {/* Resources */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Resources
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/docs')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Documentation
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/api')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              API Reference
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/tutorials')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Tutorials
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/blog')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Blog
            </Link>
          </Grid>

          {/* Company */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Company
            </Typography>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/about')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              About Us
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/contact')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Contact
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/careers')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Careers
            </Link>
            <Link
              component="button"
              variant="body2"
              onClick={() => handleNavigation('/support')}
              sx={{ display: 'block', mb: 1, color: 'text.secondary', textAlign: 'left', cursor: 'pointer' }}
            >
              Support
            </Link>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Bottom Footer */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              © 2025 Trading Platform. All rights reserved.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => handleNavigation('/privacy')}
                sx={{ color: 'text.secondary', cursor: 'pointer' }}
              >
                Privacy Policy
              </Link>
              <Link
                component="button"
                variant="body2"
                onClick={() => handleNavigation('/terms')}
                sx={{ color: 'text.secondary', cursor: 'pointer' }}
              >
                Terms of Service
              </Link>
              <Link
                component="button"
                variant="body2"
                onClick={() => handleNavigation('/cookies')}
                sx={{ color: 'text.secondary', cursor: 'pointer' }}
              >
                Cookie Policy
              </Link>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
