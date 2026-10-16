"use client";

import { type ReactNode } from "react";
import { usePathname } from "@/lib/i18n/navigation";
import { isStorePath } from "@/lib/store/store-api";
import { SessionProvider } from "@/lib/auth/SessionProvider";
import { LogoutLoadingDim } from "@/components/layout/LogoutLoadingDim";
import { RequireMemberSession } from "@/components/home/RequireMemberSession";

/**
 * Wraps every route under this group with the session and the Member-only
 * gate (ADR-033) — same shape as `(shell)/layout.tsx`, but there is no
 * sidebar/topbar chrome here: `/home` is a single self-contained page that
 * draws its own header, not a shell other pages mount inside.
 */
export default function MemberLayout({ children }: { children: ReactNode }) {
  // The Store's public apps are readable without signing in; everything else
  // in this group still needs a member session.
  const isStore = isStorePath(usePathname());
  return (
    <SessionProvider>
      <LogoutLoadingDim />
      <RequireMemberSession allowAnonymous={isStore}>{children}</RequireMemberSession>
    </SessionProvider>
  );
}
