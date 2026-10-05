# ADR-092: `developer` Lands on the Member Home, Not the Public Page

> **Status**: ACCEPTED — implemented (PM decision, direct in-session instruction)
> **Date**: 2026-10-05
> **Author**: AI (Claude Sonnet 5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction. Recorded here as a transcription of that explicit instruction, not a self-approval, the same way ADR-090/ADR-091 record their own (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Revises ADR-086's "`developer`, `reviewer`, `lead` all fall through to `/welcome`" rule — splits that trio: `developer` now lands with `user`, `reviewer`/`lead` are unchanged. Does not touch ADR-086's core rule (the admin app itself stays `admin`/`super_admin`-only); `developer` still cannot enter `(shell)`.

---

## 1. Context

Product owner reported that `developer` and `user` should see the same thing after signing in, pointing at a screenshot of `/home`'s header (the Products ▾ dropdown, fully populated). Investigation found the actual cause wasn't a missing role check inside any one page — it's that `developer` never reaches `/home` at all. `lib/auth/landing.ts`'s `landingPathFor()` (the single rule behind both the bare-domain redirect and the post-sign-in redirect) sends `user` to `/home` and routes every other non-admin role, `developer` included, to `/welcome` — the same public, signed-out-style marketing page a visitor sees. `components/home/RequireMemberSession.tsx` (the gate on `/home` itself) independently enforced the same boundary, so even a direct link to `/home` while signed in as `developer` bounced back to `/welcome`.

This was `developer`'s ADR-086 grouping with `reviewer`/`lead` — all three lost their ADR-071 Overview-dashboard carve-out together and fell through to the same destination. Confirmed with the product owner: only `developer` moves now; `reviewer` and `lead` still land on `/welcome`, unchanged.

## 2. Decision

### 2.1 `landingPathFor` (`lib/auth/landing.ts`)

```ts
return account.role === "user" || account.role === "developer" ? "/home" : "/welcome";
```

Used by both `app/page.tsx` (the bare-domain redirect) and the post-sign-in flow, so both inherit the change from the one rule.

### 2.2 `RequireMemberSession` (`components/home/RequireMemberSession.tsx`)

`canView` admits `developer` alongside `user`, `admin`, `super_admin`. Without this, 2.1 alone would have sent `developer` to `/home` only to be immediately bounced back out by this gate.

### 2.3 Scope: `/home` and whatever it pulls in, nothing admin-shaped

`/reports/attendance` inherits the fix for free — it shares `(member)/layout.tsx` with `/home`, so the same `RequireMemberSession` gate now admits `developer` there too. `/account/settings` already admitted every signed-in role (its own, separately-scoped gate, `RequireAccountSession`), so it needed no change.

Deliberately **not** touched: the admin app (`(shell)`, `RequireSession`) stays `admin`/`super_admin`-only — ADR-086's actual point, blocking `developer`/`reviewer`/`lead` from the admin shell entirely, is untouched by this ADR. Settings-sidebar-level feature gates that independently check role (`ClaudeUsageCard`'s `canSeeClaudeUsage`, `SettingsSideMenu`'s Open Dashboard) also still exclude `developer` — those are separate decisions from separate ADRs, not a consequence of `RequireMemberSession`'s floor, and nothing here asked to revisit them.

## 3. Consequences

- `developer` now sees the exact same `/home` (header, Products ▾, Reports & Records ▾, hero) as `user` — confirmed by test and by hand.
- `reviewer` and `lead` are unaffected — still land on `/welcome`, same as before this ADR and the same as `guest`.
- `app/page.test.tsx` and `lib/auth/landing.test.ts` updated: the old combined `["developer", "reviewer", "lead"]` case split into `["user", "developer"]` (→ `/home`) and `["reviewer", "lead"]` (→ `/welcome`).

## 4. References

- `frontend/lib/auth/landing.ts`
- `frontend/components/home/RequireMemberSession.tsx`
- `frontend/app/page.test.tsx`, `frontend/lib/auth/landing.test.ts`

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-05 | 1.0 | Initial draft, written alongside the fix | AI (Claude Sonnet 5) |
