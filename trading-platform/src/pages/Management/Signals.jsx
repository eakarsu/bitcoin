import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Slider, Stack, Divider, LinearProgress,
  IconButton, alpha
} from '@mui/material';
import {
  SignalCellularAlt as SignalCellAlt, TrendingUp, TrendingDown, Speed,
  Close, Edit, Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../components/shared/ConfirmDialog';
import DataTable from '../../components/shared/DataTable';

// ---------------------------------------------------------------------------
// Colour / style maps
// ---------------------------------------------------------------------------

const TYPE_COLORS = { BUY: 'success', SELL: 'error', HOLD: 'default' };
const STRENGTH_COLORS = { STRONG: 'success', MODERATE: 'warning', WEAK: 'error' };
const STATUS_COLORS = { active: 'success', expired: 'warning', closed: 'default' };
const TIMEFRAME_COLOR = 'primary';

const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtCurrency = (v) => {
  if (v == null) return '-';
  return `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) => {
  if (!d) return '-';
  try {
    return format(new Date(d), 'MMM dd, yyyy HH:mm');
  } catch {
    return '-';
  }
};

// ---------------------------------------------------------------------------
// Stats cards configuration
// ---------------------------------------------------------------------------

const STAT_CARDS = [
  { key: 'total', label: 'Total Signals', icon: SignalCellAlt, filterKey: null, filterVal: null },
  { key: 'buy', label: 'Buy Signals', icon: TrendingUp, filterKey: 'type', filterVal: 'BUY' },
  { key: 'sell', label: 'Sell Signals', icon: TrendingDown, filterKey: 'type', filterVal: 'SELL' },
  { key: 'avgConfidence', label: 'Avg Confidence', icon: Speed, filterKey: null, filterVal: null },
];

// ---------------------------------------------------------------------------
// Filters handed to DataTable
// ---------------------------------------------------------------------------

const TABLE_FILTERS = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { label: 'BUY', value: 'BUY' },
      { label: 'SELL', value: 'SELL' },
      { label: 'HOLD', value: 'HOLD' },
    ],
  },
  {
    key: 'timeframe',
    label: 'Timeframe',
    options: [
      { label: '15M', value: '15M' },
      { label: '1H', value: '1H' },
      { label: '4H', value: '4H' },
      { label: '1D', value: '1D' },
    ],
  },
  {
    key: 'strength',
    label: 'Strength',
    options: [
      { label: 'STRONG', value: 'STRONG' },
      { label: 'MODERATE', value: 'MODERATE' },
      { label: 'WEAK', value: 'WEAK' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Expired', value: 'expired' },
      { label: 'Closed', value: 'closed' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const buildColumns = () => [
  { key: 'pair', label: 'Pair', sortable: true },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
    render: (val) => (
      <Chip
        label={val}
        size="small"
        color={TYPE_COLORS[val] || 'default'}
        sx={{ fontWeight: 700, minWidth: 60 }}
      />
    ),
  },
  {
    key: 'strength',
    label: 'Strength',
    sortable: true,
    render: (val) => (
      <Chip
        label={val}
        size="small"
        color={STRENGTH_COLORS[val] || 'default'}
        variant="outlined"
        sx={{ fontWeight: 600, minWidth: 80 }}
      />
    ),
  },
  {
    key: 'confidence',
    label: 'Confidence',
    sortable: true,
    render: (val) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
        <LinearProgress
          variant="determinate"
          value={Number(val) || 0}
          sx={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: GRADIENT,
            },
          }}
        />
        <Typography variant="caption" fontWeight={600} sx={{ minWidth: 32 }}>
          {val}%
        </Typography>
      </Box>
    ),
  },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    align: 'right',
    render: (val) => <Typography variant="body2" fontWeight={500}>{fmtCurrency(val)}</Typography>,
  },
  {
    key: 'target_price',
    label: 'Target',
    sortable: true,
    align: 'right',
    render: (val) => <Typography variant="body2" fontWeight={500}>{fmtCurrency(val)}</Typography>,
  },
  {
    key: 'timeframe',
    label: 'Timeframe',
    sortable: true,
    render: (val) => (
      <Chip label={val} size="small" color={TIMEFRAME_COLOR} variant="outlined" sx={{ fontWeight: 600 }} />
    ),
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (val) => (
      <Chip
        label={val ? val.charAt(0).toUpperCase() + val.slice(1) : '-'}
        size="small"
        color={STATUS_COLORS[val] || 'default'}
        sx={{ fontWeight: 600 }}
      />
    ),
  },
  {
    key: 'created_at',
    label: 'Date',
    sortable: true,
    render: (val) => (
      <Typography variant="body2" color="text.secondary">
        {fmtDate(val)}
      </Typography>
    ),
  },
];

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

const Signals = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();

  // State
  const [stats, setStats] = useState({ total: 0, buy: 0, sell: 0, avgConfidence: 0 });
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const columns = buildColumns();

  // -----------------------------------------------------------------------
  // Load stats
  // -----------------------------------------------------------------------

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/api/signals/stats/summary');
      const s = res.data;
      setStats({
        total: s.total ?? s.totalSignals ?? 0,
        buy: s.buy ?? s.buySignals ?? 0,
        sell: s.sell ?? s.sellSignals ?? 0,
        avgConfidence: s.avgConfidence != null ? Math.round(s.avgConfidence) : 0,
      });
    } catch (err) {
      console.error('Failed to load signal stats:', err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshTrigger]);

  // -----------------------------------------------------------------------
  // fetchData for DataTable
  // -----------------------------------------------------------------------

  const fetchData = useCallback(async (params) => {
    // Merge stat-card filter into params when active
    const merged = { ...params };
    if (activeStatFilter) {
      merged[activeStatFilter.key] = activeStatFilter.value;
    }
    const res = await api.get('/api/signals', { params: merged });
    return res.data;
  }, [activeStatFilter]);

  // -----------------------------------------------------------------------
  // Build filters -- inject activeStatFilter as pre-selected value
  // -----------------------------------------------------------------------

  const resolvedFilters = TABLE_FILTERS;

  // -----------------------------------------------------------------------
  // Stat card click handler
  // -----------------------------------------------------------------------

  const handleStatClick = (card) => {
    if (!card.filterKey) {
      // Total or Avg Confidence -- clear filter
      setActiveStatFilter(null);
    } else {
      // Toggle: click same card again to clear
      if (activeStatFilter && activeStatFilter.key === card.filterKey && activeStatFilter.value === card.filterVal) {
        setActiveStatFilter(null);
      } else {
        setActiveStatFilter({ key: card.filterKey, value: card.filterVal });
      }
    }
    setRefreshTrigger((p) => p + 1);
  };

  // -----------------------------------------------------------------------
  // Row click -> Detail Dialog
  // -----------------------------------------------------------------------

  const handleRowClick = (row) => {
    setSelectedSignal(row);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedSignal(null);
  };

  // -----------------------------------------------------------------------
  // Edit
  // -----------------------------------------------------------------------

  const openEdit = (signal) => {
    const s = signal || selectedSignal;
    if (!s) return;
    setEditForm({
      id: s.id,
      type: s.type || 'BUY',
      strength: s.strength || 'MODERATE',
      confidence: s.confidence != null ? Number(s.confidence) : 50,
      price: s.price ?? '',
      target_price: s.target_price ?? '',
      stop_loss: s.stop_loss ?? '',
      timeframe: s.timeframe || '1H',
      status: s.status || 'active',
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditForm({});
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { id, ...data } = editForm;
      await api.put(`/api/signals/${id}`, data);
      toast.success('Signal updated successfully');
      closeEdit();
      closeDetail();
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update signal');
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Delete (single)
  // -----------------------------------------------------------------------

  const handleDelete = async (signal) => {
    const s = signal || selectedSignal;
    if (!s) return;
    const ok = await confirm({
      title: 'Delete Signal',
      message: `Are you sure you want to delete the ${s.type} signal for ${s.pair}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
    });
    if (!ok) return;
    try {
      await api.delete(`/api/signals/${s.id}`);
      toast.success('Signal deleted successfully');
      closeDetail();
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete signal');
    }
  };

  // -----------------------------------------------------------------------
  // Bulk operations
  // -----------------------------------------------------------------------

  const handleBulkDelete = async (ids) => {
    const ok = await confirm({
      title: 'Delete Signals',
      message: `Are you sure you want to delete ${ids.length} signal(s)? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete All',
    });
    if (!ok) return;
    try {
      await api.post('/api/signals/bulk/delete', { ids });
      toast.success(`${ids.length} signal(s) deleted`);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk delete failed');
    }
  };

  const handleBulkUpdate = async (ids, updates) => {
    try {
      await api.post('/api/signals/bulk/update', { ids, updates });
      toast.success(`${ids.length} signal(s) updated`);
      setRefreshTrigger((p) => p + 1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Bulk update failed');
    }
  };

  // -----------------------------------------------------------------------
  // Export
  // -----------------------------------------------------------------------

  const handleExportCsv = () => {
    const baseUrl = api.defaults.baseURL || '';
    window.open(`${baseUrl}/api/signals/export/csv`, '_blank');
  };

  const handleExportPdf = () => {
    const baseUrl = api.defaults.baseURL || '';
    window.open(`${baseUrl}/api/signals/export/pdf`, '_blank');
  };

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const statValue = (card) => {
    if (card.key === 'avgConfidence') return `${stats.avgConfidence}%`;
    return stats[card.key];
  };

  const isStatActive = (card) => {
    if (!activeStatFilter) return false;
    return activeStatFilter.key === card.filterKey && activeStatFilter.value === card.filterVal;
  };

  // -----------------------------------------------------------------------
  // RENDER
  // -----------------------------------------------------------------------

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Page header */}
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 3 }}>
        Signal Management
      </Typography>

      {/* ---- Stats Cards ---- */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {STAT_CARDS.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.key}>
            <Card
              onClick={() => handleStatClick(card)}
              sx={{
                cursor: 'pointer',
                borderRadius: 3,
                border: '1px solid',
                borderColor: isStatActive(card) ? 'primary.main' : 'divider',
                boxShadow: isStatActive(card)
                  ? '0 4px 20px rgba(102,126,234,0.25)'
                  : '0 4px 20px rgba(0,0,0,0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(102,126,234,0.20)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 0.5 }}
                    >
                      {card.label}
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ mt: 1 }}>
                      {statValue(card)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      borderRadius: 2.5,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: GRADIENT,
                    }}
                  >
                    <card.icon sx={{ color: '#fff', fontSize: 32 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ---- DataTable ---- */}
      <DataTable
        title="Trading Signals"
        columns={columns}
        fetchData={fetchData}
        onRowClick={handleRowClick}
        onEdit={(row) => openEdit(row)}
        onDelete={(row) => handleDelete(row)}
        onBulkDelete={handleBulkDelete}
        onBulkUpdate={handleBulkUpdate}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        filters={resolvedFilters}
        resource="signals"
        refreshTrigger={refreshTrigger}
      />

      {/* ================================================================ */}
      {/* Detail Dialog                                                     */}
      {/* ================================================================ */}
      <Dialog open={detailOpen} onClose={closeDetail} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Signal Details</Typography>
          <IconButton size="small" onClick={closeDetail}><Close /></IconButton>
        </DialogTitle>

        {selectedSignal && (
          <>
            <DialogContent dividers>
              <Stack spacing={2.5}>
                {/* Pair + Type row */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" fontWeight="bold">{selectedSignal.pair}</Typography>
                  <Chip
                    label={selectedSignal.type}
                    color={TYPE_COLORS[selectedSignal.type] || 'default'}
                    sx={{ fontWeight: 700, fontSize: '0.9rem' }}
                  />
                </Box>

                <Divider />

                {/* Info grid */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Strength</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedSignal.strength}
                        size="small"
                        color={STRENGTH_COLORS[selectedSignal.strength] || 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Confidence</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Number(selectedSignal.confidence) || 0}
                        sx={{
                          flex: 1, height: 10, borderRadius: 5, bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': { borderRadius: 5, background: GRADIENT },
                        }}
                      />
                      <Typography variant="body2" fontWeight={700}>{selectedSignal.confidence}%</Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Price</Typography>
                    <Typography variant="body1" fontWeight={600}>{fmtCurrency(selectedSignal.price)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Target Price</Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">
                      {fmtCurrency(selectedSignal.target_price)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Stop Loss</Typography>
                    <Typography variant="body1" fontWeight={600} color="error.main">
                      {fmtCurrency(selectedSignal.stop_loss)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Timeframe</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip label={selectedSignal.timeframe} size="small" color={TIMEFRAME_COLOR} variant="outlined" sx={{ fontWeight: 600 }} />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip
                        label={selectedSignal.status ? selectedSignal.status.charAt(0).toUpperCase() + selectedSignal.status.slice(1) : '-'}
                        size="small"
                        color={STATUS_COLORS[selectedSignal.status] || 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Date</Typography>
                    <Typography variant="body1">{fmtDate(selectedSignal.created_at)}</Typography>
                  </Grid>
                </Grid>

                {/* Indicators */}
                {selectedSignal.indicators && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
                        Indicators
                      </Typography>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {typeof selectedSignal.indicators === 'string'
                          ? selectedSignal.indicators
                          : JSON.stringify(selectedSignal.indicators, null, 2)}
                      </Box>
                    </Box>
                  </>
                )}

                {/* ID */}
                <Typography variant="caption" color="text.disabled">
                  ID: {selectedSignal.id}
                </Typography>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Edit />}
                onClick={() => openEdit(selectedSignal)}
              >
                Edit
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={() => handleDelete(selectedSignal)}
              >
                Delete
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ================================================================ */}
      {/* Edit Dialog                                                       */}
      {/* ================================================================ */}
      <Dialog open={editOpen} onClose={closeEdit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Edit Signal</Typography>
          <IconButton size="small" onClick={closeEdit}><Close /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {/* Type */}
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={editForm.type || ''}
                label="Type"
                onChange={(e) => handleEditChange('type', e.target.value)}
              >
                <MenuItem value="BUY">BUY</MenuItem>
                <MenuItem value="SELL">SELL</MenuItem>
                <MenuItem value="HOLD">HOLD</MenuItem>
              </Select>
            </FormControl>

            {/* Strength */}
            <FormControl fullWidth size="small">
              <InputLabel>Strength</InputLabel>
              <Select
                value={editForm.strength || ''}
                label="Strength"
                onChange={(e) => handleEditChange('strength', e.target.value)}
              >
                <MenuItem value="STRONG">STRONG</MenuItem>
                <MenuItem value="MODERATE">MODERATE</MenuItem>
                <MenuItem value="WEAK">WEAK</MenuItem>
              </Select>
            </FormControl>

            {/* Confidence slider */}
            <Box>
              <Typography variant="body2" fontWeight={600} gutterBottom>
                Confidence: {editForm.confidence ?? 50}%
              </Typography>
              <Slider
                value={editForm.confidence ?? 50}
                onChange={(_, val) => handleEditChange('confidence', val)}
                min={0}
                max={100}
                step={1}
                valueLabelDisplay="auto"
                sx={{
                  '& .MuiSlider-track': { background: GRADIENT, border: 'none' },
                  '& .MuiSlider-thumb': { background: GRADIENT },
                }}
              />
            </Box>

            {/* Price */}
            <TextField
              label="Price"
              type="number"
              size="small"
              fullWidth
              value={editForm.price ?? ''}
              onChange={(e) => handleEditChange('price', e.target.value)}
              slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> } }}
            />

            {/* Target Price */}
            <TextField
              label="Target Price"
              type="number"
              size="small"
              fullWidth
              value={editForm.target_price ?? ''}
              onChange={(e) => handleEditChange('target_price', e.target.value)}
              slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> } }}
            />

            {/* Stop Loss */}
            <TextField
              label="Stop Loss"
              type="number"
              size="small"
              fullWidth
              value={editForm.stop_loss ?? ''}
              onChange={(e) => handleEditChange('stop_loss', e.target.value)}
              slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography> } }}
            />

            {/* Timeframe */}
            <FormControl fullWidth size="small">
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={editForm.timeframe || ''}
                label="Timeframe"
                onChange={(e) => handleEditChange('timeframe', e.target.value)}
              >
                <MenuItem value="15M">15M</MenuItem>
                <MenuItem value="1H">1H</MenuItem>
                <MenuItem value="4H">4H</MenuItem>
                <MenuItem value="1D">1D</MenuItem>
              </Select>
            </FormControl>

            {/* Status */}
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={editForm.status || ''}
                label="Status"
                onChange={(e) => handleEditChange('status', e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button variant="outlined" color="inherit" onClick={closeEdit}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ background: GRADIENT, '&:hover': { background: GRADIENT, opacity: 0.9 } }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Signals;
