import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  ThumbUp,
  ThumbDown,
  Visibility,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';
import { getUserRecommendations, recordRecommendationAction, recordRecommendationOutcome } from '../../services/enhancementsApi';

export default function RecommendationHistoryCard() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);
  const [actionDialog, setActionDialog] = useState(false);
  const [action, setAction] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const data = await getUserRecommendations(1, 20);
      setRecommendations(data.recommendations || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (rec) => {
    setSelectedRec(rec);
  };

  const handleRecordAction = async () => {
    if (!selectedRec || !action) return;

    try {
      await recordRecommendationAction(selectedRec.id, action, notes);
      setActionDialog(false);
      setAction('');
      setNotes('');
      fetchRecommendations();
    } catch (err) {
      console.error('Error recording action:', err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'successful':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'failed':
        return <Cancel sx={{ color: 'error.main' }} />;
      case 'pending':
        return <HourglassEmpty sx={{ color: 'warning.main' }} />;
      default:
        return <HourglassEmpty sx={{ color: 'grey.500' }} />;
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      portfolio: 'primary',
      strategy: 'secondary',
      trade: 'success',
      risk: 'warning'
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Recommendation History
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            AI Recommendation History
          </Typography>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              AI Recommendation History
            </Typography>
            <Button size="small" onClick={fetchRecommendations}>
              Refresh
            </Button>
          </Box>

          {recommendations.length === 0 ? (
            <Alert severity="info">No recommendations yet</Alert>
          ) : (
            <List>
              {recommendations.map((rec, index) => (
                <Box key={rec.id}>
                  <ListItem
                    sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 2
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(rec.outcome_status)}
                        <Typography variant="subtitle1" fontWeight="bold">
                          {rec.title}
                        </Typography>
                      </Box>
                      <Chip
                        label={rec.recommendation_type}
                        color={getTypeColor(rec.recommendation_type)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {rec.description}
                    </Typography>

                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      {rec.confidence && (
                        <Chip
                          label={`Confidence: ${rec.confidence}%`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {rec.priority > 0 && (
                        <Chip
                          label={`Priority: ${rec.priority}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                      )}
                      {rec.acted_on && (
                        <Chip
                          label={`Action: ${rec.action_taken}`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Box display="flex" gap={1} width="100%">
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDetails(rec)}
                      >
                        Details
                      </Button>
                      {!rec.acted_on && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedRec(rec);
                            setActionDialog(true);
                          }}
                        >
                          Record Action
                        </Button>
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary" mt={1}>
                      {new Date(rec.created_at).toLocaleString()}
                    </Typography>
                  </ListItem>
                  {index < recommendations.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={Boolean(selectedRec) && !actionDialog}
        onClose={() => setSelectedRec(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Recommendation Details</DialogTitle>
        <DialogContent>
          {selectedRec && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedRec.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedRec.description}
              </Typography>

              <Box display="flex" gap={2} mb={2}>
                <Chip
                  label={selectedRec.recommendation_type}
                  color={getTypeColor(selectedRec.recommendation_type)}
                />
                {selectedRec.confidence && (
                  <Chip label={`${selectedRec.confidence}% confidence`} />
                )}
              </Box>

              {selectedRec.recommendation_data && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recommendation Data:
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      maxHeight: 300,
                      overflow: 'auto'
                    }}
                  >
                    <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                      {JSON.stringify(selectedRec.recommendation_data, null, 2)}
                    </pre>
                  </Box>
                </Box>
              )}

              {selectedRec.acted_on && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <strong>Action Taken:</strong> {selectedRec.action_taken}
                  {selectedRec.action_notes && (
                    <>
                      <br />
                      <strong>Notes:</strong> {selectedRec.action_notes}
                    </>
                  )}
                </Alert>
              )}

              {selectedRec.outcome_status && (
                <Alert
                  severity={
                    selectedRec.outcome_status === 'successful'
                      ? 'success'
                      : selectedRec.outcome_status === 'failed'
                      ? 'error'
                      : 'info'
                  }
                >
                  <strong>Outcome:</strong> {selectedRec.outcome_status}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRec(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialog} onClose={() => setActionDialog(false)}>
        <DialogTitle>Record Action</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              select
              fullWidth
              label="Action"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              margin="normal"
            >
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="modified">Modified</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialog(false)}>Cancel</Button>
          <Button onClick={handleRecordAction} variant="contained" disabled={!action}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
