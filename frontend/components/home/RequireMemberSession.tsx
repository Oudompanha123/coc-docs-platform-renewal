"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * The gate for `/home`, the Member (`user`-role) post-login landing page —
 * a deliberate copy of `RequireSession`, not a shared import, because the
 * floor is different and narrower on both ends: `RequireSession` admits
 * `admin`/`super_admin` for the sidebar shell; this admits `user` only.
 * An `admin`/`super_admin` account is sent to `/overview` instead of shown
 * this page, since that's their own real landing page.
 *
 * <p>Same courtesy-not-control caveat as `RequireSession`: every route this
 * covers is also enforced server-side (the tasks/nav/docs-content reads this
 * page makes are each gated at their own real floor). This only fixes the
 * experience for a caller who shouldn't be here at all.
 */
export function RequireMemberSession({ children }: { children: ReactNode }) {
  const { status, user } = useSession();
  const router = useRouter();
  const isMember = user?.role === "user";
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    } else if (status === "authenticated" && user?.mustChangePassword) {
      router.replace("/create-password");
    } else if (status === "authenticated" && isAdmin) {
      router.replace("/overview");
    } else if (status === "authenticated" && !isMember) {
      router.replace("/welcome");
    }
  }, [status, user, isMember, isAdmin, router]);

  if (status !== "authenticated" || user?.mustChangePassword || !isMember) {
    return null;
  }
  return <>{children}</>;
}
