# ADR-107: Live Scan Status — Running Scans, Per-Stage Results, and Members' Own Scan Logs

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-14
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction to improve `/claude-usage/monitoring`: show In Progress / Success / Partial Success / Failed / No Recent Scan, update automatically, *"do not display a scan as successful until the backend confirms the actual result"*, *"distinguish between scanning successfully, uploading successfully, and recording the scan log"*, *"regular users should see their own scan status"*, and *"add the minimum necessary backend changes if needed"*. Recorded here as a transcription of that instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Extends ADR-099 (scan log; V67). Keeps ADR-100 (team-wide Claude Usage data is super_admin only) and ADR-105 (disabled members are refused on every ingest route).

---

## 1. Context

ADR-099's scan log row arrives once, when a scan **ends**. So the server could not tell that a scan was running, and a scan that never finished (the PC slept, the process was killed) left no trace at all. Nothing could honestly say "In progress". The Scan Logs page and its API were also super_admin only. Every other member had no way to see whether their own reporter worked, short of opening `scheduled-scan.log` on their PC.

## 2. Decision

1. **The CLI announces a scan when it starts.** From `claude-team-usage` 0.6.0, `scan` sends `POST /api/ingest/scan-log/start` with `{scanId, email, trigger, cliVersion, startedAt}`. It uses the same bearer check as `/scan-log`, makes one attempt, and never retries or queues the start, because a late "started" says nothing the result does not. The request runs alongside the scan, and the scan waits for it only before sending its result, so the start reaches the server first. It never makes a scan slower and never changes the scan's outcome.
2. **One row per scan, running then finished (V80).** The start inserts the row with `status = 'running'` and `finished_at` null. A check constraint ties these together: a running row has no finish time, and a finished row always has one. The result, sent to the unchanged `/scan-log` endpoint, completes the same row with an upsert, `on conflict (client_scan_id) do update … where status = 'running' and email = excluded.email`. A resent result, or a start that arrives after its result, never changes a finished row. A different account cannot complete someone else's running row. Older CLIs still insert finished rows directly, as before.
3. **No result in time reads as `incomplete`.** Nothing is rewritten. If a row is still `running` 30 minutes (`RESULT_TIMEOUT`) after the server received its start (server time, not the PC's clock), reads return it as `incomplete`. The page shows that as **Failed — "No result received"**. A result queued on the PC can still arrive later and complete the row.
4. **Members read their own scans.** The new routes are `GET /api/v1/claude-usage/me/scan-logs` and `/me/scan-logs/{id}`, both at the `USER` floor. They are scoped by the session's email, never by a parameter. Someone else's scan id returns 404, the same answer as a missing one. A member's copy keeps only the first line of each error and step text, with file paths replaced by `[path]`. The plain-language diagnosis still works, because it matches on HTTP statuses and network codes, but no stack trace or folder layout is shown. The super_admin routes are unchanged and return full detail.
5. **The page shows only what the server confirmed.**
   - The status badges are In Progress, Success, No New Usage, Partial Success, Failed and No Recent Scan. Each has an icon and a text label, so the status never depends on color alone.
   - A "Latest scan" panel shows the start, completion, duration and last-updated times.
   - Every scan shows three stages, each judged from the stored row: **Scan** (reading usage), **Upload** (`upload_status`) and **Scan record** (received by the server). A scan that read usage but could not upload it never shows as a full success.
6. **Polling, not push.** No push channel exists for scan events, so the page re-reads the same endpoint while the tab is visible. It polls every 15 s, every 5 s while a scan in view is running, and backs off to 60 s while refreshes fail. Nothing new was added for this.
   - A scan that starts or finishes while the page is open is announced once, keyed by scan id and outcome, in a dismissible notice and an `aria-live` region.
   - Nothing is announced on the first load or after a range change.
7. **Who sees what.**
   - A super_admin sees the team view at `/claude-usage/monitoring`.
   - Any other role the admin shell admits sees "My Scan Logs" at the same URL, without the Dashboard tab.
   - A plain `user` cannot enter the shell. They get a "Your scans" section with the same status panel on My Claude Usage (`/account/settings`).

## 3. Alternatives

| Alternative | Why not |
|---|---|
| A separate `claude_usage_scan_start` table | Two rows per scan, a join on every read, and a second retention rule. One row whose status moves is simpler, and the upsert's `where` clause keeps finished rows unchanged. |
| Server-sent events / WebSocket for live updates | No push infrastructure exists for this. A scan takes seconds and the page already polled. Faster polling while a scan runs gives the same result without a new channel. |
| Mark overdue rows `failed` in the database (a sweeper job) | That writes something nobody reported. A late result could then not complete the row without overwriting a "failure". Deciding `incomplete` at read time keeps the stored data true. |
| Queue the start like the result | A start delivered after its result is meaningless, and queuing it would only add local state on the PC. |
| Strip error text entirely for members | The diagnosis ("Authentication failed — run `claude-team-usage login`") is built from that text, and it is the part a member needs most. Keeping the first line without paths keeps the diagnosis and drops the sensitive detail. |

## 4. Consequences

- **Schema:** V80 makes `finished_at` nullable, adds `running` to the status check, adds the running/finished check, and adds the `(email, started_at desc)` index for the member read.
- **API:** `durationMs` and `finishedAt` in the scan-log DTOs can now be null (`running` / `incomplete`). `status` can be `running` or `incomplete`. The frontend is the only consumer (ADR-012).
- **CLI:** release 0.6.0 is needed for "In progress" to appear. Until teammates upgrade, their scans show exactly as before, with the result only.
- **Security:** one new `permitAll` ingest path (same bearer check as its siblings) and two new `USER`-floor reads scoped by the session. Both are covered in `SecurityRulesTest`.

// req: FR-USAGE-002, NFR-SEC-PII
