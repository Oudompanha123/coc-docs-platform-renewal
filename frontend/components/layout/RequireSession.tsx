"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
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
 * <p>A signed-in caller whose role is neither `admin` nor `super_admin` is
 * sent to /welcome, not shown a restricted view of the shell. The admin app
 * (sidebar, Overview, per-product content management, Users & Roles,
 * Settings) is `admin`+ only now — a plain `user` account reads the public
 * /docs/* pages instead, same as a signed-out visitor. This is the same
 * floor `canManage` already checks in ProductContentTable/Sidebar; this is
 * just the entry gate, not a replacement for it.
 *
 * <p>Rendering `null` while loading rather than the page is deliberate. Showing
 * the shell first and redirecting after means a visible flash of an interface
 * the visitor is not entitled to see.
 */
export function RequireSession({ children }: { children: ReactNode }) {
  const { status, user } = useSession();
  const router = useRouter();
  const canAccessAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (status === "anonymous") {
      // replace, not push: the back button should not return to a page that
      // will only bounce them here again.
      router.replace("/login");
    } else if (status === "authenticated" && user?.mustChangePassword) {
      router.replace("/create-password");
    } else if (status === "authenticated" && !canAccessAdmin) {
      router.replace("/welcome");
    }
  }, [status, user, canAccessAdmin, router]);

  if (status !== "authenticated" || user?.mustChangePassword || !canAccessAdmin) {
    return null;
  }
  return <>{children}</>;
}
