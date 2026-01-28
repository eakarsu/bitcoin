import { Typography } from '@mui/material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Terms() {
  return (
    <PageTemplate title="Terms of Service" subtitle="Last updated: January 2025">
      <Typography variant="h6" fontWeight="bold" gutterBottom>1. Acceptance of Terms</Typography>
      <Typography paragraph>
        By accessing and using Trading Platform, you accept and agree to be bound by these Terms of Service.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>2. User Responsibilities</Typography>
      <Typography paragraph>
        You are responsible for maintaining the security of your account, following applicable laws,
        and using our services responsibly. You must be 18 or older to use our platform.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>3. Trading Risks</Typography>
      <Typography paragraph>
        Cryptocurrency trading involves significant risk. Past performance does not guarantee future results.
        You should never invest more than you can afford to lose.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>4. Service Availability</Typography>
      <Typography paragraph>
        We strive for 99.9% uptime but cannot guarantee uninterrupted service. We are not liable for
        losses due to service interruptions.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>5. Intellectual Property</Typography>
      <Typography paragraph>
        All content, features, and functionality are owned by Trading Platform and protected by copyright.
      </Typography>
    </PageTemplate>
  );
}
