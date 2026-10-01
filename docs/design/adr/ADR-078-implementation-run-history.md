# ADR-078: Implementation Run History

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("Implementation Run History … work on this task in a new branch") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Builds on [ADR-044](ADR-044-generate-and-apply-code-changes.md) (Generate → Review → Apply), [ADR-062](ADR-062-ai-error-assistant-and-ui-customization.md) (error-fix and UI-change runs, revert) and [ADR-070](ADR-070-revision-of-069-strict-project-access.md) (who may read a project).
> **Numbering note:** first drafted as ADR-077; renumbered to 078 when `dev` took ADR-077 for per-account inbox polling.

---

## 1. Context

A project showed only its **latest** implementation run (`detail.latestImplementationRun`). Every earlier one — plan builds, error fixes, UI changes, and how each ended (applied, rejected, cancelled, failed, reverted) — was stored in `ax_renewal_implementation_run`, but there was no way to see it: who started a run, when, why it failed, what it changed.

## 2. Decision

> A read-only **History** list in Build → Implementation, from a new `GET /projects/{id}/implementation/runs` (newest first, at most 50). No database migration; the rows already exist.

- **Backend:**
  - `AxRenewalImplementationRepository#listSummaries` is one query: the starter's display name joined from `account` (never the email — NFR-SEC-PII), and each run's changed-file count as a correlated count. A page of history therefore never costs a query per row.
  - It returns its own `AxRenewalRunSummary` rather than a wider `AxRenewalImplementationRun`, so the existing run record — and every test that builds one — is untouched. No reports and no staging path.
  - `AxRenewalService#listRuns` goes through `requireMember`: members and super admins read it; a non-member gets the missing-project 404 (ADR-070). It is a plain read at the existing `GET /api/v1/ax-renewal/**` floor, so `SecurityConfig` is unchanged.
- **Frontend:** `RunHistory` under the current run.
  - **Each row:** type (Plan build / Error fix / UI change), a status badge, "Started by <name> · <when> · took <duration>" or "in progress", and the changed-file count.
  - **Run details:** the failure reason, and the instruction — a UI change's request or an error fix's captured failure, clamped to two lines, in full when opened. This is the same text the current-run view already shows.
  - **Opening a row** lists its changed files through the existing `…/{runId}/changes` endpoint, fetched on first open rather than with the list.
  - **Refreshes** whenever the latest run's id or status changes.
- **Read-only, deliberately.** No approve, reject or revert from history. Revert stays "the latest applied run only" (ADR-062), on the current run above.

## 3. Consequences

- **Positive:** a team can see what has been tried on a project, by whom, and what came of it, including failures and reverts that the latest-run view had hidden.
- **Accepted:** capped at 50 runs, with no paging. An error fix's captured failure can be long; it is clamped in the list.

## 4. Verification

| Item | Method |
|---|---|
| Newest first; starter's display name; per-run changed-file count; another project's runs excluded; limit honoured | Hand-run of the exact query on a scratch PostgreSQL 16.15 cluster after V1–V59 |
| Service returns the repository's order unchanged, asks for at most 50, audits nothing | `AxRenewalRunHistoryTest` |
| A non-member gets the missing-project 404 | `AxRenewalMembershipTest` (on the every-project-access list) |
| Route: a plain read for every role at the user floor; 401 without a session | `SecurityRulesTest$AxRenewalPath` |
| Rows render type, status, starter, duration / in progress, files, instruction, failure; empty and error states; files fetched only on open, never for a run with none; no act-on controls; re-read when the latest run changes; duration formatting | `RunHistory.test.tsx` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Implementation Run History, on a new branch | ACCEPTED |
