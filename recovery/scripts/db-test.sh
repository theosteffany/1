#!/usr/bin/env bash
# Spins up a throwaway Postgres cluster, applies a Supabase stub + every
# migration, then runs the RLS/permission test suite.
#
#   npm run db:test
#
# Requires PostgreSQL 15+ server binaries (initdb, pg_ctl) on PATH or in
# /usr/lib/postgresql/<version>/bin. Set KEEP_DB=1 to leave the cluster running.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PG_BIN:$PATH"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/recovery-db.XXXXXX")"
PORT="${PGPORT_TEST:-54329}"
export PGHOST="$WORK" PGPORT="$PORT" PGDATABASE=postgres

if [ "$(id -u)" = "0" ]; then
  # Postgres refuses to run as root; delegate to the 'postgres' (or 'nobody') user.
  RUN_AS="$(id -u postgres >/dev/null 2>&1 && echo postgres || echo nobody)"
  chown -R "$RUN_AS" "$WORK"
  as_pg() { su "$RUN_AS" -s /bin/bash -c "PATH='$PATH' $*"; }
  export PGUSER="$RUN_AS"
else
  as_pg() { bash -c "$*"; }
fi

cleanup() {
  if [ "${KEEP_DB:-0}" != "1" ]; then
    as_pg "pg_ctl -D '$WORK/data' stop -m immediate" >/dev/null 2>&1 || true
    rm -rf "$WORK"
  else
    echo "Cluster left running: PGHOST=$WORK PGPORT=$PORT"
  fi
}
trap cleanup EXIT

as_pg "initdb -D '$WORK/data' -A trust -U '${PGUSER:-$(whoami)}' >/dev/null"
as_pg "pg_ctl -D '$WORK/data' -o '-k $WORK -p $PORT -c listen_addresses= -c wal_level=logical' -l '$WORK/log' start >/dev/null"

psql_q() { psql -v ON_ERROR_STOP=1 -q -X "$@"; }

echo "→ applying Supabase stub"
psql_q -f "$ROOT/supabase/tests/supabase_stub.sql"

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ migration $(basename "$f")"
  psql_q -f "$f"
done

if [ "${GEN_TYPES:-0}" = "1" ]; then
  echo "→ generating TypeScript types"
  node "$ROOT/scripts/gen-types.mjs"
fi

echo "→ RLS & permission tests"
psql_q -o /dev/null -f "$ROOT/supabase/tests/rls_test.sql" 2>&1 | sed -n "s/.*NOTICE:  //p; /ERROR/p"
[ "${PIPESTATUS[0]}" = "0" ] || { echo "✗ database tests failed"; exit 1; }
echo "✓ database tests passed"
