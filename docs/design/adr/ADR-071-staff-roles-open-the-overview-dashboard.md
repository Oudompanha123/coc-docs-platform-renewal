# ADR-071: Developer, Reviewer and Lead Open the Overview Dashboard

> **Status**: ACCEPTED — implemented
> **Date**: 2026-09-30
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("change role Lead, Developer, Reviewer can access to dashboard") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`), the same way [ADR-062](ADR-062-ai-error-assistant-and-ui-customization.md) records its own. Including `/settings` (§2) and hiding PRODUCTS from these roles were the implementer's reading of it; set this back to PROPOSED if either needs a PM decision.
> **Related ADR**: Extends [ADR-068](ADR-068-resolution-of-039-040-ax-role-model-and-workspace-access.md) (which admitted these roles to `/ax-renewal` only). No backend rule changes.

---

## 1. Context

"The dashboard" is the admin shell's **Overview** page (`/overview`, `components/dashboard/*`). Only Admin and Super Admin could open it. Developer, Reviewer and Lead fared worse than a plain user: both landing rules (`app/page.tsx`, `app/login/page.tsx`) branched on `role` (the highest role held) and matched only `admin`/`super_admin` → Overview, `user` → Member home. So an account whose highest role is `developer`, `reviewer` or `lead` fell through to the public `/welcome` page after signing in. They were signed in, with nowhere of their own to go.

The Overview needs no backend change to be opened by them:
- Product stats come from `GET /api/v1/nav/**`, which is public.
- Recent activity reads `/api/v1/admin/audit/**`. That is **Super Admin only**, because every row carries another person's email (NFR-SEC-PII), and the panel already renders empty for a plain Admin. It stays that way for these roles too.

## 2. Decision

> Developer, Reviewer and Lead land on **`/overview`** after sign-in and on the bare domain, and `RequireSession` admits them to exactly **`/overview`, `/settings` and `/ax-renewal`**. Everything else in the admin shell — product content pages, Users & Roles, Attendance, Claude Usage — stays Admin/Super Admin. **`SecurityConfig` is unchanged**; this is a presentation gate over data they could already read.

- **One landing rule** — `lib/auth/landing.ts#landingPathFor`, used by both redirects. They used to carry two copies and a comment asking whoever changed one to remember the other. Keyed on `role` (highest held), so `user`+`developer` lands on Overview.
- **`/settings` comes with it.** The shell's sidebar pins Settings on every page, so without it these roles would see a link that sends them away. Everything on it is the caller's own account (`/api/v1/auth/**`, `/api/v1/me/**`), no admin API.
- **PRODUCTS is hidden from them.** Each product link opens a content-management page that is Admin-only in `RequireSession` and in the `/api/v1/admin/**` floor behind it. Now that these roles see the shell's sidebar, those links would only redirect them, so the sidebar shows them Overview, AX Renewal and Settings.
- `STAFF_ROLES = ["developer", "reviewer", "lead"]` is the single list `RequireSession` and `landingPathFor` share.

## 3. Consequences

- **Positive:** these roles have a home. They are no longer signed in and dropped on the marketing page.
- **Negative / accepted:** the Overview's Recent activity panel stays empty for them, as it is for a plain Admin, because its source is Super-Admin-only for PII reasons. A plain `user` is unchanged (Member home).
- **Follow-up:** none required. If these roles should see activity, that needs a PII-safe feed, not a wider audit floor.

## 4. Verification

| Item | Method |
|---|---|
| Landing: staff → `/overview`; `user` → `/home`; guest → `/welcome`; temporary password first | `lib/auth/landing.test.ts`, `app/page.test.tsx` |
| Staff admitted to `/overview` and `/settings`; still refused on `/users-roles`, `/claude-usage`, `/attendance`, product and content pages; plain user still refused on `/overview` | `RequireSession.test.tsx` |
| PRODUCTS hidden from every non-admin; staff see exactly AX Renewal among sidebar sections | `nav-config.test.ts` |
| Backend floors unchanged | `SecurityRulesTest` (unchanged) |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-30 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-30 | User (in-session, direct instruction) | "Change role Lead, Developer, Reviewer can access to dashboard" | ACCEPTED |
