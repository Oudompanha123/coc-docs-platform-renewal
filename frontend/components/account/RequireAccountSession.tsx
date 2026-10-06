"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * The gate for `/account/settings` — deliberately its own guard, not a
 * reuse of `RequireMemberSession` (which admits only `user`/`admin`/
 * `super_admin`, the `/home` audience) or `RequireSession` (the admin-shell
 * floor, `ADMIN_APP_ROLES` only, per ADR-084).
 *
 * <p>Account settings — your own display name, theme, notification
 * preferences, HRMS link status, sessions — isn't an admin-app surface and
 * isn't specific to the Member landing experience either: every signed-in
 * account should be able to reach it, `developer`/`reviewer`/`lead`
 * included, none of whom land on `/home` or open the admin shell. So this
 * admits on authentication alone, with no role allow-list to keep in sync
 * as roles are added — the one thing it still refuses is a caller still on
 * a temporary password, same as every other gate in this app.
 *
 * <p>Same courtesy-not-control caveat as `RequireSession`/`RequireMemberSession`:
 * the real enforcement is server-side (every `/api/v1/auth/**`,
 * `/api/v1/notifications/**` and `/api/v1/me/**` route already resolves the
 * caller from the session, never a client-supplied id).
 */
export function RequireAccountSession({ children }: { children: ReactNode }) {
  const { status, user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    } else if (status === "authenticated" && user?.mustChangePassword) {
      router.replace("/create-password");
    }
  }, [status, user, router]);

  if (status !== "authenticated" || user?.mustChangePassword) {
    return null;
  }
  return <>{children}</>;
}
