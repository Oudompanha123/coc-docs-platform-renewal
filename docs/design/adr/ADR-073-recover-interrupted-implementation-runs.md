# ADR-073: Recover Implementation Runs a Stopped Backend Left In Progress

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("implement startup recovery for stuck implementation runs, safely clean up temporary folders, and allow cancellation of generating runs when their process no longer exists") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`). The compare-and-set design and the 60-minute threshold (§2) were the implementer's; set this back to PROPOSED if either needs a separate decision.
> **Related ADR**: Extends [ADR-044](ADR-044-generate-and-apply-code-changes.md) (Generate → Review → Apply) and [ADR-049](ADR-049-revision-of-044-cancel-a-running-generate-attempt.md) (Cancel). Reuses [ADR-072](ADR-072-project-delete-is-permanent-everywhere.md)'s guarded staging-copy delete.

---

## 1. Context

A Generate run's work happens on a background thread of one backend JVM: stage a copy of the source, run the local Claude CLI (hard timeout 20 minutes, `AxRenewalCodeGenerator.TIMEOUT`), diff, and move the run to `awaiting_review`. If that JVM stops part way, which happens routinely during development, the row stays at `generating` with nothing left to finish it. Then:

- **Cancel** refused with "this run has no active process to cancel", because the live process handle only ever existed in the stopped JVM's memory.
- **Delete project** refused with "cancel or resolve the active implementation run before deleting this project", because the run still counted as active. This is the error a user reported.
- Its staging copy of generated code stayed on disk.

**The constraint that shapes the fix:** the dev database (`cocdocs_dev`) is shared by several developers' backends, each with its own runner. "This backend has no process for the run" proves nothing, because a teammate's backend may be generating it right now. A naive startup sweep of every `generating` row would kill teammates' live runs every time anyone restarted.

**Not actually reachable:** `applying` and the legacy `running` are each set and finished inside one transaction (`approveImplementation`, `recordPlaceholderCompletion`), so a crash rolls them back. A *committed* row in either status only exists if that transaction's backend died half way.

## 2. Decision

> **(1)** Every status transition the runner makes is **compare-and-set** on the status it expects, so whoever closes a run first wins and a late process discards its own result. **(2)** **Cancel** closes a `generating` run that has no live process on this backend, at once. **(3)** On **startup**, runs that cannot be alive anywhere are closed as `failed` and their staging copies removed.

### 2.1 Compare-and-set (the safety net that makes 2 and 3 safe on a shared database)

`AxRenewalImplementationRepository` gains `markStagingIfGenerating`, `transitionIfStatus`, `endIfStatus` — each `… where id = ? and status = ?`, returning whether a row changed. `AxRenewalImplementationRunner#runGeneration` now:

- claims the run with `markStagingIfGenerating`; refused → deletes its fresh staging copy and stops without generating;
- ends failures and cancels with `endIfStatus(generating → …)`;
- inserts the proposed changes, then claims `generating → awaiting_review`; refused → **deletes those changes and its staging copy**. The outcome someone else already recorded stands.

### 2.2 Cancel with no live process

`AxRenewalService#cancelImplementation`: a live process here → killed exactly as before (ADR-049). None → `endIfStatus(generating → cancelled)` now, staging copy deleted after commit (guarded), `clearStaging`, audited with `hadLocalProcess: false`. If the compare-and-set loses (the run finished between read and close), 409 "this run is not currently generating". A process still alive on a teammate's backend is not reached. It keeps running until it ends, then finds its run closed and discards its result (§2.1).

### 2.3 Startup recovery (`AxRenewalRunRecovery`, on `ApplicationReadyEvent`)

`findOrphaned(now − GENERATING_ORPHANED_AFTER)` returns committed `running`/`applying` rows, and `generating` rows started more than **`GENERATING_ORPHANED_AFTER` = 3 × the CLI timeout = 60 minutes** ago. That is longer than any genuine attempt including the copy before and diff after, so on any backend. Each is ended `failed` by compare-and-set on the status it was read with (a run that moved on is skipped), with a plain reason ("interrupted — the backend stopped before this run finished…"; for `applying`, a warning that the destination may be partly updated). Its staging copy is deleted. Best-effort: an exception is logged and never stops the backend from starting.

A run younger than 60 minutes is not left waiting for this: Cancel (§2.2) closes it immediately.

### 2.4 Guarded staging delete, now shared

`AxRenewalImplementationRunner#deleteStagingCopy` (moved from `AxRenewalService`, ADR-072) deletes a path read from the database only if it is a directory directly under the system temp directory whose name starts with `ax-renewal-generate-`. A tampered value cannot aim the recursive delete elsewhere, and a path from another developer's machine simply isn't present and is left alone.

## 3. Considered Alternatives

| # | Alternative | Why not |
|---|---|---|
| A | Fail every `generating` run at startup | Kills teammates' live runs on the shared database every time anyone restarts |
| B | Record the owning host/instance on each run (new column) | Needs a migration; hostnames and temp paths are not reliable identities on company machines; Cancel + compare-and-set cover the same cases without it |
| C | Heartbeat column refreshed by the runner | More moving parts (scheduler, migration) for a development-time problem |
| D (adopted) | Compare-and-set everywhere + Cancel without a process + age-based startup recovery | No schema change; safe across backends; a stuck run can be cleared immediately by a person, and is cleared automatically after 60 minutes otherwise |

## 4. Consequences

- **Positive:** a stuck run no longer blocks its project forever, and its staging copy is removed. A late process can never overwrite a cancel, a recovery, or another backend's result.
- **Accepted:** cancelling a run that is in fact alive on a teammate's backend closes it here while that process keeps working until it ends (≤ 20 minutes of wasted local compute), then discards its result. Startup recovery waits 60 minutes before treating a `generating` run as dead.
- **No schema change.** No migration.

## 5. Verification

| Item | Method | Result (2026-10-01) |
|---|---|---|
| Runner discards its result when its run was closed before or during generation; keeps it otherwise | `AxRenewalImplementationRunnerTest` | Pass |
| Cancel without a process closes the run, clears and (guardedly) deletes staging; a lost race is a 409; a live process path unchanged | `AxRenewalCancelImplementationTest` | Pass |
| Recovery: asks with the 60-minute cutoff, fails orphans with the right reason, skips a run that moved on, never deletes a non-staging path, never blocks startup | `AxRenewalRunRecoveryTest` | Pass |
| `findOrphaned` and the compare-and-set SQL against real Postgres | `AxRenewalRunRecoveryIntegrationTest` (Docker required — skipped locally; runs in CI) and a hand-run of the same SQL on a scratch PostgreSQL 16.15 cluster | Integration test skipped (no Docker); hand-run SQL correct (see the implementing session's report) |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Startup recovery, safe temp cleanup, cancel without a process | ACCEPTED |
