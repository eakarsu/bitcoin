import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Switch,
  FormControlLabel,
  Chip
} from '@mui/material';
import { CheckCircle, Star } from '@mui/icons-material';
import { useState } from 'react';
import { subscriptionTiers } from '../../services/mockData';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const getPrice = (basePrice) => {
    return isAnnual ? Math.floor(basePrice * 0.8) : basePrice;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" gutterBottom fontWeight="bold">
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Get access to AI-powered trading signals and grow your portfolio
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isAnnual}
              onChange={(e) => setIsAnnual(e.target.checked)}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography>Annual Billing</Typography>
              <Chip label="Save 20%" color="success" size="small" />
            </Box>
          }
        />
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {subscriptionTiers.map((tier, index) => (
          <Grid item xs={12} md={4} key={tier.name}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: tier.popular ? 3 : 1,
                borderColor: tier.popular ? 'primary.main' : 'divider',
                transform: tier.popular ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: tier.popular ? 'scale(1.08)' : 'scale(1.03)',
                  boxShadow: 6
                }
              }}
            >
              {tier.popular && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  <Star sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight="bold">
                    MOST POPULAR
                  </Typography>
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1, pt: tier.popular ? 4 : 2 }}>
                <Typography variant="h5" gutterBottom fontWeight="bold" align="center">
                  {tier.name}
                </Typography>

                <Box sx={{ textAlign: 'center', my: 3 }}>
                  <Typography variant="h3" component="span" fontWeight="bold" color="primary.main">
                    ${getPrice(tier.price)}
                  </Typography>
                  <Typography variant="h6" component="span" color="text.secondary">
                    /{tier.interval}
                  </Typography>
                  {isAnnual && tier.price > 0 && (
                    <Typography variant="caption" display="block" color="success.main" sx={{ mt: 1 }}>
                      Save ${tier.price * 12 - getPrice(tier.price) * 12}/year
                    </Typography>
                  )}
                </Box>

                <List sx={{ mb: 2 }}>
                  {tier.features.map((feature, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={feature}
                        primaryTypographyProps={{
                          variant: 'body2'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Button
                  variant={tier.popular ? 'contained' : 'outlined'}
                  fullWidth
                  size="large"
                  sx={{ mt: 'auto' }}
                >
                  {tier.price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                </Button>

                {tier.price > 0 && (
                  <Typography variant="caption" display="block" align="center" color="text.secondary" sx={{ mt: 1 }}>
                    7-day free trial • Cancel anytime
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* FAQ Section */}
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Frequently Asked Questions
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  How accurate are the signals?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our AI models analyze multiple data sources including technical indicators, on-chain data, and sentiment analysis. Historical performance shows a 73% win rate, but past performance doesn't guarantee future results.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Can I cancel anytime?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes! You can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  What exchanges are supported?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our signals work with all major exchanges including Binance, Coinbase, Kraken, and more. API integration available for Pro and Enterprise tiers.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ textAlign: 'left' }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Is there a money-back guarantee?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes! If you're not satisfied within the first 30 days, we'll provide a full refund, no questions asked.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* CTA Section */}
      <Card sx={{ mt: 6, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4, color: 'white' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Ready to Start Trading Smarter?
            </Typography>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Join 10,000+ traders who trust SignalStream for their trading decisions
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': { backgroundColor: 'grey.100' }
              }}
            >
              Start Your Free Trial
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Pricing;
