# ADR-059: Ship the usage reporter as the `claude-team-usage` npm CLI, logged in with a setup code

## Status

Proposed. **§3–4 (setup-code login) superseded by ADR-060 (browser login).** Implemented directly on developer instruction in-session — formal PM sign-off recommended, not yet recorded. Does not revise or supersede ADR-047/050/053: the downloadable personalized `push-usage.mjs` keeps working unchanged alongside this.

## Context

Reporting Claude Code usage today means: sign in to Coc Docs, download a personalized `push-usage.mjs` (ADR-050), open a terminal, run it. The developer asked to remove the manual download: `npm install -g claude-team-usage && claude-team-usage scan` (or `npx claude-team-usage scan`) should do the same job, with:

- no shared `INGEST_SECRET` in the package — the personal, account-scoped `coc_` token (ADR-047/053) instead;
- no hand-edited config (`USER_EMAIL`, `USER_NAME`, `INGEST_URL`, `INGEST_SECRET`);
- the same deduplication, token calculation and Asia/Phnom_Penh day boundaries as the script.

A published npm package is the same for every user, so it cannot carry any of those four values the way the personalized download does. The CLI needs a one-time way to receive them.

## Decision

1. **New package `tools/claude-team-usage/`** (Node ≥ 18.18, ESM, zero dependencies). `bin/cli.js` → `src/{usage-parser,upload,config,login,scan,prompt}.js`. It is not placed in `tools/claude-usage-reporter/`, which is a `git subtree` and must not be hand-edited (CLAUDE.md).
2. **Collection logic is ported from `frontend/public/downloads/push-usage.mjs`** — the copy users actually download, which is newer than the subtree copy (max-per-category merge, `cacheCreation1h`). `test/parity.test.js` runs both on the same fixtures and requires byte-identical payloads, so the two cannot drift.
3. **Login by setup code.** My Claude Usage gets a "Connect the CLI" panel (`ConnectCliPanel`). It mints a token through the existing `POST /api/v1/me/usage-tokens`, then shows `cocsetup_` + base64url(JSON `{v:1, email, name, url, token, app}`) — the same values `buildPersonalizedScript` embeds, plus the page origin for a dashboard link. `claude-team-usage login`, or the first interactive `scan`, reads it with echo off. It is never a command-line argument, so it stays out of shell history.
4. **Local storage.** Credentials go in `%APPDATA%\claude-team-usage\credentials.json` on Windows and `$XDG_CONFIG_HOME` (default `~/.config`)`/claude-team-usage/credentials.json` elsewhere. The file is mode 0600 and written atomically. `logout` deletes it; the panel's "Connected machines" list revokes the token server-side.
5. **Precedence:** `USER_EMAIL` + `INGEST_URL` + `INGEST_SECRET` from the environment (all three, or none), then the saved login. Existing CI and scheduled setups keep working.
6. **No backend change.** `POST /api/ingest` already accepts `coc_` tokens and enforces the token's own email (`ClaudeUsageIngestController.authorize`). The ingest URL still comes from `PublicIngestUrl`, never from the frontend build.
7. **Retries:** at most one, and only for network errors or 5xx. A 401, 403, 404 or 400 fails immediately, because resending the same credential can't succeed (CODE-002). The timeout stays at 10 seconds.

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Browser loopback login (CLI opens a browser, the page redirects the token to `http://127.0.0.1:<port>`) | Smoother, but `/login` has no return-to support today (`RequireMemberSession` always lands on `/home`). Adding it means an open-redirect review of the sign-in flow. The CLI would also still need the frontend URL before it has any credential. Good follow-up, not the smallest change. |
| New backend `GET /api/ingest/whoami` so the code carries only the token | Needs a new permit-all, token-authenticated route. `NFR-SEC-CHANNEL` says `/api/ingest` is the one exception, not a template. Email and name already come from the signed-in session, and the backend rechecks the email on every ingest, so carrying them in the code grants nothing extra. |
| Bake a default server URL into the package | Hosting is deployment-specific; `PublicIngestUrl` already decides this per deployment. |
| `--token coc_…` flag | Puts the secret in shell history and the process list. |
| Generate the CLI from `push-usage.mjs` at build time | Needs a build step for a zero-dependency tool. The parity test catches drift with less machinery. |

## Consequences

### Positive
- The daily path is `claude-team-usage scan`: no download, no file editing.
- Each token is still scoped to one account and one machine, and can be revoked from the dashboard.
- Clearer CLI output: files scanned, responses counted, duplicate lines merged, per-day totals, the server's `created`/`updated` action, and exit codes 0/1/2.

### Negative / risks
- Two reporters to maintain (script + CLI). Mitigated by the parity test.
- The setup code is a secret shown in the browser once. The panel says so, and it lives only in React state.
- The setup-guide docs content (`scripts/seed-usage-content.sql`, DB-backed) still describes the download flow. It needs an editorial update, which is content, not code.
- `package.json` says `"license": "UNLICENSED"` until the owner picks a license for the public npm registry. The package name contains "Claude"; check Anthropic's trademark guidance before publishing.

## References
- ADR-035, ADR-047, ADR-050, ADR-053, ADR-058
- `tools/claude-team-usage/`, `frontend/components/claude-usage/ConnectCliPanel.tsx`, `frontend/lib/admin/reporterConfig.ts#buildCliSetupCode`

// req: FR-USAGE-002, NFR-SEC-CHANNEL
