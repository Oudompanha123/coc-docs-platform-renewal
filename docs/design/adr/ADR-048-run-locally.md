# ADR-048: Run Locally — Launching an Applied Project as a Live Dev Server

> **Status**: PROPOSED
> **Date**: 2026-09-25
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Fulfils the precondition [ADR-044](ADR-044-generate-and-apply-code-changes.md) created — a real applied build to point at. Extends ADR-043/ADR-044's local-only subprocess pattern from a bounded, request-scoped CLI call to a long-lived, explicitly-stopped background process — the first of its kind in this feature.

---

## 1. Context

The Build → Run locally tab has always rendered a fixed, unconditional "Not available in this phase" panel (`AttachSourceSection`'s sibling in `page.tsx`, `explorerGroups.ts`'s `item("run-locally", { locked: true })`). Its own comment explained why: *"a local run/preview needs a real generated build to point at, which this phase does not produce."*

ADR-044 has since shipped Generate → Review → Apply. Once a run reaches `applied`, the destination folder holds a real, on-disk project — exactly the thing this tab was waiting for. The PM has asked for the tab to do what its own placeholder always promised: run that project locally and show it working.

## 2. Decision

**Once a project's latest implementation run has actually reached `applied`, Run Locally can start `npm install && npm run dev` in the destination folder as a supervised background process, stream its real output, detect its own "ready" URL from that output, and stop it on request.**

### 2.1 Unlock condition

`explorerGroups.ts` changes `run-locally`'s `locked` from a hardcoded `true` to `detail.latestImplementationRun?.status !== "applied"` — the exact condition the original placeholder text described, now checkable because it can be true. A rebuild (a newer run started after `applied`) re-locks the tab until the new run is itself applied, since the destination is presumed to be mid-change again — the same reasoning `startImplementation`'s `findActive` guard already applies to a single project's implementation state.

### 2.2 What actually runs

`scripts.dev` in the destination's own `package.json` — read for real and validated to exist before anything is spawned, never assumed. If there is no `package.json`, or no `dev` script, starting is refused with the concrete reason (`AxRenewalService.requireAppliedDestination`/`startRunLocally`) rather than guessing at a command. `npm install` always runs first — correctness over speed; a stale or missing `node_modules` is a more common failure than the extra seconds cost.

Invoked as a single shell-joined command (`cmd.exe /c npm install && npm run dev` on Windows, `sh -c "npm install && npm run dev"` elsewhere) rather than as separate `ProcessBuilder` calls, because Java's `ProcessBuilder` does not resolve `npm`/`npm.cmd` through `PATHEXT` the way a real shell does — invoking it directly (the argument-array, no-shell pattern ADR-043/044 otherwise always use) reliably fails to even launch on Windows. This is judged safe specifically *because* every token in that string is a fixed literal — `"dev"` is validated to exist as a key, never interpolated from its value, and nothing here ever concatenates caller-supplied text into the command line the way the injection defense in `LocalClaudeAnalyzer`/`AxRenewalCodeGenerator` exists to prevent for the CLI prompt.

### 2.3 Process lifetime, log capture, and "ready" detection

`AxRenewalLocalRunner` is a new, deliberately **in-memory-only** component — the first piece of AX Renewal state this feature does not persist. A live `Process` handle cannot survive a backend restart no matter what a database row claims, so writing one to Postgres would be this feature's first invented fact rather than a reported one. One running process per project (`ConcurrentHashMap<UUID, Running>`); starting again while one is alive is refused, matching the "one active thing" rule `findActive` already enforces for implementation runs.

A background reader thread appends every line of the process's combined stdout/stderr (`redirectErrorStream(true)`) to a capped rolling buffer (500 lines) — the same real output a person would see running the command themselves in a terminal, never summarized or invented. The first line matching `https?://(?:localhost|127\.0\.0\.1):\d+` flips status from `starting` to `running` and records that URL — detected from the dev server's own announcement (Next.js/Vite/CRA all print exactly this shape), not assumed from a hardcoded port. `Run analysis`/`Generate`'s own "never fabricate" rule extends here: no percentage, no invented "3 seconds left" — only what the process itself said, and only once it said it.

### 2.4 Stopping

Stop destroys the whole process tree (`Process.descendants().forEach(ProcessHandle::destroy)`, then the process itself) — the shell wrapper is a parent of `npm`, which is a parent of the actual dev server; destroying only the wrapper would orphan the thing a person is actually trying to stop. A `@PreDestroy` hook stops every tracked process when the Spring context shuts down, so a backend restart during development (frequent, expected) cannot leak an unmanaged dev server running forever on some port nobody remembers starting.

### 2.5 Authority

Starting and stopping sit at the same floor as `implementation/start`/`approve`/`reject` — Super Admin, or the `developer` role held exactly (`SecurityConfig`'s existing `hasAnyAuthority(SUPER_ADMIN.authority(), DEVELOPER.exactAuthority())`) — because this executes code on the backend's own machine, the same class of action as those three. Status is a plain read, so it inherits the blanket `GET /api/v1/ax-renewal/**` → `user` floor every other read in this feature already sits at.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| 1 | Persist run state (a table, like implementation runs) | Consistent with this feature's "durable by default" habit | A live process handle is not durable no matter where its status is written — the row would survive a restart, the process would not, and the row would then be lying | No |
| 2 | WebSocket/SSE log streaming | Real-time, no polling gap | Every other long-running state in this feature (Generate, Analyze) is already polled from `GET .../detail` or a sibling status endpoint; a new transport for one feature is a second pattern to maintain for no capability this app currently needs | No — polling, matching ADR-044/043 |
| 3 | Invoke `npm`/`node` directly via `ProcessBuilder` with an argument array, no shell (ADR-043/044's usual rule) | Keeps the no-shell pattern uniform everywhere | Fails outright on Windows — `ProcessBuilder` does not apply `PATHEXT` resolution the way `cmd.exe` does, so a bare `"npm"` argument cannot be located | No — shell-wrapped, justified in §2.2 since nothing interpolated is caller-supplied |
| 4 | Configurable package-manager path (mirroring `claude-cli-path`) | Consistent with how the Claude CLI's install location is handled | `claude-cli-path` exists because Claude Code's own install location varies unpredictably; `npm` is the standard, already-required tool for running *any* Node project locally — the same machine already needs it to use the destination folder at all | No — assumed on `PATH` |
| 5 | Auto-detect yarn/pnpm from the lockfile present | More correct for a non-npm project | No destination this feature has ever produced uses anything but `npm` yet (ADR-044's own generated scaffolds); adding it now is speculative | Deferred (§4.3) |

## 4. Consequences

### 4.1 Positive Impacts
- Closes the exact gap the tab's own placeholder named, using the same real, on-disk artifact ADR-044 now produces.
- Never fabricates progress or a URL — every signal shown comes from the process's own real output.
- Reuses this feature's existing authority split (Super-Admin-or-Developer to act, `user` to view) rather than inventing a new one.

### 4.2 Negative Impacts / Costs to Accept
- In-memory only: a backend restart silently ends any running dev server, with nothing left to show it was ever running — the accepted cost of not inventing durability a live process cannot actually have.
- `npm` only, `dev` script name only — a destination using yarn/pnpm, or a differently-named script, cannot be run yet.
- No cross-feature coupling with a Rebuild: starting a new implementation run while a local dev server is running against the old applied code does not stop it — the person is left to notice and restart it themselves.
- This is arbitrary code execution by design — running the destination project's own `npm` scripts. The trust boundary is unchanged from what ADR-043/044 already accepted (the developer's own machine, the developer's own seat, a folder they set as their own destination); it is not a new risk class, but it is worth stating rather than leaving implicit.

### 4.3 Follow-up Work
- [ ] PM approval — `PROPOSED` until then; per `CONST-PROC-01` this is never self-approved.
- [ ] yarn/pnpm detection from the destination's lockfile.
- [ ] Stopping (or warning about) a live Run Locally process automatically when a Rebuild starts against the same destination.
- [ ] A configurable dev-server startup timeout / explicit "this is taking unusually long" signal, if real usage shows `npm install` regularly outlasts what feels like a hang.

## 5. References
- [ADR-044](ADR-044-generate-and-apply-code-changes.md) — produces the applied build this unlocks against.
- [ADR-043](ADR-043-local-claude-analysis.md) — the local-only subprocess pattern and its `ProcessBuilder` safety reasoning, extended here to a long-lived rather than bounded process.
- `frontend/lib/ax-renewal/explorerGroups.ts` — the `run-locally` lock this ADR makes conditional.
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalLocalRunner.java` — the process registry this ADR describes.
