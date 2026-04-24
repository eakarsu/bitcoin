import { Component } from 'react';
import { Box, Typography, Button, Card, CardContent, Container } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
          <Card sx={{ textAlign: 'center', boxShadow: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
              {import.meta.env.DEV && this.state.errorInfo && (
                <Box
                  sx={{
                    textAlign: 'left', mb: 3, p: 2,
                    bgcolor: 'grey.100', borderRadius: 1,
                    maxHeight: 200, overflow: 'auto',
                    fontSize: '0.75rem', fontFamily: 'monospace'
                  }}
                >
                  {this.state.errorInfo.componentStack}
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.location.href = '/'}
                >
                  Go Home
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
