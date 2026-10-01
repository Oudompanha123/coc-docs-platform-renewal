# ADR-074: Claude usage activity detail — requests, sessions, active time and projects

> **Status**: PROPOSED — implemented on in-session instruction; PM review requested
> **Date**: 2026-10-01
> **Author**: AI (Claude), on direct developer instruction
> **Approver**: — (not yet recorded)
> **Related ADR**: ADR-035 (usage tracking), ADR-058 (per-model usage), ADR-059/060 (`claude-team-usage` CLI)

---

## 1. Context

The admin User Activity detail (opened from the Per-user usage table) could only show tokens per day and per model. That was all ingestion stored: one running total per member per day (`claude_usage_daily`) plus its per-model split (`claude_usage_daily_model`). The developer asked for four more things: how often someone used Claude each day, which project they worked in, for how long, and tokens per project. Filters were requested for today, the last 7 days, the last 30 days and a custom range.

None of these can be derived from a day total, so the reporter has to compute them. Before choosing definitions, the transcript format was inspected on a real machine: 111 files, 52,401 lines. Only field names and statistics were read, never prompt text.

| Need | Transcript field | Finding |
|---|---|---|
| Time | `timestamp` (ISO UTC) | On every user/assistant line |
| API response | `message.id` + `requestId` | Already the token dedup key (ADR-058) |
| Human turn | `promptId` on `type:"user"` lines | 634 distinct turns. Every tool-result line of a turn repeats its `promptId` |
| Human vs. tool line | `message.content` is a `tool_result` or not; `origin.kind`, `isMeta`, `isSidechain` | 8,493 tool-result lines vs. 611 `origin.kind:"human"` lines. Task notifications carry `origin.kind:"task-notification"` |
| Conversation | `sessionId` | Exactly one per file; the file name equals it in 108 of 111 files |
| Workspace | `cwd` | On every line, but it moves into subfolders mid-conversation (`…\backend`, `…\frontend`) |
| Model, tokens | `message.model`, `message.usage.*` | As already used |

The transcript directory name is an encoded `cwd`. That encoding is lossy (`_`, `\` and `:` all become `-`) and case-variant, so it is not used to name projects.

Gaps between consecutive user/assistant events in one conversation (n = 25,516): median 2 s, p90 12 s, p99 4.1 min, p99.5 10 min. Only 46 gaps exceed 30 minutes, and 27 of those exceed an hour.

## 2. Decision

> The `claude-team-usage` reporter computes per-day activity from the transcripts it already reads and sends it as an optional `activity` object on `POST /api/ingest`. The backend stores it in three new tables (V60), replacing them wholesale per day like `claude_usage_daily_model`. It serves the activity through the existing admin route `GET /api/v1/admin/claude-usage/members/{id}/activity`, extended with `from`/`to`/`project`. Token calculation is unchanged.

### Definitions

- **Request**: one human turn, i.e. one distinct `promptId` on a user line that is not `isSidechain`, not `isMeta`, not a `tool_result`, and not from a non-human `origin.kind`. Slash commands without a `promptId` (`/clear`) are not requests.
- **API call**: one deduplicated model response (`message.id|requestId`). This is exactly the unit tokens are summed over, and it is shown as a secondary figure.
- **Conversation**: one `sessionId`.
- **Session**: a block of continuous activity. All of the day's user/assistant events are merged across conversations and projects, sorted, and split wherever a gap exceeds **30 minutes**.
  - Why 30: below it, gaps are dominated by long tool runs and by reading a reply. Nothing is written while a 10-minute build runs, and that is active use. Above it, gaps are rare (0.2%) and mostly real breaks of an hour or more.
  - Merging conversations means two terminals open in parallel count once, not twice.
- **Active duration**: the sum over sessions of last event minus first event. No padding is added, so a single-event session is 0 s. A project's duration is computed from that project's events alone, so parallel projects may sum to more than the day; the day total never double-counts.
- **Project**: the nearest ancestor of `cwd` containing `.git`, by its on-disk folder name. `fs.realpathSync.native` gives the real casing, so `d:\x` and `D:\X` merge.
  - Outside a repository, the project is the folder the conversation started in, so subfolders don't split.
  - A path that no longer exists, the home directory, or a filesystem root becomes `Other`.
  - **Only the folder name is sent, never a path** (developer decision; NFR-SEC-PII). Two checkouts with the same folder name therefore merge.
- **Tokens by project**: the same deduplicated responses as the day totals, each filed under the project of the line that first carried it. Project tokens sum exactly to the day (tested).
- **Day boundary**: Asia/Phnom_Penh, as for tokens (ADR-035). A session spanning midnight splits at the boundary.

### Key choices

- **Request = human prompt, not API call.** A request reflects "times the person used Claude". API calls run about 25× higher and mostly measure tool loops. Developer decision.
- **Activity is optional and nullable end to end.** A day with no activity row was reported by an older reporter, or by the downloadable `push-usage.mjs`, which does not send activity. The API returns null and the UI shows "—" with an explanation, never 0.
- **An ingest without `activity` deletes the day's activity.** Activity must never describe a different upload than the totals beside it.
- **Existing admin route extended, not a new `/claude-usage/users/:id` route.** Admin-only reads live under `/api/v1/admin/**`, which `SecurityConfig` already guards and `SecurityRulesTest` already covers. Developer decision.
- **A project filter narrows tokens, sessions and summary, but not cost.** Cost and the model split are not attributed per project, so a filtered day carries `costUsd: null` and no models rather than an estimate.
- **The CLI's ledger re-sends a day once** if it was sent before activity existed, or if its requests or active time grew since.

## 3. Considered alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Reporter computes activity; backend stores aggregates (this ADR) | No prompt content or paths leave the machine; small payload; backend stays dumb about transcript format | Definitions live in the reporter; changing one needs a reporter release | **Adopted** |
| B | Reporter uploads raw event timestamps; backend computes everything | Definitions changeable server-side | Much larger payload; more personal detail stored (a timeline of every action); transcript-format knowledge split across two codebases | Not adopted |
| C | Session = Claude Code conversation (`sessionId`) | Trivial | A conversation left open all day is one "session"; parallel terminals double-count time | Not adopted (shown as "conversations") |
| D | Duration = first to last event of the day | Trivial | Counts lunch and meetings as usage; the request explicitly ruled it out | Not adopted |
| E | Project = transcript directory name | No filesystem access | Lossy encoding, case variants, subfolders become separate projects | Not adopted |
| F | Send full `cwd` paths | Distinguishes same-named checkouts | Exposes usernames and drive layout to admins | Not adopted (developer decision) |

## 4. Consequences

- **Schema**: V60 adds `claude_usage_daily_activity`, plus children `claude_usage_daily_project` and `claude_usage_activity_session` (cascade from the day row and from `claude_usage_member`). Existing tables are unchanged.
- **Ingest contract**: `ClaudeUsageIngestRequest.activity` is optional. An older backend ignores it, since unknown JSON fields aren't rejected, and an older reporter omits it.
- **Admin API**: `/members/{id}/activity` now returns `project`, `summary`, `daysWithoutActivity`, `projects`, `sessions`, and per-day activity fields. Existing fields are unchanged. `period`/`offset` still work.
- **Reporter**: `claude-team-usage` gains `src/activity.js`. Its parity test with `push-usage.mjs` now compares every token field and sets `activity` aside, because only the CLI reports activity.
- **Backfill**: history only fills in where transcripts still exist locally (Claude Code keeps about 30 days by default): `claude-team-usage scan --days 30`.
- **Not collected, by design**: prompt text, tool names, file paths, session IDs. The UI shows none of them.
- **Known limits**:
  - The idle threshold is a constant (`IDLE_GAP_MS`), and changing it needs a reporter release.
  - A worktree under `.claude/worktrees/` is named after the worktree folder, not its parent repository.
  - Activity from two machines on one day is last-upload-wins, the same as tokens today (ADR-035).

// req: FR-USAGE-001, FR-USAGE-002, NFR-SEC-PII
