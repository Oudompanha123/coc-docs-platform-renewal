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
 * Where a signed-in account belongs — the one rule behind both the bare
 * domain (`app/page.tsx`) and the post-sign-in redirect (`app/login`), which
 * each used to carry their own copy and a comment asking whoever changed one
 * to remember the other. Routing only: every destination re-checks its own
 * floor, and the API refuses what it refuses regardless.
 */
export function landingPathFor(account: { role: Role | null | undefined; mustChangePassword?: boolean }): string {
  if (account.mustChangePassword) return "/create-password";
  if (account.role != null && ADMIN_APP_ROLES.includes(account.role)) return "/overview";
  // A `user` gets the Member home (ADR-033), and so does `developer` now
  // (ADR-092, revising ADR-086's own "developer, reviewer, lead all get
  // /welcome" rule — developer only, reviewer/lead still fall through).
  // Everyone else — `guest`, `reviewer`, `lead`, or a role this build does
  // not know — gets the public page, which asks nothing of them.
  return account.role === "user" || account.role === "developer" ? "/home" : "/welcome";
}
