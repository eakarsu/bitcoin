# Governed paper-trading runbook

## Production boundary

Production supports only `/api/v2/trading`, authentication/profile routes, the
governed Paper Trading UI, and health probes. Legacy signal, portfolio, price,
AI, enhancement, trade-edit/delete, mock-data, bot, and scheduler surfaces
return HTTP 410. Live broker order execution is intentionally absent.

All money is integer cents and all asset quantities are integer atomic units.
Every account has `custody_mode=PAPER`. Orders are evaluated by deterministic
exposure, liquidity, spread, daily-loss, no-short, stale-data, cash, approval,
and kill-switch rules. AI output cannot submit, approve, or fill an order.

## Configure and start

Copy `.env.example` outside source control and replace every placeholder.
`JWT_SECRET` and every value in `MARKET_DATA_WEBHOOK_SECRETS_JSON` must be
independent high-entropy secrets. Register only data sources backed by an
approved license or contract reference.

```sh
./start.sh check
ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate
./start.sh api
./start.sh frontend
```

The launcher never installs dependencies, creates or seeds a database, kills
processes, or migrates implicitly. Container topology is recorded in
`compose.yaml`; migration is a finite separate service.

## Source onboarding and reconciliation

An administrator or risk officer registers a `MARKET`, `BANK`, or `BROKER`
source through `POST /api/v2/trading/sources`, including its license reference
and maximum age. Provider events use a stable event ID, occurrence timestamp,
source timestamp, canonical payload, `x-market-source`, and
`x-market-signature` (HMAC-SHA256 over canonical JSON). Duplicate IDs are
idempotent only when their digest matches; substitutions return conflict.

Use `GET /api/v2/trading/reconciliation` to compare counts and source/receipt
timestamps. Alert on ingestion gaps, signature failures, stale observations,
unexplained broker/bank events, and any dead source. Provider credentials never
belong in database payloads or audit exports.

## Failure and incident controls

- Activate an account kill switch for stale/incorrect data, unexplained
  exposure, reconciliation drift, or suspected credential compromise.
- Do not edit or delete fills or journal evidence. Record errors with the
  independent correction endpoint, which appends reversing entries.
- Exercise `FULL`, `PARTIAL`, `REJECT`, and `TIMEOUT` paper scenarios and the
  deterministic backtest before approving a strategy change.
- Export tenant audit evidence and reconcile every journal transaction to a
  zero-cent entry sum. Preserve provider digests and source timestamps.
- Rotate a compromised provider secret, disable the data source, and reject
  observations received during the uncertain interval.

## Backup, restore, and release gates

Back up PostgreSQL with an encrypted, access-controlled mechanism. Restore to a
disposable database and verify migration checksums, tenant isolation, provider
event counts, append-only audit/fill/journal guards, balanced journal entries,
and latest source timestamps. A witnessed restore is a production release gate.

Live trading requires a separate reviewed product boundary: licensed market,
bank, and broker agreements; custody and key-management design; provider
sandbox certification; financial/legal approval; monitoring and on-call
ownership; penetration testing; load/failover testing; and a distinct opt-in
deployment. None of those gates is implied by passing paper-mode tests.
