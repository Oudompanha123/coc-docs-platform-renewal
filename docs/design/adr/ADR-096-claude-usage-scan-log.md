# ADR-096: Claude Usage Records One Scan-Log Entry Per Reporter Scan ("View Logs")

> **Status**: ACCEPTED — implemented (PM decision, direct in-session instruction)
> **Date**: 2026-10-07
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction. Recorded here as a transcription of that explicit instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Extends ADR-095 (last scan time), ADR-060 (claude-team-usage CLI) and ADR-035 (ingest). Leaves ADR-058/ADR-074's upload rules — whole-day upserts, `isDue()` — and ADR-095's `last_scan_at` unchanged.

---

## 1. Context

After ADR-095 the dashboard shows two timestamps per person: **Last scan** (the latest check-in) and **Last reported** (the latest upload). Neither says what happened on any given scan. When a teammate's reporter stopped reporting, an admin could not tell whether the scheduled task ran at all, which step failed, or why, without asking that teammate for `%APPDATA%\claude-team-usage\scheduled-scan.log`.

The product owner asked for a **View Logs** page in the Claude Usage section: a history of every scan with its duration, counts, outcome and, for a failure, the failed step and error, visible without opening server logs. A hard requirement: **"no new tokens" is a successful scan**, never a warning or an error.

- Related requirements: FR-USAGE-002 (reporter ingest), FR-USAGE-001 (team dashboard)

## 2. Decision

> Every real `claude-team-usage scan` (not `--dry-run`) sends one record to a new `POST /api/ingest/scan-log`, stored in a new table `claude_usage_scan_log` (V66). An admin-only page at `/claude-usage/logs` lists and explains them. The backend derives Success / Warning / Failed from the steps.

### Key Choices

1. **Storage — `V66__claude_usage_scan_log.sql`.** One row per scan. It holds the client-generated `client_scan_id` (unique, so a resend is ignored), `member_id` (nullable, `on delete set null`) plus `email`, `trigger` (scheduled/manual), `cli_version`, `started_at`/`finished_at` (the PC's clock, describing the scan) and `received_at` (server time). It also holds the derived `status`, `upload_status`, the counts (`transcript_files`, `responses`, `duplicates`, `new_tokens`, `days_uploaded`), `error_step`/`error_message`, and `steps` jsonb. Kept **90 days**, pruned on insert. It is a troubleshooting aid, not an audit record, so `audit_log`'s ≥1-year rule does not apply.
2. **A fixed step catalogue**: `start`, `find-transcripts`, `parse-usage`, `deduplicate`, `calculate-usage`, `check-new-usage`, `upload` (upload *or* check-in), `complete`. Each step is `success`/`warning`/`failed`/`skipped` (never ran). The server rejects unknown keys and fills a missing step as `skipped`, so every timeline has all eight steps in order.
3. **Status is server-side**: `failed` if any step failed (or `errorStep` is set), else `warning` if any step warned, else `success`. The CLI never sends a status. "No new usage" is a `success` step, so the scan is a success. Warnings are things that completed but deserve a look: a transcript file that could not be read, or a check-in that the server did not record.
4. **Endpoint**: `POST /api/ingest/scan-log` uses the same bearer check as `/api/ingest` (shared secret, or a per-account token limited to its own email) and the same `permitAll()` filter-chain exception class. It writes no usage and does not move `last_scan_at`. An email with no roster row is still logged (`member_id` null): a first scan that fails before its first upload is exactly the one worth seeing.
5. **Delivery when the server is down**: the CLI writes each record to a local outbox (`scan-logs-pending.json`, newest 50) and sends it oldest-first. It stops at the first transient failure (network, timeout, 5xx) and keeps the rest for the next scan. It drops records the server definitively refused (400, or 404 from an older server), and keeps 401/403 records, which a fresh `login` fixes. Each record is a single request with no retry (`send(..., { retry: false })`) under the existing 10 s timeout (CODE-002). A record that arrives more than 2 minutes after its scan finished is labelled in the UI as delivered from the queue.
6. **Privacy**: counts, step names and short messages only — never the token, a transcript line or a prompt. The CLI masks `coc_…` tokens and `Bearer …` values and replaces the home directory with `~`. The server masks tokens and bearer values again, and clips details to 300 characters and errors to 500.
7. **Admin reads**: `GET /api/v1/admin/claude-usage/scan-logs?from&to` takes ISO dates, inclusive, in the team's Asia/Phnom_Penh zone. Without dates it returns the last 7 days; a range may cover at most 92 days, and at most 2,000 rows come back, newest first, with `truncated`. `GET …/scan-logs/{id}` adds the steps. Both sit under the existing `/api/v1/admin/**` ADMIN floor. Each record has a readable `scanRef` (`SCAN-yyyyMMdd-HHmmss-XXXX`), built from the start time plus four characters of the client id.
8. **UI**: `/claude-usage/logs` sits under the same admin-only shell as `/claude-usage`, with a Dashboard / View Logs tab strip on both pages. The page has summary cards (Total, Successful, Warnings, Failed, Last Scan) and filters (date range, user, status, search). Date range is fetched from the server; the other filters work on the loaded rows. The summary cards ignore the status and search filters. The page has a table and a detail modal with scan information, an error panel and the step timeline. It reuses the existing stat card, pagination, modal, field and pill styles.

## 3. Alternatives Considered

| Alternative | Why not |
|---|---|
| Add fields to `last_scan_at` / `/api/ingest/scan` | One value per member cannot hold a history, and failed scans never reach that endpoint. |
| Ship `scheduled-scan.log` text to the server | Unstructured, larger, and harder to redact. A fixed step catalogue makes "which step failed" answerable without parsing. |
| Let the CLI send its own status | Two places would decide what "warning" means. Deriving it server-side keeps the rule in one place, and an older or altered client cannot mark a failure as a success. |
| Retry log delivery inside the same scan | Doubles the wait on an offline PC for no gain. The next scheduled scan is at most a few hours away. |

## 4. Consequences

- One extra small request per scan; offline scans add a short local file.
- Token maths, `isDue()`, uploads and `last_scan_at` are untouched. A reporter older than 0.4.0 keeps working and simply produces no log rows.
- **Last scan**, **Last reported** and the **scan log** stay three separate things: the latest check-in, the latest upload, and the history of every scan.
- Scans from a PC with a wrong clock show at that clock's time (the start time describes the scan). The server rejects a `finishedAt` more than a day in the future, and shows `received_at` alongside.
- A scan that never starts (Task Scheduler disabled, Node missing, not signed in) produces no record. A missing row at 11:00 or 16:00 is itself the signal.
- The SQL migration is exercised only by the Testcontainers integration suite, which needs Docker.

## 5. Files

`backend/src/main/resources/db/migration/V66__claude_usage_scan_log.sql`; `claudeusage/ClaudeUsageScanLog{,Repository,Service}.java`; `web/ClaudeUsageIngestController.java` (`/api/ingest/scan-log`), `web/AdminClaudeUsageController.java` (`/scan-logs`), `web/ApiDtos.java`, `config/SecurityConfig.java`; `tools/claude-team-usage/src/{scan-log.js,scan.js,usage-parser.js,upload.js}`, `bin/cli.js`, 0.4.0; `frontend/app/(shell)/claude-usage/logs/page.tsx`, `components/claude-usage/{ScanLogsView,ScanLogTable,ScanLogDetailModal,ScanStatusBadge,ClaudeUsageTabs}.tsx`, `lib/claudeUsage/scanLogs.ts`, `lib/admin/claudeUsage.ts`.
