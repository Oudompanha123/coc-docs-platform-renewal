"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
 * Deliberately the same three-way split as
 * {@code postLoginDestination} in `app/login/page.tsx`: whoever signs in and
 * lands somewhere must land in that same place when they later type the bare
 * domain, or the product appears to move around under them. If one of these
 * changes, the other has to.
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

    // Signed in, but the session only buys entry to one place until the
    // temporary password is replaced (revision of ADR-017).
    if (user?.mustChangePassword) {
      router.replace("/create-password");
      return;
    }

    if (user?.role === "admin" || user?.role === "super_admin") {
      router.replace("/overview");
      return;
    }

    // A `user` gets the Member home (ADR-033); anything else — a `guest`
    // account, or a role this build does not know — gets the public page,
    // which asks nothing of them.
    router.replace(user?.role === "user" ? "/home" : "/welcome");
  }, [status, user, router]);

  return null;
}
