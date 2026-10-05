# ADR-091: Claude Usage Moves Into Settings; Profile Becomes a Popup

> **Status**: ACCEPTED — implemented (PM decision, direct in-session instruction)
> **Date**: 2026-10-02
> **Author**: AI (Claude Sonnet 5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction. Recorded here as a transcription of that explicit instruction, not a self-approval, the same way ADR-090 records its own (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Revises ADR-052 (`/my-claude-usage` as its own route) and ADR-060 (the CLI browser-login redirect target, left functionally unchanged — see §2.3). Revises the earlier `/account/settings` ADR's "Profile" section naming. Drafted and implemented as "ADR-086"; renumbered to 091 on merging `dev`, whose own unrelated work had already renumbered the admin-app role-block ADR onto 086 first.

---

## 1. Context

The landing top nav carried a `Claude Usage` link to `/my-claude-usage` (ADR-052 v1.6) since before `/account/settings` existed. With Settings now the home for every other personal account surface (Appearance, Notifications, Connected accounts, Security, Sessions), the product owner asked for Claude Usage to join it as a section instead of staying its own page — plus two smaller, related changes bundled into the same task: the user menu's "Profile" item becomes a read-only popup instead of a navigation, and the Settings "Profile" section is renamed "Account" (disambiguating it from the new Profile *popup*, which is a different surface showing different content).

Investigation found two places besides the nav link itself that reference `/my-claude-usage`'s URL as a string (the CLI browser-login flow's `cliSignedInDestination` and `/cli/signed-in`'s own redirect) — both unaffected by a permanent redirect, so left untouched (§2.3). `MyClaudeUsageSection`, the component being relocated, is fully self-contained (its CLI auto-refresh hook reads `window.location.search` directly, nothing passed in from a parent page) and shares no components with the separate admin team dashboard (`AdminClaudeUsageView`), so the move has zero reuse risk and zero admin-app impact.

## 2. Decision

### 2.1 Claude Usage becomes a Settings section

`MyClaudeUsageSection` (unchanged in data/logic) is wrapped in a new `ClaudeUsageCard` and rendered inside `/account/settings`, between Notifications and Connected accounts — matching the side-menu order the task specified. Its own inner cards drop their `shadow-sm` (now nested inside a card that already has one) and move from `rounded-[10px]` to `rounded-xl`, matching the outer card's corner radius — the only visual change to that component; everything it fetches, computes, and displays is untouched.

**Role visibility is replicated, not inherited.** `/my-claude-usage` sat under `(member)`, gated by `RequireMemberSession` (`user`/`admin`/`super_admin` only — never `developer`/`reviewer`/`lead`, who don't reach any member page). `/account/settings` itself is deliberately open to every signed-in role. So `ClaudeUsageCard` and its `SettingsSideMenu` entry each carry their own `user`/`admin`/`super_admin` check, hiding both for the three roles that could never reach the old page either.

### 2.2 `/my-claude-usage` → permanent redirect

A real HTTP 308 (`next.config.ts`'s `redirects()`), not a client-side `router.replace` — correct for a genuinely permanent move, and (unlike a client redirect) a server-level rule needs no page component at all, so `app/(member)/my-claude-usage/page.tsx` is deleted outright once the redirect was verified working against a running dev server.

### 2.3 The CLI browser-login flow needed no changes

`cliSignedInDestination(role)` and `/cli/signed-in/page.tsx` still produce `/my-claude-usage?cli=signed-in` for a non-admin role — that URL now 308s to `/account/settings?cli=signed-in#claude-usage` (Next passes an unmatched query string through to the destination automatically), and `useUsageAutoRefresh`'s CLI-marker handling reads `window.location.search` itself regardless of which page it's mounted on. Nothing needed to change for the CLI flow to keep working.

### 2.4 Settings "Profile" → "Account"

The existing card (avatar, name, email, role, department, display-name editing) is unchanged in every way except its id (`profile` → `account`), title, and subtitle — freeing "Profile" to mean the new popup instead. An incoming `#profile` hash is rewritten to `#account` and re-scrolled on page load, so an old bookmark or the (now-updated) header link both still land correctly.

## 3. Consequences

- One route retired (`/my-claude-usage`), one redirect added, nothing deleted that anything still imports.
- Two existing pure-function/page tests (`cliAuthorize.test.ts`, `app/cli/signed-in/page.test.tsx`) needed no changes — confirmed by running them, not just by reasoning about them.
- The Profile *popup* (a separate, smaller task step) is a distinct surface from the renamed Account *section* — the two must not be confused when reading `MemberHeader.tsx`'s user menu.
- **Merging `dev` surfaced a second, independently-built implementation of "a member's own settings"**: `frontend/app/(member)/my-settings/page.tsx`, reached via its own new "My Settings" header link, reusing the admin shell's existing `components/settings/*` cards and leaving the old `ProfileModal` in place under a "My Profile" label (the opposite of this ADR's §2.4/§1 decision to retire that navigation in favor of `/account/settings#account`). Product-owner decision on discovery: keep `/account/settings` (this ADR) and delete `/my-settings` and its header link outright, rather than merge the two or keep both — see the merge commit for the mechanics.

## 4. References

- `frontend/components/account/ClaudeUsageCard.tsx`
- `frontend/components/claude-usage/MyClaudeUsageSection.tsx`
- `frontend/next.config.ts` — `redirects()`
- `frontend/components/account/ProfileCard.tsx` (Account section)
- `frontend/components/account/SettingsSideMenu.tsx`
- `frontend/lib/auth/cliAuthorize.ts`, `frontend/app/cli/signed-in/page.tsx` (unaffected, confirmed)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-02 | 1.0 | Initial draft, written alongside Step 2 | AI (Claude Sonnet 5) |
