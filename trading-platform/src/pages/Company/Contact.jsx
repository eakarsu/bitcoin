import { Typography, TextField, Button, Grid, Card, CardContent, Box } from '@mui/material';
import { Email, Phone, LocationOn } from '@mui/icons-material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function Contact() {
  return (
    <PageTemplate
      title="Contact Us"
      subtitle="Get in touch with our team"
    >
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Send us a message
          </Typography>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField fullWidth label="Name" margin="normal" required />
            <TextField fullWidth label="Email" type="email" margin="normal" required />
            <TextField fullWidth label="Subject" margin="normal" required />
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={4}
              margin="normal"
              required
            />
            <Button variant="contained" size="large" sx={{ mt: 2 }}>
              Send Message
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Contact Information
          </Typography>

          <Card sx={{ mt: 2, mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    support@tradingplatform.com
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Phone
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    +1 (555) 123-4567
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    123 Trading Street, Financial District<br />
                    New York, NY 10004
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: 4 }}>
            Business Hours
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monday - Friday: 9:00 AM - 6:00 PM EST<br />
            Saturday - Sunday: Closed<br />
            <br />
            <strong>24/7 Trading Support Available</strong>
          </Typography>
        </Grid>
      </Grid>
    </PageTemplate>
  );
}
