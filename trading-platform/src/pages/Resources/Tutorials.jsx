import { Typography, Card, CardContent, Grid, Chip } from '@mui/material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Tutorials() {
  const tutorials = [
    { title: 'Getting Started with AI Trading', level: 'Beginner', time: '15 min' },
    { title: 'Creating Your First Trading Bot', level: 'Beginner', time: '20 min' },
    { title: 'Advanced Signal Analysis', level: 'Advanced', time: '30 min' },
    { title: 'Portfolio Optimization Strategies', level: 'Intermediate', time: '25 min' },
  ];

  return (
    <PageTemplate title="Tutorials" subtitle="Learn how to master Trading Platform">
      <Grid container spacing={3}>
        {tutorials.map((tutorial, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>{tutorial.title}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip label={tutorial.level} size="small" color="primary" />
                  <Chip label={tutorial.time} size="small" variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </PageTemplate>
  );
}
