# ADR-016: Many Roles per Account, Many Permissions per Role

> **Status**: PROPOSED
> **Date**: 2026-09-11
> **Author**: `backend-developer` (implemented per explicit PM direction)
> **Approver**: PM (pending)
> **Revises**: the authorization pillar of [ADR-011](ADR-011-security-model.md). Does not touch its authentication pillar, which [ADR-013](ADR-013-revision-of-008-identity-broker.md) already revised.
> **Affects**: `FR-AUTH-005` (role model), `FR-AUTH-006` (per-page minimum role), `FR-AUTH-008` (who may grant roles), `UC-004`

---

## 1. Context

Authorization today is a single ordered ladder — `guest < user < admin < super_admin` — with **one role per account**, stored as `account.role`, and every decision in the system expressed as "is the caller at least X". That is 24 call sites on `isAtLeast`, six `hasRole` rules in the filter chain, and `page.min_role`, which stores a required rank as data (`FR-AUTH-006`).

The ladder has served well and is not the problem. What it cannot express is *which capabilities a role carries*. "Is at least admin" is an assumption about which roles happen to be able to publish today, restated at every call site; the day publishing and account-approval need to separate, every one of those sites is a candidate for editing, and the ones nobody edits fail open or closed silently.

**PM direction, 2026-09-11**: an account should be able to hold several roles, and a role should carry a set of permissions.

## 2. Decision

> An account holds a **set** of roles (`account_role`). A role carries a **set** of permissions (`role_permission`). The ordered ladder survives as `role.rank`, and an account's **effective rank is the highest rank it holds**.

### Key Choices

- **The ladder is kept, not replaced.** `page.min_role` states a required rank, not a required role, and that is the right model for content sensitivity — a page is more or less restricted, which is genuinely ordered. Permissions answer a different question (may this caller perform this action), and both are granted as authorities. Discarding the ladder would have meant rewriting every authorization decision in one commit.
- **Highest rank wins, deliberately.** With a set, "is at least admin" must pick one role to compare. Highest means that granting someone an additional role can never reduce their access — any other rule makes a grant a potentially destructive act, which is not how anyone expects a grant to behave.
- **`account.role` is dropped, not deprecated.** Two places answering the same question means the one nobody updates is the one the next person reads.
- **Roles stay the four `app_role` enum values; permissions are the extension point.** Adding a role means an enum value and a rank — a schema change that should feel like one, because `page.min_role` must stay comparable to it. Adding a permission is a row.
- **Permissions are resolved per request and never enter a token.** Unchanged from ADR-011, and more important now: the reason sessions here are opaque rather than JWTs is that a revoked capability must take effect on the caller's next request. Keycloak (ADR-013) still answers only *who*, never *what may they do* — its realm roles and groups are deliberately unused.
- **The `super_admin` floor moves and widens.** The V1 guard read `account.role`. It is recreated against `account_role` and armed on **both** tables, because revoking the last super admin's role and deactivating the last super admin's account are two different routes to locking everyone out, and a guard catching one is a guard nobody can rely on.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| 1 | Permissions only; keep one role per account | Much smaller change; no ambiguity about which role to compare | Does not deliver what was asked; a person who is an editor for one purpose and a reviewer for another still needs two accounts | No |
| 2 | Replace the ladder entirely with permissions | Conceptually clean; one mechanism | `page.min_role` has no meaning without a rank, and content sensitivity genuinely is ordered; forces rewriting all 24 authorization sites at once | No |
| 3 | Roles as free-text rows, user-definable at runtime | Maximum flexibility; no migration to add a role | A role with no rank cannot be compared to `page.min_role`; runtime-editable authorization needs an admin UI, grant auditing, and a guard against editing away your own access — none of which exists yet | No |
| 4 | Scoped roles (admin of section X, reader elsewhere) | Answers a real need that will likely arrive | A third axis, considerably larger, and not what was asked for; the schema here does not preclude it | Not now |
| 5 | **Set of roles + permissions per role, ladder kept as rank** | Delivers the ask; every existing check keeps working; permissions become the extension point | Two mechanisms coexist, and a reader must know which question each answers | **Yes** |

## 4. Consequences

### 4.1 Positive Impacts

- Capability checks can say what they mean (`can(CONTENT_PUBLISH)`) instead of proxying through rank.
- What a role actually grants is a table anyone can read, rather than a property distributed across 24 call sites.
- Granting roles is now recorded — `account_role.granted_by` and `granted_at` — which the single column never captured.
- The lockout guard now covers role revocation, which it previously did not.

### 4.2 Negative Impacts / Costs to Accept

- **Two mechanisms.** A reader must know that rank gates content sensitivity and permissions gate actions. Mitigated by comments at both sites, not eliminated.
- **One extra query per authenticated request** to resolve permissions. Negligible at this scale, but it is on the hot path.
- **Three copies of the catalogue** — the migration, the `Permission` enum, and the test mirror. `PermissionCatalogTest` parses the migration and fails the build when they disagree; without that test this would be the weakest part of the change, because both drift directions fail silently in the direction that looks like the system working.
- **An account can hold no roles at all.** The schema permits it, `Account.role()` reports `guest`, and `AccountService.setRoles` refuses to create the state deliberately.

### 4.3 Follow-up Work

| # | Item | Owner |
|---|---|---|
| 1 | Amend `REQUIREMENTS-SPEC.md` — `FR-AUTH-005` describes one role per account by name | `docs-writer` + PM |
| 2 | Admin UI for granting multiple roles; the PATCH endpoint still speaks a single role | `frontend-developer` |
| 3 | Move endpoint rules from `hasRole` to `hasAuthority(permission)` where the check is a capability rather than a tier | `backend-developer` |
| 4 | Decide whether scoped (per-section) roles are coming; if so, before `account_role` has production data | `architect` + PM |

## 5. Verification / Monitoring

- `PermissionCatalogTest` — the enum, the migration seed and the test mirror agree; and each role still grants everything the rank below it does, which is what `page.min_role` assumes.
- `AppRoleTest` — the ladder stays in ascending order.
- `SecurityRulesTest` — default-deny and the role floors are unchanged by this work.
- **Not yet verified: the migration itself has not been applied to any database.** Testcontainers integration tests skip without Docker, which was unavailable on the machine this was written on. `V4` must be applied against a scratch database before it reaches the shared one — it drops a column from a populated `account` table.

## 6. References

- `backend/src/main/resources/db/migration/V4__roles_and_permissions.sql`
- `backend/src/main/java/com/coc/docs/account/{Permission,Account,AccountRepository,AccountService}.java`
- `backend/src/main/java/com/coc/docs/auth/{CurrentUser,SessionAuthenticationFilter}.java`
- ADR-011 (security model), ADR-013 (identity broker), ADR-014 (password registration)

---

## Change History

| Date | Change |
|---|---|
| 2026-09-11 | Written. Status PROPOSED — implemented ahead of approval per explicit PM direction to proceed. |
