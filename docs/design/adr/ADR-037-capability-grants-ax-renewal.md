# ADR-037: Capability Grants — A Second, Rank-Independent Authorization Axis (AX Renewal "Developer")

> **Status**: PROPOSED
> **Date**: 2026-09-18
> **Author**: `backend-developer` / `frontend-developer` (implemented per PM direction to integrate the AX Renewal prototype as a native platform feature)
> **Approver**: PM (pending)
> **Related ADR**: Revises/complements [ADR-016](ADR-016-roles-and-permissions.md) (many roles, many permissions). Does not touch ADR-011 (security model) or ADR-013 (identity broker).

---

## 1. Context

The PM asked for AX Renewal — a legacy-code-migration planning prototype — to be integrated as a native feature, with one new requirement on the role system: an admin should be able to grant a user a **"Developer"** capability, layered on top of whatever `app_role` (Super Admin / Admin / User) that account already holds, without replacing it. "Admin + Developer" should behave differently from plain "Admin".

ADR-016 already gives this system a set-of-roles model (`account_role`), but its own text is explicit that the four `app_role` values and their rank are the wrong extension point for this: *"Roles stay the four `app_role` enum values; permissions are the extension point... Adding a role means an enum value and a rank — a schema change that should feel like one."* That rank is not cosmetic — `app_role` is a **native Postgres enum type**, and it is also the column type of `page.min_role` and `nav_product.min_role`. Inserting "developer" into that enum, at any ordinal position, would give it an implicit trust-tier position relative to *every* content-visibility rule in the system, not just AX Renewal — a blast radius the PM's request never asked for and ADR-016's own reasoning already argues against.

ADR-016's own follow-up table names exactly this gap as unresolved: *"#3 Move endpoint rules from `hasRole` to `hasAuthority(permission)` where the check is a capability rather than a tier"* and *"#4 Decide whether scoped (per-section) roles are coming."* This ADR is the first real instance of that decision.

## 2. Decision

> An account may hold **capabilities** (`account_capability`) — direct, rank-independent grants — in addition to its `app_role` set. A capability answers "was this specific thing granted to this account," never "how trusted is this account in general." The `app_role` ladder, `page.min_role`, and every existing rank comparison are completely untouched.

### Key Choices

- **A new table pair, not a new `app_role` value.** `capability` (a free-text key, not the `app_role` enum) and `account_capability` (account → capability, direct — no role in between) are structurally parallel to `permission`/`role_permission` but deliberately independent of them and of `account_role`. The first capability is `developer`.
- **Deliberately not named `capability_role`/`account_capability_role`.** Naming it like the role ladder would invite exactly the coupling this decision exists to avoid.
- **Resolved fresh per request, never cached in the session.** Same reasoning as `Permission` (ADR-011/016): a revoked capability must take effect on the very next request, which is why sessions here are opaque rather than JWTs.
- **A capability becomes a plain Spring Security authority** (`capability.developer`, no `ROLE_` prefix), granted alongside the existing rank-derived `ROLE_X` authorities and `Permission` authorities. `SecurityConfig` rules combine them with `hasAnyAuthority(ROLE_SUPER_ADMIN, capability.developer)` where a route should admit either.
- **AX Renewal's confirm/start-implementation floor is `Super Admin OR the developer capability` — deliberately not "Admin-or-above."** An Admin without the Developer capability may draft a plan but not sign off on or trigger its implementation. This is a real segregation-of-duties choice, not an oversight, and is called out explicitly for PM sign-off (§4.3).
- **No capability→permission mapping table yet.** With exactly one capability, `AxRenewalController`'s routes check `hasAnyAuthority(...)` directly. A mapping layer (mirroring `role_permission`) is deferred until a second capability actually needs one — building it now would be speculative.
- **AX Renewal itself is new, persisted, role-gated backend resources — not the prototype's in-memory browser state.** Phase 1 deliberately ships no live third-party AI call and no live external-database connection (see §4.2); both are structurally stubbed so a later phase can add them without reshaping the API.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Add `developer` as a 5th `app_role` enum value, ranked between `user` and `admin` | Reuses `account_role`/`AccountService.setRoles` as-is; no new tables | Requires `ALTER TYPE app_role ADD VALUE` on a type also used by `page.min_role`/`nav_product.min_role`; gives "Developer" an implicit content-trust position never asked for; conflates a capability tag with a sensitivity tier | No |
| B | Extend `Permission`/`role_permission` only; no direct account grant | Smallest schema change; fits ADR-016's "permissions are the extension point" literally | Permissions are granted through a *role*, and there is no existing role an admin could attach to one user without affecting everyone else holding that role; doesn't deliver "a capability on this specific account" | No |
| C | **New `capability`/`account_capability` tables, independent of the ladder and of `role_permission`** | Delivers exactly what was asked; zero risk to the existing ladder, `page.min_role`, or `isAtLeast`; reuses the same per-request-resolution pattern already proven for `Permission` | Introduces a third authorization mechanism alongside rank and permission — a reader must know which question each answers | **Yes** |

## 4. Consequences

### 4.1 Positive Impacts

- The existing Super Admin/Admin/User ladder, and everything that depends on its rank (`page.min_role`, `nav_product.min_role`, `isAtLeast`), is provably untouched — no migration alters `app_role`.
- A future second capability (or a dozen) costs a `capability` row and an enum value in `Capability.java`, not a schema-wide rank renegotiation.
- Granting/revoking a capability is auditable (`account.capability_grant`/`_revoke`) and takes effect on the holder's next request, with no forced sign-out — consistent with how `Permission` already behaves.
- AX Renewal's own plan-confirmation model closes a real gap the prototype had: editing a plan section after it was confirmed now silently clears that confirmation, so a stale sign-off can never survive a later edit.

### 4.2 Negative Impacts / Costs to Accept

- **A third authorization mechanism.** A reader must know that rank gates content sensitivity, permissions gate ordinary actions, and a capability gates a specific granted thing — three questions, not two.
- **AX Renewal's "Database" and "Output/Destination" sections are metadata only in Phase 1.** No live external database connection is opened (no credential is stored anywhere), and no code is generated when an implementation is "started" — it synchronously records that the plan was confirmed and says plainly that carrying it out is a manual or future-automated step. This is a deliberate divergence from the prototype, which fabricated specific before/after metrics for a demo; a production tool must not invent numbers it did not measure.
- **No live AI analysis.** `runAnalysis` is a small, disclosed keyword match against the attached manifest, not a real reading of source — the same honest "no model connected" fallback the prototype itself used when unconfigured, now the *only* path in Phase 1.

### 4.3 Follow-up Work

- [ ] PM confirms the confirm/build floor is intentionally `Super Admin OR Developer capability`, not `Admin-or-above OR Developer` (§2).
- [ ] PM confirms the Phase-1 scope limits are acceptable: no live database connection, no live AI call, no automatic code generation (§4.2).
- [ ] Amend `REQUIREMENTS-SPEC.md` with FR-IDs for the AX Renewal workflow and the capability mechanism (mirrors ADR-016 follow-up #1, never done for a REQ-less feature before this).
- [ ] Phase 2: a real server-side Anthropic client for `runAnalysis`, gated by `AxRenewalProperties.anthropicConfigured()` (already stubbed, unread).
- [ ] Phase 2: decide whether a capability→permission mapping table is needed once a second capability is proposed.
- [ ] Frontend: extend `nav-config.ts`/`RequireSession.tsx`/`AccountDetailModal.tsx` per this ADR's frontend counterpart (tracked in the implementation plan, not restated here).

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| The `app_role` ladder is unchanged | `AppRoleTest` (ascending order), `PermissionCatalogTest`-style check that `V23`/`V24` never touch `app_role` | Every build | Must pass |
| Default-deny holds for new routes | `SecurityRulesTest$AxRenewalPath` | Every build | Must pass |
| A capability revoke takes effect without sign-out | Manual/integration check: revoke `developer`, re-request as the same session, confirm the authority is gone | Before release | Must pass |
| Migration applies cleanly | Testcontainers integration suite (`mvn verify`, Docker required) — **not yet run in this environment; must run before merge** | Before merge | Must pass |

## 6. References

- `backend/src/main/resources/db/migration/V23__capabilities.sql`, `V24__ax_renewal.sql`
- `backend/src/main/java/com/coc/docs/capability/{Capability,CapabilityRepository,CapabilityService}.java`
- `backend/src/main/java/com/coc/docs/axrenewal/**`
- `backend/src/main/java/com/coc/docs/auth/{CurrentUser,SessionAuthenticationFilter,SessionService}.java`
- `backend/src/main/java/com/coc/docs/config/SecurityConfig.java`
- ADR-011 (security model), ADR-016 (many roles, many permissions)

---

## Change History

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-09-18 | 1.0 | Written. Status PROPOSED — implemented ahead of approval per PM direction to proceed with the AX Renewal integration, following the precedent ADR-016 itself set. | backend-developer / frontend-developer |

---

**Approval**
| Date | Approver | Comments | Status |
|---|---|---|---|
| | PM | | PENDING |
