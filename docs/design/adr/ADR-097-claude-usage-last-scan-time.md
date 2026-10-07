# ADR-097: Claude Usage Records "Last Scan" Separately From "Last Usage Update"

> **Status**: ACCEPTED — implemented (PM decision, direct in-session instruction)
> **Date**: 2026-10-06
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction. Recorded here as a transcription of that explicit instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Extends ADR-035 (Claude usage ingest) and ADR-060 (claude-team-usage CLI). Leaves ADR-058/ADR-074's upload rules — whole-day upserts, the CLI ledger's `isDue()` — unchanged.

---

## 1. Context

The dashboard's only timestamp was "Last reported": the newest `claude_usage_daily.reported_at`, which moves only when usage is uploaded. The CLI uploads a day only when it has grown since its last upload (`ledger.js` `isDue()`: tokens, requests or active time), so a scheduled scan that finds nothing new correctly uploads nothing — and "Last reported" stays at the earlier upload. A healthy 16:00 scan after a 14:50 upload therefore looked like a machine that had stopped reporting at 14:50.

Re-uploading identical usage just to move the timestamp was ruled out: it would rewrite unchanged rows and blur what "Last reported" means.

## 2. Decision

1. **Storage** — `V65__claude_usage_member_last_scan.sql` adds one nullable column, `claude_usage_member.last_scan_at`: the most recent completed scan from any of the member's machines. Server time on arrival (`greatest(last_scan_at, now())`), never a client clock. NULL = none recorded yet.
2. **Changed usage** — `POST /api/ingest` (unchanged contract) also sets `last_scan_at` in the same transaction as the usage upsert. Both times move together; the CLI sends no separate check-in after an upload.
3. **Unchanged usage (or none)** — new `POST /api/ingest/scan`, body `{ "email" }`, same bearer credential check as `/api/ingest` (shared secret, or a per-account token limited to its own email) and the same `permitAll()` filter-chain exception class. It sets only `last_scan_at`: no `claude_usage_daily`, model or activity row is written, so nothing is duplicated. An email with no roster row is left alone (`not-tracked`) — reporting usage adds someone (ADR-035 decision 3), checking in does not.
4. **CLI** — `scan` calls `/api/ingest/scan` when it uploaded nothing (`no-usage`, `up-to-date`), never on `--dry-run`. A failure there (old server → 404, network) is a warning only; the scan's result and exit code are unchanged.
5. **Dashboards** — `lastScanAt` is added to the My Claude Usage response and to each member row of the team dashboard. The personal page shows "Last scan" and "Last usage update"; the admin table shows "Scanned …" under "Last Reported". The frontend types mark it optional so an older backend still renders.

## 3. Consequences

- `isDue()`, token calculation, deduplication and the upsert rules are untouched; the only new write is one timestamp column.
- One extra small request per scan that uploads nothing. Scans that upload send nothing extra.
- Per member, not per machine: with two machines, "Last scan" is whichever checked in last.
- A reporter older than this change never calls `/api/ingest/scan`; its uploads still set `last_scan_at` through `/api/ingest`.
