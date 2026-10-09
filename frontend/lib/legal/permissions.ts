import type { MeResponse } from "@/lib/auth/api";

/**
 * Who may edit the Legal pages (Terms of Service / Privacy Policy) — a
 * split local to this page, not an existing role-ladder rule: admin and
 * super_admin both see it (nav-config.ts), but only super_admin may
 * actually save a draft, publish, or restore a version. Presentation only,
 * same reasoning `lib/ax-renewal/permissions.ts` states for its own
 * booleans — the backend re-derives this independently (`SecurityConfig`'s
 * super_admin-only matchers on the write routes).
 */
export function canEditLegalPages(role: MeResponse["role"] | null | undefined): boolean {
  return role === "super_admin";
}
