import { Typography, Grid, Card, CardContent, Box, Avatar } from '@mui/material';
import { TrendingUp, Security, Speed, SmartToy } from '@mui/icons-material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function About() {
  const features = [
    {
      icon: <SmartToy sx={{ fontSize: 40 }} />,
      title: 'AI-Powered Trading',
      description: 'Advanced AI algorithms analyze markets 24/7 to provide real-time signals and predictions.'
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with encrypted data and secure trading infrastructure.'
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: 'Lightning Fast',
      description: 'Execute trades in milliseconds with our optimized trading engine.'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Proven Results',
      description: 'Our AI has delivered consistent returns across multiple market conditions.'
    }
  ];

  return (
    <PageTemplate
      title="About Us"
      subtitle="Building the future of cryptocurrency trading with AI"
    >
      <Typography variant="body1" paragraph>
        Trading Platform is a cutting-edge cryptocurrency trading platform that combines advanced AI
        technology with professional-grade trading tools. Founded in 2024, we've helped thousands of
        traders make smarter decisions and achieve better results.
      </Typography>

      <Typography variant="body1" paragraph>
        Our mission is to democratize access to sophisticated trading strategies and AI-powered
        insights that were previously available only to institutional investors.
      </Typography>

      <Typography variant="h5" fontWeight="bold" sx={{ mt: 6, mb: 3 }}>
        Why Choose Us
      </Typography>

      <Grid container spacing={3}>
        {features.map((feature, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" fontWeight="bold" sx={{ mt: 6, mb: 3 }}>
        Our Values
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Innovation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We continuously push the boundaries of what's possible with AI and trading technology.
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Transparency
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We believe in open communication and full transparency in our operations and results.
          </Typography>
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Excellence
          </Typography>
          <Typography variant="body2" color="text.secondary">
            We strive for excellence in everything we do, from product design to customer support.
          </Typography>
        </Grid>
      </Grid>
    </PageTemplate>
  );
}
