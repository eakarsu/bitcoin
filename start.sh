#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "$0")" && pwd)"
cd "$project_dir"

mode="${1:-start}"
case "$mode" in
  start)
    if [[ "${NODE_ENV:-}" == "test" && "${PGDATABASE:-}" == runtime_* ]]; then
      (
        export ALLOW_SCHEMA_MIGRATION=1
        ./trading-platform/start.sh migrate
      )
      npm --prefix trading-platform/backend run seed:demo
    fi
    exec ./trading-platform/start.sh api
    ;;
  check|migrate|api|frontend)
    exec ./trading-platform/start.sh "$mode"
    ;;
  seed)
    exec npm --prefix trading-platform/backend run seed:demo
    ;;
  *)
    echo "usage: ./start.sh [start|check|migrate|api|frontend|seed]" >&2
    exit 2
    ;;
esac
