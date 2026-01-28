import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Avatar,
  Fab
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { getTradingAssistance } from '../../services/aiApi';

const AIChatAssistant = ({ open, onClose, context = {} }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI Trading Assistant. Ask me anything about cryptocurrency trading, technical analysis, risk management, or market insights.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await getTradingAssistance(input, context);

      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp)
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '800px'
        }
      }}
    >
      <DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6" fontWeight="700">
              AI Trading Assistant
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <Avatar
                sx={{
                  bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                  width: 36,
                  height: 36
                }}
              >
                {message.role === 'user' ? <PersonIcon /> : <AIIcon />}
              </Avatar>
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.role === 'user' ? 'primary.light' : 'grey.100',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary'
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    opacity: 0.7
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))}
          {loading && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>
                <AIIcon />
              </Avatar>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.100' }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>
                  Thinking...
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about trading strategies, technical indicators, risk management..."
          disabled={loading}
          sx={{ mr: 1 }}
        />
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!input.trim() || loading}
          endIcon={<SendIcon />}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AIChatFab = ({ context }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
        onClick={() => setOpen(true)}
      >
        <AIIcon />
      </Fab>
      <AIChatAssistant open={open} onClose={() => setOpen(false)} context={context} />
    </>
  );
};

export default AIChatAssistant;
