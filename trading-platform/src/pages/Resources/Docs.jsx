import { Box } from "@mui/material";
import { Typography, Card, CardContent, Grid } from '@mui/material';
import { Description, Code, School, Assessment } from '@mui/icons-material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Docs() {
  const sections = [
    { icon: <School />, title: 'Getting Started', desc: 'Learn the basics of our platform' },
    { icon: <Code />, title: 'API Reference', desc: 'Complete API documentation' },
    { icon: <Assessment />, title: 'Trading Strategies', desc: 'Advanced trading guides' },
    { icon: <Description />, title: 'Best Practices', desc: 'Tips and recommendations' },
  ];

  return (
    <PageTemplate title="Documentation" subtitle="Everything you need to know about Trading Platform">
      <Grid container spacing={3}>
        {sections.map((section, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}>
              <CardContent>
                <Box sx={{ color: 'primary.main', mb: 2 }}>{section.icon}</Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>{section.title}</Typography>
                <Typography variant="body2" color="text.secondary">{section.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </PageTemplate>
  );
}
