"use client";

import { useSession } from "@/lib/auth/SessionProvider";
import { useMinimumDisplay } from "@/lib/layout/useMinimumDisplay";
import { LoadingDim } from "./LoadingDim";

/**
 * Shows `LoadingDim` for the duration of a sign-out — mounted once inside
 * each layout that provides its own `SessionProvider` ((shell) and
 * (member)), rather than duplicated across the three "Sign out"/"Log out"
 * buttons that trigger it (Topbar, MemberHeader, HomeFooter): `LoadingDim`
 * is `position: fixed`, so where in the tree it renders from doesn't matter.
 */
export function LogoutLoadingDim() {
  const { isSigningOut } = useSession();
  const dimVisible = useMinimumDisplay(isSigningOut, 400);
  if (!dimVisible) return null;
  return <LoadingDim label="Signing out…" />;
}
