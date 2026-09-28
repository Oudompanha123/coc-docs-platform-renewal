# ADR-053: Self-service ingest-token minting widened from `admin`+ to `user`+ — revision of ADR-047

## Status

Accepted. Implemented directly on developer instruction in-session (same class of decision as ADR-035/ADR-047's own origin) — formal PM sign-off recommended, not yet recorded.

## Context

ADR-047 (per-account `/api/ingest` tokens) and ADR-050 (the single-file personalized `push-usage.mjs`) both left `ClaudeUsageIngestTokenService.MIN_ROLE = ADMIN` unchanged, matching what V35's own migration comment says the design was ("each admin / super_admin generates their own token"). ADR-050's own Alternatives Considered table explicitly rejected widening it in the same breath it shipped the one-click download: *"A real widening of who may create a standing credential is a security-relevant authorization decision on its own, not a packaging change — left open rather than folded into this ADR."*

That left a real gap the setup guide had to call out explicitly: a plain `user`-rank account could not reach the one-click flow at all. `DownloadConfigPanel` was reachable only from `AdminClaudeUsageView` (the admin/super_admin team dashboard at `/claude-usage`); the personal "My Claude Usage" view every other account sees (`MyClaudeUsageSection`, embedded on `/home` per ADR-052) never rendered it. A plain member had to ask an admin for a token or the shared secret and configure the generic script by hand via environment variables — exactly the friction ADR-047/051 set out to remove, still present for most of the userbase.

The developer asked directly, in-session, to close this: any signed-in account should be able to click Download and have it work, not just admin/super_admin.

- **Related requirements**: FR-USAGE-002 (unchanged), extended here to cover self-service minting at every rank rather than admin+ only.
- **Related risks**: minting stays scoped per-account (ADR-047's own design — `ClaudeUsageIngestController.authorize` requires the token owner's email to equal the request's `email`), so widening *who* may mint does not widen *what* a token can do. The risk this ADR actually takes on is a larger population of standing credentials to revoke if a member's account is compromised — mitigated by the existing re-check-on-every-use behavior (a deactivated or demoted account's token stops working immediately, V35's own guarantee). ~~and the existing revoke panel~~ — that panel (`DownloadConfigPanel`'s "Your tokens" list) no longer exists; see the negative consequence recorded below.

## Decision

`ClaudeUsageIngestTokenService.MIN_ROLE` moves from `AppRole.ADMIN` to `AppRole.USER` — the floor for both minting/listing/revoking (`POST`/`GET`/`DELETE /api/v1/me/usage-tokens/**`, `SecurityConfig`) and for a token resolving at all (`resolve`, checked live on every `/api/ingest` call). `USER` is the lowest *real* member rank (`guest < user < developer < reviewer < lead < admin < super_admin`) — a `guest` (ADR-017's pending/unapproved rank) still cannot mint or use one.

`DownloadConfigPanel` (unchanged itself, until its removal below) was, for a time, rendered from two places instead of one — `AdminClaudeUsageView` and `MyClaudeUsageSection` — but a same-session change removed it from `MyClaudeUsageSection` again, on direct developer instruction (see "Not part of this ADR's lasting shape" below). A further, later change removed it from `AdminClaudeUsageView` too, and deleted the component and its test file outright: `DownloadConfigPanel.tsx` no longer exists anywhere in this codebase. The one-click UI now lives exclusively in `ContentRenderer`'s `DownloadLinks` (the setup guide's `push-usage.mjs` download link, personalizing for any signed-in rank) — see "Not part of this ADR's lasting shape" for that surface's own history.

### Not part of this ADR's lasting shape

The widened `MIN_ROLE` itself is unaffected by the paragraph above — a plain member can still self-mint via `POST /api/v1/me/usage-tokens`. What changed is *where the UI for it lives*: it is no longer on the personal "My Claude Usage" view at all (`MyClaudeUsageSection`, now at its own route per ADR-052 v1.6). A non-admin account reaches the one-click flow today from the setup guide's own `push-usage.mjs` download link instead (`ContentRenderer`'s `DownloadLinks`, personalizes for any signed-in rank the same way `DownloadConfigPanel` does) — a different UI surface built the same session for a different reason (moving the docs page's own download off the plain generic file), which happened to end up as the surviving non-admin path once `MyClaudeUsageSection`'s copy was removed.

The setup guide (`content-store.ts`) drops its "admin/super_admin only" framing from the one-click step, and "Manual setup" is retitled from *"no admin account, CI, or Docker"* to *"CI or Docker"* — the only populations still needing the environment-variable path are unattended jobs that have no session to mint a token with in the first place, not plain member accounts.

### Key choices

- **Widen the floor, not the scoping.** Every token still authorizes only its own account's email (ADR-047, unchanged) — this ADR only changes *who may mint one for themselves*, not what a minted token can do. A plain member's token is exactly as blast-radius-limited as an admin's was.
- **`USER`, not lower.** `guest` is ADR-017's pre-approval holding rank for an application that has not yet been let in at all; there is no "own usage" for a guest to report yet, so the floor stops one rank above it, at the first real member rank.
- **No change to V35's migration or its comment.** The applied schema already supports any account minting a token — only the application-layer floor moved. V35's SQL comment ("each admin / super_admin generates their own token") is now stale in a second way (it already cited a nonexistent "ADR-042", per ADR-047) and is, again, left unedited per this repo's rule against modifying an applied migration's SQL — a future reader should trust this ADR and ADR-047 over V35's own comment for the current authorization design.
- **`push-usage.mjs` and `ClaudeUsageIngestController` need no change.** Neither cares which rank minted the bearer value it is handed — only `ClaudeUsageIngestTokenService.resolve`'s live re-check does, and that check already re-reads the account's *current* role/status regardless of what rank it was minted at.

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Leave `MIN_ROLE` at `ADMIN`, only fix the missing UI wiring | Does not solve the problem raised: a plain member still could not self-mint, no matter where a button for it appeared. The gap was authorization, not just a missing render call. |
| Widen to `USER` but keep `DownloadConfigPanel` admin-only in the UI | Backend-widens with no reachable frontend path is a half-measure a plain member cannot use anyway — same net effect as not doing this at all, for that population. |
| Give `MyClaudeUsageSection` its own trimmed copy of the download UI instead of reusing `DownloadConfigPanel` | `DownloadConfigPanel` already has no admin-specific behavior in it — the component itself never checked role; only its *placement* did. Reusing it outright avoids a second implementation of mint → fetch template → embed → download to keep in sync. |

## Consequences

### Positive

- Closes the actual friction gap ADR-047/051 documented but deliberately left open: every signed-in account, any rank, can now click Download and have a working `push-usage.mjs` with no admin in the loop.
- No change to the per-account scoping that makes a leaked token low-blast-radius — this ADR widens *who may hold* a token, not *what one can do*.
- Setup guide no longer bifurcates instructions by rank for the common case — "Manual setup" now genuinely means "no session at all" (CI/Docker), not "a whole tier of the userbase."

### Negative — stated plainly

- More standing credentials to exist across the fleet (one per machine per member, not just per admin), which is more rows in `claude_usage_ingest_token` and a larger set to consider in any future bulk-revoke tooling — no such tooling exists today for either population, so this is a difference of degree, not a new gap.
- `V35`'s own migration comment is now stale in exactly the dimension this ADR changes ("each admin / super_admin"), on top of the "ADR-042" staleness ADR-047 already recorded. A reader of the raw SQL alone would get the authorization story wrong; ADR-INDEX.md and this ADR are the correction path.
- **There is now no UI anywhere in the app to list or revoke a previously-minted token.** `DownloadConfigPanel` was the only screen that called `GET`/`DELETE /api/v1/me/usage-tokens`, and it has been deleted outright (on direct developer instruction, same as its two prior removals from `MyClaudeUsageSection` and then `AdminClaudeUsageView`). The backend endpoints and `frontend/lib/auth/api.ts`'s `listUsageTokens`/`revokeUsageToken` client functions are untouched and still work — a token can still be revoked via a direct API call — but nobody can do it by clicking anything today. Not raised as a follow-up item below because it was a direct instruction, not an oversight; flagged here so it isn't mistaken for one later.

### Required follow-up

- [ ] Formal PM sign-off, per the caveat this document's Status line states, same pattern ADR-035/ADR-047/ADR-050 used.
- [ ] Consider a follow-up migration comment or `ADR-INDEX.md` note correcting V35's SQL comment's authorization story, same open item ADR-047 already left (§ "Required follow-up").
- [ ] Decide whether a revoke-token UI should exist somewhere (Settings? the setup guide page?) now that `DownloadConfigPanel` is gone — an explicit product decision, not assumed here.

## References

- `backend/src/main/java/com/coc/docs/claudeusage/ClaudeUsageIngestTokenService.java` — `MIN_ROLE`
- `backend/src/main/java/com/coc/docs/config/SecurityConfig.java` — `/api/v1/me/usage-tokens/**` floor
- `backend/src/test/java/com/coc/docs/claudeusage/ClaudeUsageIngestTokenServiceTest.java`, `backend/src/test/java/com/coc/docs/web/SecurityRulesTest.java` — updated role-floor assertions
- `frontend/components/claude-usage/MyClaudeUsageSection.tsx` — briefly rendered `DownloadConfigPanel`, removed again same session (see "Not part of this ADR's lasting shape")
- `frontend/components/docs/ContentRenderer.tsx` — the surviving, only remaining self-mint UI path (setup guide's own download link)
- `frontend/components/claude-usage/DownloadConfigPanel.tsx` — deleted, along with its test file; see the negative consequence recorded above
- `frontend/lib/docs/content-store.ts` — setup guide's rank-gated wording removed
- ADR-047 (per-account ingest tokens — the decision this revises), ADR-050 (single-file script), ADR-017 (guest/approval gate), ADR-052 (personal Claude Usage dashboard, where `MyClaudeUsageSection` lives)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-28 | 1.0 | Initial draft, implemented same session on direct developer instruction | Claude Sonnet 5 |
| 2026-09-28 | 1.1 | `DownloadConfigPanel` removed from `MyClaudeUsageSection` again, on direct developer instruction — kept only on `AdminClaudeUsageView`. The widened `MIN_ROLE` this ADR is actually about is unaffected; only the UI surface changed. Decision/References updated to match | Claude Sonnet 5 |
| 2026-09-28 | 1.2 | `DownloadConfigPanel` removed from `AdminClaudeUsageView` too, on direct developer instruction, and deleted outright (dead component, no remaining caller) along with its test file. New negative consequence and follow-up item recorded: no revoke-token UI exists anywhere now. `MIN_ROLE` and every backend endpoint are unaffected | Claude Sonnet 5 |

---

**Approval**

| Date | Approver | Comments | Status |
|------|--------|------|------|
| | | | PENDING |
