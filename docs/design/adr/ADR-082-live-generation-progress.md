# ADR-082: Live Generation Progress in Build → Implementation

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("when I click Build/Rebuild, please add a UI that shows the AI working in real time, including the current step/status and progress") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Generation is [ADR-044](ADR-044-generate-and-apply-code-changes.md)'s and its cancel [ADR-049](ADR-049-revision-of-044-cancel-a-running-generate-attempt.md)'s; in-memory per-backend state follows [ADR-048](ADR-048-run-locally.md)'s Run Locally log; [ADR-073](ADR-073-recover-interrupted-implementation-runs.md)'s compare-and-set transitions are unchanged.

---

## 1. Context

While a run was `generating` (up to 20 minutes), the Implementation tab showed "Rebuilding…", a seconds counter and a fixed paragraph. The backend ran the Claude Code CLI with `--output-format json` and read its output only after it exited, so there was nothing to show: nobody could tell whether the model was reading, editing, stuck, or nearly done.

## 2. Decision

> Stream the CLI's own events and show them live: the step the run has actually reached, real counts, and the model's actions as they happen. No percentage, because nothing knows how much work the model has left. No migration.

- **Backend:**
  - **Streaming:** `AxRenewalCodeGenerator` runs the CLI with `--output-format stream-json --verbose` and reads stdout line by line as it arrives.
    - The CLI's stderr is now discarded rather than left unread, so `--verbose` cannot fill the pipe and stall it.
    - The closing `result` event is still logged; the generation's answer is still the diff of the files.
  - **Translation:** `AxRenewalStreamEvents` turns each event into plain activity, using only what the stream says:
    - tool calls become "Reading src/App.tsx", "Editing …", "Writing …", "Searching for “…”", and TodoWrite becomes "Updated its plan — 2 of 5 steps done";
    - the model's own text becomes a note, clipped to 240 characters;
    - only a tool failure is shown, clipped; a tool's result never is;
    - the closing result is shown as "finished in N turns" or "stopped without finishing";
    - an event this doesn't recognise produces nothing.
  - **Paths:** shown relative to the project copy. A path outside it is shown by file name alone, and this machine's absolute paths are never shown. File contents never appear.
  - **Steps:** preparing, working and comparing, each reported by the generator when it actually begins. "Ready for review" is the run's own status afterwards.
  - **Storage:** `AxRenewalGenerationProgress` holds each run's step, distinct files read and changed, an action count, and the newest 200 activities, noting when earlier ones were dropped. It lives in memory inside `AxRenewalImplementationRunner` from `runGeneration`'s start to its end, whatever the outcome, the same choice ADR-048 made for Run Locally's log. Once a run has an outcome, its row, changed files and history (ADR-078) are the record.
  - **Failures:** progress is a view, never part of the work. A listener that throws costs that one update, never the generation.
- **API:** `GET /projects/{id}/implementation/{runId}/progress`.
  - Membership-checked (ADR-070), and the run must belong to the project.
  - A plain read at the existing GET floor, so `SecurityConfig` is unchanged.
  - `available: false`, with every other field empty, when this backend is not the one generating the run.
- **Frontend:** `GenerationProgress` replaces the fixed paragraph while a run generates, polling every 1.5 s. It shows:
  - a four-segment step bar (an ARIA progressbar, "Step 2 of 4: The AI is working");
  - a step list with done, current and waiting states, and how long the current step has run;
  - the counts;
  - a scrolling, auto-following "What the AI is doing" feed (`aria-live="polite"`).
  - If a read fails, it keeps the last update and says it is behind.
  - "Rebuilding…", elapsed time and Cancel are unchanged.

## 3. Consequences

- **Positive:** a person can see what the model is doing, catch a run going the wrong way and cancel it, and tell a slow run from a stuck one.
- **Accepted:**
  - **Live on the generating backend only.** On a shared database, a teammate whose backend isn't running the build sees "Live activity is shown on the computer running this build" until it finishes. Persisting progress would make it visible everywhere but would need a migration and many writes per run; that can be revisited.
  - **No percentage**, by design.
  - **Depends on the CLI's stream-json format.** Unknown events are ignored, so a format change degrades to a quieter feed, never a broken generation.
  - **Generation's stderr is no longer available**, though it was never read before either.

## 4. Verification

| Item | Method |
|---|---|
| Each event type turned into the right words; relative paths, file name only outside the project; no contents; clipping; unknown events produce nothing | `AxRenewalStreamEventsTest` (11) |
| Starts at preparing; steps and activity recorded; distinct file counts; notes aren't actions; capped at 200 with "dropped"; forgotten on end, late reports ignored | `AxRenewalGenerationProgressTest` (6) |
| A real process streaming lines: steps reported in order, a non-JSON line skipped, the diff still the answer; a throwing listener doesn't fail generation | `AxRenewalCodeGeneratorTest` (a fake CLI script, Windows and POSIX) |
| Progress readable mid-run and gone afterwards; a run closed before it starts leaves none | `AxRenewalImplementationRunnerTest` |
| A member reads it; empty when not generating here; another project's run is a 404 and is never read; response mapping, and the "unavailable" shape has no stand-in values | `AxRenewalImplementationProgressTest` |
| Non-member 404 | `AxRenewalMembershipTest` |
| Route: every role at the user floor; 401 without a session | `SecurityRulesTest` |
| Step bar, step states, step timer, counts, feed, re-reading, unavailable message, last update kept on failure, "dropped" note, no percentage | `GenerationProgress.test.tsx` (12) |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Real-time view of the AI working during Build/Rebuild | ACCEPTED |
