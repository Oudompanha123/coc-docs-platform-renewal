"use client";

import { type ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/SessionProvider";
import { LogoutLoadingDim } from "@/components/layout/LogoutLoadingDim";
import { RequireAccountSession } from "@/components/account/RequireAccountSession";

/**
 * A standalone top-level route, not nested in `(member)` or `(shell)` —
 * `/account/settings` needs its own, wider access floor (every signed-in
 * role, see `RequireAccountSession`) than either of those groups' shared
 * layouts enforce, and nesting it under one of them would mean inheriting
 * that group's own narrower gate first.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <LogoutLoadingDim />
      <RequireAccountSession>{children}</RequireAccountSession>
    </SessionProvider>
  );
}
