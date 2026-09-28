# ADR-050: A single, personalized `push-usage.mjs` replaces the config-file download — revision of ADR-047

## Status

Accepted. Implemented directly on developer instruction in-session (same class of decision as ADR-035's and ADR-047's own origin) — formal PM sign-off recommended, not yet recorded.

## Context

ADR-047 added per-account `/api/ingest` tokens (`claude_usage_ingest_token`, V35) and a "Download Config" panel (`DownloadConfigPanel.tsx`, wired into `app/(shell)/claude-usage/page.tsx`) that mints one and downloads a `claude-usage.config.json` pre-filled with it. That closed the "who do I ask for the secret" friction, but left a two-file setup: download the generic `push-usage.mjs` from the setup guide, separately download `claude-usage.config.json` from the dashboard, and place both in the same folder — "the config goes in the same folder" was the setup guide's own stated rule.

A developer asked for the remaining friction to be closed: **one download, already personal, no file to place beside it.**

## Decision

`frontend/public/downloads/push-usage.mjs` gains an `EMBEDDED_CONFIG` marker — a single `const EMBEDDED_CONFIG = null;` line, checked in `loadConfig()` ahead of the `claude-usage.config.json` fallback but behind environment variables:

```js
const pick = (key) => process.env[key] ?? EMBEDDED_CONFIG?.[key] ?? fromFile[key];
```

`DownloadConfigPanel` (same file, same export — the component is rewritten, not renamed or moved) now:

1. Mints a token via the existing `POST /api/v1/me/usage-tokens` (unchanged, ADR-047).
2. Fetches the *generic* template from `/downloads/push-usage.mjs`.
3. Replaces the `EMBEDDED_CONFIG` marker with a `JSON.stringify`-escaped object literal carrying `USER_EMAIL`, `USER_NAME`, `INGEST_URL`, `INGEST_SECRET` (the minted token) — `buildPersonalizedScript` in `reporterConfig.ts` (replacing that file's prior `buildReporterConfig`).
4. Downloads the result as `push-usage.mjs` — one file, nothing else to fetch.

`page.tsx`'s existing `<DownloadConfigPanel />` placement is unchanged — the component's public surface (no props) didn't change, only its internals.

`claude-usage.config.example.json` is deleted from the normal-user download surface (`frontend/public/downloads/`) and from the setup guide's primary flow, per a repository-wide search (`.github/workflows/*.yml`, `infra/docker-compose.yml`) finding no CI/Docker dependency on it. The script's ability to read a **hand-written** `claude-usage.config.json`, and environment variables, is *not* removed — both remain for the cases the one-click flow structurally cannot cover (see "What stays manual" below).

### Why env vars still win over `EMBEDDED_CONFIG`

Unchanged precedence from ADR-035/047: a scheduled task, CI job, or Docker container setting `INGEST_URL`/`INGEST_SECRET` explicitly should always override whatever a downloaded file happens to carry — the same reasoning that already put env vars ahead of the config-file fallback.

### What stays manual (deliberately, not an oversight)

`ClaudeUsageIngestTokenService.MIN_ROLE = ADMIN` (ADR-047, matching V35's own stated design — "each admin / super_admin generates their own token") is **not changed here**. Two consequences follow directly, and are documented rather than papered over:

- **A plain `user`-rank account cannot self-mint a token**, so cannot use the one-click flow at all. They still need a token an admin hands them, or the shared secret, entered by hand via environment variables — the setup guide's new "Manual setup" step.
- **A personalized script cannot be handed to a teammate to report as them.** The embedded token is scoped to its minter's own account (`ClaudeUsageIngestController.authorize`: token owner's email must equal the request body's `email`, and the script always sends its own embedded `USER_EMAIL`). An admin generating a script and giving the file to a colleague would make that colleague's machine report as the *admin*, not themselves — a footgun the setup guide now calls out explicitly.

Widening self-service minting to every `user`-rank account is a distinct authorization-policy change from what this ADR does (packaging), and is left as an open question below rather than decided here.

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Generate the whole script server-side (backend templates and returns JS) | The script is 500+ lines of shared logic that does not vary per user; templating all of it duplicates the file's maintenance surface for four fields that do vary. A single marker line, substituted client-side against the same static file already served, changes nothing about how the script works and cannot drift from it. |
| Keep the two-file flow, just auto-zip both downloads together | Still two files on disk needing correct pairing (rename, "next to itself"); doesn't remove the "config goes in the same folder" rule the developer explicitly wants gone. |
| Widen `ClaudeUsageIngestTokenService.MIN_ROLE` to `USER` so everyone can self-mint | Directly contradicts ADR-047's stated, deliberate scoping ("matching V35's own stated design") and V35's column comments. A real widening of who may create a standing credential is a security-relevant authorization decision on its own, not a packaging change — left open rather than folded into this ADR. |
| Keep `claude-usage.config.example.json` "just in case" | Repository-wide search found no CI/Docker/automation dependency on it. The one remaining legitimate use — manual/CI setup — is fully served by environment variables against the *generic* `push-usage.mjs`, which needs no example file to demonstrate: the four names are documented inline. |

## Consequences

### Positive

- The flow the developer asked for now exists end to end: log in → Claude Code Usage → Download push-usage.mjs → `node push-usage.mjs`. No second file, no manual field-filling, for any `admin`/`super_admin` account.
- `claude-usage.config.example.json` and its "copy, rename, fill in three values" instructions are gone from the primary documented path — one less place setup instructions and the actual UI could drift apart.
- Nothing is a breaking change for anyone already running the script with environment variables or a hand-written `claude-usage.config.json` — both keep working (`EMBEDDED_CONFIG` sits below env vars, and `fromFile` reading is untouched).

### Negative — stated plainly

- Non-admin accounts and CI/Docker users are unaffected by the improvement — they remain on the manual, env-var path ADR-047 already left in place. That gap is pre-existing, not introduced here, but is now more visible by contrast with the one-click flow admins get.
- A generated script is a **credential-bearing code file** rather than a credential-bearing config file. It is more likely to get pasted into a repo, a chat, or a ticket than a JSON file people already treat as secret-bearing — mitigated by a static in-file warning (both in the header comment and directly above `EMBEDDED_CONFIG`) and a UI warning banner shown immediately after every download, but not eliminated. Blast radius on a leak is unchanged from ADR-047: scoped to the one account, revocable from the same panel, dead the moment that account is deactivated or demoted below `ADMIN`.
- `tools/claude-usage-reporter/push-usage.mjs` (git-subtree-tracked per this repo's own `CLAUDE.md`) is **not** edited by this change and now differs in shape from the public-download copy (no `EMBEDDED_CONFIG`). Left as-is per this repo's instruction not to hand-edit the subtree-tracked copy; a future `git subtree pull` from that tool's own repository is the correct way to reconcile it.

### Required follow-up

- [ ] Decide whether non-admin, self-service token minting (widening `ClaudeUsageIngestTokenService.MIN_ROLE`) is wanted — an explicit PM/security decision, not assumed by this change.
- [ ] Formal PM sign-off, per the caveat this document's Status line states, same pattern ADR-035/ADR-047 used.
- [ ] Reconcile `tools/claude-usage-reporter/push-usage.mjs` with the public-download copy's `EMBEDDED_CONFIG` addition via that tool's own upstream repository, per `CLAUDE.md`'s `git subtree pull` instruction — not evaluated here.

## References

- `frontend/public/downloads/push-usage.mjs` — `EMBEDDED_CONFIG` marker, `loadConfig()` precedence, credential warning comment
- `frontend/lib/admin/reporterConfig.ts` — `buildPersonalizedScript`/`downloadPersonalizedScript`/`personalizedScriptFileName` (replaces the prior `buildReporterConfig`/`downloadReporterConfig`/`reporterConfigFileName`)
- `frontend/components/claude-usage/DownloadConfigPanel.tsx` — mint → fetch template → embed → download; unchanged wiring in `frontend/app/(shell)/claude-usage/page.tsx`
- `frontend/lib/docs/content-store.ts` — setup guide rewritten around the one-file flow; new "Manual setup" step for non-admin/CI/Docker
- `backend/src/main/java/com/coc/docs/claudeusage/ClaudeUsageIngestTokenService.java`, `ClaudeUsageIngestController.java` — unchanged; this ADR is a packaging change only, no backend edits
- ADR-047 (per-account ingest tokens — the decision this revises), ADR-035 (shared secret, still accepted alongside), ADR-011 (security model)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-25 | 1.0 | Initial draft, implemented same session on direct developer instruction | Claude Sonnet 5 |

---

**Approval**

| Date | Approver | Comments | Status |
|------|--------|------|------|
| | | | PENDING |
