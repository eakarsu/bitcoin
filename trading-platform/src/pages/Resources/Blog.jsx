import { Typography, Card, CardContent, CardMedia, Grid, Chip } from '@mui/material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Blog() {
  const posts = [
    { title: 'AI Trading in 2025: What to Expect', date: 'Jan 15, 2025', category: 'AI' },
    { title: 'Top 10 Trading Strategies for Beginners', date: 'Jan 10, 2025', category: 'Education' },
    { title: 'Market Analysis: Bitcoin Trends', date: 'Jan 5, 2025', category: 'Analysis' },
    { title: 'How to Use Trading Bots Effectively', date: 'Dec 28, 2024', category: 'Tutorial' },
  ];

  return (
    <PageTemplate title="Blog" subtitle="Latest insights and updates from our team">
      <Grid container spacing={3}>
        {posts.map((post, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
              <CardContent>
                <Chip label={post.category} size="small" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h6" fontWeight="bold" gutterBottom>{post.title}</Typography>
                <Typography variant="body2" color="text.secondary">{post.date}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </PageTemplate>
  );
}
