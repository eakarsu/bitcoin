import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, TableSortLabel,
  Checkbox, IconButton, Tooltip, Button, Chip, Menu, MenuItem, InputAdornment,
  Select, FormControl, InputLabel, Stack, Divider, CircularProgress
} from '@mui/material';
import {
  Search, FilterList, Download, Delete, Edit, Visibility,
  SelectAll, Close, FileDownload, PictureAsPdf, MoreVert, Refresh
} from '@mui/icons-material';
import { TableSkeleton } from './LoadingSkeleton';

const DataTable = ({
  title,
  columns,
  fetchData,
  onRowClick,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkUpdate,
  onExportCsv,
  onExportPdf,
  filters = [],
  resource,
  refreshTrigger = 0,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [selected, setSelected] = useState([]);
  const [filterValues, setFilterValues] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [exportAnchor, setExportAnchor] = useState(null);
  const [bulkAnchor, setBulkAnchor] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search,
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filterValues,
      };

      const result = await fetchData(params);

      if (result.data) {
        setData(result.data);
        setTotal(result.pagination?.total || result.data.length);
      } else if (Array.isArray(result)) {
        setData(result);
        setTotal(result.length);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setData([]);
    }
    setLoading(false);
  }, [fetchData, page, rowsPerPage, search, sortBy, sortOrder, filterValues]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('DESC');
    }
    setPage(0);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(data.map(row => row.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (onBulkDelete && selected.length > 0) {
      await onBulkDelete(selected);
      setSelected([]);
      loadData();
    }
    setBulkAnchor(null);
  };

  const handleBulkUpdate = async (updates) => {
    if (onBulkUpdate && selected.length > 0) {
      await onBulkUpdate(selected, updates);
      setSelected([]);
      loadData();
    }
    setBulkAnchor(null);
  };

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value || undefined }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilterValues({});
    setSearchInput('');
    setSearch('');
    setPage(0);
  };

  const activeFilterCount = Object.values(filterValues).filter(v => v && v !== 'ALL').length + (search ? 1 : 0);

  if (loading && data.length === 0) {
    return <TableSkeleton rows={rowsPerPage} columns={columns.length} />;
  }

  return (
    <Card sx={{ boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" fontWeight="bold">{title}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {selected.length > 0 && (
              <>
                <Chip label={`${selected.length} selected`} color="primary" size="small" onDelete={() => setSelected([])} />
                <Button size="small" color="error" startIcon={<Delete />} onClick={handleBulkDelete}>
                  Delete
                </Button>
                <Button size="small" startIcon={<MoreVert />} onClick={(e) => setBulkAnchor(e.currentTarget)}>
                  Bulk Actions
                </Button>
                <Menu anchorEl={bulkAnchor} open={Boolean(bulkAnchor)} onClose={() => setBulkAnchor(null)}>
                  <MenuItem onClick={() => handleBulkUpdate({ status: 'active' })}>Set Active</MenuItem>
                  <MenuItem onClick={() => handleBulkUpdate({ status: 'paused' })}>Set Paused</MenuItem>
                  <MenuItem onClick={() => handleBulkUpdate({ status: 'closed' })}>Set Closed</MenuItem>
                  <Divider />
                  <MenuItem onClick={handleBulkDelete} sx={{ color: 'error.main' }}>Delete Selected</MenuItem>
                </Menu>
              </>
            )}
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={loadData}><Refresh /></IconButton>
            </Tooltip>
            <Tooltip title={showFilters ? 'Hide Filters' : 'Show Filters'}>
              <IconButton size="small" onClick={() => setShowFilters(!showFilters)} color={activeFilterCount > 0 ? 'primary' : 'default'}>
                <FilterList />
                {activeFilterCount > 0 && (
                  <Box sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'primary.main', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activeFilterCount}
                  </Box>
                )}
              </IconButton>
            </Tooltip>
            {(onExportCsv || onExportPdf) && (
              <>
                <Tooltip title="Export">
                  <IconButton size="small" onClick={(e) => setExportAnchor(e.currentTarget)}><Download /></IconButton>
                </Tooltip>
                <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                  {onExportCsv && (
                    <MenuItem onClick={() => { onExportCsv(filterValues); setExportAnchor(null); }}>
                      <FileDownload sx={{ mr: 1 }} /> Export CSV
                    </MenuItem>
                  )}
                  {onExportPdf && (
                    <MenuItem onClick={() => { onExportPdf(filterValues); setExportAnchor(null); }}>
                      <PictureAsPdf sx={{ mr: 1 }} /> Export PDF
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </Stack>
        </Box>

        {/* Search & Filters */}
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearchInput(''); setSearch(''); }}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: showFilters ? 2 : 0 }}
          />

          {showFilters && filters.length > 0 && (
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
              {filters.map((filter) => (
                <FormControl key={filter.key} size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={filterValues[filter.key] || 'ALL'}
                    label={filter.label}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value === 'ALL' ? undefined : e.target.value)}
                  >
                    <MenuItem value="ALL">All</MenuItem>
                    {filter.options.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
              {activeFilterCount > 0 && (
                <Button size="small" onClick={clearFilters} startIcon={<Close />}>
                  Clear Filters
                </Button>
              )}
            </Stack>
          )}
        </Box>

        {/* Table */}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {(onBulkDelete || onBulkUpdate) && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < data.length}
                      checked={data.length > 0 && selected.length === data.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align || 'left'} sx={{ fontWeight: 700 }}>
                    {col.sortable !== false ? (
                      <TableSortLabel
                        active={sortBy === col.key}
                        direction={sortBy === col.key ? sortOrder.toLowerCase() : 'desc'}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
                {(onEdit || onDelete || onRowClick) && (
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No data found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    selected={selected.includes(row.id)}
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {(onBulkDelete || onBulkUpdate) && (
                      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.includes(row.id)}
                          onChange={() => handleSelectRow(row.id)}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.key} align={col.align || 'left'}>
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete || onRowClick) && (
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {onRowClick && (
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => onRowClick(row)}>
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onEdit && (
                            <Tooltip title="Edit">
                              <IconButton size="small" color="primary" onClick={() => onEdit(row)}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {onDelete && (
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => onDelete(row)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 15, 25, 50]}
        />
      </CardContent>
    </Card>
  );
};

export default DataTable;
