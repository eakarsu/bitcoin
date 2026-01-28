import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Alert,
  List,
  ListItem,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  PlayArrow,
  Stop,
  Edit,
  Delete,
  TrendingUp,
  ShowChart
} from '@mui/icons-material';
import { getUserBots, createBot, startBot, stopBot, deleteBot, getBotPerformance } from '../../services/enhancementsApi';

export default function TradingBotsCard() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [newBot, setNewBot] = useState({
    name: '',
    description: '',
    strategyType: 'momentum',
    symbols: ['BTC'],
    maxPositionSize: 1000,
    maxDailyLoss: 100,
    stopLossPercentage: 5,
    takeProfitPercentage: 10,
    isPaperTrading: true
  });

  useEffect(() => {
    fetchBots();
    const interval = setInterval(fetchBots, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      const data = await getUserBots(1);
      setBots(data.bots || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching bots:', err);
      setError('Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBot = async () => {
    try {
      await createBot({ ...newBot, userId: 1, strategyConfig: {} });
      setCreateDialog(false);
      setNewBot({
        name: '',
        description: '',
        strategyType: 'momentum',
        symbols: ['BTC'],
        maxPositionSize: 1000,
        maxDailyLoss: 100,
        stopLossPercentage: 5,
        takeProfitPercentage: 10,
        isPaperTrading: true
      });
      fetchBots();
    } catch (err) {
      console.error('Error creating bot:', err);
      alert('Failed to create bot');
    }
  };

  const handleStartBot = async (botId) => {
    try {
      await startBot(botId);
      fetchBots();
    } catch (err) {
      console.error('Error starting bot:', err);
      alert('Failed to start bot');
    }
  };

  const handleStopBot = async (botId) => {
    try {
      await stopBot(botId);
      fetchBots();
    } catch (err) {
      console.error('Error stopping bot:', err);
      alert('Failed to stop bot');
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!confirm('Are you sure you want to delete this bot?')) return;

    try {
      await deleteBot(botId);
      fetchBots();
    } catch (err) {
      console.error('Error deleting bot:', err);
      alert('Failed to delete bot');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      paused: 'warning',
      error: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading && bots.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🤖 Trading Bots
          </Typography>
          <LinearProgress />
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
              🤖 Trading Bots
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              size="small"
              onClick={() => setCreateDialog(true)}
            >
              New Bot
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {bots.length === 0 ? (
            <Alert severity="info">
              No trading bots yet. Create your first bot to start automated trading!
            </Alert>
          ) : (
            <List>
              {bots.map((bot, index) => (
                <Box key={bot.id}>
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                    <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {bot.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bot.description}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        {bot.is_enabled ? (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleStopBot(bot.id)}
                            title="Stop Bot"
                          >
                            <Stop />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleStartBot(bot.id)}
                            title="Start Bot"
                          >
                            <PlayArrow />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteBot(bot.id)}
                          title="Delete Bot"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      <Chip
                        label={bot.status}
                        color={getStatusColor(bot.status)}
                        size="small"
                      />
                      <Chip
                        label={bot.strategy_type}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={bot.is_paper_trading ? 'Paper Trading' : 'Live Trading'}
                        size="small"
                        color={bot.is_paper_trading ? 'info' : 'warning'}
                      />
                      <Chip
                        label={`Symbols: ${bot.symbols.join(', ')}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>

                    <Box display="flex" gap={3} width="100%">
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total Trades
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {bot.total_trades}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Win Rate
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {bot.total_trades > 0
                            ? ((bot.winning_trades / bot.total_trades) * 100).toFixed(1)
                            : 0}%
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Net P/L
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={bot.total_profit - bot.total_loss >= 0 ? 'success.main' : 'error.main'}
                        >
                          ${((bot.total_profit || 0) - (bot.total_loss || 0)).toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>

                    {bot.last_error && (
                      <Alert severity="warning" sx={{ width: '100%', mt: 1 }}>
                        Last Error: {bot.last_error}
                      </Alert>
                    )}
                  </ListItem>
                  {index < bots.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Create Bot Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Trading Bot</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Bot Name"
              value={newBot.name}
              onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Description"
              value={newBot.description}
              onChange={(e) => setNewBot({ ...newBot, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />

            <TextField
              select
              fullWidth
              label="Strategy Type"
              value={newBot.strategyType}
              onChange={(e) => setNewBot({ ...newBot, strategyType: e.target.value })}
              margin="normal"
            >
              <MenuItem value="momentum">Momentum</MenuItem>
              <MenuItem value="dca">DCA (Dollar Cost Average)</MenuItem>
              <MenuItem value="grid">Grid Trading</MenuItem>
              <MenuItem value="ai_generated">AI Generated</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Symbols (comma-separated)"
              value={newBot.symbols.join(',')}
              onChange={(e) => setNewBot({ ...newBot, symbols: e.target.value.split(',').map(s => s.trim()) })}
              margin="normal"
              helperText="e.g., BTC,ETH,SOL"
            />

            <TextField
              fullWidth
              type="number"
              label="Max Position Size ($)"
              value={newBot.maxPositionSize}
              onChange={(e) => setNewBot({ ...newBot, maxPositionSize: parseFloat(e.target.value) })}
              margin="normal"
            />

            <TextField
              fullWidth
              type="number"
              label="Max Daily Loss ($)"
              value={newBot.maxDailyLoss}
              onChange={(e) => setNewBot({ ...newBot, maxDailyLoss: parseFloat(e.target.value) })}
              margin="normal"
            />

            <TextField
              fullWidth
              type="number"
              label="Stop Loss (%)"
              value={newBot.stopLossPercentage}
              onChange={(e) => setNewBot({ ...newBot, stopLossPercentage: parseFloat(e.target.value) })}
              margin="normal"
            />

            <TextField
              fullWidth
              type="number"
              label="Take Profit (%)"
              value={newBot.takeProfitPercentage}
              onChange={(e) => setNewBot({ ...newBot, takeProfitPercentage: parseFloat(e.target.value) })}
              margin="normal"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newBot.isPaperTrading}
                  onChange={(e) => setNewBot({ ...newBot, isPaperTrading: e.target.checked })}
                />
              }
              label="Paper Trading (Recommended for testing)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateBot}
            variant="contained"
            disabled={!newBot.name || !newBot.strategyType}
          >
            Create Bot
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
