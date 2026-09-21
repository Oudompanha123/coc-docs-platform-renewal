# ADR-040: Extend the Role Ladder with Reviewer and Lead

> **Renumbered from ADR-039 on merge, and it supersedes the ADR-039 that kept
> the number.** Two decisions were written for the same PM request on branches
> that could not see each other. [ADR-039](ADR-039-revision-of-038-ax-role-tech-lead-and-reviewer.md)
> extends ADR-038's capability mechanism with Tech Lead and Reviewer; this one
> retires that mechanism outright and makes Developer, Reviewer and Lead real
> `app_role` values (V30-V32). They cannot both stand -- and this is the one
> the code implements, because its migrations drop `capability` and
> `account_capability`. **Both are PROPOSED; which survives is the PM's call
> (`CONST-PROC-01`), not a merge decision.** The code and migrations cite this
> as "ADR-039" throughout, left as-is for the reason ADR-038 gives about its
> own renumbering: an applied migration is immutable, and rewriting the
> citation across twenty-eight files risks mislabelling the other ADR-039.

> **Status**: PROPOSED
> **Date**: 2026-09-21
> **Author**: AI (implemented per PM/developer instruction in-session, same class of decision as ADR-037/ADR-038's own history) — **formal PM sign-off recommended, not yet recorded** (`CONST-PROC-01`).
> **Related ADR**: Extends [ADR-016](ADR-016-roles-and-permissions.md) (the `account_role`/`role`/`role_permission` model). Deliberately does **not** revise [ADR-037](ADR-038-capability-grants-ax-renewal.md) (capability grants) — see Decision §1.

---

## 1. Context

The Users & Roles admin screen originally offered three roles: User, Admin, Super Admin. The PM asked for three more — Developer, Lead, Reviewer — to be selectable there. Investigation found:

- **"Developer" already exists**, but not as a role: ADR-037/ADR-038 deliberately kept it *out* of the `app_role` ladder as a rank-independent **capability** (`capability`/`account_capability`, V24), specifically because `app_role` is also `page.min_role`'s column type, and giving "developer" any rank would silently change content-visibility rules platform-wide. That reasoning still holds and is not revisited here — see Decision §1.
- **Lead and Reviewer have no existing mechanism.** Unlike Developer, nothing in this codebase already models "leads a team's content decisions" or "reviews content before publish." Making them real, ordered roles is new scope, not a rename of something that exists.

An earlier iteration shipped Lead/Reviewer as frontend-only, unenforced placeholders (a `RoleMultiSelect` checkbox tagged "Not enabled yet," collapsing to the highest *real* role on save) specifically to avoid touching the `app_role` enum without a considered rank decision. This ADR is that decision.

## 2. Decision

### 2.1 Developer stays a capability — not duplicated as a role

Per PM decision, "Developer" is **not** added to the ladder a second time. It continues to work exactly as ADR-037/038 built it (grant/revoke in the account's Capabilities section, `capability.developer` authority, independent of rank). Only Lead and Reviewer become real roles.

### 2.2 Ladder position: strictly between User and Admin

```
guest < user < reviewer < lead < admin < super_admin
```

Rank order between the two new roles (Lead outranks Reviewer) is a judgment call, not a requirement handed down — a team lead is read as more senior than an individual reviewer. It is a one-line change (`AppRole.java`'s declaration order plus `V29`'s two rank values) if the PM prefers the reverse.

This is a real `AppRole` Java enum insertion and a real `app_role` Postgres enum extension — not a cosmetic label. Every `isAtLeast` check, `page.min_role` comparison, and `SecurityConfig` `hasRole` rule now has two more rungs to reason about, all strictly between `user` and `admin`.

### 2.3 What Reviewer and Lead grant today: content.read, same as User — nothing more

Every `/api/v1/admin/**` route still floors at `hasRole(ADMIN)` (`SecurityConfig`, unchanged). That is a route-level gate, evaluated before any `role_permission` grant is even consulted — so granting Reviewer or Lead `content.publish` in `role_permission` would have been dead weight, refused at the route regardless. Rather than invent new authorization surface (a "reviewer can flag but not publish" endpoint, a "lead can edit drafts" carve-out) that nobody has specified requirements for, both roles are seeded with exactly `content.read` — identical to `user`.

**Net effect today**: Reviewer and Lead are real, assignable, independently-ranked roles — they show up correctly in the `/api/v1/admin/roles` catalogue, `page.min_role` can be set to either of them, and an account can hold either alongside other roles (ADR-016's existing multi-role support) — but neither unlocks an action a plain `user` could not already do. What (if anything) they should unlock beyond that is left for a future decision once a concrete feature needs it — the same deferral ADR-037/038 already made once for capability-to-permission mapping ("no capability-to-permission mapping table yet... deferred until a second capability actually needs one").

### 2.4 Schema: two migrations, not one

`ALTER TYPE app_role ADD VALUE` cannot be used in the same transaction that adds it — a well-documented Postgres restriction. Flyway runs each versioned migration in its own transaction, so the enum extension (`V28__add_lead_reviewer_app_role_values.sql`) and the row seeding that uses the new values (`V29__seed_lead_reviewer_roles.sql`) are necessarily separate files, applied in order.

`role.rank` (V4) is `unique`, and it drives the admin roles catalogue's display order — it must stay consistent with the real authorization ladder (`AppRole`'s Java declaration order), not just avoid collisions. `V29` therefore **renumbers** `admin`/`super_admin` (2→4, 3→5) to open ranks 2 and 3 for `reviewer`/`lead`, rather than appending the new roles at the end of the rank sequence (which would have shown them, misleadingly, as outranking Super Admin in the catalogue while the real ladder ranked them below Admin).

## 3. Consequences

### Positive

- Users & Roles can now assign Reviewer and Lead as real, rank-aware roles, matching what was asked.
- No duplication: "Developer" stays a single concept (capability), not two things with the same name doing different things.
- The frontend's earlier "Not enabled yet" placeholder mechanism (`RoleMultiSelect`'s unenforced-role tagging, `highestEnforcedRole`'s collapsing) is now dead code for these two roles and has been removed rather than left to rot; `AccountDetailModal` sends the account's whole checked role set directly (ADR-016), no longer collapsing to one.

### Negative — stated plainly

- Reviewer and Lead currently grant nothing beyond `user`. Anyone assigned one of these roles today gets a label and a rank, not new capability — that may read as "the feature does nothing" until a concrete permission or route is designed for either. This is a deliberate, scoped-down first cut, not an oversight.
- Two new rungs added to a security-critical enum is exactly the kind of change ADR-016 itself calls out as "a schema change that should feel like one" — reviewed here, but worth the PM's explicit sign-off given `CONST-PROC-01`.

### Required follow-up

- [ ] PM sign-off on this ADR and on the Lead > Reviewer rank-order call in §2.2.
- [ ] `docs/requirements/REQUIREMENTS-SPEC.md` has no `FR-AUTH-*` entry describing what Reviewer/Lead are *for* — needed once §2.3's "nothing beyond content.read" changes.
- [ ] `docs/design/threat-model.md` is unaffected today (no new grant beyond `user`), but should be revisited alongside whatever permission work follows.
- [ ] Integration coverage (`backend/src/test/java/com/coc/docs/account/ReviewerLeadRoleIntegrationTest.java`, `AccountMultiRoleIntegrationTest.java`) requires Docker to actually run (Testcontainers) — not executed in this session's sandbox (no Docker present); confirmed only to compile and skip cleanly. Run `mvn -f backend/pom.xml test -Dtest=ReviewerLeadRoleIntegrationTest` on a machine with Docker before treating this as verified end-to-end.

## 4. Alternatives Considered

| # | Alternative | Rejected because |
|---|---|---|
| A | Add Developer as a role too, retiring the capability | Explicitly declined by the PM — the capability already works and duplicating it under the same name serves no one. |
| B | Append Reviewer/Lead at the top of the rank sequence (above Super Admin) | Wrong on its face — neither should outrank Super Admin, and it would have been a rank column value with no relationship to the real `AppRole` ordinal order. |
| C | Grant Reviewer/Lead real content permissions now (read/validate/publish) | Dead weight without a corresponding `SecurityConfig` route carve-out — every write path floors at `hasRole(ADMIN)` regardless of `role_permission`, so the grant would do nothing observable and would misstate what the roles currently do. |
| D (adopted) | Real ladder insertion, `content.read` only, explicit deferral of anything more | Matches what was asked (real, selectable, ranked roles) without inventing authorization surface nobody specified. |

## References

- `AppRole.java`, `V28__add_lead_reviewer_app_role_values.sql`, `V29__seed_lead_reviewer_roles.sql`
- ADR-016 (roles and permissions model), ADR-037/038 (capability grants — Developer, why it stays separate)
- `RoleRepository.java` (the `/api/v1/admin/roles` catalogue this feeds), `SecurityConfig.java` (`/api/v1/admin/**` floor, unchanged)
- Frontend: `frontend/lib/mock/users-roles.ts`, `frontend/components/users-roles/RoleMultiSelect.tsx`, `AccountDetailModal.tsx`

---

## Change History

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-09-21 | 1.0 | Initial draft, on direct PM/developer instruction in-session | AI |

---

**Approval**

| Date | Approver | Comments | Status |
|---|---|---|---|
| | | | PENDING |
