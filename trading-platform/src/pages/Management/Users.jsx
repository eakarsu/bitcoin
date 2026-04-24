import { useState, useCallback, useEffect } from 'react';
import {
  Box, Container, Grid, Card, CardContent, Typography, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Divider,
  Stack, IconButton, Skeleton
} from '@mui/material';
import {
  People, VerifiedUser, Star, Business,
  CheckCircle, Cancel, Close, Email,
  CalendarToday, Login, Badge, AccountCircle
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import DataTable from '../../components/shared/DataTable';

// ── Subscription tier chip color mapping ─────────────────────────────
const tierConfig = {
  free: { color: 'default', label: 'Free' },
  professional: { color: 'info', label: 'Professional' },
  premium: { color: 'secondary', label: 'Premium' },
  enterprise: { color: 'warning', label: 'Enterprise' },
};

// ── Helper: get initials from name or email ──────────────────────────
const getInitials = (name, email) => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
};

// ── Helper: avatar background based on name hash ─────────────────────
const getAvatarColor = (str) => {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#fa709a',
    '#a18cd1', '#fbc2eb', '#fccb90', '#667eea',
  ];
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// ── Helper: safe date formatting ─────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return 'Never';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy');
  } catch {
    return 'Invalid date';
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'Never';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  } catch {
    return 'Invalid date';
  }
};

// ── Stats card component ─────────────────────────────────────────────
const StatsCard = ({ icon, label, value, gradient, active, onClick, loading }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: 'pointer',
      background: active ? gradient : 'background.paper',
      color: active ? 'white' : 'text.primary',
      transition: 'all 0.3s ease-in-out',
      border: '1px solid',
      borderColor: active ? 'transparent' : 'divider',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      },
    }}
  >
    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography
            variant="body2"
            sx={{ opacity: active ? 0.9 : 0.7, fontWeight: 500, mb: 0.5 }}
          >
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={36} />
          ) : (
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 3,
            backgroundColor: active ? 'rgba(255,255,255,0.2)' : 'rgba(102,126,234,0.08)',
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// ── Table column definitions ─────────────────────────────────────────
const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (value, row) => (
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            fontSize: 14,
            fontWeight: 700,
            bgcolor: getAvatarColor(row.name || row.email),
          }}
        >
          {getInitials(row.name, row.email)}
        </Avatar>
        <Typography variant="body2" fontWeight={600}>
          {value || 'Unnamed User'}
        </Typography>
      </Stack>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    render: (value) => (
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    ),
  },
  {
    key: 'subscription_tier',
    label: 'Subscription',
    sortable: true,
    render: (value) => {
      const config = tierConfig[value] || tierConfig.free;
      return (
        <Chip
          label={config.label}
          color={config.color}
          size="small"
          sx={{
            fontWeight: 600,
            ...(value === 'enterprise' && {
              background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              color: '#5d4037',
              '& .MuiChip-label': { fontWeight: 700 },
            }),
          }}
        />
      );
    },
  },
  {
    key: 'email_verified',
    label: 'Verified',
    sortable: true,
    align: 'center',
    render: (value) =>
      value ? (
        <CheckCircle sx={{ color: 'success.main', fontSize: 22 }} />
      ) : (
        <Cancel sx={{ color: 'error.main', fontSize: 22 }} />
      ),
  },
  {
    key: 'last_login',
    label: 'Last Login',
    sortable: true,
    render: (value) => (
      <Typography variant="body2" color="text.secondary">
        {formatDate(value)}
      </Typography>
    ),
  },
  {
    key: 'created_at',
    label: 'Joined',
    sortable: true,
    render: (value) => (
      <Typography variant="body2" color="text.secondary">
        {formatDate(value)}
      </Typography>
    ),
  },
];

// ── Filter definitions ───────────────────────────────────────────────
const tableFilters = [
  {
    key: 'subscription_tier',
    label: 'Subscription Tier',
    options: [
      { value: 'free', label: 'Free' },
      { value: 'professional', label: 'Professional' },
      { value: 'premium', label: 'Premium' },
      { value: 'enterprise', label: 'Enterprise' },
    ],
  },
  {
    key: 'email_verified',
    label: 'Email Verified',
    options: [
      { value: 'true', label: 'Verified' },
      { value: 'false', label: 'Not Verified' },
    ],
  },
];

// ── User Detail Dialog ───────────────────────────────────────────────
const UserDetailDialog = ({ user, open, onClose }) => {
  if (!user) return null;

  const tier = tierConfig[user.subscription_tier] || tierConfig.free;

  const detailFields = [
    { icon: <Email fontSize="small" />, label: 'Email', value: user.email },
    {
      icon: <VerifiedUser fontSize="small" />,
      label: 'Email Verified',
      value: user.email_verified ? (
        <Chip label="Verified" color="success" size="small" icon={<CheckCircle />} />
      ) : (
        <Chip label="Not Verified" color="error" size="small" icon={<Cancel />} />
      ),
    },
    {
      icon: <Star fontSize="small" />,
      label: 'Subscription Tier',
      value: (
        <Chip
          label={tier.label}
          color={tier.color}
          size="small"
          sx={{
            fontWeight: 600,
            ...(user.subscription_tier === 'enterprise' && {
              background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              color: '#5d4037',
              '& .MuiChip-label': { fontWeight: 700 },
            }),
          }}
        />
      ),
    },
    {
      icon: <Login fontSize="small" />,
      label: 'Last Login',
      value: formatDateTime(user.last_login),
    },
    {
      icon: <CalendarToday fontSize="small" />,
      label: 'Member Since',
      value: formatDateTime(user.created_at),
    },
    {
      icon: <Badge fontSize="small" />,
      label: 'User ID',
      value: (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
          {user.id}
        </Typography>
      ),
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ p: 0, position: 'relative' }}>
        {/* Gradient header */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            pt: 4,
            pb: 5,
            px: 3,
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'rgba(255,255,255,0.8)',
              '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Avatar overlapping header */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: -5 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              fontSize: 28,
              fontWeight: 700,
              bgcolor: getAvatarColor(user.name || user.email),
              border: '4px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {getInitials(user.name, user.email)}
          </Avatar>
        </Box>

        {/* Name and email below avatar */}
        <Box sx={{ textAlign: 'center', pt: 1.5, px: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            {user.name || 'Unnamed User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, px: 3, pb: 1 }}>
        <Stack spacing={0} divider={<Divider />}>
          {detailFields.map((field, idx) => (
            <Stack
              key={idx}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ py: 1.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ color: 'text.secondary' }}>{field.icon}</Box>
                <Typography variant="body2" color="text.secondary">
                  {field.label}
                </Typography>
              </Stack>
              <Box>
                {typeof field.value === 'string' ? (
                  <Typography variant="body2" fontWeight={500}>
                    {field.value}
                  </Typography>
                ) : (
                  field.value
                )}
              </Box>
            </Stack>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" fullWidth>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── Main Users Page ──────────────────────────────────────────────────
const Users = () => {
  const toast = useToast();

  // Stats state
  const [stats, setStats] = useState({ total: 0, verified: 0, premium: 0, enterprise: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Active stats card filter
  const [activeFilter, setActiveFilter] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Detail dialog
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Load stats on mount ─────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      // Fetch a summary by requesting page 1 with a large enough window.
      // We rely on the pagination.total to get the full count and fetch
      // filtered counts for each card.
      const [allRes, verifiedRes, premiumRes, enterpriseRes] = await Promise.all([
        api.get('/api/users', { params: { page: 1, limit: 1 } }),
        api.get('/api/users', { params: { page: 1, limit: 1, email_verified: 'true' } }),
        api.get('/api/users', { params: { page: 1, limit: 1, subscription_tier: 'premium' } }),
        api.get('/api/users', { params: { page: 1, limit: 1, subscription_tier: 'enterprise' } }),
      ]);

      setStats({
        total: allRes.data?.pagination?.total ?? 0,
        verified: verifiedRes.data?.pagination?.total ?? 0,
        premium: premiumRes.data?.pagination?.total ?? 0,
        enterprise: enterpriseRes.data?.pagination?.total ?? 0,
      });
    } catch (err) {
      console.error('Failed to load user stats:', err);
      toast.error('Failed to load user statistics');
    }
    setStatsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // ── Fetch data callback for DataTable ───────────────────────────
  const fetchUsers = useCallback(
    async (params) => {
      // Merge in any active stats-card filter
      const mergedParams = { ...params };
      if (activeFilter) {
        Object.assign(mergedParams, activeFilter);
      }
      const response = await api.get('/api/users', { params: mergedParams });
      return response.data;
    },
    [activeFilter]
  );

  // ── Stats card click handlers ───────────────────────────────────
  const handleStatsClick = (filterKey) => {
    if (activeFilter && JSON.stringify(activeFilter) === JSON.stringify(filterKey)) {
      // Toggle off if same filter clicked
      setActiveFilter(null);
    } else {
      setActiveFilter(filterKey);
    }
    setRefreshTrigger((prev) => prev + 1);
  };

  // ── Row click handler ───────────────────────────────────────────
  const handleRowClick = (user) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  // ── Stats cards config ──────────────────────────────────────────
  const statsCards = [
    {
      label: 'Total Users',
      value: stats.total.toLocaleString(),
      icon: <People sx={{ fontSize: 28, color: 'primary.main' }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      filter: null,
    },
    {
      label: 'Verified Users',
      value: stats.verified.toLocaleString(),
      icon: <VerifiedUser sx={{ fontSize: 28, color: 'success.main' }} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      filter: { email_verified: 'true' },
    },
    {
      label: 'Premium+ Users',
      value: stats.premium.toLocaleString(),
      icon: <Star sx={{ fontSize: 28, color: 'secondary.main' }} />,
      gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      filter: { subscription_tier: 'premium' },
    },
    {
      label: 'Enterprise Users',
      value: stats.enterprise.toLocaleString(),
      icon: <Business sx={{ fontSize: 28, color: 'warning.main' }} />,
      gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      filter: { subscription_tier: 'enterprise' },
    },
  ];

  return (
    <Box sx={{ py: 4, minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl">
        {/* Page Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
            <AccountCircle sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" fontWeight="bold">
              User Management
            </Typography>
          </Stack>
          <Typography variant="body1" color="text.secondary">
            View and monitor all registered users on the platform
          </Typography>
        </Box>

        {/* Stats Cards Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statsCards.map((card, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <StatsCard
                icon={card.icon}
                label={card.label}
                value={card.value}
                gradient={card.gradient}
                loading={statsLoading}
                active={
                  activeFilter !== null &&
                  JSON.stringify(activeFilter) === JSON.stringify(card.filter)
                }
                onClick={() => handleStatsClick(card.filter)}
              />
            </Grid>
          ))}
        </Grid>

        {/* Data Table */}
        <DataTable
          title="All Users"
          columns={columns}
          fetchData={fetchUsers}
          onRowClick={handleRowClick}
          filters={tableFilters}
          resource="users"
          refreshTrigger={refreshTrigger}
        />

        {/* User Detail Dialog */}
        <UserDetailDialog
          user={selectedUser}
          open={detailOpen}
          onClose={() => {
            setDetailOpen(false);
            setSelectedUser(null);
          }}
        />
      </Container>
    </Box>
  );
};

export default Users;
