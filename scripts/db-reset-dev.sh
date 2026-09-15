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

# The application composes its JDBC URL from DB_HOST/DB_PORT/DB_NAME, with the
# schema fixed in application.yml. Compose the same one. An explicitly exported
# DB_URL still wins, so an unusual target can be named directly.
URL="${DB_URL:-}"
if [ -z "$URL" ] && [ -n "${DB_HOST:-}" ]; then
  URL="jdbc:postgresql://${DB_HOST}:${DB_PORT:-5432}/${DB_NAME:-cocdocs}?currentSchema=${DB_SCHEMA:?DB_SCHEMA is not set. Set it in backend/.env.local to your own schema (cocdocs_<your name>) — there is no default, because the default used to be a colleague’s schema.}"
fi
if [ -z "$URL" ]; then
  cat >&2 <<'EOF'
No database configured. This script will not guess at one to drop.

Load the same environment the application uses:

  set -a; . ./backend/.env.local; set +a

That should define DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD and
DB_SCHEMA. DB_SCHEMA has no default anywhere any more — it used to fall back
to one developer's schema, which is how other people's migrations ended up in
it.
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

# ── Refuse anything shared ──────────────────────────────────────────────────
# The rule is about the schema, not the host. Several developers share one
# PostgreSQL server and each works in their own schema (DB_SCHEMA), so
# rebuilding cocdocs_yourname on a remote host is routine and safe, while
# rebuilding cocdocs_dev destroys everyone's work at once — which is exactly
# what happened on 2026-09-14, twice, taking nine accounts, the audit trail and
# a colleague's table with it.
#
# An earlier version of this script refused every non-localhost host instead.
# That was the wrong axis: it blocked the safe case, and people worked around
# it by dropping the schema by hand in a SQL console, where no guard applies.
SHARED_SCHEMA="cocdocs_dev"

if [ "$SCHEMA" = "$SHARED_SCHEMA" ]; then
  cat >&2 <<EOF
Refusing: '${SCHEMA}' is the schema the whole team shares.

Rebuilding it destroys everyone's accounts, content and audit trail, not just
yours. If you are hitting a Flyway error, that is not the fix -- work in your
own schema instead:

  DB_SCHEMA=cocdocs_<your name>      in backend/.env.local

Then re-run this script and it will rebuild yours alone.

If the shared schema genuinely has to be rebuilt, that is a decision for the
team, made deliberately in psql, after telling everyone.
EOF
  exit 1
fi

case "$SCHEMA$DBNAME" in
  *dev*|*test*|*local*|cocdocs_*) ;;
  *)
    echo "Refusing: neither the schema ('${SCHEMA}') nor the database ('${DBNAME}') names" >&2
    echo "itself as dev, test, local or cocdocs_*. Rename it, or do this deliberately in psql." >&2
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
# DB_USER is what .env.local defines; DB_USERNAME was never set by anything, so
# psql silently fell back to the OS user and failed on permissions, or worse,
# succeeded as a superuser.
PSQL_USER="${DB_USER:-${DB_USERNAME:-}}"
[ -n "$PSQL_USER" ] && PSQL_ARGS+=(-U "$PSQL_USER")

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
