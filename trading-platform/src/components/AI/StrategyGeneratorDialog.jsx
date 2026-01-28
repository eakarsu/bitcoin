import { useState } from 'react';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  Psychology as AIIcon,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import { generateStrategy } from '../../services/aiApi';

const StrategyGeneratorDialog = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [userProfile, setUserProfile] = useState({
    risk_tolerance: 'medium',
    experience: 'intermediate',
    capital: 10000,
    time_commitment: 'part-time',
    goals: 'growth'
  });
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);

  const steps = ['Profile', 'Generate', 'Review'];

  const handleNext = async () => {
    if (activeStep === 1) {
      await generateStrategyNow();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const generateStrategyNow = async () => {
    setLoading(true);
    try {
      const data = await generateStrategy(userProfile);
      setStrategy(data);
      setActiveStep(2);
    } catch (error) {
      console.error('Strategy Generation Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setStrategy(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h6" fontWeight="700">
              AI Strategy Generator
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Tell us about your trading preferences to generate a personalized strategy
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Risk Tolerance</InputLabel>
              <Select
                value={userProfile.risk_tolerance}
                label="Risk Tolerance"
                onChange={(e) => setUserProfile({ ...userProfile, risk_tolerance: e.target.value })}
              >
                <MenuItem value="low">Conservative</MenuItem>
                <MenuItem value="medium">Moderate</MenuItem>
                <MenuItem value="high">Aggressive</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Experience Level</InputLabel>
              <Select
                value={userProfile.experience}
                label="Experience Level"
                onChange={(e) => setUserProfile({ ...userProfile, experience: e.target.value })}
              >
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
                <MenuItem value="expert">Expert</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Trading Capital ($)"
              type="number"
              value={userProfile.capital}
              onChange={(e) => setUserProfile({ ...userProfile, capital: parseInt(e.target.value) })}
            />

            <FormControl fullWidth>
              <InputLabel>Time Commitment</InputLabel>
              <Select
                value={userProfile.time_commitment}
                label="Time Commitment"
                onChange={(e) => setUserProfile({ ...userProfile, time_commitment: e.target.value })}
              >
                <MenuItem value="casual">Casual (Few hours/week)</MenuItem>
                <MenuItem value="part-time">Part-time (Few hours/day)</MenuItem>
                <MenuItem value="full-time">Full-time (All day)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Trading Goals</InputLabel>
              <Select
                value={userProfile.goals}
                label="Trading Goals"
                onChange={(e) => setUserProfile({ ...userProfile, goals: e.target.value })}
              >
                <MenuItem value="income">Regular Income</MenuItem>
                <MenuItem value="growth">Portfolio Growth</MenuItem>
                <MenuItem value="preservation">Capital Preservation</MenuItem>
                <MenuItem value="speculation">High Risk/Reward</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 4 }}>
            {loading ? (
              <>
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary">
                  AI is generating your personalized strategy...
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Analyzing market conditions and your preferences
                </Typography>
              </>
            ) : (
              <>
                <AIIcon sx={{ fontSize: 80 }} color="primary" />
                <Typography variant="h6">
                  Ready to generate your strategy
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Click "Generate Strategy" to create a personalized trading plan based on your profile
                </Typography>
              </>
            )}
          </Box>
        )}

        {activeStep === 2 && strategy && (
          <Box>
            <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: 'primary.light' }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 1 }}>
                {strategy.strategy_type || 'Custom Trading Strategy'}
              </Typography>
              <Typography variant="body2">
                Personalized for {userProfile.risk_tolerance} risk tolerance and {userProfile.experience} level trader
              </Typography>
            </Paper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {strategy.entry_criteria && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" color="success.main" sx={{ mb: 1 }}>
                    Entry Criteria
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {typeof strategy.entry_criteria === 'string'
                      ? strategy.entry_criteria
                      : JSON.stringify(strategy.entry_criteria)}
                  </Typography>
                </Box>
              )}

              {strategy.exit_criteria && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" color="error.main" sx={{ mb: 1 }}>
                    Exit Criteria
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {typeof strategy.exit_criteria === 'string'
                      ? strategy.exit_criteria
                      : JSON.stringify(strategy.exit_criteria)}
                  </Typography>
                </Box>
              )}

              {strategy.risk_management && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" color="warning.main" sx={{ mb: 1 }}>
                    Risk Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {typeof strategy.risk_management === 'string'
                      ? strategy.risk_management
                      : JSON.stringify(strategy.risk_management)}
                  </Typography>
                </Box>
              )}

              {strategy.strategy && (
                <Box>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                    Complete Strategy
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {typeof strategy.strategy === 'string'
                      ? strategy.strategy
                      : JSON.stringify(strategy.strategy, null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<NavigateBefore />}
          >
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<NavigateNext />}
              disabled={loading}
            >
              {activeStep === 1 ? 'Generate Strategy' : 'Next'}
            </Button>
          ) : (
            <Button variant="contained" onClick={handleClose}>
              Finish
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default StrategyGeneratorDialog;
