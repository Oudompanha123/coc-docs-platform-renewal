# ADR-053: Rebuild Replays a Prior Applied Result Instead of Generating Again

> **Status**: PROPOSED
> **Date**: 2026-09-28
> **Author**: backend/frontend (paired), on the PM's explicit instruction
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Revises [ADR-044](ADR-044-generate-and-apply-code-changes.md) (Generate/Approve). Builds on [ADR-052](ADR-052-revision-of-043-051-source-path-per-call-everywhere.md)'s per-call source path — this ADR is what that one made necessary.

---

## 1. Context

The PM's request was direct: after a project has gone through Attach →
Analyze → Plan (Stack move, Pages, Database) → Output → a successful
Implementation, **every team member should be able to click Rebuild and get
the same generated source code** — not "a" result, *the* result.

`startImplementation` did not honour that before this ADR. "Rebuild" and
"Start implementation" were the same call, and the same call always meant
the same thing: if a local model and a filesystem destination were
available, ask the model to carry out the confirmed plan **again**, from
scratch, every single time. Two independent sources of drift sit on top of
each other there:

- **The model itself.** A CLI invocation is not a pure function of its
  prompt — the same confirmed plan, asked again, is not guaranteed to
  produce the same edits, the same files, or even the same *shape* of
  change twice.
- **The source.** Per ADR-052, the legacy checkout is now a path each team
  member types in themselves. Two people's checkouts of "the same" legacy
  project are not guaranteed to be byte-identical — a different branch, an
  uncommitted local change, a different line-ending setting.

So "click Rebuild" already meant two different things depending on who
clicked it and when, even with nothing about the Plan having changed in
between. That is the opposite of what was asked for.

- Related requirements: FR-AXR (AX Renewal workspace)
- Related risks: a team member reviewing and approving a diff that is
  *not* actually the one their colleague already vetted, without any way to
  tell the difference

## 2. Decision

> **Once a project has an `applied` implementation run, Rebuild reuses that
> run's exact generated files for a new review cycle instead of asking the
> model again — provided the confirmed plan is still byte-for-byte the one
> that produced it. If the plan changed, or nothing has ever been applied,
> Rebuild falls back to ADR-044's existing two paths (real Generate, or the
> Phase-1 placeholder) exactly as before.**

### Key Choices

- **A hash decides "unchanged", not a timestamp.** `ax_renewal_implementation_run`
  gains `confirmed_plan_hash` — a SHA-256 of the exact confirmed-plan text
  `buildConfirmedPlanDescription` already builds, recorded on every real
  Generate run (and carried forward unchanged by a Replay run, since nothing
  about the plan produced it differently). At Rebuild time, the *current*
  plan is hashed and compared against the latest run's stored hash — an
  exact-content check, not an inference from confirmation timestamps, which
  would have to assume reconfirming always means the text actually changed.
- **Reused as a new review cycle, not applied silently.** Replay does not
  skip Approve. It inserts a new `ax_renewal_implementation_run` row
  straight at `awaiting_review`, copies the prior run's exact
  `ax_renewal_generated_change` rows onto it, and stops — a human on *this*
  team member's own session still has to open the review screen and press
  Approve before anything is written to *their* destination. Skipping that
  would mean a click nobody explicitly authorised writes files outside this
  application's own database, the one line ADR-044 draws hardest.
- **Zero new frontend surface.** `GeneratedChangesReview`, `approveImplementation`,
  and `rejectImplementation` already exist, already work on any run sitting
  at `awaiting_review`, and do not care whether the changes underneath came
  from a fresh model call or a replay. The only frontend change this ADR
  makes at all is one line of copy in `ImplementationPanel`, shown when
  `beforeReport.mode === "replay"`, saying plainly that nothing was
  generated again.
- **No local model, no source path, no wait — required for a replaying
  team member.** The entire value of this ADR is that a colleague without
  Claude Code installed, or without their own checkout of the legacy
  project at all, can still Rebuild and get the exact same result. Replay
  never touches `AxRenewalCodeGenerator`, never spawns a subprocess, and
  never validates a `sourcePath` — there is nothing to validate, because
  nothing is read from disk to produce it.
- **Still gated on a filesystem destination.** Exactly ADR-044's own
  precondition for Approve — Replay only ever offers a diff that Approve
  could actually apply. A `git_repo`/`other` destination falls straight
  through to the existing placeholder path, same as it always has.
- **A blank confirmed plan can never match.** `confirmedPlanHash` is null
  whenever `buildConfirmedPlanDescription` is blank (nothing concrete
  decided yet) — null is never treated as equal to a stored hash, so a
  project that somehow lost its plan content cannot "replay" an old result
  against an empty confirmation.
- **Audited distinctly.** `ax_renewal.implementation_replay` is its own
  action, not folded into `ax_renewal.implementation_start` — a reader of
  the audit trail should be able to tell "the model ran again" from "a
  stored result was reused" without opening the run itself.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Replay a prior applied run's exact changes when the plan hash matches, gated on the same review/approve step (this ADR) | Genuinely deterministic; no new CLI/source-path requirement for anyone after the first person; reuses 100% of the existing review UI | One more column, one more code path to reason about in `startImplementation` | **Adopted** |
| B | Make the model call itself deterministic (fixed seed, temperature 0, pinned model version) | No new data model | Not a real engineering commitment against an agentic CLI tool with no exposed sampling controls; does not fix the "different machine, different checkout" half of the problem at all | Not adopted |
| C | Persist the applied output as a git commit/tag at the destination, and have Rebuild mean "check out that ref" | Uses existing VCS machinery for a `git_repo` destination | Does nothing for `filesystem_path`, the only destination kind Generate/Approve ever write to automatically; a bigger, orthogonal feature (destination-side versioning) not what was asked for | Not adopted |
| D | Skip Approve for a replay, since the content is provably identical to something already approved once | One click, fully automatic on every machine | Silently writes outside this application's database without an explicit action on *this* session — the boundary ADR-044 treats as non-negotiable, even though the bytes are the same | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts

- Directly delivers what was asked: every team member who clicks Rebuild
  after a successful implementation gets the identical generated source,
  reviewed and applied to their own destination.
- Removes the CLI/source-path requirement for every teammate *after* the
  first successful Approve — a large practical unblock for a team where not
  everyone has Claude Code configured locally.
- Faster too, as a side effect: a replay is a database copy, not a
  multi-minute subprocess call.

### 4.2 Negative Impacts / Costs to Accept

- **One more column and one more branch in an already-detailed method.**
  `startImplementation` now has three outcomes to reason about instead of
  two.
- **A hash mismatch after a trivial, meaning-preserving edit still forces a
  fresh Generate.** Re-typing the exact same Stack move target and
  reconfirming would, in principle, reproduce the same hash — but any
  actual text change, however small, forces a real regeneration rather
  than a replay, which is the conservative and correct default.

### 4.3 Follow-up Work

- [ ] PM decision: should Reject also have a distinct message when
      rejecting a replayed (rather than freshly generated) set of changes?
      Left as today's existing Reject behaviour for now.
- [ ] If Generate ever gains per-file review/approval (noted as deferred in
      ADR-044 itself), Replay's "reuse the whole prior set" design should be
      revisited alongside it.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| No prior run → no replay attempted | `AxRenewalRebuildReplayTest` | Every build | `findGeneratedChanges`/`insertGeneratedChanges` never called |
| Matching hash + applied + filesystem destination → replays, model never asked | `AxRenewalRebuildReplayTest` | Every build | `generator.generate` never invoked; new run at `awaiting_review` with the prior run's exact files |
| Changed plan (hash mismatch) → generates afresh, never replays a stale result | `AxRenewalRebuildReplayTest` | Every build | No replay-path calls |
| A rejected/failed prior run is never replayed | `AxRenewalRebuildReplayTest` | Every build | No replay-path calls |
| A non-filesystem destination is never replayed, even with a matching hash | `AxRenewalRebuildReplayTest` | Every build | No replay-path calls |
| A real Generate run records the confirmed-plan hash for a later Rebuild to match against | `AxRenewalRebuildReplayTest` | Every build | Returned run's `confirmedPlanHash` is non-null and correct |

## 6. References

- Related code: `backend/src/main/resources/db/migration/V48__ax_renewal_implementation_confirmed_plan_hash.sql`,
  `AxRenewalImplementationRun.java` (`confirmedPlanHash`, `REPORT_MODE_REPLAY`),
  `AxRenewalImplementationRepository.java` (`insert` with a hash),
  `AxRenewalService.java` (`startImplementation`/`replayAppliedRun`/`sha256Hex`),
  `audit/AuditAction#AX_RENEWAL_IMPLEMENTATION_REPLAY`,
  `frontend/app/ax-renewal/page.tsx` (`ImplementationPanel`'s one new line)
- Related ADR: ADR-037 (AX Renewal), ADR-044 (Generate/Approve, the
  precondition this revises), ADR-048/049 (Run Locally, cancel — the other
  places "one active thing per project" already applies), ADR-052 (the
  per-call source path this ADR's whole premise depends on)

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
