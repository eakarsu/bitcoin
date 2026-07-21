#!/bin/sh
set -eu
cd "$(dirname "$0")"

mode="${1:-check}"

require_value() {
  eval "configured_value=\${$1:-}"
  [ -n "$configured_value" ] || { echo "$1 is required" >&2; exit 1; }
}

check_runtime() {
  require_value DATABASE_URL
  require_value JWT_SECRET
  [ "${#JWT_SECRET}" -ge 32 ] || { echo 'JWT_SECRET must be at least 32 characters' >&2; exit 1; }
  case "$DATABASE_URL" in postgres://*|postgresql://*) ;; *) echo 'DATABASE_URL must use PostgreSQL' >&2; exit 1;; esac
  if [ "${NODE_ENV:-development}" = production ]; then
    require_value CORS_ORIGIN
    [ "${ENABLE_LEGACY_DEMO_SURFACES:-false}" = false ] || { echo 'legacy demo surfaces cannot run in production' >&2; exit 1; }
    case "${MARKET_DATA_WEBHOOK_SECRETS_JSON:-}" in \{*\}) ;; *) echo 'MARKET_DATA_WEBHOOK_SECRETS_JSON must be configured in production' >&2; exit 1;; esac
  fi
}

case "$mode" in
  check)
    (cd backend && npm run check)
    npm run lint
    npm run build
    ;;
  migrate)
    check_runtime
    [ "${ALLOW_SCHEMA_MIGRATION:-}" = 1 ] || { echo 'Set ALLOW_SCHEMA_MIGRATION=1 to migrate' >&2; exit 1; }
    (cd backend && npm run migrate)
    ;;
  api)
    check_runtime
    (cd backend && npm start)
    ;;
  frontend)
    npm run preview -- --host "${FRONTEND_HOST:-127.0.0.1}" --port "${FRONTEND_PORT:-5173}"
    ;;
  *)
    echo 'usage: ./start.sh check|migrate|api|frontend' >&2
    exit 2
    ;;
esac
