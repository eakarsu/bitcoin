import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Container, Grid,
  Stack, TextField, Typography,
} from '@mui/material';
import {
  bootstrapTradingTenant, createPaperAccount, getTradingAuditExport,
  getTradingDashboard, setPaperKillSwitch, simulatePaperOrder, submitPaperOrder,
} from '../../services/api';

const defaultLimits = {
  maxOrderNotionalCents: 1000000,
  maxGrossExposureCents: 5000000,
  maxDailyLossCents: 250000,
  approvalThresholdCents: 500000,
  maxLiquidityParticipationBps: 1000,
  maxSpreadBps: 100,
  maxDataAgeSeconds: 60,
};

export default function GovernedTradingDashboard() {
  const [tenantKey, setTenantKey] = useState(localStorage.getItem('tradingTenant') || 'paper-desk');
  const [dashboard, setDashboard] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [account, setAccount] = useState({ accountKey: 'paper-main', name: 'Paper Main', initialCashCents: 10000000 });
  const [order, setOrder] = useState({ accountId: '', clientOrderId: '', symbol: 'BTC-USD', side: 'BUY', quantityUnits: 1000000 });

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('tradingTenant')) return;
    try {
      setDashboard(await getTradingDashboard());
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function act(operation) {
    try {
      setError('');
      setMessage('');
      const result = await operation();
      setMessage('Operation recorded successfully.');
      await refresh();
      return result;
    } catch (requestError) {
      setError(requestError.response?.data?.error || requestError.message);
      return null;
    }
  }

  const bootstrap = () => act(() => bootstrapTradingTenant(tenantKey, 'Paper Trading Desk'));
  const createAccount = () => act(() => createPaperAccount({ ...account, initialCashCents: Number(account.initialCashCents), limits: defaultLimits }));
  const submitOrder = () => act(() => submitPaperOrder({ ...order, accountId: Number(order.accountId), quantityUnits: Number(order.quantityUnits), clientOrderId: order.clientOrderId || crypto.randomUUID() }));
  const exportAudit = async () => {
    const data = await act(getTradingAuditExport);
    if (!data) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `paper-trading-audit-${tenantKey}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" fontWeight={800}>Governed Paper Trading</Typography>
          <Typography color="text.secondary">Deterministic limits, independent approval, immutable fills, and balanced journal evidence. Live broker execution is disabled.</Typography>
        </Box>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        <Alert severity="info">A licensed source must be registered by a risk officer and deliver signed, timestamped observations before orders can be evaluated.</Alert>

        <Card><CardContent><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField label="Tenant key" value={tenantKey} onChange={(event) => setTenantKey(event.target.value)} />
          <Button variant="contained" onClick={bootstrap}>Create or select desk</Button>
          <Button onClick={refresh}>Refresh</Button>
          <Button onClick={exportAudit}>Export audit evidence</Button>
        </Stack></CardContent></Card>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}><Card><CardContent><Stack spacing={2}>
            <Typography variant="h6">Create paper custody account</Typography>
            <TextField label="Account key" value={account.accountKey} onChange={(event) => setAccount({ ...account, accountKey: event.target.value })} />
            <TextField label="Name" value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
            <TextField label="Opening cash (cents)" type="number" value={account.initialCashCents} onChange={(event) => setAccount({ ...account, initialCashCents: event.target.value })} />
            <Button variant="contained" onClick={createAccount}>Create account with risk limits</Button>
          </Stack></CardContent></Card></Grid>
          <Grid size={{ xs: 12, md: 6 }}><Card><CardContent><Stack spacing={2}>
            <Typography variant="h6">Submit paper order</Typography>
            <TextField select SelectProps={{ native: true }} label="Account" value={order.accountId} onChange={(event) => setOrder({ ...order, accountId: event.target.value })}>
              <option value="">Select account</option>{dashboard?.accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </TextField>
            <TextField label="Symbol" value={order.symbol} onChange={(event) => setOrder({ ...order, symbol: event.target.value.toUpperCase() })} />
            <TextField select SelectProps={{ native: true }} label="Side" value={order.side} onChange={(event) => setOrder({ ...order, side: event.target.value })}><option>BUY</option><option>SELL</option></TextField>
            <TextField label="Quantity (atomic units)" type="number" value={order.quantityUnits} onChange={(event) => setOrder({ ...order, quantityUnits: event.target.value })} />
            <Button variant="contained" disabled={!order.accountId} onClick={submitOrder}>Evaluate and submit</Button>
          </Stack></CardContent></Card></Grid>
        </Grid>

        <Typography variant="h5">Accounts and controls</Typography>
        <Grid container spacing={2}>{dashboard?.accounts.map((item) => <Grid key={item.id} size={{ xs: 12, md: 4 }}><Card><CardContent><Stack spacing={1}>
          <Typography fontWeight={700}>{item.name}</Typography><Typography variant="body2">{item.account_key} · {item.custody_mode}</Typography>
          <Chip size="small" color={item.trading_enabled ? 'success' : 'error'} label={item.trading_enabled ? 'Trading enabled' : `Killed: ${item.kill_reason}`} />
          <Button color={item.trading_enabled ? 'error' : 'success'} onClick={() => act(() => setPaperKillSwitch(item.id, { enabled: !item.trading_enabled, reason: item.trading_enabled ? 'Operator risk stop' : 'Reviewed and released' }))}>{item.trading_enabled ? 'Activate kill switch' : 'Release kill switch'}</Button>
        </Stack></CardContent></Card></Grid>)}</Grid>

        <Typography variant="h5">Orders</Typography>
        <Stack spacing={1}>{dashboard?.orders.map((item) => <Card key={item.id}><CardContent><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Typography fontWeight={700}>#{item.id} {item.side} {item.symbol}</Typography><Chip size="small" label={item.status} />
          <Typography variant="body2">{item.quantity_units} atomic units</Typography>
          {['ACCEPTED', 'PARTIALLY_FILLED'].includes(item.status) && <><Button onClick={() => act(() => simulatePaperOrder(item.id, { attemptKey: crypto.randomUUID(), scenario: 'PARTIAL' }))}>Partial fill</Button><Button onClick={() => act(() => simulatePaperOrder(item.id, { attemptKey: crypto.randomUUID(), scenario: 'FULL' }))}>Full fill</Button></>}
        </Stack></CardContent></Card>)}</Stack>
      </Stack>
    </Container>
  );
}
