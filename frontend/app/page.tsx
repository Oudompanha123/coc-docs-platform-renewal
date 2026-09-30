"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { landingPathFor } from "@/lib/auth/landing";
import { SessionProvider, useSession } from "@/lib/auth/SessionProvider";

/**
 * The bare origin, for somebody who typed the domain or followed a link with
 * no path. Routes by who is asking; renders nothing itself.
 *
 * <p><b>Why this is not a plain redirect any more.</b> It used to be a server
 * component that sent everyone to `/overview` unconditionally. That is an
 * admin route behind `RequireSession`, so a signed-out visitor arriving at
 * the bare domain was bounced straight to `/login` — the front door of a
 * product whose landing page is public asked for credentials before showing
 * anything. A `guest` has somewhere to be (`/welcome`); they were never sent
 * there.
 *
 * <p>The earlier version's reasoning for deciding nothing here still holds
 * for the *server*: the session is an httpOnly cookie the backend owns
 * (ADR-011), so a server component cannot read it without a round trip. The
 * answer is not to skip the question, though — it is to ask it on the client,
 * where `SessionProvider` is already asking it for every other route.
 *
 * <p><b>Why it renders nothing while it decides, rather than showing the
 * public page and correcting later.</b> Same reasoning `RequireSession`
 * gives: a visible flash of the marketing page before an admin's dashboard
 * loads reads as a glitch, and it would land on precisely the people who use
 * the product most. A redirect hub that is blank for one fetch is the honest
 * shape for this — nothing here is content, and every branch ends somewhere
 * real.
 *
 * <p>Each destination re-checks its own floor. This routes; it does not
 * authorize, and is presentation only — the API refuses what it refuses
 * regardless of which page a person reached.
 */
export default function RootPage() {
  return (
    <SessionProvider>
      <RootRedirect />
    </SessionProvider>
  );
}

/**
 * The same destination as {@code postLoginDestination} in
 * `app/login/page.tsx`, from the same function (`landingPathFor`): whoever
 * signs in and lands somewhere must land in that same place when they later
 * type the bare domain, or the product appears to move around under them.
 */
function RootRedirect() {
  const { status, user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // No session: the public landing page, which is what the bare domain
    // should have shown all along.
    if (status === "anonymous") {
      router.replace("/welcome");
      return;
    }

    // Signed in: a temporary password first (revision of ADR-017), then the
    // role's own home — Overview for Admin/Super Admin and for Developer,
    // Reviewer and Lead (ADR-071), the Member home for a `user`, the public
    // page for anything else.
    router.replace(landingPathFor({ role: user?.role, mustChangePassword: user?.mustChangePassword }));
  }, [status, user, router]);

  return null;
}
