# ADR-060: AI Error Assistant and UI Customization

> **Status**: ACCEPTED — both phases implemented
> **Date**: 2026-09-29 (Phase 1); revised 2026-09-29 (Phase 2 approved and implemented)
> **Approver**: the user, in-session, against this ADR's own four open questions (§4.3 v1.0) — recorded here as a direct transcription of that explicit instruction, not a self-approval; per `CONST-PROC-01`/HARNESS-PROCESS-STANDARD §4.8 CQ3 this is never the AI's own decision to make, the same distinction `docs/.harness-state.yaml`'s own G1 recording note draws for a gate approval
> **Related ADR**: Reuses the local-only subprocess pattern from [ADR-043](ADR-043-local-claude-analysis.md), the filtered-staging-copy safety net ADR-043 established and [ADR-046](ADR-046-assistant-chat-local-model.md) reused. Explains a failure [ADR-048](ADR-048-run-locally.md)'s Run Locally surfaces. Phase 2 (§2.2) extends [ADR-044](ADR-044-generate-and-apply-code-changes.md)'s Generate → Review → Apply pipeline rather than replacing it.

---

## 1. Context

The PM asked for one feature with two halves: when Run Locally fails, let the person ask the local Claude Code installation why and how to fix it; separately, let them describe a UI change in plain language, see it as a diff, approve it, run tests, and revert it. Both halves were asked for together, "recommend and implement," with an explicit requirement to use the already-configured local CLI (no Anthropic API key) and to never fabricate errors, logs, or test results.

The two halves are not the same size. The first is a read: hand the model a real, already-captured log and a way to look at the applied destination, and show whatever it says back. `LocalClaudeChat` (ADR-046) already does exactly this for a free-text question about the project — explaining a failure is the same call with a better prompt. The second is a write: generate a change, diff it, let someone approve it, apply it to a live filesystem destination, and be able to undo that specific apply later without disturbing anything else that has happened to the destination since. ADR-044 already built generate → review → apply once, for one kind of change (a full renewal implementation); this would be a second kind of change (a UI edit) sharing that machinery, plus two capabilities that pipeline does not have yet at all — revert, and run-tests.

Per `HARNESS-PROCESS-STANDARD.md` §5.2 and this repo's own `CLAUDE.md`, a revision of this size to an existing security-relevant pipeline needs an ADR and PM sign-off before it is built, not after. This ADR was originally split in two: Phase 1 (§2.1) was safe enough to build immediately under the same authority and safety rules the assistant already operates under; Phase 2 (§2.2) was designed at the level a PM could approve or redirect, but left unbuilt, with four open questions this document could not answer on its own (§4.3 v1.0).

Those four questions have since been answered explicitly, in-session, and Phase 2 has been implemented against those answers:

1. **Write-while-running** (§4.3 v1.0, item 1): *"Allow error-fix and UI-change writes while Run Locally is still live against the same destination files."* Neither `startErrorFixImplementation` nor `startUiChangeImplementation` checks or touches Run Locally's own state — the same as every other write this feature already made to a filesystem destination.
2. **UI Customization's scope** (item 2): *"Scope it to the renewed project's UI only, not the AX Renewal admin app."* Both new run kinds copy the applied **destination** into staging — never this admin application's own source tree, never the legacy checkout `RUN_KIND_PLAN` copies.
3. **Run-tests target** (item 3): *"Always execute tests against a disposable copy, not the live destination."* `AxRenewalTestRunner` copies a run's own staging directory into a second, throwaway temp directory before ever invoking `npm`.
4. **Revert granularity** (item 4): *"Support reverting one specific applied run."* Implemented with the safety check the original open item flagged as unresolved — only the run that is still the current *latest applied* one may be reverted (§2.2.3).

## 2. Decision

### 2.1 Phase 1 — Explain a Run Locally failure (implemented)

**`POST /api/v1/ax-renewal/projects/{id}/run-locally/explain`** asks the local model to explain the *current* Run Locally failure and, where it can, name a specific file and change — in prose only. It is refused with 409 unless `AxRenewalLocalRunner.status(projectId)` is actually `failed` right now, matching the same "no invented state" rule the rest of this feature follows.

- **The log handed to the model is `AxRenewalLocalRunner`'s own captured output** — the real rolling buffer ADR-048 already keeps, joined as-is, never summarized or embellished before being sent.
- **It may look at the applied destination**, the same "may read, may not touch" floor `LocalClaudeChat.reply` already sits at (ADR-046) — enough for a suggestion to name a real file rather than guess at one, and still nothing is written.
- **Authority**: sits at the same floor as `assistant/chat` — `hasRole(ADMIN)` (`SecurityConfig`) — not the stricter Super-Admin-or-Developer-exact floor `run-locally/start`/`stop` sit at, because, like chat, this reads and answers; it does not act.
- **Frontend**: `RunLocallyPanel` (`frontend/app/ax-renewal/page.tsx`) shows an "Ask AI to explain this" button once `status.status === "failed"`, gated on the same `canEdit` (Admin-or-above) check the rest of the read floor already uses client-side; the reply renders as plain prose, with its own error state if the call itself fails. Nothing here is persisted by the frontend either — a refresh loses it, matching Chat's own documented behavior.

This is genuinely the whole of what was asked for on the "capture and display error logs, analyze root cause, suggest fixes" side, *short of applying a suggested fix automatically* — which the request itself separated ("optionally apply approved code changes") and which is Phase 2's job.

### 2.2 Phase 2 — apply a suggested fix, describe a UI change, diff/approve/revert/test (implemented)

Both remaining asks — "optionally apply" a suggested error fix, and the whole UI Customization flow (describe → diff → approve → revert → run tests) — turned out to be the same shape: **a new kind of Generate → Review → Apply run**, not a new pipeline (ADR-044's own machinery, extended rather than duplicated).

#### 2.2.1 `run_kind` discriminator

`ax_renewal_implementation_run` gains two columns (`V53__ax_renewal_run_kind_and_revert.sql`): `run_kind` (`plan` | `error_fix` | `ui_change`, default `plan` — every pre-existing row keeps meaning exactly what it always meant) and `instruction` (the raw input a plan run never needed, since it rebuilds its own prompt from the confirmed Plan tables — the real captured Run Locally log for `error_fix`, the person's own free-text description for `ui_change`). `AxRenewalCodeGenerator.generate` now takes `runKind` alongside the prompt text and selects one of three framings (`migrationPlanPrompt`/`errorFixPrompt`/`uiChangePrompt`) — the original plan-kind wording is untouched, byte-for-byte, so nothing about ADR-044's existing behavior changed.

The critical difference from a plan run: **what gets copied into staging**. A plan run copies the legacy checkout (`source-path`) and diffs it against the model's edits. An `error_fix`/`ui_change` run copies **the applied destination itself** — decision 2 (§1) made this the only sensible reading of "the renewed project's own UI," and it falls out naturally: there is no other place this code exists once ADR-044 has already applied it there.

- `AxRenewalService.startErrorFixImplementation(projectId, actor)` — requires the current Run Locally attempt to actually be `failed` (the same check `explainRunLocallyFailure` makes), an applied filesystem destination, a configured local model, and no other implementation run already active. Deliberately bypasses every Plan-section-confirmed precondition `startImplementation` enforces — an error fix responds to what just happened at Run Locally, not to a re-confirmed Plan.
- `AxRenewalService.startUiChangeImplementation(projectId, description, actor)` — same preconditions, triggered by a person's own words instead of a captured failure.
- Both funnel into the same `beginGeneration` helper `startImplementation`'s own plan-kind path already used, now generalized to take `runKind`/`instruction` — one insert, one audit entry, one deferred-to-`afterCommit` async call, regardless of kind.
- **Decision 1 (§1) resolved as "no restriction":** neither method checks `AxRenewalLocalRunner`'s state. Writing to the destination while Run Locally is live is accepted as the same trust boundary ADR-048 already accepted — a live dev server simply picks up changed files the way it always does when a person edits them by hand.

#### 2.2.2 Review, and running tests before approving

`GeneratedChangesReview` needed no backend change — it was never specific to a full-renewal diff — but gained a **Run tests** button (frontend) backed by a new endpoint and component:

- `AxRenewalTestRunner.run(stagingPath)` copies a run's own staging directory into a **second, disposable** temp directory (decision 3, §1: never the live destination, and not even the staging directory Approve still needs to read byte-for-byte later), reads the destination's own `package.json` for a real `test` script (refusing honestly if there is none, the same pattern `AxRenewalService.requireDevScript` already established for `dev`), and runs `npm install && npm test` shell-wrapped for the same Windows `PATHEXT` reason ADR-048's own `start` is (`npm`/`npm.cmd` is not resolved by a bare `ProcessBuilder` argument). A background reader thread (not a blocking read-then-wait pair) means a genuinely hung suite still surfaces as an honest timeout rather than hanging this call forever.
- **Never fabricates a result**: `executed=false` with a `note` for every case nothing could run (no staging, no script, a copy/spawn failure, a timeout); `executed=true` with the process's own real exit code and output otherwise — a nonzero exit is a legitimate answer ("tests ran, some failed"), not a refusal.
- `AxRenewalService.runTests(projectId, runId, actor)` only requires the run still be `awaiting_review` (the same precondition Reject already checks — that is the only time a staging copy still exists to test), and audits that it happened (`executed`, `exitCode`, `note` — the full output stays on the review screen, never in the audit log).

#### 2.2.3 Revert

`AxRenewalService.revertImplementation(projectId, runId, actor)` (decision 4, §1) restores every file one applied run touched to its own recorded `beforeContent` (a created file is deleted instead, since it had no "before") — the exact rows already in `ax_renewal_generated_change`, needing no new table.

**The safety check this ADR's v1.0 flagged as unresolved is answered as: only the current latest applied run may be reverted.** Concretely, `revertImplementation` requires `run.status == applied` *and* that `AxRenewalImplementationRepository.findLatest` still returns this exact run. A file this run touched may have been modified again by a newer applied run since (another fix, another UI change, another Rebuild) — reverting past that newer run would silently discard it, which is not "undo one run," it is "undo two." Once revert succeeds the run's status moves to a new terminal state, `reverted` (`V53`'s status-check widening), so it stops being the latest applied run and a second revert attempt fails for the same honest reason a double-apply would.

#### 2.2.4 RBAC and audit

Every new write action — `error-fix/start`, `ui-change/start`, `*/run-tests`, `*/revert` — sits at the exact Super-Admin-or-Developer-exact floor `start`/`approve`/`reject`/`cancel` already share (`SecurityConfig`): each executes real code on the backend's own machine or writes to the real destination, the same class of action. Two new `AuditAction` entries (`ax_renewal.implementation_run_tests`, `ax_renewal.implementation_revert`) join the existing implementation-action trail; starting either new kind reuses `ax_renewal.implementation_start` with `runKind` in its detail, the same way Replay already has its own distinguishing action rather than overloading Start's meaning.

#### 2.2.5 Frontend

- `RunLocallyPanel` — a "Generate a fix" button beside "Ask AI to explain this," offered once Run Locally has actually failed, gated on the same write-floor `canConfirm` check every other mutating action in this feature already uses client-side; starting one navigates to the Implementation tab, where the resulting run is reviewed exactly like any other.
- `ImplementationPanel` — a "Describe a UI change" textarea + Generate button, offered once the latest run is `applied`; a `runKind` badge and the stored `instruction` shown on any error-fix/UI-change run so a reviewer knows what they are looking at without guessing; a "Revert this run" button beside an `applied` run's status line.
- `GeneratedChangesReview` — a "Run tests" button showing the real executed/exit-code/output result inline, honest refusal states rendered distinctly from a real (even a failing) test result.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| 1 | Build all of Phase 1 + Phase 2 in one pass, before any PM sign-off | Delivers the full original request in one go | A revision to an existing security-relevant pipeline (write access to a real filesystem destination, from two new trigger sources) without a written ADR or PM sign-off first is exactly what `CONST-PROC-01`/HARNESS §5.2 exist to prevent | No |
| 2 | Build nothing until Phase 2 was explicitly approved | Cleanest process compliance | The read-only half (Phase 1) carried none of Phase 2's risk — it already shared `assistant/chat`'s PM-approved authority (ADR-046) — so withholding it too would have been process for its own sake | No — Phase 1 shipped immediately, Phase 2 gated separately |
| 3 | Split: ship the read-only explain endpoint immediately; design and gate the write-capable half behind this ADR, pending explicit answers to its open questions | Shipped the safe half immediately; kept the genuinely new risk (write access, new trigger surface, revert, run-tests, UI-customization scope) behind explicit sign-off until each question had a real answer | Delivered the request in two visible steps rather than one | **Yes** |
| 4 | A dedicated `error_fix`/`ui_change` pipeline, separate from `AxRenewalImplementationRun` | No risk of one pipeline's assumptions leaking into another | Duplicates the entire Generate/Review/Apply state machine and `GeneratedChangesReview` UI for no behavioral difference the discriminator doesn't already give it | No — `run_kind` discriminator instead (§2.2.1) |
| 5 | Revert: restore to "the last applied `plan` run" only (coarser, no per-run safety check needed) | Simpler — no "is this still the latest" gate to get right | Discards exactly the case the PM asked to keep — reverting one specific error-fix or UI-change run without also rolling back every other change since | No — one-specific-run revert, gated on "still the latest applied" (§2.2.3) |

## 4. Consequences

### 4.1 Positive Impacts
- Delivers the full original request — explain, apply a fix, describe a UI change, review, test, approve, revert — using one pipeline throughout, extended rather than replaced.
- Never fabricates a result anywhere new: a test run's exit code and output are always the process's own real values or an honest refusal; a reverted file's content is always its own real prior recorded content.
- Revert's safety gate ("still the latest applied run") is enforced identically for every kind — a `plan` Rebuild, an `error_fix`, or a `ui_change` all reduce to the same rule, not three special cases.

### 4.2 Negative Impacts / Costs to Accept
- Revert is intentionally narrower than "undo any run at any time" — an older applied run can no longer be reverted once something newer has applied on top of it. The honest alternative (checking which specific files a later run also touched, and permitting a partial revert) was considered more complex than this feature's first version of revert should take on, and is left as a future refinement if it is ever asked for.
- `error_fix`/`ui_change` writes are accepted while Run Locally is live against the same destination (decision 1) — a person watching a live dev server may see it hot-reload mid-review-cycle once Approve lands, which is expected but was not previously possible for this feature (nothing wrote to an already-applied destination before ADR-060).
- Running tests always costs a second full `npm install` (into the disposable copy) — slower than reusing `node_modules` from anywhere, accepted for the isolation guarantee decision 3 asked for.

### 4.3 Follow-up Work
- [x] PM/user approval of Phase 2 — recorded above (2026-09-29), against this document's own four open questions, per `CONST-PROC-01`.
- [x] Write-while-running (was open item 1) — resolved: allowed, no restriction (§2.2.1).
- [x] UI Customization's scope (was open item 2) — resolved: the renewed project's own UI only (§2.2.1).
- [x] Run-tests target (was open item 3) — resolved: always a disposable copy (§2.2.2).
- [x] Revert granularity (was open item 4) — resolved: one specific run, gated on "still the latest applied" (§2.2.3).
- [ ] Per-file approve/reject within one run — still deferred from ADR-044 itself, unaffected by this ADR.
- [ ] `git_repo`/`other` destinations still get no generation capability of any kind (`plan`, `error_fix`, or `ui_change`) — unchanged from ADR-044.
- [ ] Partial/multi-file-aware revert (see §4.2) — not built; today's revert is all-or-nothing per run, gated on recency.

## 5. References
- [ADR-043](ADR-043-local-claude-analysis.md) — local-only subprocess pattern, filtered staging copy, "never fabricate" rule this ADR follows throughout.
- [ADR-044](ADR-044-generate-and-apply-code-changes.md) — the Generate → Review → Apply pipeline Phase 2 extends via `run_kind`, not replaces.
- [ADR-046](ADR-046-assistant-chat-local-model.md) — `LocalClaudeChat`, whose exact RBAC floor and "reads source, writes nothing" posture Phase 1 reuses.
- [ADR-048](ADR-048-run-locally.md) — the real, captured failure log Phase 1 explains and Phase 2's error-fix prompts from; the `package.json` script-reading pattern `AxRenewalTestRunner` mirrors for `scripts.test`.
- `backend/src/main/resources/db/migration/V53__ax_renewal_run_kind_and_revert.sql` — `run_kind`/`instruction` columns, the `reverted` status.
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalService.java` — `explainRunLocallyFailure`, `startErrorFixImplementation`, `startUiChangeImplementation`, `runTests`, `revertImplementation`.
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalCodeGenerator.java` — the three prompt framings selected by `run_kind`.
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalTestRunner.java` — the disposable-copy test runner.
- `backend/src/main/java/com/coc/docs/web/AxRenewalController.java` — the five new/changed endpoints.
- `backend/src/main/java/com/coc/docs/config/SecurityConfig.java` — their RBAC matchers.
- `frontend/lib/ax-renewal/api.ts`, `frontend/app/ax-renewal/page.tsx`, `frontend/components/ax-renewal/GeneratedChangesReview.tsx` — the frontend wiring for all of the above.

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-29 | 1.0 | Initial draft — Phase 1 implemented, Phase 2 designed and deferred pending PM sign-off, four open questions raised | Claude Sonnet 5 |
| 2026-09-29 | 2.0 | Phase 2 approved against its own four open questions and implemented in full — `run_kind`, error-fix/UI-change generation, run-tests against a disposable copy, one-specific-run revert | Claude Sonnet 5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-29 | User (in-session, direct instruction) | Approved all four open items from v1.0 as: (1) allow writes while Run Locally is live, (2) UI Customization scoped to the renewed project only, (3) tests always against a disposable copy, (4) revert one specific run | ACCEPTED |
