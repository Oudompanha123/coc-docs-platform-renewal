# ADR-083: Run Locally Gets Its Port Back After Stop

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("make sure rerunning after Stop reuses the original port 3000 when it is available") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Revises the stop behaviour of [ADR-048](ADR-048-run-locally.md) (Run Locally). Nothing else in ADR-048 changes.

---

## 1. Context

Run Locally starts the renewed project with `npm install && npm run <dev>`. A Next.js dev server takes the first free port from 3000, so a rerun gets 3000 back only if the previous server has really gone. Instead, reruns came up on 3001, then 3002.

Investigated on the reporting machine (Windows), on 2026-10-01:

- **Orphans from an earlier backend held the ports.** Two complete `Portfolio React After Renew` dev-server trees were still listening on 3001 and 3002. Each chain ran `cmd /c "npm install && npm run dev"` → `npm run dev` → `next dev` → `start-server.js`, and in both the top ancestor, the backend JVM that started it, was gone. The backend had been restarted at 4:17 PM without a graceful shutdown, so `@PreDestroy stopEverything` never ran. The new backend had no record of those servers: the UI showed "stopped", and the next Start moved to the next free port. Port 3000 itself was the workspace's own admin frontend at the time.
- **`stop()` didn't wait.** It sent the kills and returned, marking the run `stopped` while the tree might still be exiting and holding its port.
- **A process caught mid-spawn could escape.** A single snapshot of the tree misses a child its parent is creating at that moment, and that child survives, still holding the port and its working directory. This is also what made `AxRenewalLocalRunnerTest` fail intermittently with "Failed to delete temp directory" all along.

## 2. Decision

> Stop waits until the whole process tree has really exited. Each run's root process is recorded on disk, so the next Start for that project first stops whatever an earlier backend left running. The port is never pinned.

- **`stop()` → `killTree(root)`:**
  - **Rounds:** read the tree, kill parents before children (`destroyForcibly`), so nothing still alive can start a replacement — `next dev` supervises its own server — then wait for every process to exit.
  - **Rescan:** read the children of everything killed again, and kill any newcomer, for up to 5 rounds.
  - **Limit:** everything is bounded by `STOP_WAIT` (10 s). A process still alive after that is logged, never thrown.
  - **Returns** only after this, so a Start pressed straight after finds the port free.
- **Pid file:** `${java.io.tmpdir}/ax-renewal-run-locally/<projectId>.pid` records the run's root pid and its start time, and nothing else.
  - **Written** when the run starts.
  - **Removed** by `stop()`, or by the log reader when the run ends by itself.
  - **On Start**, `stopLeftover` checks the record. If that exact process is still alive — same pid and the same start time, so a pid reused by an unrelated process is never touched — its tree is stopped first.
  - **An unreadable record** is logged, discarded, and doesn't block the Start.
- **No pinned port:** no `PORT`/`--port` is passed. Next.js treats an explicit port as "fail if busy" rather than "try the next one", so pinning would turn a busy port into a failed run. With the old server really gone, the default gets 3000 back whenever it is free.

## 3. Consequences

- **Positive:**
  - Stop, then Start, comes back on the same port, as long as nothing else holds it.
  - A dev server orphaned by a hard backend restart is cleaned up on that project's next Start, instead of holding its port until someone finds it in Task Manager.
  - The intermittent `AxRenewalLocalRunnerTest` failures are fixed: 15/15 tests pass on five consecutive runs.
- **Accepted:**
  - **Stop can now take a moment.** It blocks until the tree exits, up to 10 s; the UI already shows "Stopping…" while it does.
  - **Orphans from before this change** have no pid file and are not found. They have to be stopped once by hand.
  - **The record is per machine** (the temp directory), the same scope as the in-memory runner itself (ADR-048).
  - **Another program on 3000** still makes the dev server use 3001, which is the dev server's own rule and correct. The admin frontend often runs on 3000 during development.

## 4. Verification

| Item | Method |
|---|---|
| Stop returns only after the whole tree (shell plus idle child) has exited; record removed | `AxRenewalLocalRunnerTest` — `stop_returns_only_once_the_whole_process_tree_has_exited` |
| A tree left by a "restarted" backend (new runner, same pid directory) is stopped before the next Start, which then runs | `…a_dev_server_an_earlier_backend_left_running_is_stopped_before_the_next_start` |
| A recorded pid with a different start time (reused) is never touched | `…a_recorded_pid_that_now_belongs_to_another_process_is_never_touched` |
| An unreadable record doesn't block a Start | `…a_record_that_cannot_be_read_does_not_stop_the_start` |
| Every existing runner test, 15 in all, passes five runs in a row (previously flaky) | repeated `mvn test -Dtest=AxRenewalLocalRunnerTest` |
| Real `npm install && npm run dev` (a Next-like parent/child server): first start, Stop then Start, and Start after a simulated hard restart all on the same port; nothing left listening | a hand-run driver against the real class, on Windows |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Rerun after Stop reuses the original port | ACCEPTED |
