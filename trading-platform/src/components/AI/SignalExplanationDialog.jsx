import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  Psychology as AIIcon,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { explainSignal } from '../../services/aiApi';

const SignalExplanationDialog = ({ open, onClose, signal }) => {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && signal) {
      fetchExplanation();
    }
  }, [open, signal]);

  const fetchExplanation = async () => {
    if (!signal) return;

    setLoading(true);
    try {
      const data = await explainSignal(signal);
      setExplanation(data.explanation);
    } catch (error) {
      console.error('Signal Explanation Error:', error);
      setExplanation('Failed to get AI explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!signal) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6" fontWeight="700">
              AI Signal Explanation
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
            <Chip
              icon={signal.type === 'BUY' ? <TrendingUp /> : <TrendingDown />}
              label={signal.type}
              color={signal.type === 'BUY' ? 'success' : 'error'}
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="h6" fontWeight="600">
              {signal.pair}
            </Typography>
            <Chip
              label={`${signal.confidence}% Confidence`}
              color="primary"
              variant="outlined"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Current Price
              </Typography>
              <Typography variant="body1" fontWeight="600">
                ${parseFloat(signal.price || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Target Price
              </Typography>
              <Typography variant="body1" fontWeight="600" color="success.main">
                ${parseFloat(signal.targetPrice || signal.target_price || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Stop Loss
              </Typography>
              <Typography variant="body1" fontWeight="600" color="error.main">
                ${parseFloat(signal.stopLoss || signal.stop_loss || 0).toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Timeframe
              </Typography>
              <Typography variant="body1" fontWeight="600">
                {signal.timeframe}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon fontSize="small" color="primary" />
              AI Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {explanation || 'No explanation available.'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SignalExplanationDialog;
