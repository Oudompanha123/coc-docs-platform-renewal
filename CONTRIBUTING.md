# Contributing — Coc Docs Platform

Six people work on this repository. These rules exist so that parallel work stays coherent, not as ceremony.

---

## Branch model

```
main   ← protected. Release-ready only. Receives PRs from dev, nothing else.
dev    ← protected. Integration branch. Everyone's work lands here first.
  └── feature/short-description   ← your working branch
```

**Nobody pushes directly to `main` or `dev`.** Not even the PM. Everything arrives by pull request.

## Your workflow

```bash
git checkout dev
git pull                                  # always, before starting
git checkout -b feature/login-api

# ... work, commit ...

git push -u origin feature/login-api
scripts/open-pr.sh                        # opens the PR into dev
```

**Target `dev`, not `main`.** A PR into `main` will be rejected unless it comes from `dev`.

Use `scripts/open-pr.sh` rather than `gh pr create` or the "Compare & pull request" button GitHub shows after a push. **Both of those target the repository's default branch, which is `main`** — so the wrong target is what you get by doing nothing. The script passes `--base dev`, refuses `main` from anything but `dev`, pushes the branch if you haven't, and prints the compare URL when `gh` isn't authenticated.

This is not a hypothetical tidiness rule. On 2026-09-10 two PRs went straight into `main`, leaving `dev` six commits behind it — and every branch cut from `dev` afterwards silently reintroduced a CI job that had already been fixed.

## A pull request merges when

| | |
|---|---|
| ✅ **CI passes** | Backend build and tests, frontend build and tests |
| ✅ **Security checks pass** | gitleaks, dependency scan, SBOM, licence check, CodeQL |
| ✅ **One approval from someone else** | You cannot approve your own PR |
| ✅ **Branch is up to date with `dev`** | Rebase or merge `dev` in before merging |

**Nobody merges their own work unreviewed.** With six people, review is what keeps the design coherent — it is not a formality, and it is the only thing standing between "six people wrote code" and "six people built one system".

## Before your first commit

**1. Install the secret-scanning hook** — this is L1 of the three-level security model, and it runs on your machine, not in CI:

```bash
cp hooks/pre-commit-gitleaks.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

You also need `gitleaks` installed. It blocks the commit if a secret is detected. Bypassing it requires a written, approved exception file — see the script.

**2. Use Java 21.** Not 22, not 25. The build now fails on the wrong version with an explanation:

```bash
java -version    # must report 21
mvn -version     # must report 3.9 or newer
```

This is not pedantry. Spring Boot 3.4 predates Java 25 and does not list it as supported, and six developers on differing JDKs produce defects that reproduce on exactly one machine.

**3. Copy the environment template.** `backend/.env.example` documents every variable the backend reads, with a safe local default for each:

```bash
cp backend/.env.example backend/..env.local
```

`.env.local` is gitignored; `.env.example` is not, and must never hold a real credential. If you add a variable to `application.yml`, add it to the template in the same commit — `scripts/check-env-documented.sh` fails the L2 audit otherwise.

**4. Node 24** for the frontend.

**5. Authenticate the GitHub CLI** — this is the step everyone forgets:

```bash
gh auth login          # then: gh auth status
```

Being able to `git push` is **not** the same as being authenticated to `gh`. Git credentials and GitHub CLI auth are separate stores, and one working tells you nothing about the other. Without `gh` auth, the `ship` step of Skill 09 can only print a pull-request URL for you to click — it cannot open the PR. `scripts/install-hooks.sh` now checks this and says so.

## Your tooling, shared

Two files configure everyone's Claude Code the same way, so the workflow behaves identically on six machines:

| File | What it does |
|---|---|
| `.mcp.json` | Registers the Flow board as an MCP server, so the task-board steps of Skill 09 work without per-person setup. Claude Code asks you to approve it the first time you open the project |
| `.claude/settings.json` | Permission rules for the commands this repo actually runs — git, `mvn`, `npm`, `gh`, `gitleaks`, `scripts/*`. Without it every routine command prompts, and people stop using the workflow and go back to raw git |

The `deny` rules in `.claude/settings.json` mirror the rules in Skill 09 §6 — no `--no-verify`, no force pushes, no direct pushes to `main` or `dev`. **Be clear about what they are worth**: permission rules match on a command prefix, so `git commit --no-verify` is caught and `git commit -m "x" --no-verify` is not. They stop the obvious path, not a determined one. The git hooks are the real control, and even those are discipline rather than security — see `.githooks/pre-push`.

Keep personal overrides in `.claude/settings.local.json`, which is gitignored. Do not put them in the shared file.

## Commit messages

Conventional Commits, per HARNESS-PROCESS-STANDARD §4.4:

```
feat(auth): verify Google ID tokens server-side
fix(content): reject links with a javascript: scheme
docs(adr-010): correct the LinkTarget description
```

Reference requirement IDs in the body where relevant — `// req: FR-AUTH-001` comments belong in the code itself (§5.1).

## Things that will get a PR sent back

- **A permission check implemented only in the frontend.** Anyone can call the API directly and skip it. Authorisation lives in the backend or it does not exist (`CONST-TECH-07`, `RISK-019`).
- **A test that proves a button is hidden** rather than that the server refuses the request. Authorisation tests call the API directly, with no browser involved.
- **Bulk-editing content with Windows PowerShell 5.1.** It reads UTF-8 as the Korean system codepage and silently corrupts em-dashes, Korean and Khmer text (`CONST-OPS-01`). Use Git Bash or an editor.
- **A secret in the diff.** The L1 hook should catch it first; CI catches it second.
- **Frontend and backend changed together without the OpenAPI contract updated.** That is how the two services drift apart (`RISK-018`).

## Where to look things up

| | |
|---|---|
| Why the project exists | `docs/planning/PROJECT-PROPOSAL.md` |
| What we are building | `docs/requirements/REQUIREMENTS-SPEC.md` — 84 requirements |
| How it fits together | `docs/design/architecture-overview.md` |
| The content model | `docs/design/adr/ADR-010-content-model.md` — the least reversible decision |
| Security model | `docs/design/adr/ADR-011-security-model.md`, `docs/design/threat-model.md` |
| Sprint plan and ownership | `docs/design/DEV-PLAN.md` |
| Testing rules | `docs/design/TEST-PLAN.md` |

If a decision looks wrong, say so. Every ADR records the alternatives it rejected and why — if the reasoning does not hold, that is worth knowing while it is still a document rather than a hundred migrated pages.
## One Keycloak each, one realm file

Keycloak in dev mode runs on a local H2 file, so your Keycloak is **yours alone** — its own realm, clients and identity provider. Nothing you configure in it reaches anybody else.

Start it from the realm in this repository rather than building one by hand:

```bash
export GOOGLE_CLIENT_SECRET='...'      # Git Bash
scripts/keycloak-dev.sh
$env:GOOGLE_CLIENT_SECRET = '...'      # PowerShell
bash scripts/keycloak-dev.sh
```

That imports `keycloak/docs_platform-realm.json`: the realm, the `cocdocs-frontend` public client, the Google identity provider, and the declarative user profile that stops Keycloak demanding a first and last name from a Google sign-in.

**Why this exists.** On 2026-09-15 a developer's Google sign-in failed with:

```
Unexpected response from token endpoint https://oauth2.googleapis.com/token
status=401 "error": "invalid_client"
"error_description": "The provided client secret is invalid."
```

Google, not Keycloak, rejecting a client secret typed into one machine's admin console with nothing to check it against. Everyone was reproducing the same realm by hand from memory. Configuration that exists only on whoever's machine happens to work is the same failure this project already had with database schemas.

**Two things are deliberately not in the file.** The Google **client secret**, which is read from `GOOGLE_CLIENT_SECRET` at import — the script refuses to start without it, because Keycloak would otherwise import an empty secret and you would meet the error above several minutes later. And the realm **signing keys**, so each installation generates its own; sharing them would let any developer mint tokens every other developer accepts.

The client ID *is* in the file. It is public by design — it appears in the address bar of every Google sign-in.

`--import-realm` imports only a realm that does not already exist, so the script is safe to re-run. To take the file's version over one you have edited, delete the realm in the admin console first.

If you browse the app from another device, add that origin to the client's Redirect URIs and Web Origins in the admin console — the file ships `http://localhost:3000` only.


## One server, one schema each

We share a PostgreSQL server. We do **not** share a schema.

Set your own in `backend/.env.local`:

```
DB_SCHEMA=cocdocs_sam
```

That gives you your own tables, your own Flyway history and your own data on the same host. **There is no default.** Leave it unset and the application refuses to start rather than guess.

It used to fall back to `cocdocs_dev` — which is not a "shared" schema, it is one developer's. That is how, on 2026-09-14, an unpushed `V8__temp_password.sql` was applied to somebody else's database by a colleague who never intended to go near it, and was found only when the owner's application refused to start against a migration that exists on no branch. The connection URL had also been changed back to a hard-coded `currentSchema=cocdocs_dev` while resolving a merge, so for a while setting `DB_SCHEMA` moved where Flyway migrated without moving where the application connected. `SchemaIsPerDeveloperTest` now fails the build if either is reintroduced.

**Why this exists.** One shared schema means one Flyway lineage for everybody. Two branches that each add a `V6` collide the moment the second person runs. Worse, the obvious escape — rebuild the schema — destroys everyone's data at once, because it is everyone's schema. On 2026-09-14 that happened twice in one morning and cost nine accounts, the audit trail, and a colleague's `password_reset_token` table. Neither person did anything unreasonable; the arrangement was.

With your own schema:

- Your migration runs against your history. A `V6` on your branch cannot collide with a `V6` on someone else's.
- `scripts/db-reset-dev.sh` rebuilds **yours** and nobody notices. It refuses `cocdocs_dev` outright.
- You can run an unmerged migration without putting a table in a database other people's code knows nothing about.

**What you give up:** shared test data. If you want the content someone else set up, you need it in your own schema — usually faster to recreate than to coordinate.

### Working in the shared schema anyway

Sometimes right — a demo, or reproducing something only its data shows. Two rules, and both exist because breaking them has already cost a day:

1. **Push a migration before you run it there.** A migration applied from an unpushed branch leaves everyone else unable to start: Flyway finds an applied version it cannot resolve, and the only real fix is the file you still have not pushed.
2. **Never rebuild it to escape a Flyway error.** Rebuilding is a local remedy applied to shared infrastructure. Move to your own schema instead; that is the fix.

## The settings that are not obvious

`backend/.env.example` is a list of names and defaults. These are the ones where the default is a local convenience, or where getting it wrong fails in a way that does not name itself.

| Setting | What to know |
|---|---|
| `COOKIE_SECURE` | `false` **only** because localhost is plain HTTP. Anywhere with TLS must set it `true`, or the session cookie travels in the clear. Left `false` in a deployment nothing appears broken — which is the problem. |
| `FRONTEND_ORIGIN` | The exact origin, never a pattern. CORS with credentials cannot use a wildcard, and an exact value is what stops a lookalike domain reaching a staging host. A trailing slash or a stray `\r` makes it stop matching, with no hint that whitespace is the reason. |
| `DB_HOST` / `DB_PORT` / `DB_NAME` | Separate variables rather than one JDBC URL: `application.yml` composes it, so the schema and connection parameters stay in one shared place instead of being retyped in each developer's `.env.local`. The default is `localhost`; the team database is elsewhere. |
| `DB_PASSWORD` | The only real secret in the file. `.env.local` is gitignored; `.env.example` must never hold a live one. |
| `KEYCLOAK_ISSUER_URI` + `KEYCLOAK_AUDIENCE` | **Both or neither.** Blank means Keycloak sign-in does not exist on this deployment and the app boots as if it were never mentioned. An issuer with no audience refuses to start, deliberately: without an audience, a token Keycloak minted for any other client in the same realm would verify here. |
| Google's `picture` claim, in the realm | **Not on by default.** `KeycloakIdTokenService` reads a `picture` claim straight off the token (ADR-013) and, when present, it flows into `account.avatar_url` automatically — but Keycloak does not forward a brokered Google account's `picture` into anything by default; it has to be told to, twice, in the realm's admin console (there is no realm-export or IaC for this checked into the repo): (1) the Google identity provider's Default Scopes must include `profile`, and it needs an **Attribute Importer** mapper — Claim `picture` → User Attribute `picture`; (2) this app's Keycloak **client** needs its own protocol mapper — a User Attribute mapper, User Attribute `picture` → Token Claim Name `picture`, added to the ID token. Skip either half and every account signs in fine but `avatar_url` stays null forever, silently — nothing here fails loudly, so this is easy to leave undone and forget. |
| `SESSION_TTL` | ISO-8601. One day, per AMB-006 / NFR-SEC-SESSION. Shortening it cannot retire sessions already issued — expiry is stored as an absolute instant on the row. |
| `S3_*` | S3-compatible API only, never a provider SDK (`CONST-TECH-08`). MinIO locally. |

Nothing exports `.env.local` at the OS level for you. `DotenvEnvironmentPostProcessor` reads it into Spring whatever the launcher, and the `Backend (dev)` run configuration also injects it through the EnvFile plugin. A real environment variable of the same name wins over both.

## When the backend will not start

### `Connection to localhost:5432 refused`

```
SQL State  : 08001
Message    : Connection to localhost:5432 refused.
```

Nothing is wrong with your `.env.local`. Nothing is **loading** it.

Spring Boot does not read `.env.local` — it is an ordinary file, and something has to put those variables into the process. When nothing does, every `${DB_HOST}` in `application.yml` falls back to its localhost default. The file sits there, correct, being ignored. That is why the address in the error is one you never configured: it is the fallback, not your setting.

From IntelliJ, use the **`Backend (dev)`** run configuration. It loads the file through the EnvFile plugin — install that from Settings > Plugins if you have not got it. The older `DocsPlatformApplication` configuration does not load it, and also names a `local` profile that no `application-local.yml` defines, so it silently gets neither your variables nor the dev logging.

From a shell:

```bash
set -a; . ./backend/..env.local; set +a
./backend/mvnw -f backend/pom.xml spring-boot:run
```

### `Migrations have failed validation`

```
Migration checksum mismatch for migration version 2
-> Applied to database : 1574820704
-> Resolved locally    : 677785464
```

Flyway compares three fields per version — `checksum`, `script` **and** `description` — so the same cause also surfaces as a description mismatch, in words rather than numbers:

```
Migration description mismatch for migration version 2
-> Applied to database : auth session
-> Resolved locally    : session
```

Correcting one field by hand and not the others only moves you to the next message. Align all three, or let `flyway repair` align them for you.

Your database ran a different file at that version — usually because you had a branch checked out that added its own. Flyway stores one row per version and refuses to start when it does not match what is on disk.

**On your own local database, rebuild rather than repair.** `flyway repair` rewrites the bookkeeping and leaves the schema alone, so a database that ran the *other* migration keeps the wrong tables and fails later, somewhere less obvious:

```bash
set -a; . ./backend/..env.local; set +a
scripts/db-reset-dev.sh
```

It refuses any host that is not localhost, refuses a schema that does not name itself dev/test/local, and makes you type the schema name. Then start the app and Flyway replays every migration from scratch.

**On the shared dev database you cannot do that**, and `db-reset-dev.sh` will refuse — deliberately. Dropping it destroys everyone's accounts, sessions and the audit trail. There, repair is the right tool, but only once you have checked the thing repair cannot check for you: that the schema the *other* file left behind is the schema this file describes. Compare the real table against the migration — columns, types, defaults, indexes (including partial ones), check constraints, foreign keys — and if anything differs, stop and raise it rather than repairing over it.

```bash
set -a; . ./backend/..env.local; set +a
scripts/flyway-repair-dev.sh
```

**Never edit a migration that is already on `dev`.** Add a new version. The L2 audit fails a PR that edits one, or that adds a second file at an existing version — that check exists because this exact collision cost a day, and then cost another one when the half-corrected bookkeeping it left behind surfaced weeks later.

## Seeing what the backend is doing

Logging is configured in `backend/src/main/resources/logback-spring.xml`. It **extends** Spring Boot's defaults rather than replacing them, so `logging.level.*` and `logging.pattern.*` in `application.yml` still work and still win.

Everything goes to the console **and** to `backend/logs/backend.log`, rolled daily or at 10MB, 10 days kept. The directory is gitignored. The console scrolls away, and the interesting part of a startup failure is usually forty lines above where you started reading.

Run with the `dev` profile to see detail:

```bash
mvn -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=dev
```

That raises `com.coc.docs` to DEBUG and turns on the SQL statements, the Spring Security filter chain, and Flyway's migration log. Without the profile everything stays at INFO, so a deployment can never pick the detail up by accident.

**Do not turn on parameter binding** — `StatementCreatorUtils` at TRACE, or the Hibernate SQL-type loggers. They log every bound value, and this schema holds bcrypt hashes and session token digests, while the password sign-in path binds the plaintext password on its way to the encoder. That writes credentials to a file on disk and to anyone's terminal scrollback. If you need to see one value, log it at the call site and remove it before committing.
