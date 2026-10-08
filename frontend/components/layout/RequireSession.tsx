"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import type { Role } from "@/lib/auth/api";
import { ADMIN_APP_ROLES } from "@/lib/auth/landing";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * Sends a visitor with no session to /login, and renders nothing until the
 * answer is known.
 *
 * <p><b>This is a courtesy, not a control.</b> Every route it covers is also
 * enforced server-side — the filter chain reads the role from the `account`
 * row on every request and ends in `anyRequest().hasRole(SUPER_ADMIN)`, and
 * `MustChangePasswordInterceptor` refuses everything else to an account still
 * on its temporary password (revision of ADR-017). A visitor who skips this
 * by disabling JavaScript gets a shell with no data in it, because the API
 * refuses them either way. What this fixes is the experience: before it, an
 * expired session produced an admin page with blank panels and no
 * explanation of why.
 *
 * <p>A caller still carrying a temporary password is sent to
 * /create-password instead of /login — they *are* signed in, just not yet
 * allowed to use that session for anything but replacing the password.
 *
 * <p>A signed-in caller whose role is not in {@link ADMIN_APP_ROLES} is sent
 * to /welcome, not shown a restricted view of the shell. The admin app
 * (sidebar, Overview, per-product content management, Users & Roles,
 * Settings, AX Renewal) is `admin`+ only now — a plain `user` account reads
 * the public /docs/* pages instead, same as a signed-out visitor. This is the
 * same floor `canManage` already checks in ProductContentTable/Sidebar; this
 * is just the entry gate, not a replacement for it.
 *
 * <p>Rendering `null` while loading rather than the page is deliberate. Showing
 * the shell first and redirecting after means a visible flash of an interface
 * the visitor is not entitled to see.
 *
 * <p><b>No more Developer/Reviewer/Lead exception (ADR-086, superseding
 * ADR-040/ADR-068/ADR-071).</b> Those three roles used to open exactly the
 * Overview dashboard, their own Settings, and AX Renewal — a 2026-09-29 PM
 * decision retired that carve-out outright: only {@link ADMIN_APP_ROLES} may
 * enter the admin shell at all now, full stop. What each admitted role may
 * *do* is still decided by the backend, route by route, not by this gate.
 *
 * <p><b>ADR-052, no longer an exception here.</b> `/claude-usage` briefly
 * admitted any authenticated caller, rendering a personal view for
 * non-admins at that same url. That personal view now lives as a section
 * embedded directly on `/home` instead (`RequireMemberSession`'s own gate,
 * not this one) — see `components/claude-usage/MyClaudeUsageSection.tsx` —
 * so `/claude-usage` is back to being an ordinary admin-only route with no
 * carve-out, the same as every other item in `ADMINISTRATION`.
 */
export function RequireSession({
  children,
  allowRoles = ADMIN_APP_ROLES,
  deniedPath = "/welcome",
}: {
  children: ReactNode;
  /**
   * Who this part of the app admits — the admin app's own two roles unless a
   * layout says otherwise. AX Renewal widens it (`AX_RENEWAL_ROLES`,
   * ADR-090); the super_admin-only ADMINISTRATION pages narrow it
   * (`SUPER_ADMIN_ROLES`, ADR-099).
   */
  allowRoles?: readonly Role[];
  /**
   * Where a signed-in caller outside `allowRoles` is sent. /welcome for the
   * shell as a whole; a super_admin-only page nested inside it sends an
   * admin back to /overview instead, since they do belong in the app.
   */
  deniedPath?: string;
}) {
  const { status, user } = useSession();
  const router = useRouter();
  const canAccessAdmin =
    (user?.role != null && allowRoles.includes(user.role)) ||
    (user?.roles?.some((r) => allowRoles.includes(r)) ?? false);

  useEffect(() => {
    if (status === "anonymous") {
      // replace, not push: the back button should not return to a page that
      // will only bounce them here again.
      router.replace("/login");
    } else if (status === "authenticated" && user?.mustChangePassword) {
      router.replace("/create-password");
    } else if (status === "authenticated" && !canAccessAdmin) {
      router.replace(deniedPath);
    }
  }, [status, user, canAccessAdmin, router, deniedPath]);

  if (status !== "authenticated" || user?.mustChangePassword || !canAccessAdmin) {
    return null;
  }
  return <>{children}</>;
}
