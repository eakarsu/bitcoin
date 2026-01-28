import { Container, Typography, Box, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function PageTemplate({ title, subtitle, children }) {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        Back to Home
      </Button>

      <Typography variant="h3" fontWeight="bold" gutterBottom sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="h6" color="text.secondary" paragraph>
          {subtitle}
        </Typography>
      )}

      <Box sx={{ mt: 4 }}>
        {children}
      </Box>
    </Container>
  );
}
