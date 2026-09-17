"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
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
  const canView = user?.role === "user" || user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (status === "anonymous") {
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
