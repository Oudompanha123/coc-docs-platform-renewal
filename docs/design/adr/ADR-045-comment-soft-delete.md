# ADR-045: AX Renewal Comments Can Be Removed, Softly — and Still Cannot Be Edited

> **Status**: PROPOSED
> **Date**: 2026-09-23
> **Author**: backend/frontend (paired), on the PM's request
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Revises the comment surface introduced by [ADR-037](ADR-037-integrations.md). Unrelated to [ADR-044](ADR-044-assistant-chat-local-model.md)'s Chat mode, which stores nothing in the first place.

---

## 1. Context

A comment on an AX Renewal project was **write-once**. `AxRenewalCommentRepository`
had `listForProject` and `insert` and nothing else; the controller exposed only
`POST /comments`. There was no edit and no delete — not in the UI, and not as
an endpoint somebody could call by hand.

That was never a decision anybody recorded. It protected nothing in
particular, while being unforgiving about the ordinary case: a comment posted
on the wrong project, or a typo a person would rather not leave in front of
their team. The PM asked for it to be fixable.

The tension worth naming: this codebase treats recorded history as something
that accumulates rather than something that gets tidied. `audit_log` is
append-only by convention (`revoke update, delete ... from public`). A comment
thread is a lighter thing than an audit log, but it is still a record of what
people said to each other about a plan they later signed off on.

- Related requirements: FR-AXR (AX Renewal workspace), ADR-011 (authorisation
  resolved server-side)
- Related risks: a discussion being rewritten after the fact; an audit entry
  pointing at a row that no longer exists

## 2. Decision

> **A comment can be removed by its author or by a `super_admin`. The removal
> is soft — the row stays, marked with who removed it and when, and stops
> being listed. There is no edit, for anyone.**

### Key Choices

- **Soft, not hard.** `deleted_at` / `deleted_by` on `ax_renewal_comment`, with
  a check constraint that they are set together. The `comment_add` audit entry
  still refers to a row that exists, and a removal is itself auditable
  (`ax_renewal.comment_delete`, carrying `commentId` and whether it was the
  remover's own).
- **No edit at all.** Removing something you said is a different act from
  changing what you said after people have replied to it. The first is a
  correction; the second rewrites a conversation. Only the first is on offer.
- **Author or `super_admin` — rank alone is not enough.** An `admin`
  out-ranks a plain `user` but does not own their words. This is the one
  authorisation rule in `AxRenewalService` that `SecurityConfig` genuinely
  cannot make, because "is this yours" is row data; the filter chain holds the
  route at the `user` floor and the service adds the ownership test, reporting
  a refusal as 403.
- **Filtered once, in the repository.** `listForProject` excludes deleted rows
  rather than returning a flag every caller must remember to check. Nothing
  outside that class needs to know they still exist.
- **Two presses, not a modal.** The button reads *Remove*, then *Really
  remove*, with *Cancel* beside it. A dialog nobody reads is not a safeguard.
- **Idempotent and race-safe in one stroke.** The update carries
  `and deleted_at is null`, so two simultaneous removals produce one update,
  one audit entry, and a 404 for the loser — rather than the second person's
  name overwriting the first's.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Soft delete, author or `super_admin`, no edit (this ADR) | Fixes the real problem; history intact; audit entries keep referring to real rows | A removed comment is still on disk, which must not be mistaken for privacy | **Adopted** |
| B | Hard delete | Simplest mental model; the row is genuinely gone | An audit entry pointing at nothing; a thread that can be silently pruned; irreversible | Not adopted |
| C | Edit with an "edited" marker | Covers the typo case without losing the comment | Lets a position be rewritten after others replied to it; needs revision history to stay honest, which is a much larger feature | Not adopted |
| D | Leave it write-once | No work; nothing can be lost | The status quo nobody chose, and the complaint that prompted this | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts

- The ordinary mistake is fixable, by the person who made it, without an
  administrator.
- A `super_admin` can remove something that should not be on a project thread
  without deleting the project or editing the database by hand.
- The audit log gains a record of removals it did not have, so "this thread
  looks shorter than I remember" has an answer.

### 4.2 Negative Impacts / Costs to Accept

- **A removed comment is still stored.** This is a tidiness feature, not a
  privacy one. Anything that genuinely must not exist — a password pasted into
  a comment, say — still needs a deliberate hard delete by an operator, and
  this ADR does not provide one.
- One more partial index and two more columns on a small table.
- Somebody will eventually ask for edit. The answer is in §3 option C, not a
  reconsideration each time.

### 4.3 Follow-up Work

- [ ] PM decision: is a hard-delete path needed for genuinely sensitive
      content pasted into a comment, or is "raise it with an operator" enough?
- [ ] If the thread ever grows a reply/threading model, revisit what removing
      a parent means for its replies — nothing today depends on it.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| Only the author or a `super_admin` may remove | `AxRenewalCommentDeleteTest` | Every build | An `admin` removing another's comment is refused |
| The route is reachable at the `user` floor, anonymous refused | `SecurityRulesTest$AxRenewalPath` | Every build | 404 from the stub vs. 401 |
| A lost race records nothing | `AxRenewalCommentDeleteTest.a_lost_race_records_nothing` | Every build | No second audit entry |
| The button is offered to the right people only | `AxAssistantPanel.test.tsx` — "removing a comment" | Every build | Not shown on another's comment for a plain `admin` |
| One press does not remove | `AxAssistantPanel.test.tsx` — "takes two presses" | Every build | `deleteComment` not called |
| Removed rows never list | `AxRenewalCommentRepository.listForProject` — `deleted_at is null` | Code review | Single filter point |

## 6. References

- Related code: `backend/src/main/resources/db/migration/V43__ax_renewal_comment_soft_delete.sql`,
  `AxRenewalCommentRepository#findLive/#softDelete`, `AxRenewalService#deleteComment`,
  `web/AxRenewalController#deleteComment`, `config/SecurityConfig` (the DELETE matcher),
  `audit/AuditAction#AX_RENEWAL_COMMENT_DELETE`,
  `frontend/components/ax-renewal/AxAssistantPanel.tsx`,
  `frontend/lib/ax-renewal/api.ts#deleteComment`
- Related ADR: ADR-037 (AX Renewal), ADR-011 (server-side authorisation)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-23 | 1.0 | Initial draft | backend/frontend |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| | PM | | PENDING |
