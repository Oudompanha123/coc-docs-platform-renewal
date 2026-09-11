#!/usr/bin/env bash
# Align flyway_schema_history with the migration files on disk.
#
# WHY THIS EXISTS
# Flyway validates three fields per version -- checksum, script and description.
# When a database ran a different file at some version (V2__session.sql on dev,
# V2__auth_session.sql on feature/login-api), all three disagree, and the
# application refuses to start:
#
#   Migration checksum mismatch for migration version 2
#   Migration description mismatch for migration version 2
#
# On a local database the honest fix is scripts/db-reset-dev.sh -- rebuild, do
# not repair. Use this script for the case that one cannot serve: a SHARED
# development database, where dropping the schema would destroy other people's
# accounts, sessions and audit trail.
#
# REPAIR DOES NOT TOUCH THE SCHEMA. It rewrites bookkeeping only. That makes it
# safe exactly when the schema the other file left behind already matches the
# migration you now have, and dangerous when it does not -- the application
# starts and fails later, somewhere less obvious. Verify before you run this;
# the confirmation prompt below asks you to.
#
#   // req: CONST-TECH-08

set -uo pipefail

URL="${DB_URL:-}"
if [ -z "$URL" ]; then
  cat >&2 <<'EOF'
DB_URL is not set. This script will not guess at a database to modify.

Load your environment first -- the same file the application uses:

  set -a; . ./backend/env.local; set +a
EOF
  exit 1
fi

FLYWAY_VERSION="$(
  sed -n 's/.*<flyway\.version>\(.*\)<\/flyway\.version>.*/\1/p' backend/pom.xml 2>/dev/null | head -1
)"
FLYWAY_VERSION="${FLYWAY_VERSION:-10.20.1}"

# Report what is about to change before asking. A prompt that does not say what
# it is agreeing to is a prompt everyone types through.
echo "About to run 'flyway repair' against:"
echo "    ${URL}"
echo
echo "This rewrites the recorded checksum, script name and description so they"
echo "match the files in backend/src/main/resources/db/migration."
echo
echo "It changes NO table, column, index or row of application data."
echo
echo "Repair is only correct if the schema already matches those migrations."
echo "If you have not compared them, answer no and compare first."
echo
printf "Have you verified the schema matches, and want to repair? [yes/no]: "
read -r CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Nothing was changed."
  exit 1
fi

exec mvn -f backend/pom.xml -q \
  "org.flywaydb:flyway-maven-plugin:${FLYWAY_VERSION}:repair" \
  -Dflyway.url="$URL" \
  -Dflyway.user="${DB_USER:-}" \
  -Dflyway.password="${DB_PASSWORD:-}" \
  -Dflyway.locations=filesystem:backend/src/main/resources/db/migration
