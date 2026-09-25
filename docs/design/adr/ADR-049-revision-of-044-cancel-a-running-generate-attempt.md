# ADR-049: Cancelling a Running Generate Attempt, Revising ADR-044

> **Status**: PROPOSED
> **Date**: 2026-09-25
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Revises [ADR-044](ADR-044-generate-and-apply-code-changes.md)'s Generate stage. Reuses [ADR-048](ADR-048-run-locally.md)'s in-memory process-tracking/process-tree-kill pattern for a second, unrelated long-lived process.

---

## 1. Context

A Generate run (`AxRenewalImplementationRunner.runGeneration`) can run for up to 20 minutes, and until now the only way it ever stopped was on its own — success, timeout, or crash. Nothing let the person watching it stop it early. The PM has asked for a Cancel button on the Rebuild/Implementation panel while a run is `generating`, that immediately kills the underlying process and guarantees nothing from it can ever be applied.

## 2. Decision

**A new `cancelled` terminal status, a new `POST .../implementation/{runId}/cancel` endpoint at the same authority as start/approve/reject, and an in-memory registry of the one live subprocess per run so cancel has something real to kill.**

### 2.1 Tracking the live process

`AxRenewalCodeGenerator.generate` gains a third parameter, `Consumer<Process> onProcessStarted`, invoked immediately after `ProcessBuilder.start()` — the same "hand the caller a live handle the moment it exists" shape ADR-048's `AxRenewalLocalRunner.start` already uses. `AxRenewalImplementationRunner` — already the one class holding a run's execution off the request thread (ADR-044 §2.4) — is the natural owner of a `Map<UUID, Process>`, registered in that callback and removed once `generate` returns, success or failure. Nothing here is persisted: a live `Process` handle cannot survive a backend restart regardless of what a row would claim (ADR-048's own reasoning, unchanged here).

### 2.2 Cancelling

`AxRenewalImplementationRunner.cancel(runId)` looks up the tracked process, records that this run was deliberately cancelled (a `Set<UUID>`, checked once and cleared when `runGeneration` reaches its failure branch), and kills the whole process tree — `Process.descendants().forEach(ProcessHandle::destroy)` then the process itself — exactly ADR-048 §2.4's reasoning: the CLI's own child processes are not reaped by destroying only the top-level handle. Destroying the process unblocks `generate`'s blocking reads/`waitFor` almost immediately, so `runGeneration` reaches its existing failure path (staging deleted, staging cleared) within moments — cancel does not wait for that to finish before returning to the caller; the frontend's existing poll (already in place for `generating`) picks up the terminal status within its normal interval.

### 2.3 A real status, not a repurposed `failed`

The run is marked `cancelled`, not `failed` — the same distinction this table already draws between `rejected` (a real result, a human said no) and `failed` (generation itself broke). Conflating "the user chose to stop this" with "generation genuinely broke" would misreport what happened to anyone reading the run's history later. `ax_renewal_implementation_run_status_check` widens to include it (`V46`).

### 2.4 What this guarantees

Because `cancel` only ever reaches a run that is still `generating`, and a cancelled run never reaches `awaiting_review`, Approve's own precondition (`status == awaiting_review`) already makes an approved-after-cancel outcome structurally impossible — no new guard is needed for "prevent any further changes from being applied": the existing state machine already refuses anything but a genuinely completed, reviewed run.

### 2.5 Authority

Same floor as start/approve/reject — Super Admin, or the `developer` role held exactly — because cancelling, like starting, is an action that changes what the backend's own machine is doing, not a passive read.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| 1 | Reuse `failed` with a `failureReason` of "cancelled" | No schema change | Loses the same real distinction `rejected`/`failed` already exist to preserve — a person scanning run history could not tell a deliberate stop from a genuine crash without reading prose | No |
| 2 | Cooperative cancellation (a flag `generate` polls) | No process-tree kill needed | The CLI call blocks on `readAllBytes()`/`waitFor()` with no polling point to check a flag from inside this class's control — would need restructuring the read loop for a capability ADR-048 already proved out with a hard kill | No |
| 3 | Let cancel wait for `runGeneration` to actually finish cleaning up before responding | Caller gets a fully up-to-date status in one round trip | Every other async operation in this feature (Generate itself, Run Locally) is already polled rather than awaited synchronously; adding a wait here is a second pattern for no real benefit given the poll already exists | No |

## 4. Consequences

### 4.1 Positive Impacts
- Closes the one gap left in a 20-minute-capable operation with no way to stop it early.
- Reuses ADR-048's process-tracking/kill pattern exactly rather than inventing a second way to manage a live subprocess.
- The state machine already guarantees a cancelled run can never be approved — no new guard, no new risk surface.

### 4.2 Negative Impacts / Costs to Accept
- In-memory tracking only: a backend restart mid-generation loses the ability to cancel that specific run from the API (the process itself is orphaned exactly as ADR-048 already accepts for Run Locally) — an existing, accepted cost of this feature's whole local-only execution model, not a new one.
- A brief window between Cancel returning and the run's status actually flipping to `cancelled` (bounded by the existing poll interval), during which the UI still shows `generating`.

### 4.3 Follow-up Work
- [ ] PM approval — `PROPOSED` until then; per `CONST-PROC-01` this is never self-approved.

## 5. References
- [ADR-044](ADR-044-generate-and-apply-code-changes.md) — the Generate stage this revises.
- [ADR-048](ADR-048-run-locally.md) — the process-tracking/process-tree-kill pattern this reuses.
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalImplementationRunner.java` — the new process registry and `cancel` method.
