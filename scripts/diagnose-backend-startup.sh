#!/usr/bin/env bash
# Why will the backend not start? Read-only.
#
# WHY THIS EXISTS
# Every startup failure we have had so far names something other than its
# cause. "Connection to localhost:5432 refused" means env.local was not loaded,
# not that localhost is wrong -- localhost is the fallback nobody configured.
# "Migration checksum mismatch" names one field of three that disagree, so
# fixing that one field advances you to the next message rather than to a
# running application.
#
# This checks each thing in the order the application does, and prints the
# cause rather than the symptom. It changes nothing -- no file, no database.
#
# Usage:
#   set -a; . ./backend/env.local; set +a
#   scripts/diagnose-backend-startup.sh
#
#   // req: CONST-TECH-08

set -uo pipefail

CONFIG_GLOB="backend/src/main/resources/application*.yml"
MIGRATIONS="backend/src/main/resources/db/migration"
ENV_LOCAL="backend/env.local"
ENV_EXAMPLE="backend/env.example"

pass=0; fail=0; warn=0
ok()   { echo "  PASS  $*"; pass=$((pass+1)); }
bad()  { echo "  FAIL  $*"; fail=$((fail+1)); }
note() { echo "  WARN  $*"; warn=$((warn+1)); }
fix()  { echo "        -> $*"; }

[ -d "$MIGRATIONS" ] || { echo "Run this from the repository root." >&2; exit 2; }

echo
echo "1. Environment file"

if [ ! -f "$ENV_LOCAL" ]; then
  bad "$ENV_LOCAL does not exist."
  fix "cp $ENV_EXAMPLE $ENV_LOCAL   then fill in DB_PASSWORD"
else
  ok "$ENV_LOCAL exists."

  # A CR at the end of a value travels with the value. FRONTEND_ORIGIN with a
  # trailing \r stops matching the browser's Origin header exactly, and CORS
  # fails with no hint that whitespace is the reason.
  if [ "$(tr -dc '\r' < "$ENV_LOCAL" | wc -c)" -gt 0 ]; then
    bad "$ENV_LOCAL has CRLF line endings; every value carries a trailing carriage return."
    fix "tr -d '\\r' < $ENV_LOCAL > tmp && mv tmp $ENV_LOCAL"
  else
    ok "Line endings are LF."
  fi

  # Read variable NAMES out of the yml. Never values: these files are covered
  # by the SEC-001 / SEC-003 rule against opening them for their content.
  REFERENCED="$(cat $CONFIG_GLOB 2>/dev/null | sed 's/#.*$//' \
    | grep -oE '\$\{[A-Z_][A-Z0-9_]*' | tr -d '${' | sort -u)"
  DEFINED="$(grep -oE '^[A-Z_][A-Z0-9_]*' "$ENV_LOCAL" | sort -u)"
  MISSING="$(comm -23 <(printf '%s\n' "$REFERENCED") <(printf '%s\n' "$DEFINED"))"

  if [ -n "$MISSING" ]; then
    bad "Read by application.yml but absent from $ENV_LOCAL:"
    printf '          %s\n' $MISSING
    fix "Usually means the config changed under you. Re-copy $ENV_EXAMPLE and carry your values across."
  else
    ok "Every variable the config reads is defined ($(printf '%s\n' "$REFERENCED" | grep -c .))."
  fi
fi

echo
echo "2. Environment actually loaded into this shell"

if [ -z "${DB_HOST:-}${DB_URL:-}" ]; then
  bad "Neither DB_HOST nor DB_URL is set in this shell."
  fix "set -a; . ./$ENV_LOCAL; set +a"
  fix "In IntelliJ: use the 'Backend (dev)' run configuration, which loads it via the EnvFile plugin."
  fix "A file on disk is not a loaded variable. This is the 'localhost:5432 refused' cause."
else
  ok "DB_HOST/DB_URL present in the environment."
fi

SCHEMA="${DB_SCHEMA:-cocdocs_dev}"
URL="${DB_URL:-}"
if [ -z "$URL" ] && [ -n "${DB_HOST:-}" ]; then
  URL="jdbc:postgresql://${DB_HOST}:${DB_PORT:-5432}/${DB_NAME:-cocdocs}?currentSchema=${SCHEMA}"
fi

echo
echo "3. Database reachable"

if [ -z "$URL" ]; then
  note "Skipped -- no database configured in this shell."
else
  HOSTPORT="${URL#jdbc:postgresql://}"; HOSTPORT="${HOSTPORT%%/*}"
  H="${HOSTPORT%%:*}"; P="${HOSTPORT##*:}"; [ "$P" = "$H" ] && P=5432
  echo "        target ${H}:${P}  schema ${SCHEMA}"
  if [ "$SCHEMA" = "cocdocs_dev" ]; then
    note "You are on cocdocs_dev, the schema the whole team shares."
    fix "Set DB_SCHEMA=cocdocs_<your name> in backend/env.local to get your own."
    fix "One shared schema means one Flyway lineage: your migration collides with theirs."
  fi
  if timeout 5 bash -c "cat < /dev/null > /dev/tcp/${H}/${P}" 2>/dev/null; then
    ok "TCP connect to ${H}:${P} succeeded."
  else
    bad "Nothing accepting connections on ${H}:${P}."
    if [ "$H" = "localhost" ] || [ "$H" = "127.0.0.1" ]; then
      fix "You are pointed at localhost. If the team database is on a shared box, your"
      fix "variables are not loaded -- see check 2. If you do run Postgres locally, start it."
    else
      fix "Check VPN, and that the host is up."
    fi
  fi
fi

echo
echo "4. Migration history"

DRIVER="$(find "${HOME}/.m2/repository/org/postgresql" -name 'postgresql-*.jar' 2>/dev/null \
  | grep -v sources | sort | tail -1)"

if [ -z "$URL" ]; then
  note "Skipped -- no database configured."
elif [ -z "$DRIVER" ]; then
  note "Skipped -- no PostgreSQL JDBC driver in ~/.m2. Run a build first."
else
  WORK="$(mktemp -d)"
  trap 'rm -rf "$WORK"' EXIT
  cat > "$WORK/HistoryCheck.java" <<'JAVA'
import java.sql.*;
import java.util.*;

/** Print flyway_schema_history beside the files on disk, and name every
 *  field that disagrees. Flyway validates checksum, script AND description;
 *  a report that shows only one of them sends people round the loop twice. */
public class HistoryCheck {
  public static void main(String[] a) throws Exception {
    String dir = a[0];
    Map<String,String> local = new TreeMap<>();
    for (java.io.File f : new java.io.File(dir).listFiles((d,n) -> n.matches("V\\d+__.*\\.sql"))) {
      String n = f.getName();
      local.put(n.substring(1, n.indexOf("__")), n);
    }
    try (Connection c = DriverManager.getConnection(
            System.getenv("JDBC_URL"), System.getenv("DB_USER"), System.getenv("DB_PASSWORD"))) {
      Set<String> seen = new TreeSet<>();
      int bad = 0;
      try (Statement s = c.createStatement();
           ResultSet r = s.executeQuery(
             "select version, description, script, success from flyway_schema_history order by installed_rank")) {
        while (r.next()) {
          String v = r.getString(1), desc = r.getString(2), script = r.getString(3);
          boolean okRow = r.getBoolean(4);
          seen.add(v);
          String file = local.get(v);
          if (file == null) {
            System.out.println("  FAIL  v" + v + " applied as '" + script + "' but no such file on disk");
            bad++;
          } else {
            String expectDesc = file.substring(file.indexOf("__") + 2).replace(".sql", "").replace('_', ' ');
            List<String> diff = new ArrayList<>();
            if (!file.equals(script)) diff.add("script (db '" + script + "' vs file '" + file + "')");
            if (!expectDesc.equals(desc)) diff.add("description (db '" + desc + "' vs file '" + expectDesc + "')");
            if (!okRow) diff.add("marked failed");
            if (diff.isEmpty()) System.out.println("  ok    v" + v + " " + file);
            else { System.out.println("  FAIL  v" + v + " " + file + " -- " + String.join(", ", diff)); bad++; }
          }
        }
      }
      for (String v : local.keySet())
        if (!seen.contains(v)) System.out.println("  ..    v" + v + " " + local.get(v) + " not yet applied (normal)");
      System.out.println(bad == 0
        ? "  NOTE  script/description agree. Checksums are only comparable by Flyway itself --"
        : "  NOTE  " + bad + " row(s) disagree with the files on disk.");
      if (bad == 0) System.out.println("        if the app still reports a mismatch, it is a checksum.");
    }
  }
}
JAVA
  JDBC_URL="$URL" java --source 21 -cp "$DRIVER" "$WORK/HistoryCheck.java" "$MIGRATIONS" 2>&1 \
    | sed 's/^/  /' || note "Could not read flyway_schema_history (credentials? schema?)."
fi

echo
echo "5. IntelliJ run configuration"

if grep -rqs 'net.ashald.envfile' .idea/runConfigurations 2>/dev/null \
   && grep -rqs 'env.local' .idea/runConfigurations 2>/dev/null; then
  ok "A run configuration loads backend/env.local."
else
  note "No committed run configuration loads backend/env.local."
  fix "Use 'Backend (dev)' if present, or enable EnvFile on your own configuration."
fi

echo
echo "----"
echo "  ${pass} pass, ${fail} fail, ${warn} warn"
if [ "$fail" -gt 0 ]; then
  echo
  echo "Fix the FAIL lines top-down: each check assumes the ones above it passed."
fi
exit $(( fail > 0 ? 1 : 0 ))
