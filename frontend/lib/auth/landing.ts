import type { Role } from "./api";

/**
 * The roles, below Admin, that work inside the admin shell rather than the
 * member area (ADR-065): they open the Overview dashboard, their own
 * Settings and AX Renewal, and nothing else in the shell. Mirrored by `nav-config.ts` (Overview and
 * the AX Renewal item) and read by `RequireSession`.
 */
export const STAFF_ROLES: readonly Role[] = ["developer", "reviewer", "lead"];

/**
 * Where a signed-in account belongs — the one rule behind both the bare
 * domain (`app/page.tsx`) and the post-sign-in redirect (`app/login`), which
 * each used to carry their own copy and a comment asking whoever changed one
 * to remember the other. Routing only: every destination re-checks its own
 * floor, and the API refuses what it refuses regardless.
 *
 * `role` is the highest role held, so an account holding `user` and
 * `developer` is a `developer` here — which is exactly why these three used
 * to fall through to the public page: no branch matched them.
 */
export function landingPathFor(account: { role: Role | null | undefined; mustChangePassword?: boolean }): string {
  if (account.mustChangePassword) return "/create-password";
  if (account.role === "admin" || account.role === "super_admin") return "/overview";
  if (account.role != null && STAFF_ROLES.includes(account.role)) return "/overview";
  // A `user` gets the Member home (ADR-033); a `guest`, or a role this build
  // does not know, gets the public page, which asks nothing of them.
  return account.role === "user" ? "/home" : "/welcome";
}
