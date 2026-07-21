import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { loadTradingContext, requireTradingRole } from '../middleware/tradingContext.js';
import {
  evaluateRisk,
  payloadDigest,
  runDeterministicBacktest,
  simulateFill,
  verifyProviderSignature,
} from '../governance/riskEngine.js';

const router = express.Router();
const keyPattern = /^[a-z0-9][a-z0-9_-]{2,63}$/;
const symbolPattern = /^[A-Z0-9]{2,12}-[A-Z0-9]{2,12}$/;

function safeInteger(value, name, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    const error = new Error(`${name} must be a safe integer >= ${minimum}`);
    error.status = 400;
    throw error;
  }
  return value;
}

function timestamp(value, name) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) {
    const error = new Error(`${name} must be an ISO-8601 timestamp`);
    error.status = 400;
    throw error;
  }
  return parsed.toISOString();
}

function providerSecrets() {
  try {
    const parsed = JSON.parse(process.env.MARKET_DATA_WEBHOOK_SECRETS_JSON || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function audit(client, tenantId, actorUserId, eventType, entityType, entityId, detail = {}) {
  await client.query(
    `INSERT INTO gt_audit_events
       (tenant_id, actor_user_id, event_type, entity_type, entity_id, detail)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tenantId, actorUserId || null, eventType, entityType, String(entityId), detail]
  );
}

async function inTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

router.post('/bootstrap', authenticate, async (req, res, next) => {
  try {
    const { tenantKey, name } = req.body;
    if (!keyPattern.test(tenantKey || '') || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'valid tenantKey and name are required' });
    }
    const result = await inTransaction(async (client) => {
      const tenant = await client.query(
        `INSERT INTO gt_tenants (tenant_key, name, created_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (tenant_key) DO NOTHING
         RETURNING *`,
        [tenantKey, name.trim(), req.user.id]
      );
      if (tenant.rowCount === 0) {
        const existing = await client.query('SELECT * FROM gt_tenants WHERE tenant_key = $1', [tenantKey]);
        const member = await client.query(
          'SELECT role FROM gt_memberships WHERE tenant_id = $1 AND user_id = $2',
          [existing.rows[0].id, req.user.id]
        );
        if (member.rowCount === 0) {
          const conflict = new Error('tenantKey is already owned');
          conflict.status = 409;
          throw conflict;
        }
        return { tenant: existing.rows[0], idempotent: true };
      }
      await client.query(
        `INSERT INTO gt_memberships (tenant_id, user_id, role) VALUES ($1, $2, 'ADMIN')`,
        [tenant.rows[0].id, req.user.id]
      );
      await audit(client, tenant.rows[0].id, req.user.id, 'TENANT_CREATED', 'tenant', tenant.rows[0].id);
      return { tenant: tenant.rows[0], idempotent: false };
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.use(authenticate, loadTradingContext);

router.post('/members', requireTradingRole('ADMIN'), async (req, res, next) => {
  try {
    const userId = safeInteger(req.body.userId, 'userId', 1);
    const role = req.body.role;
    if (!['ADMIN', 'TRADER', 'RISK_OFFICER', 'AUDITOR'].includes(role)) return res.status(400).json({ error: 'invalid role' });
    const result = await inTransaction(async (client) => {
      const member = await client.query(
        `INSERT INTO gt_memberships (tenant_id, user_id, role) VALUES ($1, $2, $3)
         ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role
         RETURNING *`,
        [req.tradingTenant.id, userId, role]
      );
      await audit(client, req.tradingTenant.id, req.user.id, 'MEMBERSHIP_SET', 'user', userId, { role });
      return member.rows[0];
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/sources', requireTradingRole('ADMIN', 'RISK_OFFICER'), async (req, res, next) => {
  try {
    const { sourceCode, sourceKind, licenseReference } = req.body;
    const maxAgeSeconds = safeInteger(req.body.maxAgeSeconds, 'maxAgeSeconds', 1);
    if (!keyPattern.test(sourceCode || '') || !['MARKET', 'BANK', 'BROKER'].includes(sourceKind) || !licenseReference?.trim()) {
      return res.status(400).json({ error: 'sourceCode, sourceKind, and licenseReference are required' });
    }
    const result = await inTransaction(async (client) => {
      const source = await client.query(
        `INSERT INTO gt_data_sources
           (tenant_id, source_code, source_kind, license_reference, max_age_seconds, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (tenant_id, source_code) DO UPDATE SET
           source_kind = EXCLUDED.source_kind,
           license_reference = EXCLUDED.license_reference,
           max_age_seconds = EXCLUDED.max_age_seconds,
           enabled = TRUE
         RETURNING *`,
        [req.tradingTenant.id, sourceCode, sourceKind, licenseReference.trim(), maxAgeSeconds, req.user.id]
      );
      await audit(client, req.tradingTenant.id, req.user.id, 'DATA_SOURCE_CONFIGURED', 'data_source', source.rows[0].id, { sourceCode, sourceKind });
      return source.rows[0];
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/provider-events', async (req, res, next) => {
  try {
    const sourceCode = req.get('x-market-source');
    const suppliedSignature = req.get('x-market-signature');
    const secret = providerSecrets()[sourceCode];
    if (!verifyProviderSignature(secret, req.body, suppliedSignature)) return res.status(401).json({ error: 'invalid provider signature' });
    const { providerEventId, eventKind, occurredAt, sourceTimestamp, payload } = req.body;
    if (!providerEventId || !['MARKET_QUOTE', 'BANK_BALANCE', 'BROKER_ORDER', 'BROKER_FILL', 'BROKER_CORRECTION'].includes(eventKind) || !payload) {
      return res.status(400).json({ error: 'provider event contract is incomplete' });
    }
    const digest = payloadDigest(req.body);
    const result = await inTransaction(async (client) => {
      const sourceResult = await client.query(
        `SELECT s.*, t.id AS tenant_id
           FROM gt_data_sources s JOIN gt_tenants t ON t.id = s.tenant_id
          WHERE t.tenant_key = $1 AND s.source_code = $2 AND s.enabled = TRUE
          FOR UPDATE`,
        [req.tradingTenant.tenant_key, sourceCode]
      );
      if (sourceResult.rowCount !== 1) {
        const error = new Error('registered licensed data source not found');
        error.status = 404;
        throw error;
      }
      const source = sourceResult.rows[0];
      const event = await client.query(
        `INSERT INTO gt_provider_events
           (tenant_id, source_id, provider_event_id, event_kind, payload_digest, occurred_at, source_timestamp, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (tenant_id, source_id, provider_event_id) DO NOTHING
         RETURNING *`,
        [source.tenant_id, source.id, providerEventId, eventKind, digest, timestamp(occurredAt, 'occurredAt'), timestamp(sourceTimestamp, 'sourceTimestamp'), payload]
      );
      if (event.rowCount === 0) {
        const existing = await client.query(
          `SELECT * FROM gt_provider_events WHERE tenant_id = $1 AND source_id = $2 AND provider_event_id = $3`,
          [source.tenant_id, source.id, providerEventId]
        );
        if (existing.rows[0].payload_digest !== digest) {
          const conflict = new Error('provider event id reused with different payload');
          conflict.status = 409;
          throw conflict;
        }
        return { event: existing.rows[0], idempotent: true };
      }
      if (eventKind === 'MARKET_QUOTE') {
        if (source.source_kind !== 'MARKET' || !symbolPattern.test(payload.symbol || '')) {
          const error = new Error('market quote requires a MARKET source and canonical symbol');
          error.status = 400;
          throw error;
        }
        safeInteger(payload.bidCents, 'bidCents', 1);
        safeInteger(payload.askCents, 'askCents', 1);
        safeInteger(payload.liquidityUnits, 'liquidityUnits', 0);
        if (payload.askCents < payload.bidCents) {
          const error = new Error('askCents must be >= bidCents');
          error.status = 400;
          throw error;
        }
        await client.query(
          `INSERT INTO gt_market_observations
             (tenant_id, provider_event_id, symbol, bid_cents, ask_cents, liquidity_units, occurred_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [source.tenant_id, event.rows[0].id, payload.symbol, payload.bidCents, payload.askCents, payload.liquidityUnits, occurredAt]
        );
      }
      await audit(client, source.tenant_id, req.user.id, 'PROVIDER_EVENT_INGESTED', 'provider_event', event.rows[0].id, { eventKind, sourceCode, providerEventId });
      return { event: event.rows[0], idempotent: false };
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/reconciliation', requireTradingRole('ADMIN', 'RISK_OFFICER', 'AUDITOR'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT s.source_code, s.source_kind, s.license_reference,
              COUNT(e.id)::INTEGER AS event_count,
              MAX(e.source_timestamp) AS latest_source_timestamp,
              MAX(e.received_at) AS latest_received_at
         FROM gt_data_sources s
         LEFT JOIN gt_provider_events e ON e.source_id = s.id
        WHERE s.tenant_id = $1
        GROUP BY s.id ORDER BY s.source_code`,
      [req.tradingTenant.id]
    );
    res.json({ generatedAt: new Date().toISOString(), sources: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/accounts', requireTradingRole('ADMIN', 'RISK_OFFICER'), async (req, res, next) => {
  try {
    const { accountKey, name } = req.body;
    if (!keyPattern.test(accountKey || '') || !name?.trim()) return res.status(400).json({ error: 'valid accountKey and name are required' });
    const initialCashCents = safeInteger(req.body.initialCashCents, 'initialCashCents', 0);
    const raw = req.body.limits || {};
    const limits = {
      maxOrderNotionalCents: safeInteger(raw.maxOrderNotionalCents, 'maxOrderNotionalCents', 1),
      maxGrossExposureCents: safeInteger(raw.maxGrossExposureCents, 'maxGrossExposureCents', 1),
      maxDailyLossCents: safeInteger(raw.maxDailyLossCents, 'maxDailyLossCents', 1),
      approvalThresholdCents: safeInteger(raw.approvalThresholdCents, 'approvalThresholdCents', 1),
      maxLiquidityParticipationBps: safeInteger(raw.maxLiquidityParticipationBps, 'maxLiquidityParticipationBps', 1),
      maxSpreadBps: safeInteger(raw.maxSpreadBps, 'maxSpreadBps', 1),
      maxDataAgeSeconds: safeInteger(raw.maxDataAgeSeconds, 'maxDataAgeSeconds', 1),
    };
    if (limits.maxLiquidityParticipationBps > 10_000 || limits.maxSpreadBps > 10_000) return res.status(400).json({ error: 'basis-point limits cannot exceed 10000' });
    const account = await inTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO gt_accounts (tenant_id, account_key, name, initial_cash_cents, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.tradingTenant.id, accountKey, name.trim(), initialCashCents, req.user.id]
      );
      const accountRow = inserted.rows[0];
      await client.query(
        `INSERT INTO gt_risk_limits
          (account_id, max_order_notional_cents, max_gross_exposure_cents,
           max_daily_loss_cents, approval_threshold_cents,
           max_liquidity_participation_bps, max_spread_bps,
           max_data_age_seconds, updated_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [accountRow.id, limits.maxOrderNotionalCents, limits.maxGrossExposureCents, limits.maxDailyLossCents, limits.approvalThresholdCents, limits.maxLiquidityParticipationBps, limits.maxSpreadBps, limits.maxDataAgeSeconds, req.user.id]
      );
      if (initialCashCents > 0) {
        const tx = await client.query(
          `INSERT INTO gt_journal_transactions
             (tenant_id, account_id, transaction_key, transaction_type, reference_type, reference_id, created_by)
           VALUES ($1, $2, $3, 'OPENING', 'account', $4, $5) RETURNING id`,
          [req.tradingTenant.id, accountRow.id, `opening:${accountRow.id}`, String(accountRow.id), req.user.id]
        );
        await client.query(
          `INSERT INTO gt_journal_entries (transaction_id, ledger_account, amount_cents)
           VALUES ($1, 'CASH:USD', $2), ($1, 'EQUITY:OPENING', $3)`,
          [tx.rows[0].id, initialCashCents, -initialCashCents]
        );
        await client.query('SELECT gt_finalize_journal($1)', [tx.rows[0].id]);
      }
      await audit(client, req.tradingTenant.id, req.user.id, 'PAPER_ACCOUNT_CREATED', 'account', accountRow.id, { accountKey, limits });
      return accountRow;
    });
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
});

router.post('/accounts/:accountId/kill-switch', requireTradingRole('ADMIN', 'RISK_OFFICER'), async (req, res, next) => {
  try {
    const accountId = safeInteger(Number(req.params.accountId), 'accountId', 1);
    const enabled = req.body.enabled === true;
    const reason = String(req.body.reason || '').trim();
    if (!enabled && reason.length < 3) return res.status(400).json({ error: 'reason is required to activate the kill switch' });
    const result = await inTransaction(async (client) => {
      const changed = await client.query(
        `UPDATE gt_accounts SET trading_enabled = $1, kill_reason = $2,
           killed_by = $3, killed_at = CASE WHEN $1 THEN NULL ELSE NOW() END
         WHERE id = $4 AND tenant_id = $5 RETURNING *`,
        [enabled, enabled ? null : reason, enabled ? null : req.user.id, accountId, req.tradingTenant.id]
      );
      if (changed.rowCount !== 1) {
        const error = new Error('account not found'); error.status = 404; throw error;
      }
      await audit(client, req.tradingTenant.id, req.user.id, enabled ? 'KILL_SWITCH_RELEASED' : 'KILL_SWITCH_ACTIVATED', 'account', accountId, { reason });
      return changed.rows[0];
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/orders', requireTradingRole('ADMIN', 'TRADER'), async (req, res, next) => {
  try {
    const body = req.body;
    const accountId = safeInteger(body.accountId, 'accountId', 1);
    const quantityUnits = safeInteger(body.quantityUnits, 'quantityUnits', 1);
    if (!body.clientOrderId || !symbolPattern.test(body.symbol || '') || !['BUY', 'SELL'].includes(body.side)) {
      return res.status(400).json({ error: 'clientOrderId, canonical symbol, and BUY/SELL side are required' });
    }
    if (body.limitPriceCents !== undefined) safeInteger(body.limitPriceCents, 'limitPriceCents', 1);
    const requestDigest = payloadDigest(body);
    const result = await inTransaction(async (client) => {
      const duplicate = await client.query(
        `SELECT * FROM gt_orders WHERE tenant_id = $1 AND account_id = $2 AND client_order_id = $3`,
        [req.tradingTenant.id, accountId, body.clientOrderId]
      );
      if (duplicate.rowCount) {
        if (duplicate.rows[0].request_digest !== requestDigest) {
          const error = new Error('clientOrderId reused with a different request'); error.status = 409; throw error;
        }
        return { order: duplicate.rows[0], idempotent: true };
      }
      const accountResult = await client.query(
        `SELECT a.*, l.*,
          COALESCE((SELECT SUM(e.amount_cents) FROM gt_journal_entries e JOIN gt_journal_transactions t ON t.id=e.transaction_id WHERE t.account_id=a.id AND e.ledger_account='CASH:USD'), 0)::BIGINT AS available_cash_cents,
          COALESCE((SELECT SUM(cost_basis_cents) FROM gt_positions p WHERE p.account_id=a.id), 0)::BIGINT AS gross_exposure_cents,
          COALESCE((SELECT SUM(realized_pnl_cents) FROM gt_positions p WHERE p.account_id=a.id), 0)::BIGINT AS realized_pnl_cents
         FROM gt_accounts a JOIN gt_risk_limits l ON l.account_id=a.id
         WHERE a.id=$1 AND a.tenant_id=$2 FOR UPDATE`,
        [accountId, req.tradingTenant.id]
      );
      if (accountResult.rowCount !== 1) { const error = new Error('paper account not found'); error.status = 404; throw error; }
      const account = accountResult.rows[0];
      const quoteResult = await client.query(
        `SELECT * FROM gt_market_observations WHERE tenant_id=$1 AND symbol=$2 ORDER BY occurred_at DESC, id DESC LIMIT 1`,
        [req.tradingTenant.id, body.symbol]
      );
      if (quoteResult.rowCount !== 1) { const error = new Error('licensed market observation not found'); error.status = 409; throw error; }
      const positionResult = await client.query(
        'SELECT quantity_units FROM gt_positions WHERE account_id=$1 AND symbol=$2', [accountId, body.symbol]
      );
      const quote = quoteResult.rows[0];
      const decision = evaluateRisk({
        order: { side: body.side, quantityUnits, limitPriceCents: body.limitPriceCents },
        quote: { bidCents: Number(quote.bid_cents), askCents: Number(quote.ask_cents), liquidityUnits: Number(quote.liquidity_units), occurredAt: quote.occurred_at },
        limits: {
          maxOrderNotionalCents: Number(account.max_order_notional_cents),
          maxGrossExposureCents: Number(account.max_gross_exposure_cents),
          maxDailyLossCents: Number(account.max_daily_loss_cents),
          approvalThresholdCents: Number(account.approval_threshold_cents),
          maxLiquidityParticipationBps: account.max_liquidity_participation_bps,
          maxSpreadBps: account.max_spread_bps,
          maxDataAgeSeconds: account.max_data_age_seconds,
        },
        account: { tradingEnabled: account.trading_enabled, availableCashCents: Number(account.available_cash_cents) },
        positionUnits: Number(positionResult.rows[0]?.quantity_units || 0),
        grossExposureCents: Number(account.gross_exposure_cents),
        dailyLossCents: Math.max(0, -Number(account.realized_pnl_cents)),
      });
      const inserted = await client.query(
        `INSERT INTO gt_orders
          (tenant_id, account_id, client_order_id, symbol, side, quantity_units,
           limit_price_cents, status, risk_snapshot, request_digest, rejection_reasons, submitted_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [req.tradingTenant.id, accountId, body.clientOrderId, body.symbol, body.side, quantityUnits, body.limitPriceCents || null, decision.status, decision, requestDigest, JSON.stringify(decision.reasons), req.user.id]
      );
      await audit(client, req.tradingTenant.id, req.user.id, 'ORDER_RISK_EVALUATED', 'order', inserted.rows[0].id, decision);
      return { order: inserted.rows[0], idempotent: false };
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:orderId/approve', requireTradingRole('ADMIN', 'RISK_OFFICER'), async (req, res, next) => {
  try {
    const orderId = safeInteger(Number(req.params.orderId), 'orderId', 1);
    const result = await inTransaction(async (client) => {
      const order = await client.query('SELECT * FROM gt_orders WHERE id=$1 AND tenant_id=$2 FOR UPDATE', [orderId, req.tradingTenant.id]);
      if (!order.rowCount) { const error = new Error('order not found'); error.status = 404; throw error; }
      if (order.rows[0].status !== 'PENDING_APPROVAL') { const error = new Error('order is not pending approval'); error.status = 409; throw error; }
      if (order.rows[0].submitted_by === req.user.id) { const error = new Error('independent approval is required'); error.status = 409; throw error; }
      const changed = await client.query(
        `UPDATE gt_orders SET status='ACCEPTED', approved_by=$1, approved_at=NOW() WHERE id=$2 RETURNING *`,
        [req.user.id, orderId]
      );
      await audit(client, req.tradingTenant.id, req.user.id, 'ORDER_APPROVED', 'order', orderId);
      return changed.rows[0];
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/orders/:orderId/simulate', requireTradingRole('ADMIN', 'TRADER'), async (req, res, next) => {
  try {
    const orderId = safeInteger(Number(req.params.orderId), 'orderId', 1);
    const scenario = req.body.scenario || 'FULL';
    const attemptKey = String(req.body.attemptKey || '').trim();
    if (!attemptKey) return res.status(400).json({ error: 'attemptKey is required' });
    const result = await inTransaction(async (client) => {
      const orderResult = await client.query(
        `SELECT o.*, a.trading_enabled FROM gt_orders o JOIN gt_accounts a ON a.id=o.account_id
         WHERE o.id=$1 AND o.tenant_id=$2 FOR UPDATE`, [orderId, req.tradingTenant.id]
      );
      if (!orderResult.rowCount) { const error = new Error('order not found'); error.status = 404; throw error; }
      const order = orderResult.rows[0];
      if (!order.trading_enabled) { const error = new Error('kill switch is active'); error.status = 409; throw error; }
      const providerEventId = `paper:${orderId}:${attemptKey}`;
      const existingFill = await client.query('SELECT * FROM gt_fills WHERE tenant_id=$1 AND provider_event_id=$2', [req.tradingTenant.id, providerEventId]);
      if (existingFill.rowCount) return { fill: existingFill.rows[0], idempotent: true };
      if (!['ACCEPTED', 'PARTIALLY_FILLED'].includes(order.status)) { const error = new Error('order is not executable'); error.status = 409; throw error; }
      const totals = await client.query('SELECT COALESCE(SUM(quantity_units),0)::BIGINT AS filled_units FROM gt_fills WHERE order_id=$1', [orderId]);
      const quoteResult = await client.query(
        'SELECT * FROM gt_market_observations WHERE tenant_id=$1 AND symbol=$2 ORDER BY occurred_at DESC,id DESC LIMIT 1',
        [req.tradingTenant.id, order.symbol]
      );
      const outcome = simulateFill(
        { side: order.side, quantityUnits: Number(order.quantity_units), filledUnits: Number(totals.rows[0].filled_units) },
        { bidCents: Number(quoteResult.rows[0].bid_cents), askCents: Number(quoteResult.rows[0].ask_cents) },
        scenario
      );
      if (outcome.status === 'FAILED') {
        await client.query(`UPDATE gt_orders SET status='FAILED' WHERE id=$1`, [orderId]);
        await audit(client, req.tradingTenant.id, req.user.id, outcome.reason, 'order', orderId, { attemptKey });
        return { order: { ...order, status: 'FAILED' }, outcome, idempotent: false };
      }
      const position = await client.query(
        'SELECT * FROM gt_positions WHERE account_id=$1 AND symbol=$2 FOR UPDATE', [order.account_id, order.symbol]
      );
      const currentUnits = Number(position.rows[0]?.quantity_units || 0);
      const currentCost = Number(position.rows[0]?.cost_basis_cents || 0);
      if (order.side === 'SELL' && currentUnits < outcome.fillUnits) { const error = new Error('position changed; no-short limit prevents fill'); error.status = 409; throw error; }
      const fill = await client.query(
        `INSERT INTO gt_fills (tenant_id, order_id, provider_event_id, quantity_units, price_cents, notional_cents, scenario)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.tradingTenant.id, orderId, providerEventId, outcome.fillUnits, outcome.priceCents, outcome.notionalCents, scenario]
      );
      const tx = await client.query(
        `INSERT INTO gt_journal_transactions
          (tenant_id, account_id, transaction_key, transaction_type, reference_type, reference_id, created_by)
         VALUES ($1,$2,$3,'FILL','fill',$4,$5) RETURNING id`,
        [req.tradingTenant.id, order.account_id, `fill:${fill.rows[0].id}`, String(fill.rows[0].id), req.user.id]
      );
      const direction = order.side === 'BUY' ? 1 : -1;
      await client.query(
        `INSERT INTO gt_journal_entries (transaction_id, ledger_account, amount_cents, asset_units)
         VALUES ($1,'CASH:USD',$2,0),($1,$3,$4,$5)`,
        [tx.rows[0].id, -direction * outcome.notionalCents, `ASSET:${order.symbol}`, direction * outcome.notionalCents, direction * outcome.fillUnits]
      );
      await client.query('SELECT gt_finalize_journal($1)', [tx.rows[0].id]);
      let nextUnits;
      let nextCost;
      let realized = Number(position.rows[0]?.realized_pnl_cents || 0);
      if (order.side === 'BUY') {
        nextUnits = currentUnits + outcome.fillUnits;
        nextCost = currentCost + outcome.notionalCents;
      } else {
        const releasedCost = Math.floor((currentCost * outcome.fillUnits) / currentUnits);
        nextUnits = currentUnits - outcome.fillUnits;
        nextCost = currentCost - releasedCost;
        realized += outcome.notionalCents - releasedCost;
      }
      await client.query(
        `INSERT INTO gt_positions (account_id,symbol,quantity_units,cost_basis_cents,realized_pnl_cents)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (account_id,symbol) DO UPDATE SET quantity_units=$3,cost_basis_cents=$4,realized_pnl_cents=$5,updated_at=NOW()`,
        [order.account_id, order.symbol, nextUnits, nextCost, realized]
      );
      const totalFilled = Number(totals.rows[0].filled_units) + outcome.fillUnits;
      const nextStatus = totalFilled === Number(order.quantity_units) ? 'FILLED' : 'PARTIALLY_FILLED';
      await client.query('UPDATE gt_orders SET status=$1 WHERE id=$2', [nextStatus, orderId]);
      await audit(client, req.tradingTenant.id, req.user.id, 'PAPER_FILL_RECORDED', 'fill', fill.rows[0].id, { orderId, scenario, nextStatus });
      return { fill: fill.rows[0], orderStatus: nextStatus, idempotent: false };
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/journal/:transactionId/reverse', requireTradingRole('ADMIN', 'RISK_OFFICER'), async (req, res, next) => {
  try {
    const transactionId = safeInteger(Number(req.params.transactionId), 'transactionId', 1);
    const reason = String(req.body.reason || '').trim();
    const correctionKey = String(req.body.correctionKey || '').trim();
    if (reason.length < 5 || !correctionKey) return res.status(400).json({ error: 'reason and correctionKey are required' });
    const result = await inTransaction(async (client) => {
      const original = await client.query(
        `SELECT t.* FROM gt_journal_transactions t WHERE t.id=$1 AND t.tenant_id=$2 FOR UPDATE`,
        [transactionId, req.tradingTenant.id]
      );
      if (!original.rowCount) { const error = new Error('journal transaction not found'); error.status = 404; throw error; }
      const duplicate = await client.query(
        'SELECT * FROM gt_journal_transactions WHERE tenant_id=$1 AND account_id=$2 AND transaction_key=$3',
        [req.tradingTenant.id, original.rows[0].account_id, correctionKey]
      );
      if (duplicate.rowCount) return { correction: duplicate.rows[0], idempotent: true };
      const already = await client.query('SELECT id FROM gt_journal_transactions WHERE reverses_transaction_id=$1', [transactionId]);
      if (already.rowCount) { const error = new Error('transaction was already reversed'); error.status = 409; throw error; }
      const entries = await client.query('SELECT * FROM gt_journal_entries WHERE transaction_id=$1 ORDER BY id', [transactionId]);
      const correction = await client.query(
        `INSERT INTO gt_journal_transactions
          (tenant_id,account_id,transaction_key,transaction_type,reference_type,reference_id,reverses_transaction_id,reason,created_by)
         VALUES ($1,$2,$3,'CORRECTION','journal_transaction',$4,$5,$6,$7) RETURNING *`,
        [req.tradingTenant.id, original.rows[0].account_id, correctionKey, String(transactionId), transactionId, reason, req.user.id]
      );
      for (const entry of entries.rows) {
        await client.query(
          'INSERT INTO gt_journal_entries (transaction_id,ledger_account,amount_cents,asset_units) VALUES ($1,$2,$3,$4)',
          [correction.rows[0].id, entry.ledger_account, -Number(entry.amount_cents), -Number(entry.asset_units)]
        );
        if (entry.ledger_account.startsWith('ASSET:')) {
          const symbol = entry.ledger_account.slice(6);
          const position = await client.query('SELECT * FROM gt_positions WHERE account_id=$1 AND symbol=$2 FOR UPDATE', [original.rows[0].account_id, symbol]);
          const nextUnits = Number(position.rows[0]?.quantity_units || 0) - Number(entry.asset_units);
          const nextCost = Number(position.rows[0]?.cost_basis_cents || 0) - Number(entry.amount_cents);
          if (nextUnits < 0 || nextCost < 0) { const error = new Error('correction would create an invalid position'); error.status = 409; throw error; }
          await client.query('UPDATE gt_positions SET quantity_units=$1,cost_basis_cents=$2,updated_at=NOW() WHERE account_id=$3 AND symbol=$4', [nextUnits, nextCost, original.rows[0].account_id, symbol]);
        }
      }
      await client.query('SELECT gt_finalize_journal($1)', [correction.rows[0].id]);
      await audit(client, req.tradingTenant.id, req.user.id, 'JOURNAL_CORRECTION_RECORDED', 'journal_transaction', correction.rows[0].id, { reverses: transactionId, reason });
      return { correction: correction.rows[0], idempotent: false };
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/corporate-actions', requireTradingRole('ADMIN', 'RISK_OFFICER'), async (req, res, next) => {
  try {
    const { sourceCode, providerEventId, symbol, actionType } = req.body;
    if (!sourceCode || !providerEventId || !symbolPattern.test(symbol || '') || !['SPLIT', 'REBASE'].includes(actionType)) {
      return res.status(400).json({ error: 'a registered source and SPLIT/REBASE action are required' });
    }
    const numerator = safeInteger(req.body.numerator, 'numerator', 1);
    const denominator = safeInteger(req.body.denominator, 'denominator', 1);
    const effectiveAt = timestamp(req.body.effectiveAt, 'effectiveAt');
    const result = await inTransaction(async (client) => {
      const source = await client.query('SELECT * FROM gt_data_sources WHERE tenant_id=$1 AND source_code=$2 AND enabled=TRUE', [req.tradingTenant.id, sourceCode]);
      if (!source.rowCount) { const error = new Error('registered source not found'); error.status = 404; throw error; }
      const existing = await client.query('SELECT * FROM gt_corporate_actions WHERE tenant_id=$1 AND source_id=$2 AND provider_event_id=$3', [req.tradingTenant.id, source.rows[0].id, providerEventId]);
      if (existing.rowCount) return { action: existing.rows[0], idempotent: true };
      const positions = await client.query(
        `SELECT p.* FROM gt_positions p JOIN gt_accounts a ON a.id=p.account_id
         WHERE a.tenant_id=$1 AND p.symbol=$2 FOR UPDATE`, [req.tradingTenant.id, symbol]
      );
      for (const position of positions.rows) {
        const product = BigInt(position.quantity_units) * BigInt(numerator);
        if (product % BigInt(denominator) !== 0n) { const error = new Error('corporate action creates fractional atomic units'); error.status = 409; throw error; }
      }
      const action = await client.query(
        `INSERT INTO gt_corporate_actions
          (tenant_id,source_id,provider_event_id,symbol,action_type,numerator,denominator,effective_at,applied_at,created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9) RETURNING *`,
        [req.tradingTenant.id, source.rows[0].id, providerEventId, symbol, actionType, numerator, denominator, effectiveAt, req.user.id]
      );
      for (const position of positions.rows) {
        const nextUnits = Number((BigInt(position.quantity_units) * BigInt(numerator)) / BigInt(denominator));
        const delta = nextUnits - Number(position.quantity_units);
        await client.query('UPDATE gt_positions SET quantity_units=$1,updated_at=NOW() WHERE account_id=$2 AND symbol=$3', [nextUnits, position.account_id, symbol]);
        if (delta !== 0) {
          const tx = await client.query(
            `INSERT INTO gt_journal_transactions
              (tenant_id,account_id,transaction_key,transaction_type,reference_type,reference_id,created_by)
             VALUES ($1,$2,$3,'CORPORATE_ACTION','corporate_action',$4,$5) RETURNING id`,
            [req.tradingTenant.id, position.account_id, `corporate:${action.rows[0].id}:${position.account_id}`, String(action.rows[0].id), req.user.id]
          );
          await client.query('INSERT INTO gt_journal_entries (transaction_id,ledger_account,amount_cents,asset_units) VALUES ($1,$2,0,$3)', [tx.rows[0].id, `ASSET:${symbol}`, delta]);
          await client.query('SELECT gt_finalize_journal($1)', [tx.rows[0].id]);
        }
      }
      await audit(client, req.tradingTenant.id, req.user.id, 'CORPORATE_ACTION_APPLIED', 'corporate_action', action.rows[0].id, { symbol, numerator, denominator, accounts: positions.rowCount });
      return { action: action.rows[0], idempotent: false };
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/backtests', requireTradingRole('ADMIN', 'TRADER', 'RISK_OFFICER'), async (req, res, next) => {
  try {
    const runKey = String(req.body.runKey || '').trim();
    if (!runKey) return res.status(400).json({ error: 'runKey is required' });
    const scenario = { steps: req.body.steps, limits: req.body.limits, initialCashCents: req.body.initialCashCents, maxGapSeconds: req.body.maxGapSeconds };
    const digest = payloadDigest(scenario);
    const output = runDeterministicBacktest(scenario);
    const result = await inTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO gt_backtest_runs (tenant_id,run_key,input_digest,scenario,result,created_by)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (tenant_id,run_key) DO NOTHING RETURNING *`,
        [req.tradingTenant.id, runKey, digest, scenario, output, req.user.id]
      );
      if (!inserted.rowCount) {
        const existing = await client.query('SELECT * FROM gt_backtest_runs WHERE tenant_id=$1 AND run_key=$2', [req.tradingTenant.id, runKey]);
        if (existing.rows[0].input_digest !== digest) { const error = new Error('runKey reused with different scenario'); error.status = 409; throw error; }
        return { run: existing.rows[0], idempotent: true };
      }
      await audit(client, req.tradingTenant.id, req.user.id, 'BACKTEST_COMPLETED', 'backtest', inserted.rows[0].id, output);
      return { run: inserted.rows[0], idempotent: false };
    });
    res.status(result.idempotent ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard', async (req, res, next) => {
  try {
    const [accounts, orders, positions] = await Promise.all([
      pool.query(`SELECT id,account_key,name,custody_mode,trading_enabled,kill_reason,created_at FROM gt_accounts WHERE tenant_id=$1 ORDER BY id`, [req.tradingTenant.id]),
      pool.query(`SELECT id,account_id,client_order_id,symbol,side,quantity_units,status,created_at FROM gt_orders WHERE tenant_id=$1 ORDER BY id DESC LIMIT 100`, [req.tradingTenant.id]),
      pool.query(`SELECT p.* FROM gt_positions p JOIN gt_accounts a ON a.id=p.account_id WHERE a.tenant_id=$1 ORDER BY p.account_id,p.symbol`, [req.tradingTenant.id]),
    ]);
    res.json({ tenant: req.tradingTenant, accounts: accounts.rows, orders: orders.rows, positions: positions.rows });
  } catch (error) {
    next(error);
  }
});

router.get('/audit-export', requireTradingRole('ADMIN', 'RISK_OFFICER', 'AUDITOR'), async (req, res, next) => {
  try {
    const [events, transactions, entries, providerEvents] = await Promise.all([
      pool.query('SELECT * FROM gt_audit_events WHERE tenant_id=$1 ORDER BY created_at,id', [req.tradingTenant.id]),
      pool.query('SELECT * FROM gt_journal_transactions WHERE tenant_id=$1 ORDER BY created_at,id', [req.tradingTenant.id]),
      pool.query(`SELECT e.* FROM gt_journal_entries e JOIN gt_journal_transactions t ON t.id=e.transaction_id WHERE t.tenant_id=$1 ORDER BY e.id`, [req.tradingTenant.id]),
      pool.query('SELECT id,source_id,provider_event_id,event_kind,payload_digest,occurred_at,source_timestamp,received_at FROM gt_provider_events WHERE tenant_id=$1 ORDER BY id', [req.tradingTenant.id]),
    ]);
    const entryBalance = entries.rows.reduce((sum, entry) => sum + BigInt(entry.amount_cents), 0n);
    res.json({ generatedAt: new Date().toISOString(), tenantKey: req.tradingTenant.tenant_key, journalBalanced: entryBalance === 0n, events: events.rows, transactions: transactions.rows, entries: entries.rows, providerEvents: providerEvents.rows });
  } catch (error) {
    next(error);
  }
});

export default router;
