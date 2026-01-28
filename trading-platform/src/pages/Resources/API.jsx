import { Typography, Card, CardContent, Button, Box, Chip } from '@mui/material';
import PageTemplate from '../../components/shared/PageTemplate';

export default function API() {
  return (
    <PageTemplate title="API Reference" subtitle="Integrate Trading Platform into your applications">
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>REST API</Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Base URL: https://api.tradingplatform.com/v1
          </Typography>
          <Chip label="GET" color="success" size="small" sx={{ mr: 1 }} />
          <Chip label="POST" color="primary" size="small" sx={{ mr: 1 }} />
          <Chip label="PUT" color="warning" size="small" sx={{ mr: 1 }} />
          <Chip label="DELETE" color="error" size="small" />
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight="bold" gutterBottom>Endpoints</Typography>
      {['/signals', '/predictions', '/bots', '/portfolio', '/analytics'].map(endpoint => (
        <Card key={endpoint} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="body1" fontWeight="bold">{endpoint}</Typography>
            <Typography variant="body2" color="text.secondary">
              Access {endpoint.substring(1)} data and operations
            </Typography>
          </CardContent>
        </Card>
      ))}

      <Button variant="contained" sx={{ mt: 2 }}>View Full Documentation</Button>
    </PageTemplate>
  );
}
