import { Typography, Card, CardContent } from '@mui/material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Cookies() {
  return (
    <PageTemplate title="Cookie Policy" subtitle="Last updated: January 2025">
      <Typography paragraph>
        This Cookie Policy explains how Trading Platform uses cookies and similar technologies.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>What Are Cookies?</Typography>
          <Typography>
            Cookies are small text files stored on your device when you visit our website. They help us
            provide a better user experience and analyze how our platform is used.
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight="bold" gutterBottom>Types of Cookies We Use</Typography>
      
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Essential Cookies</Typography>
      <Typography paragraph>
        Required for the platform to function properly. These cannot be disabled.
      </Typography>

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Analytics Cookies</Typography>
      <Typography paragraph>
        Help us understand how users interact with our platform so we can improve it.
      </Typography>

      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Preference Cookies</Typography>
      <Typography paragraph>
        Remember your settings and preferences for a better experience.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 3 }}>Managing Cookies</Typography>
      <Typography paragraph>
        You can control cookies through your browser settings. Note that disabling cookies may affect
        platform functionality.
      </Typography>
    </PageTemplate>
  );
}
