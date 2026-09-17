"use client";

import { type ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/SessionProvider";
import { RequireMemberSession } from "@/components/home/RequireMemberSession";

/**
 * Wraps every route under this group with the session and the Member-only
 * gate (ADR-033) — same shape as `(shell)/layout.tsx`, but there is no
 * sidebar/topbar chrome here: `/home` is a single self-contained page that
 * draws its own header, not a shell other pages mount inside.
 */
export default function MemberLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <RequireMemberSession>{children}</RequireMemberSession>
    </SessionProvider>
  );
}
