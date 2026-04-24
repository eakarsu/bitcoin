import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box, Container, Grid, Typography, Card, CardContent, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
  Select, FormControl, InputLabel, LinearProgress, Divider, IconButton,
  alpha, Stack
} from '@mui/material';
import {
  AccountTree, PlayArrow, EmojiEvents, AttachMoney,
  Edit, Delete, Close, TrendingUp, TrendingDown
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';

// ── Constants ────────────────────────────────────────────────────────────────

const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'testing', label: 'Testing' },
];

const TYPE_OPTIONS = [
  'Statistical Arbitrage',
  'Trend Following',
  'Market Making',
  'AI/ML',
  'Scalping',
  'DCA',
  'Grid Trading',
];

const STATUS_COLORS = {
  active: 'success',
  paused: 'warning',
  testing: 'info',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v) => {
  const n = parseFloat(v) || 0;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPercent = (v) => {
  const n = parseFloat(v) || 0;
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
};

const fmtDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

// ── Stats Card (custom inline for clickable filter) ──────────────────────────

const StatCard = ({ title, value, icon: Icon, gradient, onClick, active }) => (
  <Card
    onClick={onClick}
    sx={{
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      borderRadius: 3,
      border: '2px solid',
      borderColor: active ? 'primary.main' : 'transparent',
      boxShadow: active
        ? '0 8px 30px rgba(102,126,234,0.25)'
        : '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      },
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5, mb: 1 }}
          >
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            background: gradient || GRADIENT,
            borderRadius: 2.5,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ color: '#fff', fontSize: 32 }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ── Column Definitions ───────────────────────────────────────────────────────

const buildColumns = () => [
  {
    key: 'name',
    label: 'Name',
    render: (val) => (
      <Typography variant="body2" fontWeight={600}>{val}</Typography>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    render: (val) => (
      <Chip label={val} size="small" variant="outlined" sx={{ fontWeight: 500 }} />
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => (
      <Chip
        label={val}
        size="small"
        color={STATUS_COLORS[val] || 'default'}
        sx={{ textTransform: 'capitalize', fontWeight: 600 }}
      />
    ),
  },
  {
    key: 'pnl',
    label: 'PnL',
    align: 'right',
    render: (val) => {
      const n = parseFloat(val) || 0;
      return (
        <Typography variant="body2" fontWeight={600} color={n >= 0 ? 'success.main' : 'error.main'}>
          {fmtCurrency(val)}
        </Typography>
      );
    },
  },
  {
    key: 'pnl_percent',
    label: 'PnL %',
    align: 'right',
    render: (val) => {
      const n = parseFloat(val) || 0;
      return (
        <Typography variant="body2" fontWeight={600} color={n >= 0 ? 'success.main' : 'error.main'}>
          {fmtPercent(val)}
        </Typography>
      );
    },
  },
  {
    key: 'sharpe_ratio',
    label: 'Sharpe Ratio',
    align: 'right',
    render: (val) => (
      <Typography variant="body2">{parseFloat(val)?.toFixed(2) ?? '-'}</Typography>
    ),
  },
  {
    key: 'win_rate',
    label: 'Win Rate',
    align: 'right',
    render: (val) => {
      const n = parseFloat(val) || 0;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(n, 100)}
            sx={{
              width: 60,
              height: 6,
              borderRadius: 3,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: GRADIENT,
              },
            }}
          />
          <Typography variant="body2" fontWeight={500} sx={{ minWidth: 40, textAlign: 'right' }}>
            {n.toFixed(1)}%
          </Typography>
        </Box>
      );
    },
  },
  {
    key: 'trades_count',
    label: 'Trades',
    align: 'right',
    render: (val) => <Typography variant="body2">{val ?? 0}</Typography>,
  },
  {
    key: 'avg_hold_time',
    label: 'Avg Hold',
    align: 'right',
    render: (val) => <Typography variant="body2">{val || '-'}</Typography>,
  },
  {
    key: 'created_at',
    label: 'Created',
    align: 'right',
    render: (val) => <Typography variant="body2" color="text.secondary">{fmtDate(val)}</Typography>,
  },
];

// ── Main Component ───────────────────────────────────────────────────────────

const StrategiesManagement = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();

  // State
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [allStrategies, setAllStrategies] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null); // null | 'active' | 'winrate' | 'pnl'
  const [filterValues, setFilterValues] = useState({});

  // Dialogs
  const [detailDialog, setDetailDialog] = useState({ open: false, strategy: null });
  const [editDialog, setEditDialog] = useState({ open: false, strategy: null });
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const columns = useMemo(() => buildColumns(), []);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (params) => {
    const mergedParams = { ...params, ...filterValues };
    const response = await api.get('/api/strategies', { params: mergedParams });
    const result = response.data;

    // Keep a local copy for stats calculation
    if (result.data) {
      setAllStrategies(result.data);
    } else if (Array.isArray(result)) {
      setAllStrategies(result);
    }

    return result;
  }, [filterValues]);

  // Also fetch unfiltered data once for aggregate stats
  const [stats, setStats] = useState({ total: 0, active: 0, avgWinRate: 0, totalPnl: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/strategies', { params: { limit: 1000 } });
        const data = response.data?.data || response.data || [];
        const list = Array.isArray(data) ? data : [];
        const activeCount = list.filter((s) => s.status === 'active').length;
        const avgWin = list.length > 0
          ? list.reduce((sum, s) => sum + (parseFloat(s.win_rate) || 0), 0) / list.length
          : 0;
        const totalPnl = list.reduce((sum, s) => sum + (parseFloat(s.pnl) || 0), 0);
        setStats({
          total: list.length,
          active: activeCount,
          avgWinRate: avgWin,
          totalPnl,
        });
      } catch {
        // silent
      }
    };
    fetchStats();
  }, [refreshTrigger]);

  // ── Stat Card Clicks ────────────────────────────────────────────────────

  const handleStatClick = (filterType) => {
    if (activeFilter === filterType) {
      // Toggle off
      setActiveFilter(null);
      setFilterValues({});
    } else {
      setActiveFilter(filterType);
      switch (filterType) {
        case 'active':
          setFilterValues({ status: 'active' });
          break;
        case 'total':
          setFilterValues({});
          break;
        default:
          setFilterValues({});
          break;
      }
    }
    setRefreshTrigger((p) => p + 1);
  };

  // ── Row Actions ──────────────────────────────────────────────────────────

  const handleRowClick = (row) => {
    setDetailDialog({ open: true, strategy: row });
  };

  const handleEdit = (row) => {
    setEditForm({
      name: row.name || '',
      type: row.type || '',
      status: row.status || 'active',
      pnl: row.pnl ?? '',
      pnl_percent: row.pnl_percent ?? '',
      sharpe_ratio: row.sharpe_ratio ?? '',
      max_drawdown: row.max_drawdown ?? '',
      win_rate: row.win_rate ?? '',
    });
    setEditDialog({ open: true, strategy: row });
  };

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: 'Delete Strategy',
      message: `Are you sure you want to delete "${row.name}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/strategies/${row.id}`);
      toast.success(`Strategy "${row.name}" deleted successfully`);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete strategy');
    }
  };

  // ── Bulk Actions ─────────────────────────────────────────────────────────

  const handleBulkDelete = async (ids) => {
    const ok = await confirm({
      title: 'Delete Strategies',
      message: `Are you sure you want to delete ${ids.length} strategies? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete All',
    });
    if (!ok) return;
    try {
      await api.post('/api/strategies/bulk/delete', { ids });
      toast.success(`${ids.length} strategies deleted successfully`);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk delete failed');
    }
  };

  const handleBulkUpdate = async (ids, updates) => {
    try {
      await api.post('/api/strategies/bulk/update', { ids, updates });
      toast.success(`${ids.length} strategies updated successfully`);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk update failed');
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/api/strategies/export/csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'strategies.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported successfully');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  const handleExportPdf = async () => {
    try {
      const response = await api.get('/api/strategies/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'strategies.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  };

  // ── Edit Dialog Save ────────────────────────────────────────────────────

  const handleEditSave = async () => {
    if (!editDialog.strategy) return;
    setSaving(true);
    try {
      await api.put(`/api/strategies/${editDialog.strategy.id}`, editForm);
      toast.success(`Strategy "${editForm.name}" updated successfully`);
      setEditDialog({ open: false, strategy: null });
      setDetailDialog({ open: false, strategy: null });
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update strategy');
    } finally {
      setSaving(false);
    }
  };

  // ── Detail Dialog Delete ─────────────────────────────────────────────────

  const handleDetailDelete = async () => {
    if (!detailDialog.strategy) return;
    await handleDelete(detailDialog.strategy);
    setDetailDialog({ open: false, strategy: null });
  };

  // ── Filters for DataTable ────────────────────────────────────────────────

  const tableFilters = [
    {
      key: 'type',
      label: 'Type',
      options: TYPE_OPTIONS.map((t) => ({ value: t, label: t })),
    },
    {
      key: 'status',
      label: 'Status',
      options: STATUS_OPTIONS,
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────

  const s = detailDialog.strategy;

  return (
    <Container maxWidth="xl" sx={{ py: 5, px: { xs: 2, sm: 3, md: 4 } }}>
      {/* Page Header */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography
          variant="h3"
          fontWeight="700"
          gutterBottom
          sx={{
            background: GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
          }}
        >
          Strategy Management
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Monitor, edit, and manage all your trading strategies in one place
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Strategies"
            value={stats.total}
            icon={AccountTree}
            gradient={GRADIENT}
            onClick={() => handleStatClick('total')}
            active={activeFilter === 'total'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Strategies"
            value={stats.active}
            icon={PlayArrow}
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            onClick={() => handleStatClick('active')}
            active={activeFilter === 'active'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Win Rate"
            value={`${stats.avgWinRate.toFixed(1)}%`}
            icon={EmojiEvents}
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            onClick={() => handleStatClick('winrate')}
            active={activeFilter === 'winrate'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total PnL"
            value={fmtCurrency(stats.totalPnl)}
            icon={AttachMoney}
            gradient={stats.totalPnl >= 0
              ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
              : 'linear-gradient(135deg, #f5576c 0%, #ff6b6b 100%)'}
            onClick={() => handleStatClick('pnl')}
            active={activeFilter === 'pnl'}
          />
        </Grid>
      </Grid>

      {/* DataTable */}
      <DataTable
        title="Trading Strategies"
        columns={columns}
        fetchData={fetchData}
        onRowClick={handleRowClick}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onBulkUpdate={handleBulkUpdate}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        filters={tableFilters}
        resource="strategies"
        refreshTrigger={refreshTrigger}
      />

      {/* ── Detail Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, strategy: null })}
        maxWidth="md"
        fullWidth
      >
        {s && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box>
                <Typography variant="h5" fontWeight={700}>{s.name}</Typography>
                <Chip
                  label={s.status}
                  color={STATUS_COLORS[s.status] || 'default'}
                  size="small"
                  sx={{ mt: 0.5, textTransform: 'capitalize', fontWeight: 600 }}
                />
              </Box>
              <IconButton onClick={() => setDetailDialog({ open: false, strategy: null })}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {/* Performance Summary */}
              <Box
                sx={{
                  background: (theme) => alpha(theme.palette.primary.main, 0.04),
                  borderRadius: 2,
                  p: 2.5,
                  mb: 3,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Performance Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">PnL</Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={parseFloat(s.pnl) >= 0 ? 'success.main' : 'error.main'}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {parseFloat(s.pnl) >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                      {fmtCurrency(s.pnl)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">PnL %</Typography>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color={parseFloat(s.pnl_percent) >= 0 ? 'success.main' : 'error.main'}
                    >
                      {fmtPercent(s.pnl_percent)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Win Rate</Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {parseFloat(s.win_rate)?.toFixed(1) ?? '-'}%
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" color="text.secondary">Sharpe Ratio</Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {parseFloat(s.sharpe_ratio)?.toFixed(2) ?? '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Detail Fields */}
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Strategy ID</Typography>
                  <Typography variant="body1" fontWeight={500}>{s.id}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">User ID</Typography>
                  <Typography variant="body1" fontWeight={500}>{s.user_id ?? '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Type</Typography>
                  <Typography variant="body1" fontWeight={500}>{s.type}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>{s.status}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Max Drawdown</Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {s.max_drawdown != null ? `${parseFloat(s.max_drawdown).toFixed(2)}%` : '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Total Trades</Typography>
                  <Typography variant="body1" fontWeight={500}>{s.trades_count ?? 0}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Avg Hold Time</Typography>
                  <Typography variant="body1" fontWeight={500}>{s.avg_hold_time || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="body1" fontWeight={500}>{fmtDate(s.created_at)}</Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                startIcon={<Delete />}
                color="error"
                variant="outlined"
                onClick={handleDetailDelete}
              >
                Delete
              </Button>
              <Button
                startIcon={<Edit />}
                variant="contained"
                onClick={() => handleEdit(s)}
                sx={{
                  background: GRADIENT,
                  '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4199 100%)' },
                }}
              >
                Edit
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, strategy: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Edit Strategy</Typography>
          <IconButton onClick={() => setEditDialog({ open: false, strategy: null })}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={editForm.name || ''}
              onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={editForm.type || ''}
                label="Type"
                onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}
              >
                {TYPE_OPTIONS.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status || ''}
                label="Status"
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
              >
                {STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Divider sx={{ my: 1 }}>Performance Metrics</Divider>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="PnL ($)"
                  type="number"
                  fullWidth
                  value={editForm.pnl ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, pnl: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="PnL %"
                  type="number"
                  fullWidth
                  value={editForm.pnl_percent ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, pnl_percent: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Sharpe Ratio"
                  type="number"
                  fullWidth
                  value={editForm.sharpe_ratio ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, sharpe_ratio: e.target.value }))}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Max Drawdown (%)"
                  type="number"
                  fullWidth
                  value={editForm.max_drawdown ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, max_drawdown: e.target.value }))}
                  inputProps={{ step: 0.01 }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Win Rate (%)"
                  type="number"
                  fullWidth
                  value={editForm.win_rate ?? ''}
                  onChange={(e) => setEditForm((p) => ({ ...p, win_rate: e.target.value }))}
                  inputProps={{ step: 0.1, min: 0, max: 100 }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setEditDialog({ open: false, strategy: null })}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={saving || !editForm.name}
            sx={{
              background: GRADIENT,
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4199 100%)' },
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StrategiesManagement;
