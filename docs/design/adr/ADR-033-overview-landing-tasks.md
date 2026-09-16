# ADR-033: A dedicated post-login landing page, and a real task list to back it

## Status

**PARTIALLY REVERTED** — 2026-09-16

- Deciders: PM (requested), via Claude Code pairing session.
- Decision 1 (the `/overview` route-group split, Viewer/Admin/Super Admin
  variants built on top of it) was reverted the same day on PM instruction
  ("revert admin page do not change UI on admin page") — `/overview` is back
  on the shared `(shell)` sidebar layout. Decisions 2 and 3 (the real `task`
  table and its API) were **not** reverted and remain in the schema and
  backend, unused by any current frontend page. See each decision's own note
  below for what's actually live.

## Context

The page an `admin`/`super_admin` account lands on after sign-in (`/overview`)
has so far been the same authenticated shell every other admin page uses:
`Sidebar` + `Topbar`, from `app/(shell)/layout.tsx`. The PM asked for this one
route to become a distinct landing experience instead — a horizontal product
nav, a greeting/search header, per-product progress cards, and a "Your Tasks"
panel — while every other admin page (Settings, Users & Roles, each product's
content editor) keeps the sidebar shell unchanged.

The reference design's task panel shows assignable items with due dates
("Review Jex3.0 API Reference draft — Due tomorrow"). Nothing in the schema
models this today; `audit_log` (ADR-006) records what already happened, not
what someone still needs to do. Rather than fabricate example rows on the
landing page — the same "no placeholder data" rule this session has held to
for `RecentActivityPanel` — this ADR adds a minimal, real task list.

## Decision

### 1. `/overview` moves to its own route group, not a branch in the shared layout

**Reverted.** `/overview` is back under `app/(shell)/layout.tsx`, the same
sidebar shell every other admin page uses. Nothing below in this decision is
live code anymore; kept for the record of what was tried and why.

`app/(landing)/layout.tsx` provides only `SessionProvider` + `RequireSession`
— the same role gate (`admin`/`super_admin`, temporary-password redirect,
`/welcome` fallback) `app/(shell)/layout.tsx` already enforces, copied rather
than parameterized so neither layout's behaviour depends on the other. No
`Sidebar`, no `Topbar`. `app/(shell)/overview/page.tsx` is removed; the route
group is invisible in the URL, so `/overview` does not change.

A conditional inside the shared `(shell)` layout (skip the sidebar when
`pathname === "/overview"`) was the other option, and was rejected: it makes
a file every other admin page depends on carry a special case for one route,
where a second route group carries the same case with zero blast radius on
the rest of the app.

### 2. `task` — a real, minimal work-item list, not a copy of `audit_log`

**Still in place**, just currently unreachable from any page — the "Your
Tasks" panel that read/wrote it lived on the now-reverted landing page. The
table, repository, service and `/api/v1/admin/tasks/**` endpoints are real
and tested; they simply have no frontend consumer today.

```
task(id uuid pk, title text, due_date date null, status text ('open'|'done'),
     created_by uuid -> account, created_at, completed_at null)
```

Deliberately thin: no assignee, no product/target reference, no priority.
The reference shows three example items and no bulk-management UI; a richer
model would be designing ahead of an actual second requirement. Assignment,
linking a task to a product/sub-item, and reminders are explicitly left for
a future ADR if the PM asks for them.

Gated at the existing `admin` floor (`/api/v1/admin/tasks/**`, already
covered by `SecurityConfig`'s generic `/api/v1/admin/**` matcher — no new
security-critical route to reason about, unlike `AuditRepository`'s
`super_admin` floor, because a task's title carries no other account's PII).

### 3. The panel gets a real write path, not a read-only dead end

A feature a person can never populate is a feature that is always empty in
practice, which is its own kind of dishonesty even without literal fake rows.
The Tasks panel includes a minimal "+ Add task" (title, optional due date)
and a complete checkbox, backed by `POST /api/v1/admin/tasks` and `POST
/api/v1/admin/tasks/{id}/complete`.

## Alternatives Considered

| Option | Why not |
|---|---|
| Static/fabricated task rows on the landing page | Violates the standing "no placeholder data" rule this session has held to everywhere else (Recent Activity, Recent Documents) |
| Auto-derive "tasks" from missing-content stats (e.g. "Write 3 missing Coach docs") | Conflates two different things — a coverage gap is not a task someone has picked up — and the reference's other two example rows ("Review...", "Approve...") aren't coverage-shaped at all |
| Conditional sidebar-skip inside the shared `(shell)` layout | Couples every other admin page's layout to one route's special case |
| Full task model (assignee, product link, priority) | No second requirement asks for it yet; adds surface with nothing exercising it |

## Consequences

### Positive
- `/overview`'s landing design can evolve independently of the sidebar shell used everywhere else.
- The Tasks panel is honest: empty until someone adds something, same as Recent Activity.

### Negative — stated plainly
- Two route groups now separately implement the same `admin`/`super_admin` gate (`RequireSession` is reused as a component, but the wrapping layout is duplicated rather than shared). A future change to that gate must be made in both places.
- The task model has no assignee or due-date reminders — it is a list, not a workflow, until a real requirement asks for more.

## References

- Requirements: none yet — `REQUIREMENTS-SPEC.md` has no FR for a task list; this is PM-directed UI work, not a spec amendment.
- Related: ADR-006 (audit trail this deliberately does not reuse), the Recent Activity work earlier this session (`AuditRepository`, `RecentActivityPanel.tsx`) — same "real data or honest empty state" precedent.
- Code: `backend/src/main/resources/db/migration/V17__tasks.sql`, `com.coc.docs.tasks.*` (still live); `frontend/app/(landing)/overview/page.tsx` (reverted — no longer exists)

## Numbering

Drafted and implemented as "ADR-029" before `origin/dev` merged its own,
unrelated
[ADR-029](ADR-029-revision-of-018-forgot-password-covers-google-only-accounts.md)
first. Renumbered to 033 on resolving that merge — the same situation
[ADR-030](ADR-030-revision-of-022-024-google-only-account-may-set-initial-password.md)'s,
[ADR-031](ADR-031-totp-second-factor-for-password-login.md)'s, and
[ADR-032](ADR-032-hrms-report-arrival-notifications.md)'s
own numbering notes already record for this branch — and no decision in this
document changed because of the renumbering (Decision 1's revert above is
unrelated, a same-day PM instruction, not a numbering artifact).

`V17__tasks.sql`/`V18__product_access.sql` are untouched by the renumbering,
deliberately: both cite "ADR-029" in their comments (one inside a `comment on
table` that is itself persisted into the schema), and an applied migration is
immutable regardless of what it cites (see ADR-031's note on the Flyway
checksum mismatch the last renumbering caused). Those comments now point to
the wrong number; this paragraph is the correction on record.
