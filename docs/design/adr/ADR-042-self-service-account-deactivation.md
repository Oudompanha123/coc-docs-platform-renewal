# ADR-042: Self-service account deactivation with a grace period, revising the unconditional self-deactivation refusal

> **Status**: PROPOSED
> **Date**: 2026-09-22 (revised same day — see Change History v1.1)
> **Author**: backend-developer (AI-drafted, per PM's direct request in-session — see Change History)
> **Approver**: PM — **pending** (`CONST-PROC-01`: this status is recorded by a human, never by the AI, even when the AI drafts the ADR)
> **Related ADR**: ADR-011 (security model), ADR-023 (revision of ADR-011 — account deletion, which documents and relies on the same self-deactivation guard this ADR relaxes)

> **v1.1 note**: v1.0 of this ADR (below, largely unchanged in §1–§3) deactivated the account immediately, the moment the caller confirmed. The PM asked, later the same session, for a grace period instead: choosing "7 days" should not deactivate the account until 7 days pass, and signing back in during that window should cancel it — matching the behavior described informally as "if I deactivate for 7 days and log back in before then, ask me to sign in again to confirm, and that cancels it." §2 and §4 below describe the grace-period design that replaced the immediate-deactivation decision; §3's alternatives table is unchanged history, not a currently-live comparison.

---

## 1. Context

`AccountService.setActive` (`backend/src/main/java/com/coc/docs/account/AccountService.java:271-277`) has, since the account-management feature shipped, unconditionally refused a caller who tries to deactivate their own account — for every role, including `super_admin`. The code comment is explicit about why: *"Not a security boundary — a super admin could deactivate a colleague and then themselves. It is refused because it is almost always a misclick, and the recovery is another person."* `frontend/components/settings/DangerZoneCard.tsx` mirrors this: its "Deactivate account" button never calls an API at all — it only opens a modal explaining the refusal, because, per its own comment, *"There is no endpoint this button could call that would not always 400."*

The PM asked, directly in-session, for the Settings → Danger zone page to stop showing that blocking explanation and instead let a user deactivate their own account the way Facebook's own account does: an in-place confirmation of consequences, then an actual deactivation — not an error dialog. The PM was told explicitly, before agreeing, that this reverses a documented, deliberate refusal (not a bug) and confirmed they want the rule itself changed, not just the dialog restyled.

Investigation (`Explore` agent, this session) found self-deactivation is currently blocked at three independent layers, not one:
1. **Route floor**: `/api/v1/admin/accounts/**`, the only route that can flip `active`, requires `super_admin` (`SecurityConfig.java:281-282`) — a plain `user`/`admin` cannot reach it at all, on themselves or anyone.
2. **Service guard**: `AccountService.setActive` 400s unconditionally on `accountId == actor.id()`.
3. **Frontend**: no API call is wired behind the Danger zone button at all.

Making self-deactivation genuinely usable by *any* signed-in account (not only a `super_admin` acting through the admin table) therefore requires a new self-service surface, not a one-line guard removal — mirroring the existing self-service pattern already used for `PATCH /api/v1/auth/me`, `/api/v1/auth/me/avatar`, and `/api/v1/auth/change-password` (all `USER`-floor, all act on the caller's own account, resolved from the session, never from a path parameter).

- **Related requirements**: FR-AUTH-003 (deactivation), FR-AUTH-007 (session termination)
- **Related risks**: the exact risk the original guard names — a genuine self-deactivation is not recoverable by the person who did it (recovery requires another `super_admin` to reactivate the row from Users & Roles); a lone `super_admin` self-deactivating would additionally lock everyone out with nobody left to undo it.
- **Decision pressure**: none — this is a scoped UX/product change, not a G2/G3 blocking item. Recorded as an ADR per `CLAUDE.md`'s "revisions to an existing [security-adjacent] decision" rule, not because it is large.

## 2. Decision (v1.1 — grace period)

Add a dedicated self-service deactivation path, separate from the admin-management endpoint, that **schedules** deactivation after a chosen grace period rather than flipping it immediately, and replace the Danger zone's explanatory modal with an in-place Facebook-style confirmation that includes choosing that period.

> The admin-management path (`AccountService.setActive`, reached only via `PATCH /api/v1/admin/accounts/{id}`, `super_admin`-only) is **left exactly as it is today**, self-refusal included, and still deactivates *immediately* when a `super_admin` acts on someone else — that endpoint's job is "one person acting on someone else's account," and it stays that. A new, separate self-service method and route exist specifically for "I am deactivating my own account," matching the existing `/api/v1/auth/me*` family rather than reusing the admin one. The grace period is a self-service-only concept.

### Key Choices

- **`account.deactivation_scheduled_for`** (V40, nullable `timestamptz`): non-null while a self-service deactivation is pending but has not taken effect. The account stays `isActive()` (its `deactivated_at` stays null — every existing `canSignIn()`/admin-listing/role check is unaffected) for the whole grace period. Kept as a second column rather than repurposing `deactivated_at` itself, so "scheduled but not yet in effect" and "actually deactivated" are never the same state to a caller reading the row.
- **New backend method**: `SessionService.deactivateSelf(CurrentUser caller, int graceDays)` (alongside its existing `renameSelf`/`removeOwnAvatar`/`changeOwnPassword` self-service siblings). It:
  - Validates `graceDays` against a fixed preset (`SessionService.DEACTIVATION_GRACE_PERIOD_DAYS_OPTIONS` = 3/7/14/30) — a number field was considered and rejected; presets keep the confirm panel simple and the backend's validation a single set-membership check rather than a range plus reasoning about what an extreme value like "36500 days" should mean.
  - Refuses only when the caller is the **last active `super_admin`** (`AccountRepository.isLastActiveSuperAdmin`) — unchanged from v1.0, the one guard that is a real lockout risk, not a misclick guard.
  - Otherwise stamps `deactivation_scheduled_for = now + graceDays`, revokes **every** session for the account immediately (`SessionService.revokeAllFor`, all devices — matching `setActive`'s existing behavior, and Facebook's own "signed out everywhere"), and writes an `ACCOUNT_DEACTIVATE_SCHEDULE` audit row (`actor == subject`, `"selfService": true`, `graceDays`, `scheduledFor`) — distinct from `ACCOUNT_DEACTIVATE`, which is now only written once `deactivated_at` is actually set.
  - Sessions are revoked **at scheduling time, not at the end of the grace period.** This is what makes "sign back in to cancel" a real re-authentication rather than a stale cookie still working: there is nothing left to resume, so getting back in requires actually proving identity again (Google or password, whichever the account uses) — which is what "please input email and password again" (the PM's own phrasing) already means for this system, without adding a second credential prompt on top of normal sign-in.
- **Cancellation on sign-in**: `SessionService.issue` — the one private method every sign-in path already funnels through (Google, password, password+TOTP) — now calls `cancelScheduledDeactivationOnSignIn` after issuing the session. If `deactivation_scheduled_for` is set, it is cleared (`AccountRepository.cancelScheduledDeactivation`) and an `ACCOUNT_DEACTIVATE_CANCEL` audit row is written. No new "confirm cancellation" step or second credential prompt was added — successfully signing back in at all, during the window, *is* the cancellation, because getting that session already required proving identity (see above). `MeResponse.deactivationCancelled` (true only on that response) lets the frontend tell the caller their scheduled deactivation was just called off.
- **Finalization via a sweep, not a request-time check**: `ScheduledDeactivationSweeper` (`@Scheduled`, every 15 minutes) calls `SessionService.finalizeDueScheduledDeactivations`, which finds every account whose `deactivation_scheduled_for` has passed (`AccountRepository.findDueForScheduledDeactivation`) and, one account per transaction, sets `deactivated_at`, clears the schedule, revokes sessions again defensively, and writes the real `ACCOUNT_DEACTIVATE` audit row (`"afterGracePeriod": true`). A sweep rather than lazily checking on next sign-in: an account nobody signs into again should still actually deactivate, not stay perpetually "scheduled."
- **New route**: `POST /api/v1/auth/me/deactivate`, `USER` floor (`SecurityConfig`, alongside the other `/api/v1/auth/me*` self-service matchers), now taking `{"graceDays": <preset>}` and returning `{"scheduledFor": <instant>}` instead of 204 — reachable by any signed-in account, not only `super_admin`, for the same reason as v1.0.
- **Frontend**: the confirm panel (still in-place, still no popup) adds a preset picker (3/7/14/30 days, 7 default) and states the grace period explicitly — signed out on every device immediately, active for N more days unless the caller signs back in first, deactivated (super-admin-only reactivation, unchanged) once N days pass with no sign-in, content/audit history preserved either way. Confirming calls the endpoint with the chosen `graceDays`, then reuses `useSession().signOut()` for client-side cleanup as in v1.0.
- **The last-active-super-admin and out-of-range-`graceDays` refusals surface in place**, on the same panel, as plain text — unchanged reasoning from v1.0.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | New self-service endpoint/method, admin path untouched (above) | Minimal blast radius — the well-tested admin endpoint and its `DeactivateModal.isSelf` short-circuit are unchanged; self-service gets its own audit semantics (`selfService: true`) | Two code paths now set `deactivated_at` instead of one | **Adopted** |
| B | Remove the self-refusal from `AccountService.setActive` directly, widen its route floor to `USER` for self-targeting only | Single code path | `/api/v1/admin/accounts/**`'s floor is a blanket `super_admin` rule (`SecurityConfig.java:281-282`) stated as flat PII/authority boundary — carving a path-parameter-dependent exception into it (401 for other IDs, allowed for your own) is exactly the kind of per-route special case ADR-011's default-deny design tries to avoid, and conflates "manage anyone" with "manage myself" in one controller | Not adopted |
| C | Full Facebook parity: re-enable on next Google sign-in, no admin action needed | Closest match to the literal reference | New state machine (a deactivated-but-reclaimable row vs. one that needs an admin), touches the sign-in path's `Account::isActive` filter (`SessionService.java:411`) and the Users & Roles reactivate UI's assumptions — materially larger and its own design decision, not requested | Not adopted (see §4.3 follow-up) |

## 4. Consequences

### 4.1 Positive Impacts
- Matches the PM's requested UX: no more "can't do this" error dialog, and — per the v1.1 revision — a mistaken or reconsidered deactivation is recoverable by the caller themselves for the whole grace period, by simply signing back in, without needing a `super_admin`.
- Keeps the admin-management endpoint, its tests, its `super_admin`-only floor, and its *immediate* deactivation behavior completely unchanged — no regression risk there; the grace period is self-service-only.
- Audit trail keeps every phase distinguishable — `ACCOUNT_DEACTIVATE_SCHEDULE`, `ACCOUNT_DEACTIVATE_CANCEL`, and the final `ACCOUNT_DEACTIVATE` (`selfService`/`afterGracePeriod` detail flags) — so `audit_log` answers "was this scheduled, cancelled, or did it actually happen" without inference.
- The one real lockout risk the original guard's comment named (a lone `super_admin` self-deactivating) is still caught at scheduling time — by the same `isLastActiveSuperAdmin` check `setActive` already used.

### 4.2 Negative Impacts / Costs to Accept
- Once the grace period actually elapses, deactivation is still **not reversible by the person who did it** — only a `super_admin` can reactivate the row (Users & Roles → Reactivate, unchanged). This is disclosed in the confirmation panel itself. The grace period narrows, but does not remove, the gap versus literal Facebook (where signing back in *always* reactivates, with no window) — closing it fully is Alternative C, still not adopted (§4.3).
- A new scheduled job (`ScheduledDeactivationSweeper`, 15-minute poll) exists that did not before — one more background process whose failure mode (a stuck deactivation, up to ~15 minutes late) has to be understood by whoever runs this in production. Judged acceptable: it logs and retries rather than throwing, the same pattern `SessionMaintenance` already uses.
- Three service methods (`AccountService.setActive`, `SessionService.deactivateSelf`, `SessionService.finalizeOneScheduledDeactivation`) now independently touch `deactivated_at`/session revocation/audit — a future change to one has to remember the others exist. Same tradeoff v1.0 already accepted for two methods, now three.
- `deactivateSelf`'s signature and `POST /api/v1/auth/me/deactivate`'s request/response shape both changed from v1.0 (`(CurrentUser)` → `(CurrentUser, int)`; `204` → `200` with `{scheduledFor}`) — since this branch had not merged yet, there is no deployed v1.0 behavior to migrate away from, but it does mean the v1.0 code this same session wrote earlier today was superseded within the day, not shipped and then revised.

### 4.3 Follow-up Work
- [ ] PM to confirm/record this ADR's approval (`CONST-PROC-01`) before merge, since it reverses a previously deliberate refusal and, as of v1.1, adds a new scheduled job and schema column.
- [ ] If literal reactivate-by-signing-in-again parity (no grace-period window, reactivable indefinitely) is wanted later, that is still a new ADR (Alternative C) — not silently folded into this one.
- [ ] Confirm whether the admin-side `DeactivateModal.tsx`'s `isSelf` short-circuit (Users & Roles table) should ever be revisited now that self-service deactivation exists through a different route — left unchanged here deliberately; flagging so it isn't assumed forgotten.
- [ ] Consider whether the Danger zone should show a persistent "deactivation scheduled for <date>, cancel by signing back in" state somewhere reachable without needing to reopen the confirm panel — not added in v1.1 because the only way to view it (being signed in) already cancels it, the same tension Facebook's own "log in to reactivate" has; flagged rather than silently decided.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| Scheduling deactivation does not touch `deactivated_at`, only `deactivation_scheduled_for`, and revokes every session immediately | Integration test: `POST /api/v1/auth/me/deactivate`, assert `isActive()` stays true, `deactivationScheduledFor` is set, and a subsequent request with the old cookie is unauthenticated | Per PR touching this endpoint | 100% |
| The last active `super_admin` cannot schedule their own deactivation | Integration test: sole active `super_admin` calls the endpoint, asserts `409` with the promote-someone-else message, and that neither `deactivated_at` nor `deactivation_scheduled_for` changed | Per PR | Always refused |
| An out-of-range `graceDays` is refused | Unit/integration test: a value outside {3,7,14,30} asserts `400` | Per PR | Always refused |
| Signing back in during the grace period cancels the schedule | Integration test: schedule, then sign in again, assert `deactivation_scheduled_for` is null and the account is still active | Per PR | 100% |
| The sweep finalizes a due schedule and leaves a not-yet-due one alone | Integration test: one account scheduled in the past, one in the future; assert only the past one ends up with `deactivated_at` set | Per PR touching the sweeper | 100% |
| `PATCH /api/v1/admin/accounts/{id}` (admin path) still refuses self-targeting and still deactivates immediately, unchanged | Existing behavior — regression test kept | Per PR | Unchanged from pre-ADR-042 behavior |
| Audit rows distinguish schedule / cancel / final-deactivate | Test: assert the three distinct `AuditAction` constants each appear only where expected, with `selfService`/`afterGracePeriod` detail flags | Per PR | 100% |

## 6. References

- Related code: `backend/src/main/java/com/coc/docs/account/AccountService.java:261-300`, `backend/src/main/java/com/coc/docs/account/AccountRepository.java` (`scheduleDeactivation`/`cancelScheduledDeactivation`/`findDueForScheduledDeactivation`/`finalizeScheduledDeactivation`), `backend/src/main/java/com/coc/docs/auth/SessionService.java`, `backend/src/main/java/com/coc/docs/auth/ScheduledDeactivationSweeper.java`, `backend/src/main/java/com/coc/docs/web/AuthController.java`, `backend/src/main/java/com/coc/docs/config/SecurityConfig.java:140-180`, `backend/src/main/resources/db/migration/V40__self_deactivation_grace_period.sql`, `frontend/components/settings/DangerZoneCard.tsx`, `frontend/components/users-roles/DeactivateModal.tsx`
- Related requirements: FR-AUTH-003, FR-AUTH-007
- Related ADR: ADR-011 (security model), ADR-023 (revision of ADR-011 — account deletion; §4 of that ADR is the fullest existing discussion of the self-deactivation guard's rationale)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-22 | 1.0 | Initial draft, written alongside the code change it authorizes, per direct PM request in-session to allow self-service deactivation instead of the existing unconditional refusal | backend-developer (AI-drafted) |
| 2026-09-22 | 1.1 | Revised the same day, before v1.0 merged: replaced immediate self-deactivation with a chosen grace period (3/7/14/30 days), cancellable by signing back in before it elapses (which requires actually re-authenticating, since every session was revoked at scheduling time) and otherwise finalized by a new scheduled sweep. Per direct PM request in-session. §2 and §4–§6 rewritten; §1 and §3 left as unchanged history | backend-developer (AI-drafted) |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-22 | PM | AI-drafted per in-session request; PM sign-off on the ADR itself (as opposed to the underlying feature ask) not yet separately recorded — now covers v1.1's grace-period design, not v1.0's immediate deactivation | **PENDING** |
