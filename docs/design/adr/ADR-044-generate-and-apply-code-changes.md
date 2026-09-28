# ADR-044: Generating and Applying Real Code Changes for AX Renewal Implementation

> **Status**: PROPOSED, revised in part by [ADR-053](ADR-053-rebuild-replays-the-applied-result.md)
> **Date**: 2026-09-23
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Extends [ADR-043](ADR-043-local-claude-analysis.md)'s local-only local-Claude pattern from read-only analysis to a write-capable generation step. Does not touch ADR-011 (security model) or ADR-012 (two-service split).
>
> **Note (ADR-053, 2026-09-28)**: Rebuild (a second or later `startImplementation`
> call) no longer always asks the model again. Once a project has an
> `applied` run and the confirmed plan is unchanged since, Rebuild replays
> that run's exact generated changes into a new `awaiting_review` cycle
> instead. The Generate mechanism this ADR describes, and Approve/Reject's
> own preconditions, are otherwise unchanged — Replay produces the same
> shape of run this ADR already specifies, just without a fresh model call
> behind it.

---

## 1. Context

`AxRenewalService.startImplementation` has always been an honest placeholder: it records which Plan sections were confirmed, restates the destination, and says plainly *"this phase does not generate code automatically."* No file has ever been written by AX Renewal to anything outside its own Postgres tables — a deliberate choice, not an oversight, made explicit in that method's own Javadoc: *"A real tool must not invent numbers it did not measure."*

The PM has now asked for the real thing: given a confirmed Plan (stack-move targets, page mappings, database changes, an architecture description) and a real attached project, actually produce code changes and get them into the destination — using the same local Claude Code capability ADR-043 already wired in for analysis, never fabricating a result, and with a human reviewing what would change before anything lands in the destination.

*(Note on citation drift: the existing code — `AxRenewalService`, `AxRenewalDestination`, `AxRenewalImplementationRun` — cites "ADR-037" throughout. `ADR-037` is now officially "Outgoing webhook integrations" — a reverted, unrelated feature per `ADR-INDEX.md` — so that citation no longer points anywhere real. Flagged here so nobody chases the wrong file; not something this ADR attempts to fix.)*

## 2. Decision

**When a local Claude Code binary is configured *and* the destination is a local filesystem path, `startImplementation` becomes a three-stage flow — Generate → Review → Apply — instead of one atomic action. Everything else (no local model, or a `git_repo`/`other` destination) keeps today's honest "nothing generated" behavior exactly as it is.**

### 2.1 Generate

A new endpoint starts a **background** run that:
1. Copies the attached project's real source (`source-path`, the same real folder `LocalClaudeAnalyzer` already reads for analysis) into a fresh, disposable **staging directory** the backend owns — never the original folder, and never the destination.
2. Invokes the local Claude Code CLI against that staging copy with `--add-dir <staging>`, in a mode that lets it **edit files** — not the read-only `--print` mode analysis uses. The prompt is the confirmed Plan restated as instructions (stack-move targets, page-path mappings, database change list, architecture description) — nothing invented on top of what was actually confirmed.
3. Diffs the staging copy against the untouched original to get a real, computed list of added/changed/removed files.
4. Persists that diff (new `ax_renewal_generated_change` rows, one per file) against the run, and sets the run to `awaiting_review`. The staging directory is kept until the run is approved or rejected.

If the CLI fails, times out, or the diff comes back empty, the run is marked `failed` with the reason recorded — never silently treated as success, the same "fall back rather than fabricate" rule `LocalClaudeAnalyzer` already follows.

### 2.2 Review

A person with the same authority `confirmSection`/`startImplementation` already require — Super Admin, or the `developer` role held exactly (`SecurityConfig`'s existing `hasAnyAuthority(SUPER_ADMIN.authority(), DEVELOPER.exactAuthority())` gate, reused unchanged) — opens the run and sees every proposed file: its change kind (create/modify/delete) and a diff against the original. They **Approve** or **Reject** the run as a whole for this phase — per-file selection is real and useful, but deliberately deferred (§4.3) so a first version stays buildable.

### 2.3 Apply

Only on Approve: the backend copies the approved files from the staging directory into the real destination path (`AxRenewalDestination.target`, `kind = filesystem_path` only), then deletes the staging directory and marks the run `applied`. On Reject, the staging directory is deleted and the run is marked `rejected` — the destination is never touched.

New table, one row per proposed file, child of `ax_renewal_implementation_run`:
```
ax_renewal_generated_change
  id, run_id, path, change_kind (create|modify|delete), diff (text), position
```
`ax_renewal_implementation_run.status` gains `generating`, `awaiting_review`, `applying`, `applied`, `rejected` alongside the existing `running`/`completed`/`failed`.

### 2.4 Execution model

Generation is asynchronous — a full-project transformation can run far longer than analysis's 3-minute cap (a 6-file smoke test alone took over two minutes end to end). A single-thread `TaskExecutor` bean runs the generate/apply work off the request thread; the run's own `status` column — already the shape the frontend polls project detail through — is exactly what ADR-043 already flagged as "the natural place to write a status into" if this ever stopped being synchronous.

### 2.5 What stays exactly as it is

- **`git_repo` and `other` destinations get no generation capability in this phase.** Writing to a remote repository needs push credentials and its own review-before-push story (most likely PR creation), which this ADR does not attempt. `startImplementation` keeps its current honest behavior for these.
- **No local model configured**: unchanged — the existing "this phase does not generate code automatically" message stands.
- **The attached source folder is never written to.** Only a disposable copy of it is.
- **`ProcessBuilder` with an argument array, prompt over stdin, no shell** — the exact command-injection defense `LocalClaudeAnalyzer` already uses, carried over unchanged.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| 1 | Write straight to the destination, no review step | Simplest | Directly contradicts what was asked — an unattended agent could overwrite real files with no chance to say no | No |
| 2 | Support `git_repo` destinations too (open a PR) | More useful end state | Needs a stored git credential and a push/PR integration — a second, security-sensitive feature this ADR would rather scope out than build hastily | Deferred (§4.3) |
| 3 | Run generation synchronously, like analysis | No new execution-model code | A full-project run can genuinely take much longer than 3 minutes; ADR-043 already anticipated this exact problem for a *smaller* one | No |
| 4 | Let Claude Code write directly into `source-path` (skip the staging copy) | One less copy step | The attached folder never being edited is the one guarantee this whole product has made from the start — breaking it for this feature alone is not acceptable | No |
| 5 | Store generated diffs in S3 (`S3AvatarStorage`/`S3ContentImageStorage` pattern) | Reuses an existing pattern | Both existing classes are narrowly built for image `MultipartFile` uploads with hardcoded size/type validation, not a general blob store; S3 itself is `[DEFERRED]` per ADR-012 §2 (CONST-TECH-08) — making this depend on a storage decision nobody has made yet is premature | No — plain Postgres `text`, same as every other AX Renewal field |

## 4. Consequences

### 4.1 Positive Impacts
- Closes the exact gap the PM asked about, for the one case that's safe to build now (local model, filesystem destination).
- Nothing here can silently overwrite real files — Apply is a deliberate, separate action from Generate, gated behind the same authority the rest of Plan already requires.
- Reuses every safety property `LocalClaudeAnalyzer`/ADR-043 already established (no shell, no source-folder writes, honest failure) rather than inventing new ones.

### 4.2 Negative Impacts / Costs to Accept
- Only `filesystem_path` destinations get real generation in this phase; `git_repo` — the more useful end state for most teams — is explicitly not built yet.
- Whole-run approve/reject, not per-file — a person who likes 9 of 10 proposed files still has to reject the whole run and try again.
- A staging copy of the whole attached project sits on the backend's disk for the life of a review — cleaned up on approve/reject, not before.
- The generation prompt sends the confirmed Plan and the copied source to whatever local Claude Code session is configured — the same trust boundary ADR-043 already accepted for analysis (developer's own machine, developer's own seat).

### 4.3 Follow-up Work
- [ ] PM approval — `PROPOSED` until then; per `CONST-PROC-01` this is never self-approved.
- [ ] Per-file approve/reject within one run.
- [ ] `git_repo` destinations: needs its own ADR (credential storage, PR-based review instead of a diff list).
- [ ] A retention/cleanup policy for rejected runs' staging directories if the process ever restarts mid-review.
- [ ] Whether a large generated diff ever needs pagination in the review UI.

## 5. References
- [ADR-043](ADR-043-local-claude-analysis.md) — the local-only subprocess pattern this extends.
- [ADR-039](ADR-039-revision-of-038-ax-role-tech-lead-and-reviewer.md) / [ADR-038](ADR-038-capability-grants-ax-renewal.md) — the Super-Admin-or-Developer authority this reuses unchanged.
- `backend/src/main/java/com/coc/docs/axrenewal/LocalClaudeAnalyzer.java` — the exact `ProcessBuilder` safety pattern this carries over.
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalService.java#startImplementation` — the current honest-placeholder behavior this extends without breaking for anyone without a local model or a filesystem destination.
