# ADR-017: Signing In Is Not Being Let In

> **Status**: PROPOSED
> **Date**: 2026-09-14
> **Author**: `backend-developer` (implemented per PM direction, phase 2)
> **Approver**: PM (pending)
> **Revises**: [ADR-014](ADR-014-revision-of-008-password-registration.md) — restores the approval gate that ADR-014 specified and that product direction removed on 2026-09-11. Extends [ADR-011](ADR-011-security-model.md)'s authentication pillar; the authorization pillar is [ADR-016](ADR-016-roles-and-permissions.md)'s.
> **Affects**: `FR-AUTH-001` (Google sign-in), `FR-AUTH-002`/`FR-AUTH-003` (registration), `UC-004`

---

## 1. Context

Anyone who signed in with Google got a working account. The first sign-in created a row at `active`/`user` and issued a session in the same request — the code said so plainly: *"nobody needs to approve what an administrator's identity provider already vouched for."*

That sentence conflates two claims. Google vouches that the address is real and that the person holds it. It does not vouch that they belong here. For an internal documentation platform, the second is the one that matters, and nothing was checking it: any Google account in the world could sign in and read internal content at role `user`.

Password self-registration had the same shape. ADR-014 originally put a `super_admin` approval gate in front of it, and product direction removed that on 2026-09-11, making registration produce an active account immediately.

**The useful surprise:** almost the whole approval mechanism already existed and had never run. `account_status` (`pending`/`active`/`rejected`), the `account_pending_idx` index, `canSignIn()`, `listPending()`, `approve()`, `reject()`, the `GET /pending` and `POST /{id}/approve|reject` endpoints, the `ACCOUNT_APPROVE` permission, the audit actions, and even the message *"this registration is awaiting approval"* were all in place. Because both write paths hardcoded `'active'`, the queue was permanently empty and the approve endpoints had never had a row to act on.

## 2. Decision

> A first arrival is an **application**, not an account. Both sign-up doors — first Google sign-in and password registration — create a row at status `pending` and role `guest`, which grants nothing and opens nothing. A `super_admin` decides, and chooses the role in the same decision.

### Key Choices

- **Both doors, or neither.** Gating Google while leaving password registration open would put a door beside the gate: anyone could self-issue a working account by choosing a password instead. This reverses the 2026-09-11 direction, which is the main thing this ADR exists to record.
- **`guest`, not "no role".** An applicant holds a role that grants nothing, rather than holding none. `Account.role()` reports `guest` either way, but a row with no `account_role` entry is indistinguishable from a broken one, and `AccountService.setRoles` refuses to create that state.
- **Approve carries the role.** "Should this person be in, and as what" is one thought. Approve-then-promote is two screens, two audit entries, and a window in which someone is inside at a role nobody chose. Approving at `guest` is refused: it would admit nobody, and the caller almost certainly meant to reject.
- **A super admin's invite skips the queue.** `AccountService.create` still produces an `active` account. That caller *is* the approval; queuing it would ask them to approve their own decision.
- **The applicant is told — on the Google path only.** They have just proved they own that address, so naming their own status discloses nothing to anyone else, and a generic error after a deliberate action reads as the product being broken. The password path stays uniformly opaque: there the caller has proved nothing, and a distinguishable answer would turn sign-in into a way to discover who has applied.
- **Bootstrap: the first person through an empty installation is an active `super_admin`.** Without it, every applicant is pending and nobody can approve anyone — an empty database is a locked door. The condition is `account` being completely empty, not "no super admin exists": the weaker test would hand the role to whoever signed in next any time the last administrator was deactivated, which is exactly when it must not.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| 1 | Leave it open; rely on the role ladder | Nothing to build; a stranger only reaches `user` | `user` reads internal documentation. "Anyone with a Google account may read it" is a publishing decision nobody made | No |
| 2 | Domain allow-list — `@company.com` is admitted automatically | Removes the queue for the common case | Assumes every legitimate person is on one domain, which nobody has confirmed. Additive later, and cheap then | Not now |
| 3 | Gate Google, leave password registration open | Smaller change; keeps the 2026-09-11 direction | The gate would have an open door beside it | No |
| 4 | Remove password registration entirely | Smallest surface; one way in | Discards ADR-014's work and anyone who cannot use Google | No |
| 5 | **Both doors create applications; approve carries the role** | One gate, one decision, one audit entry; most of it already built | Somebody must watch the queue, and the first sign-in needs a bootstrap | **Yes** |

## 4. Consequences

### 4.1 Positive Impacts

- Reading internal content now requires a decision by a named person, recorded in the audit trail.
- The queue, the approve/reject endpoints and the `ACCOUNT_APPROVE` permission become reachable for the first time since ADR-014 wrote them.
- Who approved whom, at what role, is one audit entry instead of two.

### 4.2 Negative Impacts / Costs to Accept

- **Somebody has to watch the queue.** A badge in the console is the whole notification mechanism; there is no email, queue or notification code anywhere in the backend, and adding one means a mail dependency, a sender domain and a deliverability problem. Chosen deliberately — it only reaches a super admin who signs in.
- **A new person cannot self-serve.** Their first sign-in ends at a waiting message.
- **The bootstrap grants `super_admin` on a first sign-in.** Narrow, and true only once per installation, but it is a real privilege path and deserves the scrutiny of anyone reviewing this.
- **Existing accounts are unaffected** — everyone already `active` stays so. The gate applies to arrivals from here on.

### 4.3 Follow-up Work

| # | Item | Owner |
|---|---|---|
| 1 | Amend `REQUIREMENTS-SPEC.md` — `FR-AUTH-001`/`FR-AUTH-003` describe provisioning on first sign-in | `docs-writer` + PM |
| 2 | Decide whether a domain allow-list should auto-approve the common case (alternative 2) | PM |
| 3 | Notification beyond the badge, if the queue is ever missed in practice | PM |
| 4 | `docs/api/openapi.yaml` — `/register` now answers 202, and approve takes a role | `docs-writer` |

## 5. Verification / Monitoring

- `ApprovalGateTest` — applicant is pending at `guest` and cannot sign in; both doors queue; approve carries the role and replaces `guest`; approving at `guest` is refused; rejection keeps the row; a decision can only be made once; an invited account skips the queue; `isEmpty` stays narrow.
- `AuthControllerTest$Register` — 202 and the waiting message, rather than 200 and a promise.
- Verified end to end against the running backend: registering returns `PENDING`, and signing in with that account is refused.
- **Not yet verified:** the Google door end to end, which needs a real Google sign-in; and the bootstrap, which needs an empty installation. Both are covered by tests that require Docker and therefore only run in CI.

## 6. References

- `backend/src/main/java/com/coc/docs/account/{AccountRepository,AccountService}.java`
- `backend/src/main/java/com/coc/docs/auth/SessionService.java` — the gate and the bootstrap
- `frontend/components/users-roles/PendingTab.tsx` — the queue
- ADR-011 (security model), ADR-014 (password registration), ADR-016 (roles and permissions)

---

## Change History

| Date | Change |
|---|---|
| 2026-09-14 | Written. Status PROPOSED — implemented ahead of approval on explicit direction; the three open questions it settles were answered by the PM before building. |
