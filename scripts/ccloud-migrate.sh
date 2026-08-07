#!/usr/bin/env bash
# Helper: apply DevTrace schema via ccloud or psql-compatible URL.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL="$ROOT/packages/db/migrations/001_init.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Set DATABASE_URL to your CockroachDB Cloud connection string."
  exit 1
fi

if command -v ccloud >/dev/null 2>&1; then
  echo "Applying migration with ccloud sql..."
  ccloud sql --url "$DATABASE_URL" -f "$SQL"
else
  echo "ccloud not found; using npm run db:migrate (node-pg) instead..."
  cd "$ROOT" && npm run db:migrate
fi

echo "Done. Next: npm run db:seed"
