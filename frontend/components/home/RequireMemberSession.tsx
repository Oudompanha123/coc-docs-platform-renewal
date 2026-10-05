"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { AX_RENEWAL_STAFF_ROLES } from "@/lib/auth/landing";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * The gate for `/home`, the Member (`user`-role) post-login landing page —
 * a deliberate copy of `RequireSession`, not a shared import, because the
 * floor is different on both ends: `RequireSession` admits `admin`/
 * `super_admin` for the sidebar shell; this admits `user` as its real
 * audience, plus `admin`/`super_admin` as a read-only preview (the admin
 * Sidebar's "View site" link opens this page directly, the same way it used
 * to open `/welcome`, and an admin needs to actually see the page to preview
 * it rather than being bounced back to `/overview`).
 *
 * <p>Same courtesy-not-control caveat as `RequireSession`: every route this
 * covers is also enforced server-side (the tasks/nav/docs-content reads this
 * page makes are each gated at their own real floor). This only fixes the
 * experience for a caller who shouldn't be here at all.
 */
export function RequireMemberSession({ children }: { children: ReactNode }) {
  const { status, user } = useSession();
  const router = useRouter();
  // Developer, Reviewer and Lead too: they land here after signing in
  // (ADR-090). `role` is the highest role held.
  const canView =
    user?.role === "user" ||
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    (user?.role != null && AX_RENEWAL_STAFF_ROLES.includes(user.role));

  // Was this mount ever authenticated? Distinguishes a visitor arriving
  // anonymous fresh (send to /login, the only sane default) from a caller
  // who just signed out from this very page (SessionProvider's doSignOut
  // already redirected them somewhere role-aware — /welcome for a regular
  // user — before this status update ever landed here; blindly redirecting
  // to /login on any "anonymous" sighting raced ahead of that and won).
  const wasAuthenticated = useRef(false);
  if (status === "authenticated") {
    wasAuthenticated.current = true;
  }

  useEffect(() => {
    if (status === "anonymous" && !wasAuthenticated.current) {
      router.replace("/login");
    } else if (status === "authenticated" && user?.mustChangePassword) {
      router.replace("/create-password");
    } else if (status === "authenticated" && !canView) {
      router.replace("/welcome");
    }
  }, [status, user, canView, router]);

  if (status !== "authenticated" || user?.mustChangePassword || !canView) {
    return null;
  }
  return <>{children}</>;
}
