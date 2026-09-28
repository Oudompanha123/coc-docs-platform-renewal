# ADR-052: The Legacy Source Path Is Never Configuration — Analysis, Implementation and Chat All Take It Per Call

> **Status**: PROPOSED
> **Date**: 2026-09-28
> **Author**: backend/frontend (paired), on the PM's explicit instruction
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Revises [ADR-043](ADR-043-local-claude-analysis.md) (removes `app.ax-renewal.source-path`) and [ADR-051](ADR-051-revision-of-043-per-run-source-path.md) (extends the per-run override from Run analysis alone to Start implementation and, partially, chat).

---

## 1. Context

ADR-051 gave Run analysis a per-call `sourcePath` override, but kept
`app.ax-renewal.source-path` alive as the *default* it fell back to — and two
other consumers, `AxRenewalCodeGenerator` (Start implementation's real
Generate path, ADR-044) and `LocalClaudeChat` (the assistant chat, ADR-046),
still read that configured default directly and had no override at all.

The PM's instruction that prompted this ADR was direct: **remove the fixed
`APP_AXRENEWAL_SOURCEPATH` from `.env` entirely.** The system should use
whatever path a person provides or selects, for Analysis or Implementation,
at the point of the action — not a value that lives in a file on one
machine and is silently wrong for everybody else's checkout.

The concrete failure this fixes: **Start implementation always completed as
the Phase-1 placeholder** ("this phase does not generate code automatically")
on a machine where `app.ax-renewal.claude-cli-path` was configured but
`app.ax-renewal.source-path` was not — a state a team member relying on
ADR-051's new per-run override for *analysis* would land in easily, since
that override never touched Generate's own separate config read. Nothing
told them why; the run just completed successfully with a message that read,
from the outside, as nothing having happened.

- Related requirements: FR-AXR (AX Renewal workspace)
- Related risks: a second consumer of a removed config value failing to
  compile; a silent behavioural regression in the assistant chat, which had
  no per-call override to fall onto

## 2. Decision

> **`app.ax-renewal.source-path` is deleted. `AxRenewalProperties` no longer
> has a `sourcePath` field. Run analysis and Start implementation each take
> a `sourcePath` argument, validated once, in the same place, before either
> ever reaches a subprocess. The assistant chat's backend contract gained
> the same argument for consistency; its frontend does not send one yet —
> a deliberate, recorded gap, not an oversight.**

### Key Choices

- **Deleted, not deprecated.** No env var, no config field, no silent
  fallback. `AxRenewalCodeGenerator#canGenerate` no longer checks a source
  path at all — it is purely "is a CLI configured" now, since the folder to
  copy from is supplied per call. `AxRenewalProperties`' own doc comment
  records why: a fixed, server-side default for "the attached project's
  folder on this machine" is wrong the instant a second person's checkout,
  or a second project, is not that one folder.
- **One validation point for three consumers.** `AxRenewalService`'s
  existing `requireReadableDirectoryOrNull` (written for ADR-051's Run
  analysis override) is now called by `runAnalysis`, `startImplementation`,
  and `chat` alike — a caller-typed path is checked once, the same way,
  regardless of which of the three asked for it.
- **Start implementation only asks when it would matter.** The path is
  validated — and required, with a 409 if missing — only once every other
  precondition for real generation already holds: a model configured, a
  filesystem destination, a confirmed plan with something concrete in it.
  A project that was always going to take the placeholder path (no model,
  or a non-filesystem destination) is not asked for a path it was never
  going to use, the same reasoning ADR-051 already applied to `useModel`.
- **A missing path is now a clear 409, not a silent placeholder.** This is
  the direct fix for the reported symptom: before this ADR, a caller whose
  deployment could otherwise generate but had not given a source path got
  the exact same "nothing generated" message as a deployment with no model
  at all. Now they get "give this project's legacy source path before
  starting implementation" — an answer that says what to do next.
- **Generate copies from the given path; nothing else changes about how.**
  `AxRenewalCodeGenerator#generate` gains a `sourcePath` parameter in place
  of reading `properties.sourcePath()`, and re-validates it is a real
  directory before copying (defence in depth, the same posture every
  subprocess-spawning class in this package already takes toward its own
  configured/given path). The disposable-staging-copy design ADR-044
  already committed to — never touch the real source, never touch the
  destination during generation — is unchanged; only where the source
  folder's path comes from moved.
- **The async boundary carries the path across, not a shared field.**
  `AxRenewalImplementationRunner#runGeneration` gains a `sourcePath`
  parameter, captured from the HTTP request that started the run and passed
  straight through to `AxRenewalCodeGenerator#generate` — nothing new is
  held in memory keyed by project or account, avoiding the exact "whose
  path is this, really" ambiguity a shared field would reintroduce.
- **Chat's backend contract is extended; its frontend is not, yet.** Leaving
  `AxRenewalProperties#sourcePath()` deleted while `LocalClaudeChat` still
  called it would not compile, and defaulting chat to permanently
  manifest-only silently regresses a shipped capability (ADR-046) nobody
  asked to take away. `AxRenewalChatRequest` gained an optional
  `sourcePath` field and `LocalClaudeChat#reply` takes it the same way
  `LocalClaudeAnalyzer#analyse` does — but no frontend call site sends one
  yet, since a third source-path input was not what was asked for here.
  Recorded as follow-up work (§4.3), not left silently unmentioned.
- **`AxRenewalService#engineStatus`'s `readsSource` is now always false when
  connected.** It used to report whether the *configured default* would let
  a call read source; there is no longer a configured default for it to
  report on, and whether one particular upcoming call will read source
  depends on what somebody is about to type, which this project-independent
  status check cannot know. The field is kept rather than removed, to avoid
  rewriting `AxAssistantPanel`'s existing test suite for a field this ADR
  does not otherwise touch — flagged as vestigial in §4.3, not
  quietly left to look like it still means what it used to.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Delete the config value; per-call path for analysis and implementation, extended to chat's contract only (this ADR) | Matches the PM's explicit instruction exactly; one validation choke point; no machine ever has a "wrong default" again | Chat still cannot read source from its UI until a follow-up wires it up | **Adopted** |
| B | Keep `source-path` as a configured *fallback*, per-call as an override (ADR-051's original shape, extended to Generate/Chat too) | Smaller diff; a single-project, single-developer machine keeps working with zero typing | Exactly the problem being fixed: a second developer or a second project silently inherits the wrong default, which is what produced the "Start implementation does nothing" report this ADR answers | Not adopted |
| C | Persist the path server-side per project (on `AxRenewalProject`) | Nobody retypes it; visible to every teammate | Wrong for every teammate except whoever last set it, on whatever machine they set it from — ADR-051 already rejected this for Run analysis; Start implementation's stakes (writing generated code) are higher, not lower | Not adopted |
| D | Also build the chat frontend input in this pass | One consistent surface across all three consumers immediately | Not what was asked; a third copy of the same input widget without a specific request for it is exactly the scope creep this codebase's own conventions warn against | Deferred, not adopted now |

## 4. Consequences

### 4.1 Positive Impacts

- Fixes the reported bug directly: Start implementation now either
  generates real code or explains in one sentence why it cannot, instead of
  silently taking the placeholder path with no visible reason.
- No developer's `backend/.env.local` can ever again be "wrong" for a
  second project or a second person — there is nothing in it to be wrong.
- One shared validation function, one behaviour, across Run analysis, Start
  implementation, and chat's backend contract.

### 4.2 Negative Impacts / Costs to Accept

- **One more thing to type, for real generation.** A team member who wants
  Start implementation to actually write code now has to type their
  checkout's path there too, not just once in a file. Accepted directly by
  the PM as the point of this change, not a side effect of it.
- **The assistant chat regresses to manifest-only**, on any machine, until
  a follow-up gives it the same field — a real, if small and disclosed,
  capability loss versus what ADR-046 shipped.
- **`AxRenewalEngineStatus.readsSource` is now dead weight** — always false
  when connected, carrying no information `connected` alone did not already
  carry. Kept rather than removed this pass; see follow-up.

### 4.3 Follow-up Work

- [ ] PM decision: give the assistant chat the same per-call source-path
      field Run analysis and Start implementation now have, or leave it
      manifest-only as a settled scope boundary?
- [ ] If chat gets one: reuse `engine-preference.ts`'s existing
      `readSourcePathOverride`/`writeSourcePathOverride` (already keyed per
      project) rather than a fourth storage mechanism.
- [ ] Decide whether `AxRenewalEngineStatus.readsSource` /
      `AxRenewalEngineResponse.readsSource` should be removed outright, once
      whoever touches `AxAssistantPanel.tsx` next is willing to update its
      test suite for the change.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| `AxRenewalProperties` no longer has a `sourcePath` field or `sourcePathConfigured()` | Compiler | Every build | Any remaining reference fails the build |
| Start implementation refuses (409) real generation with no source path given, once everything else is ready | `AxRenewalService` (manual/integration) | Every build | Distinct message naming the missing path, not the generic placeholder note |
| A bad source path is refused before Generate ever copies anything | `AxRenewalCodeGeneratorTest` | Every build | `generate` returns empty for a non-directory path |
| `canGenerate()` no longer depends on a source path | `AxRenewalCodeGeneratorTest` | Every build | True with only a CLI path configured |
| Run analysis's existing override behaviour is unchanged | `AxRenewalRunAnalysisSourcePathTest` | Every build | All existing cases still pass unmodified |
| Chat compiles and degrades to manifest-only with no path given | `LocalClaudeChatTest` | Every build | `reply(..., null)` behaves exactly as before this ADR |

## 6. References

- Related code: `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalProperties.java`,
  `AxRenewalCodeGenerator.java` (`canGenerate`/`generate`),
  `AxRenewalImplementationRunner.java` (`runGeneration`),
  `LocalClaudeChat.java` (`reply`/`run`), `AxRenewalService.java`
  (`startImplementation`/`beginGeneration`/`chat`/`engineStatus`/
  `requireReadableDirectoryOrNull`), `web/AxRenewalController.java`,
  `web/ApiDtos.java` (`AxRenewalChatRequest`),
  `frontend/lib/ax-renewal/api.ts` (`startImplementation`),
  `frontend/app/ax-renewal/page.tsx` (`ImplementationPanel`),
  `backend/.env.example`, `CONTRIBUTING.md`
- Related ADR: ADR-037 (AX Renewal), ADR-043 (the original configured
  default), ADR-044 (Generate/staging), ADR-046 (assistant chat),
  ADR-051 (Run analysis's own per-call override, now generalised)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-28 | 1.0 | Initial draft | backend/frontend |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| | PM | | PENDING |
