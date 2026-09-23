# ADR-046: Free-Text Assistant Chat Against the Local Model, Stored Nowhere

> **Status**: PROPOSED
> **Date**: 2026-09-23
> **Author**: backend/frontend (paired), on the PM's request
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Extends [ADR-043](ADR-043-local-claude-analysis.md) (local Claude Code as the analysis engine) to a second surface. Does not change ADR-011/ADR-012's trust boundary, and does not touch [ADR-037](ADR-037-integrations.md)'s implementation phase.

---

## 1. Context

The AX Assistant column on the right of the AX Renewal workspace has never
been a chat. It is a **command console**: `parseCommand` matches a handful of
fixed phrases ("run analysis", "confirm pages"), and anything it does not
recognise is written to the project's persisted comment thread. Every message
in that column is a row in Postgres, attributed to an account.

Two things changed underneath it:

- **ADR-043** connected a real model — a developer's own Claude Code
  installation, run as a subprocess by the backend. It answers `Run analysis`
  and nothing else.
- The PM asked whether a person could type a question in that panel and have
  the local model answer **in the panel**, rather than opening a terminal —
  and explicitly asked that such a conversation **not be stored in the
  database**, "like chat in cmd".

That is a reasonable ask with one genuine tension: this codebase's habit is
that anything a person does to a project is recorded and auditable. A chat
that writes nothing is a deliberate exception, and this ADR exists to make it
an explicit, bounded exception rather than an oversight.

- Related requirements: FR-AXR (AX Renewal workspace), `CONST-TECH-07` (the
  frontend asserts no authority), ADR-011 (role resolved server-side)
- Related risks: prompt injection via typed text; unbounded subprocess spawn;
  the absence of an audit trail

## 2. Decision

> **The assistant panel gains a second mode, `Chat`, offered only where a
> local Claude Code binary is configured. It sends free text to that local
> model and shows the reply. Nothing about the conversation is persisted:
> no table, no comment row, no audit entry. The browser tab holds the
> conversation and replays it for context; a refresh ends it.**

### Key Choices

- **Two modes, one column, never mistakable.** `Chat` and `Thread` are a
  visible toggle. Thread is unchanged — commands and persisted comments.
  Chat writes nothing. The mode banner says "Not saved — this conversation is
  gone when you refresh".
- **Chat never executes a command.** `parseCommand` is not consulted in Chat
  mode. Typing "confirm pages" there is a *question about* confirming pages.
  A mode that could silently change a project would be worse than no chat.
- **Read-only tools.** The CLI is invoked with
  `--allowedTools Read Glob Grep`. Not a prompt instruction — a flag. The
  message came from a text box, so the model's capabilities are constrained
  by construction, not by asking.
- **The conversation lives in the browser.** The backend is stateless across
  turns; `history` is replayed in the request. This is what makes "stored
  nowhere" literally true rather than "stored, but we do not show it".
- **Authorisation at the analysis floor** (`admin`+), not the comment floor
  (`user`). Chat can point a model at the source folder, exactly as
  `Run analysis` can. What is being gated is reading the source.
- **Bounded.** At most 2 concurrent subprocesses, a 2-minute timeout, 40
  history turns accepted and the last 20 used, 4,000 characters per turn.

### What this deliberately does **not** do

- It does not run on any deployment. No server has the binary
  (`localClaudeConfigured()` is false), and the panel does not offer the tab
  there.
- It does not let chat write files, run commands, or alter the plan.
- It does not become the implementation phase. Generating code is still not a
  thing this product does (ADR-037, `AxRenewalService.startImplementation`).

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Ephemeral chat, browser-held history, local CLI (this ADR) | Matches the ask exactly; nothing to leak, retain or migrate; no schema change | No audit trail; no continuity across refresh; local machines only | **Adopted** |
| B | Persist the conversation as a new `ax_renewal_chat` table | Auditable; survives refresh; searchable later | Directly contradicts the requirement; stores model output as if it were project record; new retention question for content nobody reviewed | Not adopted |
| C | Reuse the existing comment thread for chat | No new surface; already audited | Pollutes a human review thread with machine output; the two would be indistinguishable a week later | Not adopted |
| D | Wait for a server-side API key and build it for everyone | One implementation, works on the deployed site | Needs a paid key nobody has bought; blocks a thing that works today on the machines that matter | Not adopted (still the right answer for a deployed feature — ADR-038 Phase 2) |

## 4. Consequences

### 4.1 Positive Impacts

- A developer can ask about an attached legacy project from the workspace
  instead of switching to a terminal, with the project's own context already
  in the prompt.
- Nothing new is stored, so there is no retention, PII or migration question
  attached to this feature.
- The read-only tool constraint makes the blast radius of a hostile prompt a
  *read* of a folder the operator already pointed the tool at.

### 4.2 Negative Impacts / Costs to Accept

- **No audit trail.** There is no record of who asked what. Accepted *only*
  while chat stays read-only and cannot change a project. If that changes,
  this decision must be revisited before the capability ships.
- **"Not saved" is true of this application, not of the machine.** Claude
  Code writes its own transcript under `~/.claude/projects`, which is exactly
  what `tools/claude-usage-reporter` reads — so the conversation exists
  locally and its tokens appear on the Claude Usage page. The panel's wording
  is about this product's database; the team should know the rest.
- **Local machines only**, permanently, for the reasons ADR-043 gives. Two
  developers will see different capability in the same UI.
- Each turn spawns a process on somebody's laptop. Bounded, but not free.

### 4.3 Follow-up Work

- [ ] PM decision on the missing audit trail — accept as scoped, or require
      a minimal "a chat happened" audit entry with no content.
- [ ] If chat is ever allowed to act on a project, route those actions
      through the existing audited command path and revise this ADR first.
- [ ] Revisit when `app.ax-renewal.anthropic-api-key` becomes real: a
      deployed chat is a different decision, not a configuration change.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| Nothing is persisted by a chat turn | `AxAssistantPanel.test.tsx` — "writes nothing — a chat message is not a comment" | Every build | `addComment` never called |
| A command typed in chat does not execute | `AxAssistantPanel.test.tsx` — "does not execute a command typed into chat" | Every build | `confirmSection` never called |
| The route is gated at the analysis floor | `SecurityRulesTest$AxRenewalPath` — plain `user` 403, anonymous 401 | Every build | Both refused |
| Chat is not offered without a model | `AxAssistantPanel.test.tsx` — "is not offered where no model can answer" | Every build | No `chat` tab rendered |
| Prompt stays bounded | `LocalClaudeChatTest.ThePrompt` | Every build | Oldest turns dropped; long message truncated |

## 6. References

- Related code: `backend/src/main/java/com/coc/docs/axrenewal/LocalClaudeChat.java`,
  `AxRenewalService#chat`, `web/AxRenewalController#chat`,
  `config/SecurityConfig` (the `assistant/chat` matcher),
  `frontend/components/ax-renewal/AxAssistantPanel.tsx`,
  `frontend/lib/ax-renewal/api.ts#chatWithAssistant`
- Related ADR: ADR-043 (local analysis), ADR-037 (AX Renewal), ADR-038
  (capability grants / the reserved API key), ADR-011 (server-side role)
- Configuration: no new keys — reuses `app.ax-renewal.claude-cli-path` and
  `app.ax-renewal.source-path` from ADR-043

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
