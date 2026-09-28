# ADR-054: Run Analysis Accepts a Per-Run Source Path Override

> **Status**: PROPOSED, superseded in part by [ADR-055](ADR-055-revision-of-043-051-source-path-per-call-everywhere.md)
> **Date**: 2026-09-28
> **Author**: backend/frontend (paired)
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Revises [ADR-043](ADR-043-local-claude-analysis.md)'s `app.ax-renewal.source-path` decision. Deliberately scoped to Run analysis only — see §4.3 for why Generate (ADR-044) and Chat (ADR-046), which read the same setting, are left untouched.
>
> **Note (ADR-055, 2026-09-28)**: on direct PM instruction, `app.ax-renewal.source-path`
> — the configured default this ADR still fell back to — is now deleted outright,
> and the same per-call approach this ADR introduced for Run analysis is
> extended to Start implementation (Generate) and to chat's request shape.
> Everything else this ADR decided (the per-call parameter, validating it in
> `AxRenewalService` before a subprocess ever sees it, remembering it
> client-side per project rather than persisting it) stands unchanged —
> only "there is still a configured default to fall back to" is no longer
> true.

---

## 1. Context

ADR-043 gave Run analysis a way to read real source instead of only the
stored manifest: `app.ax-renewal.source-path`, an absolute path in one
developer's own `backend/.env.local`, read by `LocalClaudeAnalyzer` and
passed to the local Claude Code binary as `--add-dir`. That ADR's own
reasoning for why this had to be configuration, not something the browser
supplies, still holds — the File System Access API deliberately hides a
picked folder's real filesystem path, so the attach step can never fill this
in on its own.

What that reasoning did not require, and what the code ended up doing
anyway, was making it a **fixed** value: one line in one file, changed only
by editing it and restarting the backend. On a team of six, each running
their own backend against their own checkout of whatever legacy project they
are currently migrating, that means editing `.env.local` and restarting
every time somebody switches which project they are analysing — the same
inconvenience ADR-043 already built one workaround for (`useModel=false`,
`engine-preference.ts`'s per-browser "Disconnect", so a *different* per-run
choice would not need a restart either).

- Related requirements: FR-AXR (AX Renewal workspace)
- Related risks: a stale or wrong path silently producing a manifest-only
  analysis nobody notices happened; a caller-supplied path pointing
  somewhere it should not

## 2. Decision

> **Run analysis accepts an optional `sourcePath` — one caller's own legacy
> checkout, typed in for that one call. Given and valid, it is used instead
> of the configured default; given and invalid, the request is refused
> (400); omitted, behaviour is exactly what it was before this ADR. Nothing
> is persisted server-side — the browser remembers it per project, per
> machine, the same way it already remembers the `useModel` choice.**

### Key Choices

- **A per-request override, not a persisted setting.** `AxRenewalProject`
  gains no column for this. Two team members analysing the same project
  from two different machines have the legacy codebase checked out at two
  different paths — a value stored on the shared project row would be right
  for one of them and silently wrong for the other, the exact failure mode
  ADR-043's own "co-location" reasoning already warns about one level up
  (why this cannot become the deployed answer). A per-request parameter has
  no such row to be wrong on.
- **Remembered client-side, per project, per browser.** `engine-preference.ts`
  gains `readSourcePathOverride(projectId)`/`writeSourcePathOverride(projectId,
  path)`, `localStorage`-backed and keyed by project id (unlike the global
  `useModel` preference, since two different projects are two different
  folders even on one machine). This is convenience only — surviving a
  reload without retyping — never sent anywhere until Run analysis is
  actually pressed, and the backend still does not persist it.
- **Validated where the request is decided, not where the subprocess is
  built.** `AxRenewalService.runAnalysis` checks the override is a real,
  readable directory and throws `ApiException.badRequest` before
  `LocalClaudeAnalyzer` is ever reached. `LocalClaudeAnalyzer` itself keeps
  its unchanged, ADR-043 behaviour for the *configured* default — log a
  warning and fall back to the manifest — because that value is passive
  configuration nobody is actively deciding anything by leaving stale.
  A path a person just typed and pressed Enter on deserves an answer that
  says so, not the same silent degrade a forgotten `.env.local` line gets.
- **Ignored, not validated, when `useModel` is false.** Disconnect
  (ADR-043) means the keyword stub runs regardless of what is in the box —
  validating an override that cannot affect anything would turn stale text
  left over from before Disconnect was pressed into a surprising 400 on an
  otherwise unrelated action.
- **No new security floor.** The route stays exactly where ADR-037 put it
  (`admin`). An `admin`-or-above caller already sets `destination` to an
  arbitrary filesystem path that Approve later writes into and Run Locally
  later executes `npm run dev` in (ADR-044/048) — granting the same tier of
  caller read-only `--add-dir` access to a directory they name themselves is
  a smaller grant than what this feature already trusts them with, not a
  new one.
- **The raw path is never logged, audited, or returned.** Same posture
  `AxRenewalProperties`' own Javadoc already states for the configured
  default — a path can embed an OS username or an internal folder
  structure, and the audit log is shared with every other `admin`. Only
  whether source was read (`readSource`, already existing) is recorded.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Per-run override, validated at request time, remembered client-side only (this ADR) | No schema change; correct on a multi-developer team; consistent with the existing `useModel` per-browser pattern | One more parameter to thread through the controller/service/analyzer | **Adopted** |
| B | Persist the path on `AxRenewalProject` | Nobody has to retype it; visible to every teammate | Wrong for every teammate except whoever last set it — the exact machine-locality problem ADR-043 already avoided for the configured default | Not adopted |
| C | Let the browser derive it from the picked folder (File System Access API) | No typing at all | Technically impossible — the API deliberately withholds the real path; this is the constraint ADR-043 already documented, not a new one | Not adopted |
| D | Silently fall back to the keyword stub on a bad override, same as a bad configured default | One code path for "bad path", simplest | A person who just typed a path and got the keyword stub anyway, with no visible reason, is worse off than before this ADR — passive misconfiguration and an active, just-taken action deserve different honesty | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts

- A team member can point analysis at their own checkout without touching
  `backend/.env.local` or restarting anything, for every project they work
  on, remembered across reloads on their own machine.
- The configured default keeps working unchanged for anyone who has not
  adopted the override — every existing deployment/test/behaviour is
  unaffected.
- A mistyped path is caught immediately, with a message naming the problem,
  instead of a silent, unexplained manifest-only result.

### 4.2 Negative Impacts / Costs to Accept

- One more thing to explain in the UI: the input only appears once a model
  is connected at all, and its own copy has to carry the "blank means the
  deployment's default, if any" nuance.
- `Run analysis` and `Run analysis again` now validate a directory on every
  call when an override is given — a cheap `Files.isDirectory` check, not a
  measurable cost, but a new code path nonetheless.

### 4.3 Follow-up Work

- [ ] PM decision: should Generate (ADR-044, which copies *from*
      `source-path` into a staging area) and Chat (ADR-046) gain the same
      per-run override? Deliberately out of scope here — Generate in
      particular does more than read, and deserves its own look at what a
      caller-supplied path means for a flow that already writes to a
      destination.
- [ ] If Generate/Chat ever adopt this, `requireReadableDirectoryOrNull`
      (currently private to `AxRenewalService`) is the natural thing to
      share rather than re-implement.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| No override behaves exactly as before | `AxRenewalRunAnalysisSourcePathTest` | Every build | `analyse` called with `null` |
| A bad override is refused before the analyzer runs | `AxRenewalRunAnalysisSourcePathTest` | Every build | 400; `LocalClaudeAnalyzer.analyse` never invoked |
| A good override reaches the analyzer, resolved | `AxRenewalRunAnalysisSourcePathTest` | Every build | `analyse` called with the given path |
| The override is ignored, not validated, when `useModel` is false | `AxRenewalRunAnalysisSourcePathTest` | Every build | No exception; analyzer never invoked |
| The input is offered only where a model is connected, to somebody who may edit | `AttachSourceSection.test.tsx` | Every build | Not rendered otherwise |
| The typed value is sent with the next Run analysis | `AttachSourceSection.test.tsx` | Every build | `runAnalysis`'s fourth argument matches |
| Storage read/write round-trips, and degrades to empty/silent rather than throwing | `engine-preference.test.ts` | Every build | Explicit `Storage` stub, including a throwing one |

## 6. References

- Related code: `backend/src/main/java/com/coc/docs/axrenewal/LocalClaudeAnalyzer.java`
  (two-arg `analyse` overload), `AxRenewalService#runAnalysis` /
  `#requireReadableDirectoryOrNull`, `web/AxRenewalController#runAnalysis`,
  `frontend/lib/ax-renewal/api.ts#runAnalysis`,
  `frontend/lib/ax-renewal/engine-preference.ts`,
  `frontend/components/ax-renewal/AttachSourceSection.tsx`
- Related ADR: ADR-037 (AX Renewal), ADR-043 (the configured default this
  revises), ADR-044/048 (why the `admin` floor already trusts this class of
  caller with a filesystem path)

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
