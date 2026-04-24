import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  MenuItem,
  Chip,
  Divider,
  Tab,
  IconButton,
  InputAdornment,
  Stack,
} from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
  Person,
  Lock,
  Info,
  Warning,
  Visibility,
  VisibilityOff,
  Save,
  Logout,
  VerifiedUser,
  ErrorOutline,
  Edit,
  Shield,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import PasswordStrength from '../../components/shared/PasswordStrength';
import { ProfileSkeleton } from '../../components/shared/LoadingSkeleton';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'America/Toronto', label: 'Eastern Time (Canada)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina Time' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Moscow', label: 'Moscow Time' },
  { value: 'Europe/Istanbul', label: 'Istanbul (TRT)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time' },
  { value: 'Asia/Kolkata', label: 'India Standard Time' },
  { value: 'Asia/Bangkok', label: 'Indochina Time' },
  { value: 'Asia/Shanghai', label: 'China Standard Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time' },
  { value: 'Asia/Singapore', label: 'Singapore Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

const TIER_COLORS = {
  free: 'default',
  basic: 'info',
  pro: 'secondary',
  premium: 'warning',
  enterprise: 'success',
};

function getInitials(name, email) {
  if (name) {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading, updateProfile, changePassword, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('1');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    bio: '',
    timezone: '',
    notifications_enabled: true,
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Populate profile form when user data loads
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        timezone: user.timezone || 'UTC',
        notifications_enabled: user.notifications_enabled ?? true,
      });
    }
  }, [user]);

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <ProfileSkeleton />
      </Container>
    );
  }

  // No user (shouldn't happen if route is protected, but handle gracefully)
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h6" color="text.secondary" textAlign="center">
          Please log in to view your profile settings.
        </Typography>
      </Container>
    );
  }

  // Handlers
  const handleProfileChange = (field) => (event) => {
    const value = field === 'notifications_enabled' ? event.target.checked : event.target.value;
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordForm((prev) => ({ ...prev, [field]: event.target.value }));
    // Clear errors as user types
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (passwordForm.currentPassword && passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSave = async () => {
    if (!validatePasswordForm()) return;

    setPasswordSaving(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('You have been logged out');
      navigate('/login');
    } catch {
      // logout context already clears state, navigate regardless
      navigate('/login');
    }
  };

  const gradientBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* ========== Profile Header ========== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: gradientBg,
          color: '#fff',
        }}
      >
        <Avatar
          src={user.avatar_url || undefined}
          sx={{
            width: 88,
            height: 88,
            fontSize: '2rem',
            fontWeight: 700,
            bgcolor: 'rgba(255,255,255,0.25)',
            border: '3px solid rgba(255,255,255,0.5)',
          }}
        >
          {getInitials(user.name, user.email)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700} noWrap>
            {user.name || 'Unnamed User'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mb: 1 }} noWrap>
            {user.email}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={(user.subscription_tier || 'free').toUpperCase()}
              size="small"
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: 0.5,
              }}
            />
            {user.email_verified ? (
              <Chip
                icon={<VerifiedUser sx={{ color: '#fff !important', fontSize: 16 }} />}
                label="Email Verified"
                size="small"
                sx={{
                  bgcolor: 'rgba(76,175,80,0.35)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            ) : (
              <Chip
                icon={<ErrorOutline sx={{ color: '#fff !important', fontSize: 16 }} />}
                label="Email Not Verified"
                size="small"
                sx={{
                  bgcolor: 'rgba(244,67,54,0.35)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            )}
          </Stack>
        </Box>
      </Box>

      {/* ========== Tab Navigation ========== */}
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <TabList
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 48,
              },
              '& .Mui-selected': {
                color: '#667eea',
              },
              '& .MuiTabs-indicator': {
                background: gradientBg,
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab icon={<Person />} iconPosition="start" label="Profile" value="1" />
            <Tab icon={<Lock />} iconPosition="start" label="Password" value="2" />
            <Tab icon={<Info />} iconPosition="start" label="Account" value="3" />
            <Tab icon={<Warning />} iconPosition="start" label="Danger Zone" value="4" />
          </TabList>
        </Box>

        {/* ========== Tab 1: Profile Info ========== */}
        <TabPanel value="1" sx={{ p: 0 }}>
          <Card>
            <CardHeader
              avatar={<Edit sx={{ color: '#667eea' }} />}
              title={
                <Typography variant="h6" fontWeight={600}>
                  Profile Information
                </Typography>
              }
              subheader="Update your personal details and preferences"
            />
            <Divider />
            <CardContent sx={{ pt: 3 }}>
              <Stack spacing={3}>
                <TextField
                  label="Full Name"
                  value={profileForm.name}
                  onChange={handleProfileChange('name')}
                  fullWidth
                  placeholder="Enter your full name"
                />

                <TextField
                  label="Phone Number"
                  value={profileForm.phone}
                  onChange={handleProfileChange('phone')}
                  fullWidth
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                />

                <TextField
                  label="Bio"
                  value={profileForm.bio}
                  onChange={handleProfileChange('bio')}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Tell us about yourself..."
                  inputProps={{ maxLength: 500 }}
                  helperText={`${profileForm.bio.length}/500 characters`}
                />

                <TextField
                  label="Timezone"
                  value={profileForm.timezone}
                  onChange={handleProfileChange('timezone')}
                  fullWidth
                  select
                >
                  {TIMEZONES.map((tz) => (
                    <MenuItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </MenuItem>
                  ))}
                </TextField>

                <FormControlLabel
                  control={
                    <Switch
                      checked={profileForm.notifications_enabled}
                      onChange={handleProfileChange('notifications_enabled')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#667eea',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#667eea',
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        Email Notifications
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive trading signals, alerts, and platform updates via email
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', ml: 0 }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    sx={{
                      background: gradientBg,
                      px: 4,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #624088 100%)',
                      },
                    }}
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ========== Tab 2: Change Password ========== */}
        <TabPanel value="2" sx={{ p: 0 }}>
          <Card>
            <CardHeader
              avatar={<Shield sx={{ color: '#667eea' }} />}
              title={
                <Typography variant="h6" fontWeight={600}>
                  Change Password
                </Typography>
              }
              subheader="Ensure your account stays secure by using a strong password"
            />
            <Divider />
            <CardContent sx={{ pt: 3 }}>
              <Stack spacing={3}>
                <TextField
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange('currentPassword')}
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword}
                  fullWidth
                  placeholder="Enter your current password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword((v) => !v)}
                          edge="end"
                          size="small"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box>
                  <TextField
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange('newPassword')}
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
                    fullWidth
                    placeholder="Enter a new password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword((v) => !v)}
                            edge="end"
                            size="small"
                          >
                            {showNewPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <PasswordStrength password={passwordForm.newPassword} />
                </Box>

                <TextField
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange('confirmPassword')}
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword}
                  fullWidth
                  placeholder="Confirm your new password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Lock />}
                    onClick={handlePasswordSave}
                    disabled={passwordSaving}
                    sx={{
                      background: gradientBg,
                      px: 4,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #624088 100%)',
                      },
                    }}
                  >
                    {passwordSaving ? 'Updating...' : 'Update Password'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ========== Tab 3: Account Info (Read-Only) ========== */}
        <TabPanel value="3" sx={{ p: 0 }}>
          <Card>
            <CardHeader
              avatar={<Info sx={{ color: '#667eea' }} />}
              title={
                <Typography variant="h6" fontWeight={600}>
                  Account Information
                </Typography>
              }
              subheader="Read-only details about your account"
            />
            <Divider />
            <CardContent sx={{ pt: 3 }}>
              <Stack spacing={3}>
                {/* Subscription Tier */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Subscription Tier
                  </Typography>
                  <Chip
                    label={(user.subscription_tier || 'free').toUpperCase()}
                    color={TIER_COLORS[user.subscription_tier] || 'default'}
                    size="small"
                    sx={{ fontWeight: 700, letterSpacing: 0.5 }}
                  />
                </Box>
                <Divider />

                {/* Email Verified */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Email Verification
                  </Typography>
                  {user.email_verified ? (
                    <Chip
                      icon={<VerifiedUser sx={{ fontSize: 16 }} />}
                      label="Verified"
                      color="success"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  ) : (
                    <Chip
                      icon={<ErrorOutline sx={{ fontSize: 16 }} />}
                      label="Not Verified"
                      color="error"
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  )}
                </Box>
                <Divider />

                {/* Account Created */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Account Created
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(user.created_at)}
                  </Typography>
                </Box>
                <Divider />

                {/* Last Login */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Last Login
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(user.last_login)}
                  </Typography>
                </Box>
                <Divider />

                {/* User Roles */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    Roles
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Chip
                          key={role}
                          label={role.charAt(0).toUpperCase() + role.slice(1)}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            borderColor: '#667eea',
                            color: '#667eea',
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No roles assigned
                      </Typography>
                    )}
                  </Stack>
                </Box>

                {/* User ID */}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={500}>
                    User ID
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      bgcolor: 'grey.100',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      color: 'text.secondary',
                    }}
                  >
                    {user.id}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ========== Tab 4: Danger Zone ========== */}
        <TabPanel value="4" sx={{ p: 0 }}>
          <Card
            sx={{
              border: '2px solid',
              borderColor: 'error.main',
              '&:hover': {
                boxShadow: '0 4px 16px rgba(244,67,54,0.15)',
              },
            }}
          >
            <CardHeader
              avatar={<Warning sx={{ color: 'error.main' }} />}
              title={
                <Typography variant="h6" fontWeight={600} color="error.main">
                  Danger Zone
                </Typography>
              }
              subheader="Irreversible and destructive actions"
            />
            <Divider sx={{ borderColor: 'error.light' }} />
            <CardContent sx={{ pt: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(244,67,54,0.04)',
                  border: '1px solid',
                  borderColor: 'rgba(244,67,54,0.2)',
                }}
              >
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    Log Out
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Sign out of your account on this device. You will need to log in again to access
                    your dashboard and trading tools.
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Logout />}
                  onClick={handleLogout}
                  sx={{
                    ml: 3,
                    minWidth: 120,
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      bgcolor: 'error.main',
                      color: '#fff',
                    },
                  }}
                >
                  Log Out
                </Button>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </TabContext>
    </Container>
  );
}
