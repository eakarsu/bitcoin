# Governed cryptocurrency paper-trading platform

This repository's supported product is a tenant-scoped **paper-trading**
application. It ingests signed observations from registered licensed sources,
evaluates orders with deterministic limits, requires independent approval for
large orders, simulates provider outcomes, and preserves append-only audit,
fill, and balanced journal evidence.

It does not hold assets, store broker keys, or execute live trades. The legacy
signal, mock-data, mutable-trade, bot, scheduler, and generic-AI implementation
remains only as quarantined development history. Those HTTP routes return 410
in the supported configuration, and the production UI exposes only the
governed workflow.

## Supported journey

1. A user creates a tenant and an administrator assigns tenant-scoped trader,
   risk-officer, and auditor roles.
2. An administrator or risk officer registers a `MARKET`, `BANK`, or `BROKER`
   source with its license/contract reference and age policy.
3. The provider sends HMAC-signed events with stable IDs and explicit source,
   occurrence, and receipt timestamps. Duplicate IDs are accepted only when
   their canonical payload digest matches.
4. An administrator creates a paper-custody account with integer-cent cash and
   deterministic exposure, order, liquidity, spread, loss, stale-data,
   approval, no-short, and kill-switch controls.
5. A trader submits an idempotent order. Rejected orders retain their risk
   evidence; high-notional orders require a different risk actor's approval.
6. The paper provider models full fill, partial fill, reject, and timeout
   outcomes. Fills produce immutable entries in a finalized balanced journal.
7. Source errors are corrected with appended reversal transactions; supported
   split/rebase corporate actions update atomic-unit positions without erasing
   evidence. Auditors export the tenant history and reconciliation timestamps.

AI output is not an input to order acceptance, approval, fill, correction, or
kill-switch decisions.

## Local verification

Install dependencies explicitly, then run the non-mutating check:

```sh
npm ci
npm --prefix backend ci
./start.sh check
```

Runtime configuration is documented in `.env.example`. Database changes and
service startup are separate, explicit actions:

```sh
ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate
./start.sh api
./start.sh frontend
```

The launcher never installs dependencies, creates or seeds a database, kills
processes, or migrates during normal startup. `compose.yaml` records the
PostgreSQL, finite migration, API, and static-web topology. See
[`RUNBOOK.md`](RUNBOOK.md) for provider onboarding, incident response,
reconciliation, backup/restore, and live-trading release gates.

## Main surfaces

- Frontend: `/` and `/paper-trading`
- API: `/api/v2/trading`
- Liveness: `/health`
- Database readiness: `/health/ready`
- Schema: `backend/migrations/008_governed_paper_trading.sql`
- Risk and replay engine: `backend/src/governance/riskEngine.js`

The generated UI is served separately from the API in the container topology;
the checked-in Nginx configuration proxies API requests without exposing the
database. Production requires TLS at the ingress, high-entropy JWT/provider
secrets, licensed sources, monitored backups, and a witnessed restore.
