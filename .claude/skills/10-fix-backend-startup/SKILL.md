---
name: 10-fix-backend-startup
description: Diagnose and repair a backend that will not start. Reads the failure in the order the application does — environment file, variables actually loaded, database reachable, migration history, IDE run configuration — and fixes what is safe to fix without asking, while holding anything that touches the shared database behind a human decision.
when_to_use: A developer reports the backend failing to start, or pastes a startup stack trace — "Connection to localhost:5432 refused", "Migrations have failed validation", "Unsatisfied dependency ... flywayInitializer". Also before asking anyone else for help with a local environment.
phase: 3,4
lead_agent: backend-developer
support_agents:
  - qa-engineer
outputs:
  - a running backend, or one named blocker with the command that clears it
  - where a shared database is involved, a schema comparison the person can check before approving a repair
---

# Skill 10 — Fix Backend Startup

## 0. Responsible Agents

| Role | Agent | Does |
|---|---|---|
| Lead | `backend-developer` | Runs the diagnosis, applies the safe fixes, reports |
| Support | `qa-engineer` | Confirms the application actually starts afterwards |

The PM is not involved. This is a developer unblocking themselves.

## 1. Principle

**Every startup failure here names something other than its cause.** The whole
point of this skill is to stop people fixing the symptom.

| What it says | What it means |
|---|---|
| `Connection to localhost:5432 refused` | `.env.local` was not loaded. `localhost` is `application.yml`'s fallback — nobody configured it. The file is fine; nothing read it. |
| `Migration checksum mismatch` | One of three fields disagrees. Fix only that one and you advance to the next message, not to a running application. |
| `Migration description mismatch` | The same cause, a different field. |
| `Unsatisfied dependency ... sessionAuthenticationFilter` | Noise. Read to the bottom of the `Caused by` chain; the real failure is the last one. |

Never diagnose from the first line of a Spring stack trace. It names the first
bean that could not be built, which is never the problem.

## 2. Run the diagnosis

```bash
set -a; . ./backend/..env.local; set +a
scripts/diagnose-backend-startup.sh
```

Read-only: no file and no database is modified. It checks, in the order the
application itself does, and prints a prescription under every `FAIL`.

Work the `FAIL` lines top-down. Each check assumes the ones above it passed —
"database unreachable" is meaningless while the variables are unloaded, because
the address being probed is the fallback rather than the configured one.

## 3. Fix without asking

These are local, reversible, and affect nobody else. Apply them, then re-run
the diagnosis.

| Finding | Fix |
|---|---|
| `.env.local` missing | `cp backend/.env.example backend/.env.local`, then tell the person which values to fill — never invent a password |
| `.env.local` has CRLF | `tr -d '\r' < f > tmp && mv tmp f` — a trailing `\r` rides along inside every value and breaks exact-match settings like `FRONTEND_ORIGIN` |
| Variables missing from `.env.local` | The config changed underneath them. Re-copy the template and carry their values across |
| Variables not loaded | `Backend (dev)` run configuration in IntelliJ, or `set -a; . ./backend/.env.local; set +a` in a shell |
| No run configuration loads the file | Point them at `Backend (dev)`; it needs the EnvFile plugin |

Use `Edit`/`Write` or `Bash` for these. **Never PowerShell string replacement**
on `.env.local` — it reads UTF-8 as the Korean system codepage on these machines
and corrupts the file (`CONST-OPS-01`).

## 4. Migration mismatch — stop and think

A mismatch means the database ran a **different file** at that version, usually
from a branch that added its own. The fix depends entirely on whose database it
is, and getting that wrong is expensive in one direction only.

### Their own local database

Rebuild. Do not repair.

```bash
set -a; . ./backend/..env.local; set +a
scripts/db-reset-dev.sh
```

Repair rewrites the bookkeeping and leaves the schema alone, so a database that
ran the *other* migration keeps the wrong tables and fails later, somewhere far
less obvious. A local database costs nothing to rebuild, so there is no reason
to accept that risk.

### The shared development database

`db-reset-dev.sh` refuses a non-localhost host, deliberately — dropping that
schema destroys everyone's accounts, sessions and audit trail. Repair is the
right tool there, but **only after checking the thing repair cannot check for
you**: that the schema the other file left behind is the schema this file
describes.

Do that comparison before proposing repair. For the table the migration
creates, compare against the live database:

- column names, types, nullability, defaults
- indexes — including partial ones, `where` clause and all
- check constraints
- foreign keys, and their `on delete` behaviour

Query the live side over JDBC using the driver already in `~/.m2` (see
`scripts/diagnose-backend-startup.sh` for the pattern). **Show the person the
comparison.** Then:

- **Identical** — repair is safe. Say so, show the evidence, and let them run
  it: `scripts/flyway-repair-dev.sh` (add `--yes` where there is no terminal).
- **Any difference at all** — stop. Do not repair, do not reset. Report the
  difference and let a human decide. This is the case the whole check exists
  for.

Do not run the repair on the person's behalf. A write to a shared database is
theirs to authorise, and a skill that repairs silently is exactly how someone
eventually repairs over a schema that genuinely diverged.

## 5. Confirm it actually starts

Never report success from a fixed config alone. Start it:

```bash
set -a; . ./backend/..env.local; set +a
./backend/mvnw -f backend/pom.xml spring-boot:run
```

Look for all four, not just the last:

```
Successfully validated N migrations
Schema "cocdocs_dev" is up to date
Tomcat started on port 8080
Started DocsPlatformApplication
```

A timeout killing a backgrounded run prints a Maven `ERROR` **after** those
lines. That is the timeout, not a failure — check what came before it.

## 6. Rules

1. Read to the bottom of the `Caused by` chain before saying anything.
2. Do not read or print `application*.yml`, `*.env`, or key material
   (`SEC-001`/`SEC-003`). Variable **names** extracted from the yml are fine —
   that is all `diagnose-backend-startup.sh` reads — values are not.
3. Never write a credential into a file that is not gitignored. `.env.example`
   holds placeholders; `.env.local` holds secrets and is ignored.
4. Never run a write against the shared database. Hand over the command.
5. If the config changed under the developer, check whether `.env.example` and
   the scripts kept up — `scripts/check-env-documented.sh` must exit 0, or the
   next person's PR fails the L2 audit for a reason they did not cause.
6. Do not edit a migration that is already on `dev`. Add a new version.

## 7. Definition of Done

- `scripts/diagnose-backend-startup.sh` exits 0.
- The application was started and printed `Started DocsPlatformApplication`.
- `scripts/check-env-documented.sh` exits 0.
- Anything left for the developer is one named action with its exact command.

## 8. Question Criteria

Ask when, and only when:

- a secret is needed — a password, a client id. Never guess one.
- the live schema differs from the migration. Report the difference; the
  decision is a human's.
- the fix would change `application.yml`, a migration already on `dev`, or
  anything on the shared database.

Otherwise fix it and say what you did.
