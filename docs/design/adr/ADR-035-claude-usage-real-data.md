# ADR-035: Claude Usage becomes real data — roster, daily usage, and the `/api/ingest` bearer secret

## Status

Accepted. Implemented directly on PM/developer instruction in-session (same
class of decision as REQUIREMENTS-SPEC.md §7.4/7.5) — formal PM sign-off
recommended, not yet recorded. See §7.6 of that document for the requirements
amendment this ADR is paired with.

## Context

The Claude Usage screen (`/claude-usage`, admin + super_admin, wired into the
sidebar under Users & Roles) shipped against `frontend/lib/mock/claude-usage.ts`
— a static in-memory array, restyled to this project's design system from a
separate internal usage-dashboard tool (`D:\Jex MCP 3.0\jexmcp3.0`, the
`ai-usage` feature) but never backed by a database.

That reference tool already has a real design for this: Google Sheets as the
store, a Next.js API route at `/api/ingest` guarded by a single shared bearer
secret (`INGEST_SECRET`), and a small reporter script each developer's machine
runs locally to read Claude Code's own usage logs and push a day's running
total. `REQUIREMENTS-SPEC.md` already anticipated exactly this shape before
today — `NFR-SEC-CHANNEL` names `/api/ingest` and its bearer secret verbatim,
and `threat-model.md` (TM-028) already accounts for `INGEST_SECRET` in the
team's credential-sprawl risk. What it also says, in `FR-USAGE-001`, is
**Won't** for this release: "Migrating ai-usage from Google Sheets into the
database... does not reduce the content bottleneck" (`AMB-004`), and
`PROJECT-PROPOSAL.md`'s `RISK-011` flags it as the first thing to cut if
capacity tightens.

The PM/developer directly instructed, in this session, that the mock be
replaced with a real table and a real backend now, ahead of that deferral.
This ADR is that decision, made on purpose rather than by a mock quietly
growing a database underneath it — see the Requirements Amendment below for
the `FR-USAGE-001` status change this pairs with.

Two things this project already decided, that this feature must fit rather
than reopen:

- **CONST-TECH-05/06/07/08 (ADR-012)**: the backend owns all persistence and
  authorization; the frontend has no database access and no code path that
  substitutes for backend enforcement.
- **ADR-011 §"middleware enforcement"**: a route not explicitly declared in
  `SecurityConfig` is not open by accident — the terminal rule denies it to
  everyone but `super_admin`. A new route family means new, deliberate lines
  in that file, not an assumption that omission is safe.

## Decision

### 1. Two tables, not one: roster vs. raw usage

`claude_usage_member` is the opt-in tracking roster — email, display name,
`team_role` (`admin`/`member`, a dashboard-scoped role that has nothing to do
with `AppRole`), `status` (`invited`/`active`/`removed`), and an optional
per-person soft-budget override. `claude_usage_daily` is one row per
`(member, day)` of ingested token counts, cost estimate, and the models used
that day.

Splitting them is what lets "Remove" stay a display decision rather than a
data-loss event: `claude_usage_daily` rows are never deleted when a member is
removed (foreign key has no `on delete cascade` triggered by a status change,
only by the row itself being deleted, which nothing in this feature does), so
a former contractor's history stays visible and attributable exactly as the
mock's own framing already promised ("Remove... doesn't change their Claude
Code access... that stays their choice").

A tracked person is **not** required to hold a Coc Docs Platform `account`
row. This roster answers "who is opted into this dashboard," which is a
different question from "who can sign in here," and conflating them would
mean a contractor with no platform login could never be tracked, or that
every dashboard invite silently became an account-creation flow with its own
authentication implications.

### 2. Ingestion: one shared bearer secret at `POST /api/ingest`, not a per-member token

Matches the reference tool's actual design, and the requirements/threat-model
work already written against it (`NFR-SEC-CHANNEL`, `TM-028`, `TEST-PLAN.md`
line 214) almost to the letter — `/api/ingest`, unversioned, is a deliberate
exception to this backend's `/api/v1/**` convention: a reporter script's
config should not need to change when the *admin* API is version-bumped.

Considered a per-member issued token (mint on invite, store only its hash,
show once) — the shape `PasswordResetToken`/`AppSession` already use in this
codebase. Rejected for this feature specifically:

- The mock UI's own copy already says `INGEST_SECRET: "<ask your admin>"` —
  a shared secret an admin hands out through whatever secure channel the team
  already uses, not something the API reveals. A per-member secret would
  need its own "reveal once" screen and rotation UI with no requirement
  asking for either.
- `NFR-SEC-CHANNEL` and the threat model were written in the singular ("the
  `/api/ingest` bearer secret") — a fleet of per-member secrets is a
  materially different credential-management shape (rotation, one leak
  compromising one person vs. the shared secret) that would need its own
  security review, not a drive-by expansion of an existing line.
- The reporter identifies *whose* day it is reporting in the request body
  (`email`), same as the reference tool. The secret's only job is proving the
  caller is allowed to write at all, not who they are.

The secret is never returned by any API response (`ClaudeUsageProperties`
never appears in a DTO), matching how `AppProperties.Storage.secretAccessKey`
is already documented as "never logged, never returned in any response."
It is compared with `MessageDigest.isEqual` (constant-time), matching the
reference implementation's `timingSafeEqual` reasoning exactly.

`NFR-SEC-CHANNEL`'s own wording — "explicitly not a template for editorial
write paths" — is binding here: this is the *only* route family in this
backend authorized by a bearer secret instead of the session cookie
`SessionAuthenticationFilter` establishes everywhere else, and it must stay
that way. A future feature needing machine-to-machine auth needs its own ADR,
not a second `permitAll()` line borrowed from this one's reasoning.

### 3. Ingest is upsert-by-day, keyed on `(member_id, usage_date)`

The reporter sends the day's whole running total on every tick, never a
delta — the same idempotency shape `/api/ingest` already had in the tool
being replaced (see `REQUIREMENTS-SPEC.md`'s own retry/idempotency note under
ADR-009's coverage check). A double-run or a retried request converges
instead of double-counting. Enforced by a unique constraint on
`(member_id, usage_date)` plus an `insert ... on conflict ... do update`,
not by trusting the reporter to be well-behaved.

An email not yet on the roster is created automatically, `status = 'active'`
— someone's machine choosing to report *is* the opt-in the roster exists to
record, and requiring an admin to pre-invite before a report is even
accepted would contradict the "cooperative, not gatekept" framing the UI
already states. An `invited` member is promoted to `active` on their first
successful report. A `removed` member is **not** silently reactivated by a
new report — status changes only in the direction an admin chose, in either
direction; that is what makes "Remove" mean something. Their new data still
lands in `claude_usage_daily`, because their laptop does not know or care
that an admin clicked Remove here.

### 4. Cost stays a flat blended rate, computed server-side

The dashboard already states the cost figure is "an estimate, blended rate,"
not a real invoice — a decision this feature inherits rather than revisits.
Per-model pricing (the reference tool's actual approach) is a strictly more
accurate number, but changing what the existing UI's stat card and the
`API-Equivalent Cost` column already promise the reader is a separate
decision from making the data real, and is not made here. `cost_usd` is
computed from `(input + output) / 1000 * 0.006` at ingest time, server-side,
so a rate change taking effect does not require every reporter script to be
redeployed — and is never trusted from the request body, same reasoning as
the reference tool's own `cost_usd` derivation.

### 5. Soft budget scales with the selected period

The existing mock compared raw totals against one constant regardless of
which of Day/Week/Month was selected — harmless when those buttons did
nothing, misleading once they actually change the date range (a week's worth
of tokens would almost always clear a "budget" sized for a day). The
override an admin types remains a **weekly-equivalent** figure; the dashboard
scales it by the selected range's length in days (`weekly * days / 7`),
matching the reference tool's own `budgetFor` — the one piece of that tool's
math this feature does port outright, since without it the period switcher
is not just inert but actively wrong.

### 6. Roster mutations are audited; ingest is not

Inviting, changing a `team_role`, changing a budget override, and removing a
member are each a person's decision and go into `audit_log`
(`ClaudeUsageMember*` actions), same as every other admin mutation in this
system. Ingest is not audited, for the same reason V21's `hrms_notification`
is a table of its own rather than `audit_log` rows: nobody *here* did
anything — a script on somebody's own machine reported a number. Writing that
into a trail whose whole meaning is "an account acting inside this system did
this" would make the trail answer "who did this" with a claim nobody made.
`claude_usage_daily.reported_at` is this feature's equivalent of
`hrms_notification.recorded_at`.

## Requirements Amendment

`FR-USAGE-001` (§2.8, "Won't" for this release) is superseded: real
persistence for Claude usage is in scope now, on direct PM/developer
instruction, ahead of the `AMB-004`/`RISK-011` deferral. Recorded as
`REQUIREMENTS-SPEC.md` v1.6, §7.6.

## Alternatives Considered

| Option | Rejected because |
|---|---|
| Keep mock data, defer to phase 2 as `FR-USAGE-001` already says | Superseded by direct instruction this session — see above. |
| Sync from the jexmcp3.0 tool's own Google Sheet (poll it, mirror rows in, like `HrmsMailPollJob` polls IMAP) | Makes this project depend on another product's Google service-account credentials and spreadsheet layout for its own admin dashboard. The HRMS poll is justified because the *source system* (KOSIGN) will never call us; here we are choosing not to accept direct calls, which is a much weaker justification for the same complexity. |
| Per-member roster rows double as Coc Docs Platform accounts (reuse `account`) | A tracked person need not be able to sign in here at all (contractors); forcing the two concepts together would mean every dashboard invite is also an authentication decision, which it plainly is not one of today. |
| Per-member ingest token, hashed at rest (mirrors `PasswordResetToken`) | See Decision §2 — a materially bigger credential-management surface than the single shared secret the existing requirements/threat-model work already scoped, without a requirement asking for the difference. |

## Consequences

### Positive

- The dashboard shows real numbers without inventing a second store: one
  Postgres database, same as everything else `CONST-TECH-08` already governs.
- The ingest contract matches what `NFR-SEC-CHANNEL`, `TM-028` and
  `TEST-PLAN.md` already describe, so those requirements stop being written
  ahead of the code that satisfies them.
- Removing a tracked person never discards their history — an admin can
  always answer "what did this cost us while they were here."

### Negative — stated plainly

- A single shared secret is a single point of compromise: anyone who has it
  can post usage as *any* email, including one that does not exist yet
  (auto-created as `active`). This is the same trade-off `NFR-SEC-CHANNEL`
  already accepted for the tool being replaced, not a new exposure —
  but it is worth restating: this is not per-person accountability, only
  per-*team* gatekeeping on who may write at all.
- `POST /api/ingest` is a genuinely new authenticated-but-sessionless route
  family in a backend whose entire authorization model (ADR-011) is built
  around a session cookie read server-side. It is the one deliberate
  exception, and `SecurityConfig`'s comment on this line says so — a future
  reviewer must not treat it as precedent for a second one.
- Cost figures remain an estimate at a flat blended rate. A team using a
  disproportionate mix of the most expensive model will see a lower cost
  estimate than they actually generated. Unchanged from the existing mock's
  own promise, not a regression introduced here.

### Required follow-up

- [ ] A reporter script (the local piece that actually reads Claude Code's
      usage logs and calls `POST /api/ingest`) is not part of this change.
      Without it the roster and dashboard are real but empty until someone
      builds or ports one.
- [ ] `INGEST_SECRET` (`app.claude-usage.ingest-secret`) must be set in each
      environment's own configuration before ingest will accept anything;
      per `AppProperties`' existing convention this is deliberately left
      unset in version control. Confirm it lands in the same secret store
      `ADR-011`'s team-scale section names for every other credential here,
      once a production host is chosen (still `[DEFERRED]`, `ADR-012`).
      Distributing the value itself to whoever needs it is a PM/admin
      decision, not something this ADR or the API performs.
- [ ] Formal PM sign-off on the `FR-USAGE-001` reversal, per the caveat
      already attached to every other in-session requirements amendment in
      this document's history (§7.3–7.5).

## References

- `frontend/lib/mock/claude-usage.ts`, `frontend/app/(shell)/claude-usage/page.tsx` — the mock being replaced
- `D:\Jex MCP 3.0\jexmcp3.0\lib\usage\*`, `app/api/ingest/route.ts` — the reference tool's real implementation
- `REQUIREMENTS-SPEC.md` — `FR-USAGE-001`, `NFR-SEC-PII`, `NFR-SEC-CHANNEL`, `AMB-004`, `RISK-011` (in `PROJECT-PROPOSAL.md`), §7.6
- `docs/design/threat-model.md` — TM-028
- `docs/design/TEST-PLAN.md` — line 214, `NFR-SEC-CHANNEL` verification row
- ADR-006 (audit logging), ADR-011 (security model, middleware enforcement), ADR-012 (two-service split), ADR-023 (why removal ≠ deletion elsewhere in this system), ADR-034 (notifications as rows — the nearest sibling schema decision)
