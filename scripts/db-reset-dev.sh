#!/usr/bin/env bash
# Rebuild a local development database from the migrations.
#
# WHY THIS EXISTS
# Flyway records a checksum per migration version. Switching between branches
# that each added a different file at the same version — V2__session.sql on
# dev, V2__auth_session.sql on feature/login-api — leaves the database holding
# a checksum for a file that no longer exists, and the application refuses to
# start:
#
#   Migration checksum mismatch for migration version 2
#
# `flyway repair` rewrites the checksum but does not touch the schema, so a
# database that ran the *other* V2 keeps the wrong tables and fails later, in a
# less obvious place. For a development database the honest fix is to rebuild
# it. This does that, and refuses to do it anywhere that does not look local.
#
# Usage:
#   DB_URL=jdbc:postgresql://localhost:5432/cocdocs?currentSchema=cocdocs_dev \
#     scripts/db-reset-dev.sh
#
#   // req: CONST-TECH-08

set -uo pipefail

URL="${DB_URL:-}"
if [ -z "$URL" ]; then
  cat >&2 <<'EOF'
DB_URL is not set. This script will not guess at a database to drop.

Set it to the same value the application uses — it is in backend/env.local,
or in application.yml's datasource url:

  export DB_URL='jdbc:postgresql://localhost:5432/cocdocs?currentSchema=cocdocs_dev'
EOF
  exit 1
fi

# ── Parse the JDBC URL ──────────────────────────────────────────────────────
STRIPPED="${URL#jdbc:postgresql://}"
HOSTPORT="${STRIPPED%%/*}"
REST="${STRIPPED#*/}"
DBNAME="${REST%%\?*}"
QUERY="${REST#*\?}"
HOST="${HOSTPORT%%:*}"
PORT="${HOSTPORT##*:}"
[ "$PORT" = "$HOST" ] && PORT=5432

SCHEMA="public"
case "$QUERY" in
  *currentSchema=*) SCHEMA="${QUERY##*currentSchema=}"; SCHEMA="${SCHEMA%%&*}" ;;
esac

# ── Refuse anything that is not obviously a development database ────────────
# Dropping a schema is not recoverable, and a mistyped host is the one input
# most likely to be wrong. Both tests must pass; either alone is too weak.
case "$HOST" in
  localhost|127.0.0.1|::1|host.docker.internal) ;;
  *)
    echo "Refusing to reset a database on '${HOST}'. This script only touches localhost." >&2
    echo "If you genuinely mean to rebuild a shared database, do it deliberately in psql." >&2
    exit 1 ;;
esac
case "$SCHEMA$DBNAME" in
  *dev*|*test*|*local*) ;;
  *)
    echo "Refusing: neither the schema ('${SCHEMA}') nor the database ('${DBNAME}') names" >&2
    echo "itself as dev, test or local. Rename it, or do this deliberately in psql." >&2
    exit 1 ;;
esac

command -v psql >/dev/null 2>&1 || { echo "psql is not on PATH." >&2; exit 1; }

echo "About to DROP and recreate:"
echo "    host    ${HOST}:${PORT}"
echo "    database ${DBNAME}"
echo "    schema  ${SCHEMA}"
echo
echo "Everything in that schema is lost — content, accounts, sessions, audit trail."
printf "Type the schema name to confirm: "
read -r CONFIRM
if [ "$CONFIRM" != "$SCHEMA" ]; then
  echo "Did not match. Nothing was changed."
  exit 1
fi

export PGPASSWORD="${DB_PASSWORD:-${PGPASSWORD:-}}"
PSQL_ARGS=(-h "$HOST" -p "$PORT" -d "$DBNAME" -v ON_ERROR_STOP=1)
[ -n "${DB_USERNAME:-}" ] && PSQL_ARGS+=(-U "$DB_USERNAME")

psql "${PSQL_ARGS[@]}" <<SQL
drop schema if exists "${SCHEMA}" cascade;
create schema "${SCHEMA}";
SQL
rc=$?

if [ $rc -ne 0 ]; then
  echo "psql failed. Nothing further attempted." >&2
  exit $rc
fi

cat <<EOF

Schema '${SCHEMA}' rebuilt empty.

Start the application and Flyway will run V1, V2 and V3 from scratch:

  mvn -f backend/pom.xml spring-boot:run

EOF
