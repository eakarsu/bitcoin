import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Link,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Email,
  Lock,
  VpnKey,
  Visibility,
  VisibilityOff,
  LockReset,
  ArrowBack,
  CheckCircleOutline,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PasswordStrength from '../../components/shared/PasswordStrength';

const steps = ['Request Reset', 'Set New Password'];

const PasswordReset = () => {
  const { requestPasswordReset, confirmPasswordReset } = useAuth();
  const toast = useToast();

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState({});

  // Step 1 state
  const [email, setEmail] = useState('');

  // Step 2 state
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordScore = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
    return score;
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!token.trim()) {
      newErrors.token = 'Reset token is required';
    }
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (getPasswordScore(newPassword) < 3) {
      newErrors.newPassword = 'Password is too weak. Please include uppercase, lowercase, numbers, and special characters.';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);
    try {
      await requestPasswordReset(email);
      toast.success('Reset instructions sent! Check your email for the reset token.');
      setActiveStep(1);
      setErrors({});
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to send reset email. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      await confirmPasswordReset(token, newPassword);
      toast.success('Password reset successful! You can now sign in with your new password.');
      setCompleted(true);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Password reset failed. The token may be invalid or expired.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Success state after password has been reset
  if (completed) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                py: 4,
                px: 3,
                textAlign: 'center',
              }}
            >
              <CheckCircleOutline sx={{ fontSize: 48, color: 'white', mb: 1 }} />
              <Typography variant="h4" fontWeight="bold" color="white">
                Password Reset Complete
              </Typography>
            </Box>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your password has been successfully reset. You can now sign in with your new password.
              </Typography>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #624088 100%)',
                  },
                }}
              >
                Go to Sign In
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Gradient Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              py: 4,
              px: 3,
              textAlign: 'center',
            }}
          >
            <LockReset sx={{ fontSize: 48, color: 'white', mb: 1 }} />
            <Typography variant="h4" fontWeight="bold" color="white">
              Reset Password
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              {activeStep === 0
                ? 'Enter your email to receive a reset token'
                : 'Enter the token and your new password'}
            </Typography>
          </Box>

          {/* Stepper */}
          <Box sx={{ px: 4, pt: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Step 1: Request Reset */}
          {activeStep === 0 && (
            <CardContent sx={{ p: 4 }}>
              <Box component="form" onSubmit={handleRequestReset} noValidate>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter the email address associated with your account and we will send you a reset token.
                </Typography>

                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  error={!!errors.email}
                  helperText={errors.email}
                  margin="normal"
                  autoComplete="email"
                  autoFocus
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #624088 100%)',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Send Reset Token'
                  )}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Link
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                    underline="hover"
                    sx={{
                      color: 'primary.main',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <ArrowBack fontSize="small" />
                    Back to Sign In
                  </Link>
                </Box>
              </Box>
            </CardContent>
          )}

          {/* Step 2: Confirm Reset */}
          {activeStep === 1 && (
            <CardContent sx={{ p: 4 }}>
              <Box component="form" onSubmit={handleConfirmReset} noValidate>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Enter the reset token you received via email and choose a new password.
                </Typography>

                <TextField
                  fullWidth
                  label="Reset Token"
                  name="token"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    if (errors.token) setErrors((prev) => ({ ...prev, token: '' }));
                  }}
                  error={!!errors.token}
                  helperText={errors.token}
                  margin="normal"
                  autoFocus
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKey color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword}
                  margin="normal"
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <PasswordStrength password={newPassword} />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  margin="normal"
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #624088 100%)',
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 3,
                  }}
                >
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    underline="hover"
                    onClick={() => {
                      setActiveStep(0);
                      setErrors({});
                    }}
                    sx={{
                      color: 'text.secondary',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <ArrowBack fontSize="small" />
                    Resend Token
                  </Link>

                  <Link
                    component={RouterLink}
                    to="/login"
                    variant="body2"
                    underline="hover"
                    sx={{ color: 'primary.main' }}
                  >
                    Back to Sign In
                  </Link>
                </Box>
              </Box>
            </CardContent>
          )}
        </Card>
      </Container>
    </Box>
  );
};

export default PasswordReset;
