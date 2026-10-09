# ADR-105: Disabling a Claude Usage Member Stops Tracking and Hides Them from the Dashboard

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-09
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction: first *"Please implement option 2 … exclude them from the active dashboard member table, charts, token totals, cost totals …"*, then *"Stop collecting new usage data from that member. Enforce this on the backend … Reject usage uploads and scan/check-in requests from disabled members, including `/api/ingest`, `/api/ingest/scan`, and `/api/ingest/scan-log` … Historical data means data collected before disabling. Do not promise to recover usage that was rejected while the member was disabled."* Recorded here as a transcription of that instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Revises ADR-035. Before, a removed member stayed listed and counted in the table, chart and totals, and their reporter's uploads were still stored; only Active Users and Near Limit left them out. ADR-035's other rules are unchanged: nothing is deleted, and status changes only when an admin chooses. Adds a status check to the ingest routes of ADR-047, ADR-097 and ADR-099; credential handling itself is unchanged.

---

## 1. Context

The Disable confirmation said a member "will stop appearing in this dashboard's per-user usage and charts". In fact only the Active Users and Near Limit counters left them out. `ClaudeUsageService.dashboard` rolled up every roster row, so a disabled member who kept reporting still appeared in the member table, the stacked chart, and the token and cost totals.

## 2. Decision

1. **Excluded in the backend, before anything is summed.** `dashboard()` separates members whose status is `removed` and drops their daily rows from the inputs to every figure: the member table, chart (`rollupDaily`), totals (`totalsOf`), Active Users, Near Limit and `lastUpdated`. All figures come from the same two filtered lists, so they always agree.
2. **No new data while disabled.** `ClaudeUsageService.recordUsage` (`POST /api/ingest`), `recordScan` (`POST /api/ingest/scan`) and `ClaudeUsageScanLogService.record` (`POST /api/ingest/scan-log`) refuse a disabled member with **403**, problem `code: "tracking-disabled"`. Nothing is written.
   - The check is in the service and uses the email being reported, after the controller's credential check. It covers both credential types, including the unscoped shared secret.
   - It runs before the payload is validated.
3. **No backfill after Enable (V78, `claude_usage_tracking_pause`).** Disable opens a pause row (`disabled_at`); Enable closes it (`resumed_at`, the effective tracking-resumed time). Every past window is kept, so an old window can't be reached by a later `--days` backfill either. After Enable, a record from a window is refused with **409**, problem `code: "disabled-period"`:
   - **Usage (one reporting day, Asia/Phnom_Penh):** refused when its date is on or between the disable day and the resume day, both inclusive. A daily total cannot be split at the moment tracking stopped or resumed, so either boundary day would carry disabled-period usage. **Tracking effectively resumes on the day after Enable.** A row stored for the disable day before disabling is kept as it was.
   - **Scan logs (a moment):** refused when `startedAt` is in `[disabled_at, resumed_at)`.
   - **Scan check-ins:** describe "now", so they are accepted as soon as the member is enabled.
   - **Members already disabled** when V78 runs get an open pause, dated by their newest `claude_usage_member.remove` audit entry, falling back to `updated_at`.
4. **The CLI (0.5.0) acts on the code, never the wording.**
   - `tracking-disabled` prints *"Claude usage tracking has been disabled for your account by an administrator … Contact your Coc Docs administrator"*, with no login advice, and the queued scan log is dropped.
   - `disabled-period` marks the day `skipped` in the local ledger, so a plain scan never sends it again, and the scan continues with the other days.
   - A genuine 401/403 keeps its login advice, and its scan log stays queued for a fresh login.
5. **Still findable.** The dashboard response gains `disabledMembers`, shown in a collapsed "Disabled members (N)" panel with Enable.
6. **History preserved.** Disable and Enable never touch usage rows. Rows collected before disabling come back into every figure on Enable.
7. **Reports never re-enable.** A refused report cannot change status, and only an admin's Enable does.
8. **Wording.** The confirmation dialog says tracking stops and the member is hidden from the dashboard. It says earlier usage is kept, usage from the disabled period is not recorded even after Enable, and new usage counts from the day after Enable.

## 3. Consequences

- **Boundary days are lost.** The disable day's usage after the moment of disabling is lost, and so is the whole resume day, including usage after Enable on that day. That is the price of a day-level total, accepted so that no disabled-period usage gets in.
- **Older CLIs (< 0.5.0) are still blocked, but noisily.** A 403 ends their scan with the old "log in" advice. After Enable, an old CLI's ledger retries refused days, gets 409, treats it as a failed upload, and stops the scan at that day. The server still refuses every such day, so nothing gets in. But until the refused days age out of the 30-day lookback, those scans stop at the first refused day, and newer days queued behind it wait. Teammates should update to 0.5.0.
- **Migration numbering.** V78 assumes V74–V77, which are on other branches or untracked, land first or are renumbered. Flyway refuses a lower version arriving after V78 has been applied.
- **Same rule in the self-scoped view.** `dashboardFor` for a non-super_admin applies the same rule. The personal `/api/v1/claude-usage/me` is unaffected.

## 4. Files

`backend/src/main/resources/db/migration/V78__claude_usage_tracking_pause.sql`; `backend/.../claudeusage/ClaudeUsageService.java` (`dashboard`, `remove`, `restore`, `recordUsage`, `recordScan`, `requireTrackingEnabled`, `requireDayOutsidePauses`, `requireMomentOutsidePauses`), `ClaudeUsageTrackingPauseRepository.java`, `ClaudeUsageScanLogService.java` (`record`), `web/ApiException.java` + `ApiExceptionHandler.java` (`code`), `ClaudeUsageDashboard.java`, `web/ApiDtos.java` (`ClaudeUsageDashboardResponse`); tests `ClaudeUsageServiceTest`, `ClaudeUsageTrackingPauseTest`, `ClaudeUsageTrackingPauseRepositoryIntegrationTest`, `ClaudeUsageScanLogServiceTest`, `ClaudeUsageIngestControllerTest`, `SecurityRulesTest`; `tools/claude-team-usage/src/{upload,scan,scan-log,ledger}.js`, `test/{scan-log,cli}.test.js`, `README.md`, 0.5.0; `frontend/lib/admin/claudeUsage.ts`, `components/claude-usage/{AdminClaudeUsageView,DisabledMembersPanel,RemoveMemberModal}.tsx`, `DisabledMembersPanel.test.tsx`.
