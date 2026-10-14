"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SessionProvider, useSession } from "@/lib/auth/SessionProvider";
import { cliSignedInDestination } from "@/lib/auth/cliAuthorize";

/**
 * `/cli/signed-in` — where `claude-team-usage`'s loopback callback page sends
 * the browser after a successful Authorize (ADR-060). The CLI cannot know the
 * member's role, so this page decides: a super_admin goes to the team
 * dashboard `/claude-usage` (ADR-100), everyone else to `/my-claude-usage`, each with
 * `?cli=signed-in` so that page watches for the upload the CLI is about to
 * make (`useUsageAutoRefresh`).
 *
 * Outside the `(member)` and `(shell)` groups on purpose — each group's gate
 * would bounce the other audience before this could route it. Carries nothing
 * sensitive: no code, token or state ever reaches this URL.
 *
 * // req: FR-USAGE-002, FR-USAGE-005, ADR-060
 */
export default function CliSignedInPage() {
  return (
    <SessionProvider>
      <RouteByRole />
    </SessionProvider>
  );
}

function RouteByRole() {
  const { status, user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace(cliSignedInDestination(user?.role));
    // Only if the session ended between Authorize and here — the CLI itself
    // is already signed in, so there is nothing to resume; a normal sign-in.
    else if (status === "anonymous") router.replace("/login");
  }, [status, user, router]);

  return (
    <main className="grid min-h-[90vh] place-items-center px-4 text-center">
      <p className="text-muted-foreground text-sm">Returning to Claude Usage…</p>
    </main>
  );
}
