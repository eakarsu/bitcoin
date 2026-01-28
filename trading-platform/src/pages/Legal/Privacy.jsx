import { Typography } from '@mui/material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Privacy() {
  return (
    <PageTemplate title="Privacy Policy" subtitle="Last updated: January 2025">
      <Typography variant="h6" fontWeight="bold" gutterBottom>1. Information We Collect</Typography>
      <Typography paragraph>
        We collect information you provide directly to us, including name, email, payment information,
        and trading preferences. We also collect usage data and analytics to improve our services.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>2. How We Use Your Information</Typography>
      <Typography paragraph>
        We use your information to provide and improve our services, process transactions, send updates,
        and ensure platform security. We never sell your personal data to third parties.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>3. Data Security</Typography>
      <Typography paragraph>
        We implement industry-standard security measures including encryption, secure servers, and regular
        security audits to protect your data.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>4. Your Rights</Typography>
      <Typography paragraph>
        You have the right to access, update, or delete your personal information at any time. Contact
        us at privacy@tradingplatform.com for any privacy-related requests.
      </Typography>

      <Typography variant="h6" fontWeight="bold" gutterBottom>5. Cookies</Typography>
      <Typography paragraph>
        We use cookies to enhance your experience. You can control cookie settings in your browser.
      </Typography>
    </PageTemplate>
  );
}
