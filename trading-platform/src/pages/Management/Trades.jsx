import { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, FormControl, InputLabel,
  Select, MenuItem, Divider, Stack, IconButton, Tooltip, alpha
} from '@mui/material';
import {
  SwapHoriz, LockOpen, Lock, TrendingUp, Close, Edit, Delete,
  ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';

// ── helpers ──────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fmt = (v, prefix = '') => (v != null ? `${prefix}${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-');

const pnlColor = (v) => {
  if (v == null) return 'text.secondary';
  return Number(v) >= 0 ? 'success.main' : 'error.main';
};

const SYMBOL_OPTIONS = [
  { value: 'BTC/USDT', label: 'BTC/USDT' },
  { value: 'ETH/USDT', label: 'ETH/USDT' },
  { value: 'SOL/USDT', label: 'SOL/USDT' },
  { value: 'BNB/USDT', label: 'BNB/USDT' },
  { value: 'XRP/USDT', label: 'XRP/USDT' },
  { value: 'ADA/USDT', label: 'ADA/USDT' },
];

const SIDE_OPTIONS = [
  { value: 'BUY', label: 'BUY' },
  { value: 'SELL', label: 'SELL' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

// ── Stats Card ───────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, color, active, onClick }) => (
  <Card
    onClick={onClick}
    sx={{
      cursor: 'pointer',
      border: '2px solid',
      borderColor: active ? color : 'transparent',
      transition: 'all 0.25s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
      },
    }}
  >
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${color}22, ${color}44)`,
          }}
        >
          <Icon sx={{ color, fontSize: 26 }} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// ── Main Component ───────────────────────────────────────────────────
const Trades = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, pnl: 0 });
  const [activeFilter, setActiveFilter] = useState(null); // null | 'open' | 'closed'
  const [filterValues, setFilterValues] = useState({});

  // Dialogs
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    exit_price: '',
    pnl: '',
    pnl_percent: '',
    status: 'open',
  });

  // ── Fetch data for DataTable ────────────────────────────────────
  const fetchData = useCallback(
    async (params) => {
      const merged = { ...params, ...filterValues };
      const response = await api.get('/api/trades', { params: merged });
      return response.data;
    },
    [filterValues],
  );

  // ── Load stats ──────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      // fetch a broad page to compute stats (server could have a dedicated endpoint)
      const res = await api.get('/api/trades', { params: { page: 1, limit: 9999 } });
      const all = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      const open = all.filter((t) => t.status === 'open');
      const closed = all.filter((t) => t.status === 'closed');
      const totalPnl = all.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
      setStats({ total: all.length, open: open.length, closed: closed.length, pnl: totalPnl });
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshTrigger]);

  // ── Stats card click handler ────────────────────────────────────
  const handleStatClick = (type) => {
    if (type === activeFilter) {
      // toggle off
      setActiveFilter(null);
      setFilterValues({});
    } else if (type === 'open' || type === 'closed') {
      setActiveFilter(type);
      setFilterValues({ status: type });
    } else {
      setActiveFilter(null);
      setFilterValues({});
    }
    setRefreshTrigger((p) => p + 1);
  };

  // ── Row click -> detail dialog ──────────────────────────────────
  const handleRowClick = (row) => {
    setSelectedTrade(row);
    setDetailOpen(true);
  };

  // ── Edit ────────────────────────────────────────────────────────
  const openEdit = (trade) => {
    const t = trade || selectedTrade;
    if (!t) return;
    setEditForm({
      exit_price: t.exit_price ?? '',
      pnl: t.pnl ?? '',
      pnl_percent: t.pnl_percent ?? '',
      status: t.status || 'open',
    });
    setSelectedTrade(t);
    setDetailOpen(false);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const payload = {
        exit_price: editForm.exit_price === '' ? null : Number(editForm.exit_price),
        pnl: editForm.pnl === '' ? null : Number(editForm.pnl),
        pnl_percent: editForm.pnl_percent === '' ? null : Number(editForm.pnl_percent),
        status: editForm.status,
      };
      await api.put(`/api/trades/${selectedTrade.id}`, payload);
      toast.success('Trade updated successfully');
      setEditOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update trade');
    }
  };

  // ── Delete (single) ────────────────────────────────────────────
  const handleDelete = async (trade) => {
    const t = trade || selectedTrade;
    if (!t) return;
    const confirmed = await confirm({
      title: 'Delete Trade',
      message: `Are you sure you want to delete the ${t.side} ${t.symbol} trade (#${t.id})?`,
      type: 'danger',
      confirmText: 'Delete',
    });
    if (!confirmed) return;
    try {
      await api.delete(`/api/trades/${t.id}`);
      toast.success('Trade deleted successfully');
      setDetailOpen(false);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete trade');
    }
  };

  // ── Bulk delete ─────────────────────────────────────────────────
  const handleBulkDelete = async (ids) => {
    const confirmed = await confirm({
      title: 'Delete Trades',
      message: `Are you sure you want to delete ${ids.length} trade(s)? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete All',
    });
    if (!confirmed) return;
    try {
      await api.post('/api/trades/bulk/delete', { ids });
      toast.success(`${ids.length} trade(s) deleted`);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk delete failed');
    }
  };

  // ── Bulk update ─────────────────────────────────────────────────
  const handleBulkUpdate = async (ids, updates) => {
    try {
      await api.post('/api/trades/bulk/update', { ids, updates });
      toast.success(`${ids.length} trade(s) updated`);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk update failed');
    }
  };

  // ── Export ──────────────────────────────────────────────────────
  const handleExportCsv = () => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/api/trades/export/csv?token=${token}`, '_blank');
  };

  const handleExportPdf = () => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/api/trades/export/pdf?token=${token}`, '_blank');
  };

  // ── Column definitions ──────────────────────────────────────────
  const columns = [
    {
      key: 'symbol',
      label: 'Symbol',
      render: (val) => (
        <Typography variant="body2" fontWeight={700}>
          {val}
        </Typography>
      ),
    },
    {
      key: 'side',
      label: 'Side',
      render: (val) => (
        <Chip
          label={val}
          size="small"
          sx={{
            fontWeight: 700,
            bgcolor: val === 'BUY' ? 'success.main' : 'error.main',
            color: '#fff',
          }}
        />
      ),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      align: 'right',
      render: (val) => Number(val).toLocaleString(undefined, { maximumFractionDigits: 8 }),
    },
    {
      key: 'entry_price',
      label: 'Entry Price',
      align: 'right',
      render: (val) => fmt(val, '$'),
    },
    {
      key: 'exit_price',
      label: 'Exit Price',
      align: 'right',
      render: (val) => fmt(val, '$'),
    },
    {
      key: 'pnl',
      label: 'PnL',
      align: 'right',
      render: (val) => (
        <Typography variant="body2" fontWeight={600} color={pnlColor(val)}>
          {fmt(val, '$')}
        </Typography>
      ),
    },
    {
      key: 'pnl_percent',
      label: 'PnL%',
      align: 'right',
      render: (val) => (
        <Typography variant="body2" fontWeight={600} color={pnlColor(val)}>
          {val != null ? `${Number(val).toFixed(2)}%` : '-'}
        </Typography>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Chip
          label={val}
          size="small"
          sx={{
            fontWeight: 600,
            textTransform: 'capitalize',
            bgcolor: val === 'open' ? 'success.main' : 'grey.500',
            color: '#fff',
          }}
        />
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => {
        try {
          return format(new Date(val), 'MMM dd, yyyy HH:mm');
        } catch {
          return val || '-';
        }
      },
    },
  ];

  // ── Filter definitions ──────────────────────────────────────────
  const filters = [
    { key: 'symbol', label: 'Symbol', options: SYMBOL_OPTIONS },
    { key: 'side', label: 'Side', options: SIDE_OPTIONS },
    { key: 'status', label: 'Status', options: STATUS_OPTIONS },
  ];

  // ── Render ──────────────────────────────────────────────────────
  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Trade Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Monitor, edit, and manage all trade records
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total Trades"
            value={stats.total}
            icon={SwapHoriz}
            color="#667eea"
            active={activeFilter === null}
            onClick={() => handleStatClick(null)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Open Trades"
            value={stats.open}
            icon={LockOpen}
            color="#4CAF50"
            active={activeFilter === 'open'}
            onClick={() => handleStatClick('open')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Closed Trades"
            value={stats.closed}
            icon={Lock}
            color="#9e9e9e"
            active={activeFilter === 'closed'}
            onClick={() => handleStatClick('closed')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatsCard
            title="Total PnL"
            value={fmt(stats.pnl, '$')}
            icon={TrendingUp}
            color={stats.pnl >= 0 ? '#4CAF50' : '#f44336'}
            active={false}
            onClick={() => handleStatClick(null)}
          />
        </Grid>
      </Grid>

      {/* DataTable */}
      <DataTable
        title="Trades"
        columns={columns}
        fetchData={fetchData}
        onRowClick={handleRowClick}
        onEdit={openEdit}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
        onBulkUpdate={handleBulkUpdate}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        filters={filters}
        resource="trades"
        refreshTrigger={refreshTrigger}
      />

      {/* ── Detail Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTrade && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
              }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700} color="inherit">
                  {selectedTrade.symbol}
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.8)">
                  Trade #{selectedTrade.id}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton size="small" sx={{ color: '#fff' }} onClick={() => openEdit(selectedTrade)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" sx={{ color: '#fff' }} onClick={() => handleDelete(selectedTrade)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setDetailOpen(false)}>
                    <Close fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
              {/* PnL hero */}
              {selectedTrade.pnl != null && (
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 2.5,
                    mb: 2.5,
                    borderRadius: 2,
                    bgcolor: (theme) =>
                      Number(selectedTrade.pnl) >= 0
                        ? alpha(theme.palette.success.main, 0.08)
                        : alpha(theme.palette.error.main, 0.08),
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                    {Number(selectedTrade.pnl) >= 0 ? (
                      <ArrowUpward sx={{ color: 'success.main' }} />
                    ) : (
                      <ArrowDownward sx={{ color: 'error.main' }} />
                    )}
                    <Typography variant="h4" fontWeight={700} color={pnlColor(selectedTrade.pnl)}>
                      {fmt(selectedTrade.pnl, '$')}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color={pnlColor(selectedTrade.pnl_percent)} fontWeight={600}>
                    {selectedTrade.pnl_percent != null
                      ? `${Number(selectedTrade.pnl_percent).toFixed(2)}%`
                      : ''}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ mb: 2 }} />

              {/* Detail fields */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Side</Typography>
                  <Box sx={{ mt: 0.25 }}>
                    <Chip
                      label={selectedTrade.side}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: selectedTrade.side === 'BUY' ? 'success.main' : 'error.main',
                        color: '#fff',
                      }}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box sx={{ mt: 0.25 }}>
                    <Chip
                      label={selectedTrade.status}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        bgcolor: selectedTrade.status === 'open' ? 'success.main' : 'grey.500',
                        color: '#fff',
                      }}
                    />
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Quantity</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {Number(selectedTrade.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">User ID</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedTrade.user_id}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Entry Price</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {fmt(selectedTrade.entry_price, '$')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Exit Price</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {fmt(selectedTrade.exit_price, '$')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedTrade.created_at
                      ? format(new Date(selectedTrade.created_at), 'MMM dd, yyyy HH:mm:ss')
                      : '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Closed At</Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedTrade.closed_at
                      ? format(new Date(selectedTrade.closed_at), 'MMM dd, yyyy HH:mm:ss')
                      : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button variant="outlined" color="inherit" onClick={() => setDetailOpen(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => openEdit(selectedTrade)}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #624088 100%)' },
                }}
              >
                Edit
              </Button>
              <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => handleDelete(selectedTrade)}>
                Delete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ── Edit Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" fontWeight={700} color="inherit">
            Edit Trade {selectedTrade ? `#${selectedTrade.id}` : ''}
          </Typography>
          <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setEditOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Exit Price"
              type="number"
              fullWidth
              value={editForm.exit_price}
              onChange={(e) => setEditForm((p) => ({ ...p, exit_price: e.target.value }))}
              slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> } }}
            />
            <TextField
              label="PnL"
              type="number"
              fullWidth
              value={editForm.pnl}
              onChange={(e) => setEditForm((p) => ({ ...p, pnl: e.target.value }))}
              slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> } }}
            />
            <TextField
              label="PnL %"
              type="number"
              fullWidth
              value={editForm.pnl_percent}
              onChange={(e) => setEditForm((p) => ({ ...p, pnl_percent: e.target.value }))}
              slotProps={{ input: { endAdornment: <Typography sx={{ ml: 0.5, color: 'text.secondary' }}>%</Typography> } }}
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status}
                label="Status"
                onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => setEditOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5568d3 0%, #624088 100%)' },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Trades;
