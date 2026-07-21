import test from 'node:test';
import assert from 'node:assert/strict';

const databaseUrl = process.env.TEST_DATABASE_URL;

test('governed PostgreSQL paper-trading lifecycle', { skip: !databaseUrl }, async () => {
  process.env.DATABASE_URL = databaseUrl;
  const jwtTestValue = ['integration', 'jwt', 'value', '32', 'characters', 'minimum'].join('-');
  const providerTestValue = ['integration', 'provider', 'value', '32', 'characters'].join('-');
  process.env.JWT_SECRET = jwtTestValue;
  process.env.MARKET_DATA_WEBHOOK_SECRETS_JSON = JSON.stringify({ 'licensed-market': providerTestValue });
  process.env.ENABLE_LEGACY_DEMO_SURFACES = 'false';
  process.env.NODE_ENV = 'production';
  process.env.CORS_ORIGIN = 'https://paper.example.invalid';

  const [{ httpServer }, { default: pool }, jwt, risk] = await Promise.all([
    import('../src/server.js'),
    import('../src/config/database.js'),
    import('jsonwebtoken'),
    import('../src/governance/riskEngine.js'),
  ]);
  const users = await pool.query(
    `INSERT INTO users (email,password_hash,name,email_verified) VALUES
      ('trader-test@example.invalid','not-used','Trader',TRUE),
      ('risk-test@example.invalid','not-used','Risk',TRUE)
     RETURNING id`
  );
  const traderId = users.rows[0].id;
  const riskId = users.rows[1].id;
  const traderToken = jwt.default.sign({ userId: traderId }, process.env.JWT_SECRET);
  const riskToken = jwt.default.sign({ userId: riskId }, process.env.JWT_SECRET);

  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const address = httpServer.address();
  const origin = `http://127.0.0.1:${address.port}`;
  const base = `${origin}/api/v2/trading`;
  async function call(path, { token = traderToken, tenant = 'test-desk', method = 'GET', body, headers = {} } = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'x-tenant-id': tenant, 'content-type': 'application/json', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json();
    return { status: response.status, data };
  }

  try {
    assert.equal((await fetch(`${origin}/health/ready`)).status, 200);
    assert.equal((await fetch(`${origin}/api/trades`)).status, 410);
    assert.equal((await call('/bootstrap', { method: 'POST', body: { tenantKey: 'test-desk', name: 'Test Desk' } })).status, 201);
    assert.equal((await call('/members', { method: 'POST', body: { userId: riskId, role: 'RISK_OFFICER' } })).status, 201);
    assert.equal((await call('/sources', { method: 'POST', body: { sourceCode: 'licensed-market', sourceKind: 'MARKET', licenseReference: 'test-contract-2026', maxAgeSeconds: 60 } })).status, 201);

    const providerBody = {
      providerEventId: 'quote-1', eventKind: 'MARKET_QUOTE',
      occurredAt: new Date().toISOString(), sourceTimestamp: new Date().toISOString(),
      payload: { symbol: 'BTC-USD', bidCents: 4_990_000, askCents: 5_000_000, liquidityUnits: 100_000_000 },
    };
    const signature = risk.signProviderPayload(providerTestValue, providerBody);
    const providerHeaders = { 'x-market-source': 'licensed-market', 'x-market-signature': signature };
    assert.equal((await call('/provider-events', { method: 'POST', body: providerBody, headers: providerHeaders })).status, 201);
    assert.equal((await call('/provider-events', { method: 'POST', body: providerBody, headers: providerHeaders })).data.idempotent, true);
    const tampered = { ...providerBody, payload: { ...providerBody.payload, askCents: 6_000_000 } };
    assert.equal((await call('/provider-events', { method: 'POST', body: tampered, headers: providerHeaders })).status, 401);
    const tamperedSignature = risk.signProviderPayload(providerTestValue, tampered);
    assert.equal((await call('/provider-events', { method: 'POST', body: tampered, headers: { ...providerHeaders, 'x-market-signature': tamperedSignature } })).status, 409);

    const accountResponse = await call('/accounts', {
      method: 'POST', body: {
        accountKey: 'paper-main', name: 'Paper Main', initialCashCents: 2_000_000,
        limits: { maxOrderNotionalCents: 1_000_000, maxGrossExposureCents: 1_500_000, maxDailyLossCents: 100_000, approvalThresholdCents: 250_000, maxLiquidityParticipationBps: 2_000, maxSpreadBps: 100, maxDataAgeSeconds: 60 },
      },
    });
    assert.equal(accountResponse.status, 201);
    const accountId = Number(accountResponse.data.id);
    const orderResponse = await call('/orders', { method: 'POST', body: { accountId, clientOrderId: 'client-1', symbol: 'BTC-USD', side: 'BUY', quantityUnits: 6_000_000 } });
    assert.equal(orderResponse.data.order.status, 'PENDING_APPROVAL');
    const orderId = Number(orderResponse.data.order.id);
    assert.equal((await call(`/orders/${orderId}/approve`, { method: 'POST', body: {} })).status, 409);
    assert.equal((await call(`/orders/${orderId}/approve`, { token: riskToken, method: 'POST', body: {} })).status, 200);
    const partial = await call(`/orders/${orderId}/simulate`, { method: 'POST', body: { attemptKey: 'first', scenario: 'PARTIAL' } });
    assert.equal(partial.data.orderStatus, 'PARTIALLY_FILLED');
    assert.equal((await call(`/orders/${orderId}/simulate`, { method: 'POST', body: { attemptKey: 'first', scenario: 'PARTIAL' } })).data.idempotent, true);
    assert.equal((await call(`/orders/${orderId}/simulate`, { method: 'POST', body: { attemptKey: 'second', scenario: 'FULL' } })).data.orderStatus, 'FILLED');

    const audit = await call('/audit-export', { token: riskToken });
    assert.equal(audit.data.journalBalanced, true);
    assert.ok(audit.data.providerEvents[0].source_timestamp);
    const fillTransaction = audit.data.transactions.find((item) => item.transaction_type === 'FILL');
    assert.equal((await call(`/journal/${fillTransaction.id}/reverse`, { token: riskToken, method: 'POST', body: { correctionKey: 'correction-1', reason: 'provider correction test' } })).status, 201);
    await assert.rejects(pool.query('UPDATE gt_audit_events SET event_type=event_type'), /append-only/);
    await assert.rejects(pool.query('TRUNCATE gt_audit_events'), /append-only/);
    await assert.rejects(pool.query("INSERT INTO gt_journal_entries (transaction_id,ledger_account,amount_cents) VALUES ($1,'CASH:USD',1)", [fillTransaction.id]), /finalized/);

    const corporate = await call('/corporate-actions', { token: riskToken, method: 'POST', body: { sourceCode: 'licensed-market', providerEventId: 'split-1', symbol: 'BTC-USD', actionType: 'SPLIT', numerator: 2, denominator: 1, effectiveAt: new Date().toISOString() } });
    assert.equal(corporate.status, 201);
    assert.equal((await call('/reconciliation', { token: riskToken })).data.sources[0].event_count, 1);

    assert.equal((await call(`/accounts/${accountId}/kill-switch`, { token: riskToken, method: 'POST', body: { enabled: false, reason: 'risk drill' } })).status, 200);
    const killed = await call('/orders', { method: 'POST', body: { accountId, clientOrderId: 'client-killed', symbol: 'BTC-USD', side: 'BUY', quantityUnits: 1_000_000 } });
    assert.ok(killed.data.order.rejection_reasons.includes('KILL_SWITCH_ACTIVE'));

    const backtest = await call('/backtests', { method: 'POST', body: { runKey: 'risk-suite-1', initialCashCents: 1_000_000, maxGapSeconds: 60, limits: { maxOrderNotionalCents: 1_000_000, maxGrossExposureCents: 1_500_000, maxDailyLossCents: 100_000, approvalThresholdCents: 250_000, maxLiquidityParticipationBps: 2_000, maxSpreadBps: 100, maxDataAgeSeconds: 60 }, steps: [{ eventId: 'one', occurredAt: new Date().toISOString(), quote: providerBody.payload, order: { side: 'BUY', quantityUnits: 1_000_000 }, scenario: 'PARTIAL' }] } });
    assert.equal(backtest.status, 201);
  } finally {
    await new Promise((resolve) => httpServer.close(resolve));
    await pool.end();
  }
});
