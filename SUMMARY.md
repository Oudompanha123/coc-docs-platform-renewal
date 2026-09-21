# CodeRenewalPlatform.html — Summary

## What it is
A single self-contained HTML/CSS/JS file implementing an IDE-styled UI prototype called **"AX Renewal"** for AI-assisted legacy code migration planning. It has no backend and no build step, and is designed to run either as a standalone file or as a Claude Artifact (one of its AI-connection modes runs inside the Claude app with no key needed).

## Purpose
To walk a team through analyzing an old codebase, planning a move to a new technology stack, executing that move via Claude Code, and verifying the result — while keeping a full attributable record of who decided what.

## Core workflow
1. **Attach** — reads a folder/file selection via the browser File API, but only the manifest: file count, size, extensions, dependency-manifest detection, lockfile presence, and a regex scan of small config files for hardcoded secrets. No source is parsed yet.
2. **Analyze** — the step that reads actual code. With an AI model connected, it samples up to 40 truncated source files and sends them to Claude for a structured JSON report (stack, findings, pages). Without a model, it walks the same UI stages against hardcoded sample data, clearly labeled as such.
3. **Plan** — four sections that must each be explicitly confirmed before implementation can start: **Stack move** (per-layer target selection), **Architecture** (resulting layered design), **Pages** (old vs. new previews), and **Database** (schema read plus additive-only changes — indexes/columns, never table creation/deletion). An **Output** setting controls where generated code is written.
4. **Implement** — once all four sections are confirmed and a destination is set, a simulated build runs with progress tracking, ending in a before/after metrics report and a list of items still requiring human sign-off.
5. **Verify** — a "Run locally" view generates tailored shell commands, an iframe preview, and a per-page pass/issue checklist attributed to the signed-in user.
6. **Audit** — every state change is logged (who/what/when), exportable as a JSON record of the full plan, decisions, and conversation.

## Key architecture and design choices
- Pure client-side, in-memory state — nothing persists across a page reload; no server component.
- Laid out like a VS Code shell (activity bar, explorer, tabbed editor, chat sidebar, status bar).
- Four architecture diagrams (system context, request-lifecycle sequence, module coupling, deployment) are hand-drawn inline SVG, recolored live to match the active theme.
- Four selectable visual themes plus zoom/motion accessibility preferences.

## AI integration and RBAC
- Three AI connection modes: inside the Claude app (no credential touches the page), a pasted OAuth-style token, or a raw API key (the latter two call the Anthropic API directly from the browser).
- The assistant is constrained to a fixed JSON action protocol (retarget a layer, add/remove/rename a page, add a database index, confirm a section, set the destination, open a tab) rather than free-form mutation.
- Role-based access control (lead / developer / reviewer) is enforced in application logic for both human and AI-initiated actions; unauthorized attempts are denied and logged rather than silently blocked.

## Important limitations and risks
- Sign-in is cosmetic, not real authentication — email is matched against a small hardcoded list, and any non-empty password is accepted.
- API keys/tokens are held in browser memory and sent client-side directly to Anthropic — workable for a prototype, not a safe pattern for shared/production use.
- No persistence — refreshing the page discards all plan state, chat history, and audit trail.
- Analysis fidelity depends entirely on whether a live AI model is connected; otherwise the "analysis" is illustrative sample data.

## Overall assessment
A well-constructed UX/interaction demo validating a human-gated, AI-assisted migration workflow (attach → analyze → plan → implement → verify → audit). It's suitable for stakeholder review and concept validation, not for production deployment as-is.
