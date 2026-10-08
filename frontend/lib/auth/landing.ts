import type { Role } from "./api";

/**
 * The only roles that may use the admin app at all (2026-09-29 PM decision,
 * ADR-086, superseding ADR-040/ADR-068/ADR-071's Developer/Reviewer/Lead
 * carve-outs — those three used to open the Overview dashboard, their own
 * Settings, and AX Renewal; none of that survives ADR-086). Put in one place
 * and read by both `landingPathFor` below and `RequireSession`, the same way
 * the backend's own allow-list (`AppRole.ADMIN_APP_ROLE_NAMES`) is the one
 * place on that side.
 */
export const ADMIN_APP_ROLES: readonly Role[] = ["admin", "super_admin"];

/**
 * Who may open Users & Roles, Attendance and Claude Usage (ADR-099).
 * Narrower than {@link ADMIN_APP_ROLES}: an admin publishes content; who holds which role, the team's clock-ins and its
 * Claude spend are a super_admin's to read. The backend floors the same routes
 * at SUPER_ADMIN in SecurityConfig — this list only decides what is shown.
 */
export const SUPER_ADMIN_ROLES: readonly Role[] = ["super_admin"];

/**
 * Developer, Reviewer and Lead: kept out of the admin app (ADR-086) except
 * for AX Renewal, which they may open again (ADR-090, revising ADR-086 for
 * that one feature). They land on the Member home after signing in, like a
 * plain user. What each may do in AX Renewal is the workspace's own
 * question (`axRenewalPermissions`).
 */
export const AX_RENEWAL_STAFF_ROLES: readonly Role[] = ["developer", "reviewer", "lead"];

/** Everyone the AX Renewal workspace admits (ADR-090) — `app/ax-renewal/layout.tsx`'s `RequireSession`. */
export const AX_RENEWAL_ROLES: readonly Role[] = [...ADMIN_APP_ROLES, ...AX_RENEWAL_STAFF_ROLES];

/**
 * Where a signed-in account belongs — the one rule behind both the bare
 * domain (`app/page.tsx`) and the post-sign-in redirect (`app/login`), which
 * each used to carry their own copy and a comment asking whoever changed one
 * to remember the other. Routing only: every destination re-checks its own
 * floor, and the API refuses what it refuses regardless.
 */
export function landingPathFor(account: { role: Role | null | undefined; mustChangePassword?: boolean }): string {
  if (account.mustChangePassword) return "/create-password";
  if (account.role != null && ADMIN_APP_ROLES.includes(account.role)) return "/overview";
  // A `user` gets the Member home (ADR-033), and so do Developer, Reviewer
  // and Lead (ADR-090). `role` is the highest role held, so an Admin who
  // also holds Developer still lands on the Overview above.
  if (account.role === "user") return "/home";
  if (account.role != null && AX_RENEWAL_STAFF_ROLES.includes(account.role)) return "/home";
  // Everyone else — `guest`, or a role this build does not know — gets the
  // public page, which asks nothing of them.
  return "/welcome";
}
