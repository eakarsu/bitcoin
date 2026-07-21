-- Governed, paper-only trading boundary. Monetary values are integer cents and
-- asset quantities are integer atomic units (1 asset = 100,000,000 units).

CREATE TABLE IF NOT EXISTS gt_tenants (
  id BIGSERIAL PRIMARY KEY,
  tenant_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gt_memberships (
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TRADER', 'RISK_OFFICER', 'AUDITOR')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS gt_data_sources (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  source_code TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('MARKET', 'BANK', 'BROKER')),
  license_reference TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  max_age_seconds INTEGER NOT NULL CHECK (max_age_seconds BETWEEN 1 AND 86400),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, source_code)
);

CREATE TABLE IF NOT EXISTS gt_provider_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  source_id BIGINT NOT NULL REFERENCES gt_data_sources(id),
  provider_event_id TEXT NOT NULL,
  event_kind TEXT NOT NULL CHECK (event_kind IN ('MARKET_QUOTE', 'BANK_BALANCE', 'BROKER_ORDER', 'BROKER_FILL', 'BROKER_CORRECTION')),
  payload_digest CHAR(64) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_timestamp TIMESTAMPTZ NOT NULL,
  payload JSONB NOT NULL,
  UNIQUE (tenant_id, source_id, provider_event_id)
);

CREATE TABLE IF NOT EXISTS gt_market_observations (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  provider_event_id BIGINT NOT NULL UNIQUE REFERENCES gt_provider_events(id),
  symbol TEXT NOT NULL CHECK (symbol ~ '^[A-Z0-9]{2,12}-[A-Z0-9]{2,12}$'),
  bid_cents BIGINT NOT NULL CHECK (bid_cents > 0),
  ask_cents BIGINT NOT NULL CHECK (ask_cents >= bid_cents),
  liquidity_units BIGINT NOT NULL CHECK (liquidity_units >= 0),
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gt_market_latest_idx
  ON gt_market_observations (tenant_id, symbol, occurred_at DESC);

CREATE TABLE IF NOT EXISTS gt_accounts (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  account_key TEXT NOT NULL,
  name TEXT NOT NULL,
  custody_mode TEXT NOT NULL DEFAULT 'PAPER' CHECK (custody_mode = 'PAPER'),
  base_currency TEXT NOT NULL DEFAULT 'USD' CHECK (base_currency = 'USD'),
  initial_cash_cents BIGINT NOT NULL CHECK (initial_cash_cents >= 0),
  trading_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  kill_reason TEXT,
  killed_by INTEGER REFERENCES users(id),
  killed_at TIMESTAMPTZ,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, account_key)
);

CREATE TABLE IF NOT EXISTS gt_risk_limits (
  account_id BIGINT PRIMARY KEY REFERENCES gt_accounts(id),
  max_order_notional_cents BIGINT NOT NULL CHECK (max_order_notional_cents > 0),
  max_gross_exposure_cents BIGINT NOT NULL CHECK (max_gross_exposure_cents > 0),
  max_daily_loss_cents BIGINT NOT NULL CHECK (max_daily_loss_cents > 0),
  approval_threshold_cents BIGINT NOT NULL CHECK (approval_threshold_cents > 0),
  max_liquidity_participation_bps INTEGER NOT NULL CHECK (max_liquidity_participation_bps BETWEEN 1 AND 10000),
  max_spread_bps INTEGER NOT NULL CHECK (max_spread_bps BETWEEN 1 AND 10000),
  max_data_age_seconds INTEGER NOT NULL CHECK (max_data_age_seconds BETWEEN 1 AND 86400),
  updated_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gt_positions (
  account_id BIGINT NOT NULL REFERENCES gt_accounts(id),
  symbol TEXT NOT NULL,
  quantity_units BIGINT NOT NULL DEFAULT 0,
  cost_basis_cents BIGINT NOT NULL DEFAULT 0,
  realized_pnl_cents BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, symbol),
  CHECK (quantity_units >= 0)
);

CREATE TABLE IF NOT EXISTS gt_orders (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  account_id BIGINT NOT NULL REFERENCES gt_accounts(id),
  client_order_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('BUY', 'SELL')),
  quantity_units BIGINT NOT NULL CHECK (quantity_units > 0),
  limit_price_cents BIGINT CHECK (limit_price_cents > 0),
  status TEXT NOT NULL CHECK (status IN ('REJECTED', 'PENDING_APPROVAL', 'ACCEPTED', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'FAILED')),
  risk_snapshot JSONB NOT NULL,
  request_digest CHAR(64) NOT NULL,
  rejection_reasons JSONB NOT NULL DEFAULT '[]'::JSONB,
  submitted_by INTEGER NOT NULL REFERENCES users(id),
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, account_id, client_order_id)
);

CREATE INDEX IF NOT EXISTS gt_orders_account_created_idx
  ON gt_orders (tenant_id, account_id, created_at DESC);

CREATE TABLE IF NOT EXISTS gt_fills (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  order_id BIGINT NOT NULL REFERENCES gt_orders(id),
  provider_event_id TEXT NOT NULL,
  quantity_units BIGINT NOT NULL CHECK (quantity_units > 0),
  price_cents BIGINT NOT NULL CHECK (price_cents > 0),
  notional_cents BIGINT NOT NULL CHECK (notional_cents > 0),
  scenario TEXT NOT NULL CHECK (scenario IN ('FULL', 'PARTIAL', 'PROVIDER')),
  filled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider_event_id)
);

CREATE TABLE IF NOT EXISTS gt_journal_transactions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  account_id BIGINT NOT NULL REFERENCES gt_accounts(id),
  transaction_key TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('OPENING', 'FILL', 'CORRECTION', 'CORPORATE_ACTION')),
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  reverses_transaction_id BIGINT REFERENCES gt_journal_transactions(id),
  reason TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  UNIQUE (tenant_id, account_id, transaction_key)
);

CREATE TABLE IF NOT EXISTS gt_journal_entries (
  id BIGSERIAL PRIMARY KEY,
  transaction_id BIGINT NOT NULL REFERENCES gt_journal_transactions(id),
  ledger_account TEXT NOT NULL,
  amount_cents BIGINT NOT NULL,
  asset_units BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_cents <> 0 OR asset_units <> 0)
);

CREATE TABLE IF NOT EXISTS gt_corporate_actions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  source_id BIGINT NOT NULL REFERENCES gt_data_sources(id),
  provider_event_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('SPLIT', 'REBASE', 'CASH_DISTRIBUTION')),
  numerator BIGINT NOT NULL DEFAULT 1 CHECK (numerator > 0),
  denominator BIGINT NOT NULL DEFAULT 1 CHECK (denominator > 0),
  cash_per_unit_micros BIGINT NOT NULL DEFAULT 0 CHECK (cash_per_unit_micros >= 0),
  effective_at TIMESTAMPTZ NOT NULL,
  applied_at TIMESTAMPTZ,
  created_by INTEGER NOT NULL REFERENCES users(id),
  UNIQUE (tenant_id, source_id, provider_event_id)
);

CREATE TABLE IF NOT EXISTS gt_backtest_runs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  run_key TEXT NOT NULL,
  input_digest CHAR(64) NOT NULL,
  scenario JSONB NOT NULL,
  result JSONB NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, run_key)
);

CREATE TABLE IF NOT EXISTS gt_audit_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES gt_tenants(id),
  actor_user_id INTEGER REFERENCES users(id),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  detail JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gt_audit_tenant_created_idx
  ON gt_audit_events (tenant_id, created_at, id);

CREATE OR REPLACE FUNCTION gt_block_append_only_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;

CREATE OR REPLACE FUNCTION gt_guard_journal_transaction()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' OR OLD.finalized_at IS NOT NULL OR NEW.finalized_at IS NULL OR
     (to_jsonb(NEW) - 'finalized_at') IS DISTINCT FROM (to_jsonb(OLD) - 'finalized_at') THEN
    RAISE EXCEPTION 'finalized journal transactions are append-only';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION gt_guard_journal_entry()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RAISE EXCEPTION 'journal entries are append-only';
  END IF;
  IF EXISTS (SELECT 1 FROM gt_journal_transactions WHERE id = NEW.transaction_id AND finalized_at IS NOT NULL) THEN
    RAISE EXCEPTION 'cannot append to a finalized journal transaction';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION gt_finalize_journal(transaction_to_finalize BIGINT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE entry_count BIGINT; balance BIGINT;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(amount_cents), 0)
    INTO entry_count, balance
    FROM gt_journal_entries WHERE transaction_id = transaction_to_finalize;
  IF entry_count = 0 OR balance <> 0 THEN
    RAISE EXCEPTION 'journal transaction % is unbalanced or empty', transaction_to_finalize;
  END IF;
  UPDATE gt_journal_transactions SET finalized_at = NOW()
   WHERE id = transaction_to_finalize AND finalized_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'journal transaction missing or already finalized'; END IF;
END;
$$;

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'gt_provider_events', 'gt_market_observations', 'gt_fills',
    'gt_audit_events'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'gt_append_only_guard', table_name);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION gt_block_append_only_mutation()',
      'gt_append_only_guard', table_name
    );
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS gt_journal_transaction_guard ON gt_journal_transactions;
CREATE TRIGGER gt_journal_transaction_guard
  BEFORE UPDATE OR DELETE ON gt_journal_transactions
  FOR EACH ROW EXECUTE FUNCTION gt_guard_journal_transaction();

DROP TRIGGER IF EXISTS gt_journal_entry_guard ON gt_journal_entries;
CREATE TRIGGER gt_journal_entry_guard
  BEFORE INSERT OR UPDATE OR DELETE ON gt_journal_entries
  FOR EACH ROW EXECUTE FUNCTION gt_guard_journal_entry();

DO $$
DECLARE table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'gt_provider_events', 'gt_market_observations', 'gt_fills',
    'gt_journal_transactions', 'gt_journal_entries', 'gt_audit_events'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', 'gt_append_only_truncate_guard', table_name);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION gt_block_append_only_mutation()',
      'gt_append_only_truncate_guard', table_name
    );
  END LOOP;
END;
$$;
