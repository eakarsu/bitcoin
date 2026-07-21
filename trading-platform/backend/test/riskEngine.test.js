import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canonicalize,
  evaluateRisk,
  orderNotionalCents,
  payloadDigest,
  runDeterministicBacktest,
  signProviderPayload,
  simulateFill,
  verifyProviderSignature,
} from '../src/governance/riskEngine.js';

const now = Date.parse('2026-07-19T12:00:00.000Z');
const quote = { bidCents: 4_990_000, askCents: 5_000_000, liquidityUnits: 100_000_000, occurredAt: new Date(now).toISOString() };
const limits = {
  maxOrderNotionalCents: 1_000_000,
  maxGrossExposureCents: 2_000_000,
  maxDailyLossCents: 100_000,
  approvalThresholdCents: 250_000,
  maxLiquidityParticipationBps: 2_000,
  maxSpreadBps: 100,
  maxDataAgeSeconds: 30,
};
const account = { tradingEnabled: true, availableCashCents: 2_000_000 };

test('canonical provider signatures are stable and tamper evident', () => {
  const body = { z: 1, a: { y: 2, x: 3 } };
  assert.equal(canonicalize(body), '{"a":{"x":3,"y":2},"z":1}');
  const signature = signProviderPayload('a-secure-provider-secret-that-is-long', body);
  assert.equal(verifyProviderSignature('a-secure-provider-secret-that-is-long', body, signature), true);
  assert.equal(verifyProviderSignature('a-secure-provider-secret-that-is-long', { ...body, z: 2 }, signature), false);
  assert.equal(payloadDigest(body).length, 64);
});

test('notional uses integer atomic units and rounds cents upward', () => {
  assert.equal(orderNotionalCents(100_000_000, 5_000_000), 5_000_000);
  assert.equal(orderNotionalCents(1, 1), 1);
  assert.throws(() => orderNotionalCents(0, 1), /quantityUnits/);
});

test('small marketable order is deterministically accepted', () => {
  const result = evaluateRisk({ order: { side: 'BUY', quantityUnits: 2_000_000 }, quote, limits, account, now });
  assert.equal(result.status, 'ACCEPTED');
  assert.deepEqual(result.reasons, []);
});

test('approval threshold is evaluated outside any AI path', () => {
  const result = evaluateRisk({ order: { side: 'BUY', quantityUnits: 6_000_000 }, quote, limits, account, now });
  assert.equal(result.status, 'PENDING_APPROVAL');
});

test('kill switch rejects otherwise valid orders', () => {
  const result = evaluateRisk({ order: { side: 'BUY', quantityUnits: 1_000_000 }, quote, limits, account: { ...account, tradingEnabled: false }, now });
  assert.deepEqual(result.reasons, ['KILL_SWITCH_ACTIVE']);
});

test('stale and future market observations fail closed', () => {
  const stale = evaluateRisk({ order: { side: 'BUY', quantityUnits: 1_000_000 }, quote: { ...quote, occurredAt: new Date(now - 31_000).toISOString() }, limits, account, now });
  const future = evaluateRisk({ order: { side: 'BUY', quantityUnits: 1_000_000 }, quote: { ...quote, occurredAt: new Date(now + 1).toISOString() }, limits, account, now });
  assert.ok(stale.reasons.includes('STALE_MARKET_DATA'));
  assert.ok(future.reasons.includes('STALE_MARKET_DATA'));
});

test('exposure, loss, liquidity, spread and cash limits accumulate reasons', () => {
  const result = evaluateRisk({
    order: { side: 'BUY', quantityUnits: 9_000_000 },
    quote: { ...quote, bidCents: 4_000_000, liquidityUnits: 9_000_000 },
    limits: { ...limits, maxOrderNotionalCents: 100, maxGrossExposureCents: 100, maxDailyLossCents: 50, maxLiquidityParticipationBps: 100, maxSpreadBps: 10 },
    account: { ...account, availableCashCents: 100 },
    grossExposureCents: 100,
    dailyLossCents: 50,
    now,
  });
  for (const reason of ['SPREAD_LIMIT', 'LIQUIDITY_LIMIT', 'ORDER_NOTIONAL_LIMIT', 'GROSS_EXPOSURE_LIMIT', 'DAILY_LOSS_LIMIT', 'INSUFFICIENT_PAPER_CASH']) assert.ok(result.reasons.includes(reason));
});

test('sell path prohibits shorting and enforces limit prices', () => {
  const noPosition = evaluateRisk({ order: { side: 'SELL', quantityUnits: 1_000_000, limitPriceCents: 5_000_000 }, quote, limits, account, positionUnits: 0, now });
  assert.ok(noPosition.reasons.includes('NO_SHORTING_LIMIT'));
  assert.ok(noPosition.reasons.includes('LIMIT_PRICE_NOT_MARKETABLE'));
});

test('paper simulator models full, partial, reject, and timeout outcomes', () => {
  const order = { side: 'BUY', quantityUnits: 100, filledUnits: 0 };
  assert.equal(simulateFill(order, quote, 'FULL').status, 'FILLED');
  assert.equal(simulateFill(order, quote, 'PARTIAL').fillUnits, 50);
  assert.equal(simulateFill(order, quote, 'REJECT').reason, 'PAPER_PROVIDER_REJECTED');
  assert.equal(simulateFill(order, quote, 'TIMEOUT').reason, 'PAPER_PROVIDER_TIMEOUT');
});

test('backtest exposes duplicate, stale, rejected and partial-fill behavior', () => {
  const base = '2026-07-19T12:00:00.000Z';
  const scenario = {
    limits,
    initialCashCents: 1_000_000,
    maxGapSeconds: 60,
    steps: [
      { eventId: 'q1', occurredAt: base, quote, order: { side: 'BUY', quantityUnits: 1_000_000 }, scenario: 'PARTIAL' },
      { eventId: 'q1', occurredAt: base, quote },
      { eventId: 'q2', occurredAt: '2026-07-19T12:02:00.000Z', quote, order: { side: 'SELL', quantityUnits: 9_000_000 } },
    ],
  };
  const result = runDeterministicBacktest(scenario);
  assert.deepEqual(
    { duplicateEvents: result.duplicateEvents, staleEvents: result.staleEvents, rejected: result.rejected, partialFills: result.partialFills },
    { duplicateEvents: 1, staleEvents: 1, rejected: 1, partialFills: 1 }
  );
});
