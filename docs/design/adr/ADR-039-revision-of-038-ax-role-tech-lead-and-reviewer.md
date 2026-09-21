# ADR-039: Revision of ADR-038 — AX Role Extended to Tech Lead, Developer, Reviewer

> **Superseded in practice by [ADR-040](ADR-040-reviewer-lead-roles.md)**, written
> for the same PM request on a branch that could not see this one. ADR-040
> retires the capability mechanism this document extends, and it is the version
> the merged code implements. Both are PROPOSED; which stands is the PM's call
> (`CONST-PROC-01`).

> **Status**: PROPOSED
> **Date**: 2026-09-21
> **Author**: `backend-developer` / `frontend-developer` (implemented per PM direction to add "AX Role" choices to the account details screen)
> **Approver**: PM (pending)
> **Related ADR**: Revises [ADR-038](ADR-038-capability-grants-ax-renewal.md) (capability grants — filed in code/migrations as "ADR-037"; see that document's own renumbering note). Does not touch ADR-011, ADR-013, or ADR-016.

---

## 1. Context

The PM asked for the account details screen (Users & Roles → Account details) to offer an **"AX Role"** of **Tech Lead**, **Developer**, or **Reviewer** — for example, an account that is `super_admin` on the role ladder and also carries the `Developer` AX Role.

ADR-038 already built exactly the mechanism this needs: a `capability`/`account_capability` table pair, independent of the `app_role` ladder, holding one value (`developer`) that gates the AX Renewal feature. Its own follow-up table named the extension point explicitly: *"a future second capability... costs a `capability` row and an enum value in `Capability.java`, not a schema-wide rank renegotiation."* Separately, this platform's AX Renewal feature was integrated from a prototype (see the prototype's own `SUMMARY.md`) whose access model was described as *"role-based access control (lead / developer / reviewer)"* — three roles, flattened to the single `developer` capability during native integration because only one was asked for at the time. This ADR is that second-and-third capability being proposed, and is the natural continuation of both threads.

## 2. Decision

> The `capability` catalog gains two rows, `tech_lead` and `reviewer`, alongside the existing `developer`. All three are surfaced together in the account details screen under the label **"AX Role"** rather than the generic "Capabilities" heading ADR-038 used, since all three values that exist today are specifically AX Renewal role tags. The underlying mechanism is unchanged: a capability is still a direct, rank-independent grant on an account, multiple may be held at once, and it is still resolved fresh per request (`CapabilityRepository.findForAccount`) exactly as ADR-038 specified.

### Key Choices

- **Two new `Capability` enum values, not a new mechanism.** `Capability.java` gains `TECH_LEAD("tech_lead")` and `REVIEWER("reviewer")`, declared after the existing `DEVELOPER("developer")` so its ordinal (and therefore nothing that iterates `Capability.values()`) is disturbed. `AdminAccountController`'s grant/revoke/list endpoints are already generic over `Capability.parse(key)` and need no change.
- **A new migration, not an edit to `V24__capabilities.sql`.** Flyway migrations are immutable once applied; `V26__ax_role_capabilities.sql` inserts the two new catalog rows the same way `V24` inserted `developer`.
- **Deliberately not mutually exclusive.** The existing UI is a checkbox list (a set), not a `<select>` (a single choice), and this ADR keeps that shape: an account can hold more than one AX Role at once (e.g., a person who is both `tech_lead` and `developer` on a given effort). Nothing about "Tech Lead / Developer / Reviewer" as job-description labels requires forcing them to be exclusive, and building that constraint now would be speculative given the PM asked only for the three choices to exist.
- **No change to what any capability actually unlocks.** `SecurityConfig`'s `hasAnyAuthority(AppRole.SUPER_ADMIN.authority(), Capability.DEVELOPER.authority())` rules on the AX Renewal confirm/reopen/start-implementation routes, the frontend's mirrored `canConfirm` check (`app/ax-renewal/page.tsx`), the `/ax-renewal` route exception in `RequireSession.tsx`, and the `DEVELOPER` nav section's `capability: "developer"` visibility rule in `nav-config.ts` are all **untouched**. Holding `tech_lead` or `reviewer` today grants visibility in the account admin screen only — it does not (yet) unlock the AX Renewal workspace or any action inside it for an account that isn't already `admin`/`super_admin` or `developer`-capable. Whether it should is a real segregation-of-duties question, and per ADR-038 §4.3's own precedent for exactly this kind of call, it is left open below rather than decided silently.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | A single-select `ax_role` column on `account` (mirrors `claude_usage_member.team_role`, ADR-035) | One value per account is a closer literal fit to "Tech Lead / Developer / Reviewer" reading like a job title | A brand-new table/column, a brand-new enum, and a brand-new API surface to deliver something ADR-038's `capability` mechanism already does; forces mutual exclusivity the PM never asked for | No |
| B | **Extend the existing `Capability` enum with two more values** | Reuses 100% of existing plumbing (`CapabilityService`, the grant/revoke endpoints, the account-details checkbox UI); smallest possible diff; matches the "second capability" extension point ADR-038 explicitly left open | A reader has to learn that today's three `capability` rows are all AX-Renewal-specific role tags, not a general-purpose mechanism, until a fourth, unrelated capability is ever added | **Yes** |

## 4. Consequences

### 4.1 Positive Impacts

- Zero schema change beyond two catalog rows; the `app_role` ladder, `page.min_role`, and every existing authorization rule remain provably untouched, same as ADR-038's own positive impact.
- Granting/revoking `tech_lead` or `reviewer` is already auditable (`account.capability_grant`/`_revoke`) for free, via the existing `CapabilityService`.
- The account details screen's "AX Role" section reads correctly as three siblings rather than one checkbox with two more bolted on inconsistently.

### 4.2 Negative Impacts / Costs to Accept

- **Tech Lead and Reviewer currently grant no additional access.** An account holding only `tech_lead` or only `reviewer` (and no `admin`/`super_admin` role) cannot open `/ax-renewal` at all — the route exception in `RequireSession.tsx` and the nav visibility rule in `nav-config.ts` still check for `developer` specifically. This is very likely *not* the end state the PM wants once these roles are used for real (a Reviewer who cannot see the plan they are meant to review is not useful), but widening those checks is an access-control decision this ADR deliberately does not make silently — see follow-up.
- **Naming ambiguity persists.** "AX Role" in the UI and `Capability`/`capability` in the code/schema still disagree in name, exactly as ADR-038 already accepted for "Developer" alone (§4.2's "third authorization mechanism" cost). This ADR does not rename the table or the Java package.

### 4.3 Follow-up Work

- [ ] PM decides whether `tech_lead` and/or `reviewer` should also satisfy the `/ax-renewal` route exception (`RequireSession.tsx`) and the `DEVELOPER` nav section's visibility rule (`nav-config.ts`) — today only `developer` does.
- [ ] PM decides whether `tech_lead` should also satisfy the confirm/reopen/start-implementation floor in `SecurityConfig` (currently `Super Admin OR developer` only) and the frontend's mirrored `canConfirm` check in `app/ax-renewal/page.tsx`.
- [ ] PM decides whether `reviewer` should gain a narrower, read/comment-only floor of its own once AX Renewal has an action that maps to "review" specifically (no such action exists yet).
- [ ] Carried over from ADR-038, still undone: amend `REQUIREMENTS-SPEC.md` with FR-IDs for the capability mechanism and the AX Renewal workflow.
- [ ] Decide whether AX Role should ever become mutually exclusive (a `<select>` instead of a checkbox list) if real usage shows accounts should hold exactly one.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| The `app_role` ladder and existing `developer`-gated rules are unchanged | `SecurityRulesTest$AxRenewalPath`, `AppRoleTest` | Every build | Must pass |
| The three AX Role values round-trip through grant/revoke/list | Manual/integration check against `/api/v1/admin/accounts/{id}/capabilities/{tech_lead,developer,reviewer}` | Before release | Must pass |
| Migration applies cleanly | Testcontainers integration suite (`mvn verify`, Docker required) | Before merge | Must pass |

## 6. References

- `backend/src/main/resources/db/migration/V26__ax_role_capabilities.sql`
- `backend/src/main/java/com/coc/docs/capability/Capability.java`
- `frontend/lib/auth/api.ts` (`Capability` type)
- `frontend/components/users-roles/AccountDetailModal.tsx` (`CAPABILITY_CHOICES` → AX Role section)
- ADR-038 (capability grants, filed as "ADR-037" in code)

---

## Change History

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-09-21 | 1.0 | Written. Status PROPOSED — implemented ahead of approval per PM direction, following the precedent ADR-038 itself set. | backend-developer / frontend-developer |

---

**Approval**
| Date | Approver | Comments | Status |
|---|---|---|---|
| | PM | | PENDING |
