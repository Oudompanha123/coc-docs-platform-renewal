# ADR-047: Per-account `/api/ingest` tokens, alongside the shared secret — revision of ADR-035 Decision 2

## Status

Accepted. Implemented directly on developer instruction in-session (same class
of decision as ADR-035's own origin) — formal PM sign-off recommended, not
yet recorded.

## Context

ADR-035 chose a single shared bearer secret (`app.claude-usage.ingest-secret`)
for `POST /api/ingest`, and explicitly considered and rejected a per-member
token at the time:

> "The mock UI's own copy already says `INGEST_SECRET: "<ask your admin>"` —
> a shared secret an admin hands out through whatever secure channel the team
> already uses, not something the API reveals... a materially different
> credential-management shape... that would need its own security review, not
> a drive-by expansion of an existing line."

In this session, a developer asked to remove the `INGEST_SECRET` requirement
from `push-usage.mjs`/`/api/ingest` entirely, so that a freshly downloaded
reporter config would work with no credential at all. That was refused: the
shared secret is the *only* authorization check on a route this backend
deliberately `permitAll()`s at the filter-chain level (`ClaudeUsageIngestController`'s
own Javadoc), and removing it would let anyone who has ever seen the
predictable `/api/ingest` URL post fabricated usage rows for any email in the
system.

The developer then asked for the actual underlying problem to be solved
instead: too much friction getting the shared secret (asking around, out of
band, before the reporter script is usable at all). The first proposal —
return the *shared* secret from an authenticated "download my config"
endpoint — was also refused: `ClaudeUsageProperties`'s own Javadoc states
the secret "is never logged and never appears in any API response," the same
handling `AppProperties.Storage.secretAccessKey` already documents. Returning
it from any endpoint, session-authenticated or not, breaks that invariant.

**A third thing surfaced during this investigation**: `V35__claude_usage_ingest_token.sql`
already exists in this repository's migration history (committed
2026-09-22, bundled into an unrelated "update mail notification" commit) and
already implements almost exactly the design below — `coc_`-prefixed tokens,
SHA-256 hex hash storage, per-token label, `revoked_at` soft-delete,
`last_used_at`. Its own header comment cites "ADR-042" as the decision behind
it. No such ADR exists: `ADR-042` is taken by two unrelated, later documents
(`ADR-042-hrms-attendance-detail-on-demand.md`,
`ADR-042-self-service-account-deactivation.md`), and no Java code anywhere in
the backend ever referenced `claude_usage_ingest_token` — the table was
migrated once and never wired to any entity, repository, service or
controller. This ADR is written under the next free number, and completes
that orphaned schema rather than replacing it: **V35 required no changes.**

## Decision

`POST /api/ingest` now accepts *either* credential shape:

1. **The shared secret** (`ClaudeUsageProperties.ingestSecret`) — unchanged,
   unscoped, may report as any email. Kept for any deployment already
   configured with it; not removed, not deprecated.
2. **A per-account token** (`claude_usage_ingest_token`, V35) — minted by an
   `admin`/`super_admin` from `POST /api/v1/me/usage-tokens`, restricted to
   reporting only its own account's email, and re-validated against the live
   `account` row on every use.

### Key choices

- **Scoped, not another shared value.** `ClaudeUsageIngestController.authorize`
  requires a per-account token's request body `email` to equal the token
  owner's account email. This closes the exact negative consequence ADR-035
  §2 stated plainly and accepted: "anyone who has [the secret] can post usage
  as *any* email." A per-account token cannot.
- **Live re-check, not a stored snapshot.** `ClaudeUsageIngestTokenService.resolve`
  reloads the account on every `/api/ingest` call and requires it to both
  `canSignIn()` and hold at least `ADMIN` rank — matching V35's own column
  comments ("Role is re-checked on every ingest request... so a role
  downgrade or deactivation takes effect immediately without revoking tokens
  explicitly"). A deactivated or demoted admin's token stops working the
  moment that happens, with nothing else to update.
- **Minted by `ADMIN`+, matching V35's stated design** ("each admin /
  super_admin generates their own token"), not opened to every `USER` —
  `SecurityConfig` floors `/api/v1/me/usage-tokens/**` there. A plain member
  can still be *given* a token to configure (an admin could hand one out the
  same way the shared secret is today), but cannot self-mint one — narrower
  than ADR-035's original "someone's machine choosing to report is the
  opt-in" framing, which this ADR does not otherwise revisit.
- **`POST /api/ingest` moves from `503` to `401` when nothing is configured.**
  ADR-035's `ClaudeUsageIngestController` returned `503 usage ingestion is
  not configured on this deployment` when the shared secret was unset,
  distinguishing "nobody's fault yet" from a wrong credential. That
  distinction stops being meaningful once a *second*, independent credential
  path exists — a deployment with no shared secret configured can still
  accept ingestion the moment one admin mints a token, so there is no longer
  a single "not configured at all" state. Every rejection is now a uniform
  `401`. (`SecurityRulesTest.ingest_is_reachable_without_a_session` is
  updated to assert `401`, not `503`.)
- **`push-usage.mjs` needed no change.** It already sends whatever fills
  `INGEST_SECRET` as the bearer value, blind to which shape it is (see the
  script's own `canReport` gate, which already made `INGEST_SECRET` optional
  client-side — the local-preview/dry-run fallback shipped earlier this
  session, independent of this ADR). A per-account token slots into that same
  field.

### Not done here

- ~~The frontend "download my config, already filled in" UI the friction
  complaint was actually about is not implemented in this change~~ — done in
  a follow-up session: `DownloadConfigPanel.tsx` (Claude Usage page), see
  Follow-up below and References.
- The shared secret is not deprecated or scheduled for removal. Both shapes
  are expected to coexist indefinitely, same as ADR-035 §2 already reasoned a
  fleet of per-member secrets would be "a materially different
  credential-management shape" from the single one — this ADR adds that
  shape rather than replacing what existed.

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Remove `INGEST_SECRET` entirely; `/api/ingest` accepts any request with a valid `INGEST_URL` | The literal first ask this session. `INGEST_URL` is not a secret — it is printed in the setup docs and every teammate's config file. Removing the only check leaves the endpoint open to anyone who has seen it, able to post fabricated usage for any email. Refused outright, not just discouraged. |
| Return the shared secret from an authenticated "download my config" endpoint | Directly contradicts `ClaudeUsageProperties`'s own documented invariant ("never appears in any API response"), the same handling `AppProperties.Storage.secretAccessKey` already gets. Also does not close ADR-035's "any email" exposure — every account would still hold the one value that authorizes writing as anyone. |
| Email the shared secret to the caller's verified address instead of returning it via API | Keeps ADR-035 §2 unchanged (single shared secret) and avoids the API-response invariant, but does not address the "anyone who has it can post as any email" negative consequence, and still means the value propagates to everyone who asks — automating the hand-off, not narrowing what is handed off. |
| Per-account token, unscoped (any token may report any email, same as the shared secret) | Would satisfy "no manual secret" but not the accountability half of the problem ADR-035 §2 itself named as the tradeoff being accepted. Scoping to the owning account is the same amount of code and closes a real gap. |

## Consequences

### Positive

- Closes ADR-035's own stated negative consequence for anyone using a
  per-account token: a leaked or misused token can only ever misreport *its
  own* account's numbers, not any email in the system.
- Revoking one person's access, or downgrading their role, no longer requires
  rotating a value every other teammate's already-configured reporter script
  also depends on.
- `push-usage.mjs` and the shared secret continue to work unmodified for any
  deployment already using them — nothing is a breaking change.
- Completes schema (`V35`) that has sat migrated and unused since 2026-09-22,
  rather than leaving it as permanent dead weight or writing a second,
  divergent table for the same purpose.

### Negative — stated plainly

- Two credential shapes for one route is more to reason about than one.
  `ClaudeUsageIngestController.authorize` is no longer a single comparison;
  a future reader must understand both branches, same caution ADR-035 §2
  already gave about a second `permitAll()` route — this is a second
  authorization *shape* on the one route ADR-035 already flagged as the
  system's sole deliberate exception, not a second exception.
- `claude_usage_ingest_token` rows are a new credential-bearing table (hashed
  at rest, same as `password_reset_token`/`app_session`) that now needs the
  same operational attention (backup, and — if ever needed — a bulk-revoke
  path) as any other credential store in this system.
- ~~The self-service download UI that actually removes the friction this ADR
  was motivated by is not part of this change~~ — shipped in a follow-up
  session (`DownloadConfigPanel.tsx`): generate a labeled token and download
  a pre-filled `claude-usage.config.json` in one click, from the Claude
  Usage page. The raw token is held only long enough to build that download
  and is never rendered or stored client-side; `listUsageTokens` returns
  label/timestamps only.

### Required follow-up

- [x] Frontend: a "Usage tokens" panel (Settings, or the Claude Usage setup
      guide) to mint, label, list, and revoke a token, and to download a
      `claude-usage.config.json` pre-filled with it, `USER_EMAIL`, and
      `NEXT_PUBLIC_BACKEND_URL + "/api/ingest"` — the actual friction-removal
      this ADR was requested to enable. **Done**: `DownloadConfigPanel.tsx`
      on the Claude Usage page (`app/(shell)/claude-usage/page.tsx`), backed
      by `lib/auth/api.ts` (`listUsageTokens`/`createUsageToken`/`revokeUsageToken`)
      and `lib/admin/reporterConfig.ts` (the config builder/download). The
      setup guide (`lib/docs/content-store.ts`) now points to it as the
      preferred path, manual config-editing kept as the fallback.
- [ ] Decide whether to correct or annotate `V35`'s SQL comment citing the
      nonexistent "ADR-042" — the migration file itself is left unedited here
      (an applied Flyway migration's checksum must not change); a follow-up
      migration's comment, or a note in `ADR-INDEX.md`, is the safe way to
      redirect a future reader to this ADR instead.
- [ ] Formal PM sign-off, per the caveat this document's Status line already
      states, same pattern ADR-035 itself used.

## References

- `backend/src/main/resources/db/migration/V35__claude_usage_ingest_token.sql` — schema (already applied, unmodified by this ADR)
- `backend/src/main/java/com/coc/docs/claudeusage/ClaudeUsageIngestToken.java`, `ClaudeUsageIngestTokenRepository.java`, `ClaudeUsageIngestTokenService.java`
- `backend/src/main/java/com/coc/docs/web/ClaudeUsageIngestController.java` — dual-credential `authorize()`
- `backend/src/main/java/com/coc/docs/web/ClaudeUsageIngestTokenController.java` — `/api/v1/me/usage-tokens` (mint/list/revoke)
- `backend/src/main/java/com/coc/docs/config/SecurityConfig.java` — `ADMIN` floor on the new route
- `frontend/public/downloads/push-usage.mjs` — unmodified by this ADR; already accepts either credential shape via `INGEST_SECRET`
- `frontend/components/claude-usage/DownloadConfigPanel.tsx` — the "Download Config" panel (mint/list/revoke UI, generate-and-download flow)
- `frontend/lib/admin/reporterConfig.ts` — builds the `claude-usage.config.json` payload and hands it to the browser as a download
- `frontend/lib/auth/api.ts` — `listUsageTokens`/`createUsageToken`/`revokeUsageToken`, the `/api/v1/me/usage-tokens` client
- `frontend/lib/docs/content-store.ts` — setup guide updated to lead with the panel, manual three-value config kept as the fallback path
- ADR-035 (Claude Usage becomes real data — the decision this revises), ADR-011 (security model), ADR-018 (`PasswordResetToken`, the hashed-token shape this mirrors)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-23 | 1.0 | Initial draft, implemented same session on direct developer instruction | Claude Sonnet 5 |
| 2026-09-23 | 1.1 | Frontend follow-up shipped (`DownloadConfigPanel`) — checked off in Required follow-up; "Not done here"/Negative sections updated to match | Claude Sonnet 5 |

---

**Approval**

| Date | Approver | Comments | Status |
|------|--------|------|------|
| | | | PENDING |
