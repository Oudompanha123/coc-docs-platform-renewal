# ADR-047: A personal "My Claude Usage" dashboard for every signed-in account

> **Status**: PROPOSED
> **Date**: 2026-09-25
> **Author**: backend-developer / frontend-developer (AI-drafted, per direct PM/developer request in-session)
> **Approver**: PM — **pending** (`CONST-PROC-01`: this status is recorded by a human, never by the AI, even when the AI drafts the ADR)
> **Related ADR**: ADR-035 (Claude Usage becomes real data), ADR-036 (per-model pricing), ADR-044 (per-account ingest tokens)

> **v1.1 note**: v1.0 of this ADR (below, unchanged in §1 and §3) gave the personal view its own frontend route, `/my-claude-usage`, separate from the admin dashboard's `/claude-usage`. The PM/developer asked, later the same day, to collapse that into a single url: `/claude-usage` itself now renders the team view for `admin`/`super_admin` and the personal view for everyone else, so a nav link labeled "Claude Usage" always goes to the same place regardless of who clicks it. `/my-claude-usage` is now a thin redirect stub, kept only so a link or bookmark from the brief window it existed still lands somewhere real. §2 and §4–§6 below describe the merged design; §1 and §3 are left as unchanged history.
>
> **v1.2 note**: v1.1 still left "Claude Usage" reachable from *two* places at once — `/home`'s `MemberHeader` (every role) and the admin sidebar's "ADMINISTRATION → Claude Usage" (admin/super_admin only), both pointing at the identical merged url. The PM/developer asked, later the same day, to remove the sidebar entry entirely: `/home`'s header link is now the *only* nav path to `/claude-usage`, for every role including admin/super_admin. The `/api/v1/*` endpoints, the page's role-branch, and the direct-url `RequireSession` exception from v1.1 are all unchanged — this is a presentation-only removal of one of two redundant links, not a new authorization decision.
>
> **v1.3 note**: the PM/developer asked, later the same day again, for the personal view to stop sharing a url with the admin dashboard at all. `/claude-usage` briefly went back to admin/super_admin-only, and the personal dashboard rendered as a section embedded directly on `/home` instead, reachable by scrolling rather than navigating.
>
> **v1.4 note**: the PM/developer asked, a few minutes later, to reverse v1.3: the personal view moved back to `/claude-usage` (one url, two views), `PersonalClaudeUsageView` restored with its `AppShell` wrapper, `RequireSession`'s exception restored.
>
> **v1.5 note (current)**: the PM/developer asked, a few minutes after *that*, to reverse v1.4 too — **back to v1.3's exact shape**: the personal view is a section embedded directly on `/home` again (`MyClaudeUsageSection`, no route of its own), `/claude-usage` is admin/super_admin-only again with no `RequireSession` exception, and the header's "Claude Usage" link scrolls instead of navigating. This session's oscillation (v1.1 merge → v1.2 sidebar trim → v1.3 move to `/home` → v1.4 revert to `/claude-usage` → v1.5 revert to `/home`, confirmed explicitly before applying) is recorded in full in Change History rather than squashed — see that section's own note on why. A reader who only needs the current answer: read this note and §2; the backend has not changed once across any of it. §2, §4–§6 below describe this current (= v1.3) state; §1 and §3 remain unchanged history from v1.0.

---

## 1. Context

ADR-035 gave Claude Usage a real team-wide dashboard at `GET /api/v1/admin/claude-usage`, but every route under `/api/v1/admin/claude-usage/**` sits behind `SecurityConfig`'s generic `/api/v1/admin/**` rule, floored at `admin`/`super_admin` (`AdminClaudeUsageController`'s own Javadoc explains why: it manages a roster and its budgets, the same floor as everything else an admin manages). `frontend/components/home/UsageSnapshotPanel.tsx` — the "your usage" widget on `/home`, the Member landing page every signed-in account sees — already anticipated a personal view: it calls the admin dashboard and filters the response down to the caller's own row, but only `if (isAdmin)`. A plain `user` account gets a generic "view usage docs" promo card instead, because the only API that exists would 403 for them.

The PM/developer asked directly, in-session, to close that gap: give a normal (non-admin) account a real place to see its own Claude Code usage, reachable from the sidebar, without widening the admin dashboard's floor or letting the frontend ask for another account's data by passing an id.

- **Related requirements**: FR-USAGE-001 through FR-USAGE-004 (ADR-035/036), extended here with a new self-service requirement (see §2).
- **Related risks**: the obvious failure mode is a client-suppliable identifier (`userId`, `email` query param) that lets one account read another's token counts — `NFR-SEC-PII`-adjacent even though `claude_usage_member` is deliberately not `account` (ADR-035 §1: "not an account — a tracked person need not be able to sign in to this platform at all"), because the row still carries a real work email and usage volume.
- **Decision pressure**: none — this is a scoped, additive feature, not a G2/G3 blocker. Recorded as an ADR per `CLAUDE.md`'s "new security-relevant endpoint / revision-adjacent addition to an existing decision" rule, not because it is architecturally large.

## 2. Decision (v1.5 — the personal view lives on /home, not under the admin shell)

The **backend** is exactly as v1.0 designed it and has never changed: a deliberately separate self-service surface, `GET /api/v1/claude-usage/me` (`USER` floor), alongside the unchanged admin surface `GET /api/v1/admin/claude-usage` (`ADMIN` floor). The **frontend** — specifically, *where the personal view is drawn* — has moved several times; v1.5 is identical in shape to v1.3.

- `/claude-usage` (under `(shell)`) is the admin team dashboard, `admin`/`super_admin` only, with no exception and no role-branch — `AdminClaudeUsageView`'s content, unchanged since v1.0.
- The personal dashboard is `MyClaudeUsageSection`, a component with no route of its own, rendered as a real `<section id="my-claude-usage">` directly inside `app/(member)/home/page.tsx` — governed by `RequireMemberSession` (which already admits `user`/`admin`/`super_admin`), not `RequireSession`.
- `/home`'s `MemberHeader` "Claude Usage" link no longer navigates anywhere: it is a `next/link` `<Link>` whose `onClick` intercepts the click, finds `#my-claude-usage` in the DOM, and calls `scrollIntoView({behavior: "smooth"})` — `preventDefault()` only fires when the section is actually present, so the `href="/home#my-claude-usage"` still works as a real link (no JS, a different tab, a screen reader) in every case that matters.
- `/my-claude-usage` is a **top-level** route (`app/my-claude-usage/page.tsx`, outside `(shell)` and `(member)` both) that unconditionally `redirect()`s to `/home#my-claude-usage`. Top-level rather than under `(shell)`: it renders nothing of its own, so it needs no session gate at all.
- Sidebar (`nav-config.ts`): still no "Claude Usage" entry anywhere — v1.2's removal is the one decision in this whole chain that was never reversed. The `/home` header link is the only nav surface.

> v1.1 merged the personal view into `/claude-usage`. v1.2 collapsed the sidebar to one path. v1.3 moved the personal view onto `/home` as an embedded section. v1.4 reversed v1.3, back to `/claude-usage`. **v1.5 reverses v1.4**, back to `/home` — the PM/developer confirmed this explicitly (asked directly whether this meant restoring the v1.3 behavior) before it was applied, given the immediately preceding reversal. `RequireSession`'s doc comment is back to describing exactly one exception (`/ax-renewal`), the same as before ADR-047 existed.

### Key Choices

- **`FR-USAGE-005`** (unchanged since v1.0): any signed-in account can read its own Claude Code usage (today's tokens, input/output split, this-week/this-month totals, and a 30-day daily history) without holding `admin`/`super_admin`.
- **`GET /api/v1/claude-usage/me`**, `USER` floor (`SecurityConfig`) — unchanged since v1.0. `ClaudeUsageMeController` resolves the caller from `@AuthenticationPrincipal CurrentUser`; there is no `userId`/`email` request parameter for a caller to substitute.
- **`ClaudeUsageService.myDashboard(CurrentUser)`** — unchanged since v1.0. Reuses `claude_usage_member`/`claude_usage_daily` (ADR-035) with one scoped query (`listInRangeForMember`). No new table, no new column.
- **Fixed 30-day history window** (`ClaudeUsageService.MY_HISTORY_DAYS`) — unchanged since v1.0.
- **`MyClaudeUsageSection` (v1.5, re-added)**: the same stat cards / input-output split bar / `MyUsageHistoryChart` markup as v1.4's `AppShell`-wrapped `PersonalClaudeUsageView`, minus the `AppShell` wrapper it doesn't need here — rendered directly, inline, on `/home` alongside `RecentDocumentsPanel`/`TasksPanel`/the rest of that page's own sections. `PersonalClaudeUsageView` is gone again.
- **`/claude-usage` is admin/super_admin-only again (v1.5)** — `app/(shell)/claude-usage/page.tsx` unconditionally renders `AdminClaudeUsageView`, and `RequireSession`'s exception for it is removed outright. A plain `user` visiting the url directly is refused, same as `/users-roles`.
- **`/my-claude-usage`'s redirect target changed back (v1.5)** — from `/claude-usage` to `/home#my-claude-usage`. Stays top-level (a keeper from v1.3, unaffected by v1.4's brief reversal).

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | New `/api/v1/claude-usage/me` endpoint + new route, session-resolved caller (above) | Minimal blast radius on the admin surface; matches the existing `/api/v1/auth/me*` self-service pattern; no client-suppliable id to misuse | A second small controller/service method pair to maintain alongside the admin one | **Adopted** |
| B | Widen `/api/v1/admin/claude-usage`'s floor to `USER` and have the frontend filter the full roster response down to the caller's own row (as `UsageSnapshotPanel` already does for admins) | Reuses one endpoint | Ships every tracked colleague's email, token counts and budget status to any signed-in account just to let them find their own row — a real `NFR-SEC-PII`-adjacent over-exposure, and the exact bug class §1 flags | Not adopted |
| C | Accept a `userId`/`email` query parameter on a shared endpoint, trusted from the request | Simplest possible client code | Exactly the vulnerability the PM's request called out to avoid — a caller could substitute another account's identifier | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts
- Closes the actual gap that motivated this ADR: a non-admin caller has a real, safe endpoint and a real place on the page they already land on, instead of a promo card.
- No new schema — `claude_usage_member`/`claude_usage_daily` (V22, ADR-035) already hold everything the personal view needs; this is a new read path, not new data.
- The admin dashboard's floor, route, and content are unmodified across every revision including this one — verified by the existing `AdminClaudeUsageController`/`ClaudeUsageService` test suites passing unchanged.
- **(v1.5)** `RequireSession` is back to exactly its pre-ADR-047 shape — one documented exception (`/ax-renewal`). The personal view's own gate is `RequireMemberSession`, which already had to admit `user`/`admin`/`super_admin` for `/home` regardless of this feature.
- **(v1.5)** `/my-claude-usage`'s redirect stub needs no session/role logic at all, being outside `(shell)`.

### 4.2 Negative Impacts / Costs to Accept
- Two controllers still read from `ClaudeUsageService` at two different floors (`ADMIN` and `USER`) — a future change to either has to remember the other exists, the same tradeoff ADR-042 accepted for its own two-path self-service/admin split.
- The personal view's 30-day window is a fixed constant (`ClaudeUsageService.MY_HISTORY_DAYS`), not user-configurable — judged sufficient for "how am I doing lately"; a period picker here would just be the admin dashboard's UI duplicated for one person.
- **(v1.5)** The personal view is coupled to `/home`'s own page structure (`app/(member)/home/page.tsx`) rather than being its own route — a change to that page's layout can now shift or break `#my-claude-usage`'s anchor scroll in a way a dedicated route never could have. `MyClaudeUsageSection` itself stays a self-contained component for exactly this reason, so the coupling is one `<section>` placement, not the whole feature.
- **(v1.5)** An admin/super_admin still has no way to view *only* their own personal breakdown (unchanged since v1.1, just relocated again): `/home` shows them `MyClaudeUsageSection` same as anyone, `/claude-usage` shows them only the team view. Their own row remains visible inside the team dashboard's per-user table.
- **(v1.5)** This is the fifth frontend-only revision of where the personal view lives, in one day, on one ADR. Recorded in full in Change History below rather than squashed, per this repo's own convention for same-day revisions (ADR-042's v1.0→v1.1 note is the precedent) — a reader who only needs the current answer should read the v1.5 note at the top and §2, not the full history. Given the oscillation, a follow-up item below asks the PM to confirm this is the settled design before further code touches it.

### 4.3 Follow-up Work
- [ ] PM to confirm/record this ADR's approval (`CONST-PROC-01`) before merge — **and, given five revisions in one session, to confirm v1.5 (personal view embedded on `/home`) is the design to actually build on**, not just the latest one asked for.
- [ ] `docs/requirements/REQUIREMENTS-SPEC.md` needs `FR-USAGE-005` added at the next requirements-spec revision — not edited here, since that document's change history is PM-owned per its own convention.
- [ ] `docs/design/adr/ADR-INDEX.md` needs a row for ADR-047 — left unedited here because the index currently has an **unresolved merge conflict** around ADR-044/045/046 (two different ADR-044s from diverged branches); adding a row through that conflict risked corrupting an in-progress merge that predates this work. Whoever resolves that conflict should add ADR-047 to the "Written" table at the same time.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| A plain `user` can reach `GET /api/v1/claude-usage/me` and gets 200 | `SecurityRulesTest.ClaudeUsagePath.my_dashboard_admits_a_plain_user` | Per PR | Always admitted |
| An anonymous caller is refused | `SecurityRulesTest.ClaudeUsagePath.my_dashboard_refuses_a_caller_with_no_session` (401) | Per PR | Always refused |
| The response is built from the session email, never a request parameter | `ClaudeUsageServiceTest.MyDashboard.resolvesCallerFromSession` | Per PR | 100% |
| A caller who never reported gets an all-zero response, not an error | `ClaudeUsageServiceTest.MyDashboard.neverReportedIsZeroNotError` | Per PR | 100% |
| History is exactly 30 days, zero-filled | `ClaudeUsageServiceTest.MyDashboard.historyIsThirtyDaysZeroFilled` | Per PR | 100% |
| `/api/v1/admin/claude-usage` behavior/floor is unchanged | Existing `AdminClaudeUsageController`/`ClaudeUsageServiceTest.Dashboard` suites, unmodified and passing | Per PR | Unchanged from pre-ADR-047 behavior |
| Neither "Claude Usage" nor "My Claude Usage" appears in the sidebar for any role, including admin/super_admin; the `MY WORK` section no longer exists at all | `nav-config.test.ts`, describe block "Claude Usage is not in the sidebar at all (ADR-047, further revised)" | Per PR | 100% |
| A plain `admin` (not `super_admin`) sees no `ADMINISTRATION` section at all, since it would otherwise be empty | `nav-config.test.ts`, "drops the ADMINISTRATION heading rather than rendering it empty" | Per PR | 100% |
| **(v1.5)** `/claude-usage` refuses a plain `user` and admits an `admin`, with no exception | `RequireSession.test.tsx`, describe block "/claude-usage (ADR-047, further revised: admin-only again, no exception)" | Per PR | 100% |
| **(v1.5)** MemberHeader's "Claude Usage" link carries a real `href="/home#my-claude-usage"`, and its click handler prevents default + calls `scrollIntoView` when the section is present, but not when absent | `MemberHeader.test.tsx` | Per PR | 100% |

## 6. References

- Related code: `backend/src/main/java/com/coc/docs/claudeusage/ClaudeUsageService.java` (`myDashboard`), `ClaudeUsageDailyRepository.java` (`listInRangeForMember`), `ClaudeUsageMyDashboard.java`, `ClaudeUsageMyDashboardPoint.java`, `backend/src/main/java/com/coc/docs/web/ClaudeUsageMeController.java`, `backend/src/main/java/com/coc/docs/config/SecurityConfig.java` (all unchanged since v1.0), `frontend/app/(shell)/claude-usage/page.tsx` (v1.5: unconditionally admin again), `frontend/app/my-claude-usage/page.tsx` (top-level redirect stub since v1.3, target `/home#my-claude-usage` again in v1.5), `frontend/components/claude-usage/AdminClaudeUsageView.tsx`, `frontend/components/claude-usage/MyClaudeUsageSection.tsx` (v1.5, replaces `PersonalClaudeUsageView.tsx` again), `frontend/app/(member)/home/page.tsx` (v1.5: renders the section again), `frontend/components/layout/nav-config.ts`, `frontend/components/layout/RequireSession.tsx` (v1.5: exception removed again), `frontend/components/home/MemberHeader.tsx` (v1.5: scroll, not navigate, again), `frontend/lib/claudeUsage/myUsage.ts`
- Related requirements: FR-USAGE-005 (new)
- Related ADR: ADR-035 (Claude Usage becomes real data), ADR-036 (per-model pricing), ADR-044 (per-account ingest tokens, the other `/api/v1/me/**`-adjacent prefix this ADR deliberately avoids colliding with)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-25 | 1.0 | Initial draft, written alongside the code change it authorizes, per direct PM/developer request in-session to give every signed-in account a personal Claude Usage view | backend-developer (AI-drafted) |
| 2026-09-25 | 1.1 | Revised the same day, before v1.0 merged: collapsed the frontend's two routes (`/claude-usage` admin, `/my-claude-usage` personal) into one (`/claude-usage`, role-branched), per direct PM/developer request that a "Claude Usage" nav link should never point somewhere else depending on which one they clicked. Backend endpoint/floor unchanged. §2 and §4–§6 revised; §1 and §3 left as unchanged history | frontend-developer (AI-drafted) |
| 2026-09-25 | 1.2 | Revised the same day, before v1.0/v1.1 merged: removed the admin sidebar's "ADMINISTRATION → Claude Usage" entry (and v1.1's "MY WORK → My Claude Usage" sibling), per direct PM/developer request that `/home`'s `MemberHeader` link be the *only* nav path to `/claude-usage`, for every role. Presentation-only — no endpoint, floor, or page-content change. §2, §4–§6 revised | frontend-developer (AI-drafted) |
| 2026-09-25 | 1.3 | Revised the same day, before v1.0/v1.1/v1.2 merged: reversed v1.1's url merge — `/claude-usage` is admin/super_admin-only again with no exception, and the personal view moved to a `MyClaudeUsageSection` embedded directly on `/home` (`RequireMemberSession`'s gate, not `RequireSession`'s), reachable by scrolling rather than navigating. `/my-claude-usage`'s redirect moved from `(shell)` to a top-level route, now pointing at `/home#my-claude-usage`. Per direct PM/developer request that the personal view live on the landing page a caller already reaches, not under the admin shell in any form. Backend completely unchanged. §2, §4–§6 revised | frontend-developer (AI-drafted) |
| 2026-09-25 | 1.4 | Revised the same day, minutes after v1.3, before any version merged: reversed v1.3 — the personal view is back at `/claude-usage` (`PersonalClaudeUsageView`, restored with its `AppShell` wrapper; `MyClaudeUsageSection` and its `/home` placement removed), `RequireSession`'s `/claude-usage` exception restored, `MemberHeader`'s link an ordinary navigating `Link` again. `/my-claude-usage`'s top-level (outside `(shell)`) redirect stub is kept from v1.3, only its target changed back to `/claude-usage`. Per direct PM/developer request, after asking to confirm the intent given the immediately preceding reversal. Net effect of v1.1→v1.4 equals v1.2's end state, plus the simpler top-level redirect stub. Backend completely unchanged throughout. §2, §4–§6 revised | frontend-developer (AI-drafted) |
| 2026-09-25 | 1.5 | Revised the same day, minutes after v1.4, before any version merged: reversed v1.4 — back to v1.3's exact shape. Personal view re-embedded on `/home` as `MyClaudeUsageSection`; `/claude-usage` admin-only again with `RequireSession`'s exception removed; `MemberHeader`'s link back to scroll-intercepting; `/my-claude-usage`'s redirect target back to `/home#my-claude-usage`. Per direct PM/developer request, applied only after asking a direct confirming question given this was the fourth direction change on the same feature in one session. Backend completely unchanged throughout v1.0–v1.5. §2, §4–§6 revised | frontend-developer (AI-drafted) |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-25 | PM | AI-drafted per in-session request; covers v1.5's current design (personal view embedded on /home, admin dashboard unconditionally at /claude-usage, no sidebar entry) — the fifth revision of this ADR in one session; PM sign-off not yet recorded, and explicit confirmation that v1.5 is the design to keep building on is especially warranted here | **PENDING** |
