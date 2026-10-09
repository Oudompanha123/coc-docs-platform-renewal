"use client";

import { PushNotificationsCard } from "@/components/settings/PushNotificationsCard";
import { NotificationsCard as NotificationPreferences } from "@/components/settings/NotificationsCard";
import { MailCredentialCard } from "@/components/settings/MailCredentialCard";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * `/account/settings#notifications` — the same three controls as the
 * Notifications card on `/settings`, reused as-is rather than copied, so the
 * two pages can never drift apart: the browser-permission toggle (the only
 * control that asks for notification permission, ADR-025), the per-type
 * preferences, and sending your own attendance mail (ADR-063, ADR-084).
 *
 * <p>A normal `user` gets only the browser-permission toggle: the other two
 * are hidden here, not removed, and every role above `user` still sees all
 * three. The role is the signed-in session's own, never assumed.
 */
export function NotificationsCard() {
  const { user } = useSession();
  const isNormalUser = user?.role === "user";

  return (
    <section id="notifications" className="scroll-mt-24 rounded-xl border border-surface-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Notifications</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Choose what you get notified about.</p>
      <div className="mt-4">
        <PushNotificationsCard />
        {!isNormalUser && (
          <>
            <NotificationPreferences />
            <MailCredentialCard />
          </>
        )}
      </div>
    </section>
  );
}
