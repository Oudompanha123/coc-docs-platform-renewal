# ADR-067: Stale-Edit Protection for a Shared AX Renewal Plan

> **Status**: ACCEPTED — implemented
> **Date**: 2026-09-30
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("proceed with the recommended small scope … implement stale-edit protection first") — recorded here as a transcription of that explicit instruction, not a self-approval, the same way [ADR-062](ADR-062-ai-error-assistant-and-ui-customization.md) records its own (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3). If a separate PM sign-off is required, set this back to PROPOSED.
> **Related ADR**: Applies [ADR-003](ADR-003-persistence-strategy.md)'s optimistic-locking pattern (`page_version.version_no`, FR-CONT-013) to the AX Renewal plan tables of ADR-037 (the AX Renewal ADR, filed in code as "ADR-037" — see [ADR-038](ADR-038-capability-grants-ax-renewal.md)'s renumbering note). Companion to [ADR-068](ADR-068-resolution-of-039-040-ax-role-model-and-workspace-access.md), which widens who can open the workspace.

---

## 1. Context

AX Renewal was built to be worked on by a team — Admins draft a plan, a Developer or Super Admin confirms it — but every plan write was last-write-wins with no warning:

- `PUT /plan/stack-move`, `/plan/architecture`, `/plan/pages`, `/plan/database`, `/database/connect` and `/destination` each **replace their whole section**. Two people with the Pages section open: the second save silently erased the first. Neither person was told.
- `POST /plan/{section}/confirm` recorded a sign-off without checking what the confirmer had actually seen. Person B edits Pages (which clears its confirmation — that part already worked); person A, still looking at the old Pages, presses Confirm; the confirmation is recorded against content A never saw.

Everything else a team needs already existed: projects are shared, comments carry author names, two concurrent implementation runs are already refused (409), and editing a section already clears its confirmation. This was the one real correctness gap.

The codebase already solved the same problem once, for page drafts: `SaveDraftRequest.versionNo` is required with no default, the update carries `version_no` in its `where` clause, and a mismatch is a 409 the editor sees (FR-CONT-013, `PageService#saveDraft`).

## 2. Decision

> One `revision` counter per AX Renewal project (`ax_renewal_project.revision`, V57). Every plan edit must send back the revision it loaded; the edit bumps it; a mismatch is a **409** whose message says a teammate changed the plan and to reload. Confirming a section **checks** the revision but does **not** bump it. A request without a revision is a **400** — never an implied "latest".

### Key Choices

- **Per project, not per section.** One column instead of a version on each of six tables. The cost: an edit to Pages also refuses a concurrent Stack Move edit that did not actually overlap. At team scale that is one reload, and it keeps the change to one column and one helper.
- **Required, in the request body.** Same stance and same transport as `SaveDraftRequest.versionNo` — not an `If-Match` header — so there is one optimistic-locking idiom in this codebase, not two. A client that omitted it would be asking to overwrite whatever a teammate saved meanwhile.
- **Row lock, then compare, then bump** (`AxRenewalProjectRepository#lockRevision` = `select … for update`, then `#incrementRevision`). The lock is what makes the confirmation check sound: without it, a confirm could read the old revision, a concurrent edit could clear that section's confirmation and commit, and the confirm would then insert its sign-off on content nobody had reviewed. Holding the row serialises the two.
- **Confirm checks, does not bump.** A confirmation changes no plan content, so it must not make a teammate's open copy stale. It follows that "Confirm all" in the Assistant panel can send the same revision for every section.
- **Reopen is not checked.** It only withdraws a sign-off; there is no content in it a stale copy could overwrite.
- **Out of scope, deliberately:** attach manifest and run analysis do not touch the revision (they write the Understand side, not the plan sections people edit in forms); implementation start is already protected by `confirmed_plan_hash` (V48).
- **Frontend keeps the person's unsaved input on a 409.** Each section's edit state is initialised once from props, so a refused save leaves what they typed on screen next to the backend's message, rather than refreshing it away. Confirm is now awaited, not fire-and-forget, so its 409 reaches the section's existing `role="alert"` line instead of disappearing as an unhandled rejection.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | One revision per project, required in the body | One column; same idiom as FR-CONT-013; covers confirm too | Coarse — unrelated concurrent edits also conflict | **Adopted** |
| B | A version per section (six columns / six tables) | No false conflicts between sections | Six places to keep in step; list sections (pages, db changes, stack layers) are replaced wholesale and have no single row to version | Not adopted |
| C | `If-Match` / `ETag` headers | Standard HTTP | A second locking idiom beside `versionNo`; needs `ETag` exposed through CORS; the response bodies are section lists with nowhere natural to carry the new value | Not adopted |
| D | Live presence / co-editing (WebSocket, SSE) | Prevents the conflict instead of refusing it | A new transport and architecture for a problem a 409 already makes safe | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts
- A teammate's save can no longer be silently erased, and a sign-off can no longer be recorded against content its confirmer never saw.
- Existing projects need no backfill (`default 0`).

### 4.2 Negative Impacts / Costs to Accept
- **API change.** The six plan-edit bodies gain a required `revision`, and `POST /plan/{section}/confirm` now takes a JSON body `{ "revision": n }` where it took none. The frontend in this repository is the only client and is updated in the same change; any other caller gets a 400 until it sends one.
- False conflicts between unrelated sections (§2, Key Choices).
- After a 409 the person must reload the page to see the teammate's change, re-applying their own edit by hand. There is no merge UI.

### 4.3 Follow-up Work
- [ ] Run the Testcontainers suite (`mvn -f backend/pom.xml verify`) on a machine with Docker to prove V57 applies against real Postgres — not run in the implementing session (no Docker).
- [ ] If false cross-section conflicts turn out to be common in real use, revisit Alternative B.

## 5. Verification

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| Every plan edit refuses a stale revision and writes nothing | `AxRenewalStaleEditTest` (parameterised over all six edits) | Every build | Must pass |
| Confirm refuses a stale revision, and a current one does not bump it | `AxRenewalStaleEditTest` | Every build | Must pass |
| A request with no revision never reaches the service | `SecurityRulesTest$AxRenewalPath` (`…without_a_revision…`) | Every build | Must pass |
| The client sends the revision and surfaces a 409's own message | `frontend/lib/ax-renewal/api.test.ts` | Every build | Must pass |
| A refused Confirm is shown, not swallowed | `frontend/components/ax-renewal/PagesSection.test.tsx` | Every build | Must pass |
| V57 applies cleanly | Testcontainers integration suite (Docker required) | Before merge | Must pass |

## 6. References

- `backend/src/main/resources/db/migration/V57__ax_renewal_project_revision.sql`
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalProjectRepository.java` (`lockRevision`, `incrementRevision`)
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalService.java` (`requireCurrentRevision`, `advanceRevision`)
- `backend/src/main/java/com/coc/docs/web/ApiDtos.java`, `AxRenewalController.java`
- `frontend/lib/ax-renewal/api.ts`, `frontend/app/ax-renewal/page.tsx`, the four `*Section.tsx` plan sections, `AxAssistantPanel.tsx`
- Precedent: `PageService#saveDraft`, `ApiDtos.SaveDraftRequest` (FR-CONT-013)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-30 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-30 | User (in-session, direct instruction) | "Proceed with the recommended small scope. Implement stale-edit protection first." | ACCEPTED |
