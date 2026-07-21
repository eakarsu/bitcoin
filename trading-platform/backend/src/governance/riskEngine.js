import crypto from 'crypto';

export const ASSET_SCALE = 100_000_000n;

export function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function payloadDigest(value) {
  return crypto.createHash('sha256').update(canonicalize(value)).digest('hex');
}

export function signProviderPayload(secret, value) {
  return crypto.createHmac('sha256', secret).update(canonicalize(value)).digest('hex');
}

export function verifyProviderSignature(secret, value, supplied) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(supplied || '')) return false;
  const expected = Buffer.from(signProviderPayload(secret, value), 'hex');
  const actual = Buffer.from(supplied, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function integer(value, name, { min = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < min) throw new Error(`${name} must be a safe integer >= ${min}`);
  return BigInt(value);
}

function safeNumber(value, name) {
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error(`${name} exceeds safe integer range`);
  return result;
}

export function orderNotionalCents(quantityUnits, priceCents) {
  const units = integer(quantityUnits, 'quantityUnits', { min: 1 });
  const price = integer(priceCents, 'priceCents', { min: 1 });
  return safeNumber((units * price + ASSET_SCALE - 1n) / ASSET_SCALE, 'notional');
}

export function evaluateRisk({ order, quote, limits, account, positionUnits = 0, grossExposureCents = 0, dailyLossCents = 0, now = Date.now() }) {
  const quantity = Number(integer(order.quantityUnits, 'quantityUnits', { min: 1 }));
  const bid = Number(integer(quote.bidCents, 'bidCents', { min: 1 }));
  const ask = Number(integer(quote.askCents, 'askCents', { min: 1 }));
  const liquidity = Number(integer(quote.liquidityUnits, 'liquidityUnits'));
  if (ask < bid) throw new Error('askCents must be >= bidCents');
  if (!['BUY', 'SELL'].includes(order.side)) throw new Error('side must be BUY or SELL');

  const price = order.side === 'BUY' ? ask : bid;
  const notionalCents = orderNotionalCents(quantity, price);
  const ageMs = now - new Date(quote.occurredAt).getTime();
  const midpoint = Math.max(1, Math.floor((bid + ask) / 2));
  const spreadBps = Math.floor(((ask - bid) * 10_000) / midpoint);
  const participationBps = liquidity === 0 ? 10_001 : Math.ceil((quantity * 10_000) / liquidity);
  const reasons = [];

  if (!account.tradingEnabled) reasons.push('KILL_SWITCH_ACTIVE');
  if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > limits.maxDataAgeSeconds * 1000) reasons.push('STALE_MARKET_DATA');
  if (spreadBps > limits.maxSpreadBps) reasons.push('SPREAD_LIMIT');
  if (participationBps > limits.maxLiquidityParticipationBps) reasons.push('LIQUIDITY_LIMIT');
  if (notionalCents > limits.maxOrderNotionalCents) reasons.push('ORDER_NOTIONAL_LIMIT');
  if (grossExposureCents + notionalCents > limits.maxGrossExposureCents) reasons.push('GROSS_EXPOSURE_LIMIT');
  if (dailyLossCents >= limits.maxDailyLossCents) reasons.push('DAILY_LOSS_LIMIT');
  if (order.side === 'BUY' && notionalCents > account.availableCashCents) reasons.push('INSUFFICIENT_PAPER_CASH');
  if (order.side === 'SELL' && quantity > positionUnits) reasons.push('NO_SHORTING_LIMIT');
  if (order.limitPriceCents && ((order.side === 'BUY' && ask > order.limitPriceCents) || (order.side === 'SELL' && bid < order.limitPriceCents))) reasons.push('LIMIT_PRICE_NOT_MARKETABLE');

  const status = reasons.length > 0
    ? 'REJECTED'
    : notionalCents >= limits.approvalThresholdCents
      ? 'PENDING_APPROVAL'
      : 'ACCEPTED';

  return {
    status,
    reasons,
    priceCents: price,
    notionalCents,
    quoteAgeMs: ageMs,
    spreadBps,
    participationBps,
    evaluatedAt: new Date(now).toISOString(),
  };
}

export function simulateFill(order, quote, scenario = 'FULL') {
  if (!['FULL', 'PARTIAL', 'REJECT', 'TIMEOUT'].includes(scenario)) throw new Error('unsupported paper scenario');
  if (scenario === 'REJECT') return { status: 'FAILED', reason: 'PAPER_PROVIDER_REJECTED', fillUnits: 0 };
  if (scenario === 'TIMEOUT') return { status: 'FAILED', reason: 'PAPER_PROVIDER_TIMEOUT', fillUnits: 0 };
  const remaining = order.quantityUnits - (order.filledUnits || 0);
  if (!Number.isSafeInteger(remaining) || remaining <= 0) throw new Error('order has no remaining quantity');
  const fillUnits = scenario === 'PARTIAL' ? Math.max(1, Math.floor(remaining / 2)) : remaining;
  const priceCents = order.side === 'BUY' ? quote.askCents : quote.bidCents;
  return {
    status: fillUnits === remaining ? 'FILLED' : 'PARTIALLY_FILLED',
    fillUnits,
    priceCents,
    notionalCents: orderNotionalCents(fillUnits, priceCents),
  };
}

export function runDeterministicBacktest({ steps, limits, initialCashCents, maxGapSeconds = 60 }) {
  if (!Array.isArray(steps) || steps.length === 0) throw new Error('steps are required');
  const seen = new Set();
  let cash = initialCashCents;
  let positionUnits = 0;
  let gross = 0;
  let accepted = 0;
  let rejected = 0;
  let duplicateEvents = 0;
  let staleEvents = 0;
  let partialFills = 0;
  let previousAt = null;

  for (const step of steps) {
    if (seen.has(step.eventId)) {
      duplicateEvents += 1;
      continue;
    }
    seen.add(step.eventId);
    const occurred = new Date(step.occurredAt).getTime();
    if (previousAt !== null && occurred - previousAt > maxGapSeconds * 1000) staleEvents += 1;
    previousAt = occurred;
    if (!step.order) continue;

    const decision = evaluateRisk({
      order: step.order,
      quote: { ...step.quote, occurredAt: step.occurredAt },
      limits,
      account: { tradingEnabled: true, availableCashCents: cash },
      positionUnits,
      grossExposureCents: gross,
      now: occurred,
    });
    if (decision.status === 'REJECTED') {
      rejected += 1;
      continue;
    }
    accepted += 1;
    const result = simulateFill({ ...step.order, filledUnits: 0 }, step.quote, step.scenario || 'FULL');
    if (result.status === 'FAILED') continue;
    if (result.status === 'PARTIALLY_FILLED') partialFills += 1;
    if (step.order.side === 'BUY') {
      cash -= result.notionalCents;
      positionUnits += result.fillUnits;
      gross += result.notionalCents;
    } else {
      cash += result.notionalCents;
      positionUnits -= result.fillUnits;
      gross = Math.max(0, gross - result.notionalCents);
    }
  }

  return { accepted, rejected, duplicateEvents, staleEvents, partialFills, endingCashCents: cash, endingPositionUnits: positionUnits };
}
