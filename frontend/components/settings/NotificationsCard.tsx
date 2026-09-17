"use client";

import { BellIcon, MailIcon } from "@/components/layout/icons";
import type { NotificationPreference } from "@/lib/mock/settings";

const ROW_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  notifications: BellIcon,
  messages: MailIcon,
};

/**
 * Per-type notification preferences — **not yet real**.
 *
 * <p><b>These two toggles store nothing.</b> They hold React state seeded from
 * `lib/mock/settings.ts`, so they reset on navigation, not merely on sign-out,
 * and nothing anywhere reads them: turning "Notifications" off still delivers
 * every notification. They are rendered read-only for that reason — a switch
 * that moves and changes nothing is worse than one that is visibly not ready,
 * because the first teaches somebody that the setting does not work and the
 * second admits it.
 *
 * <p><b>What making them real needs, and why it is not done here.</b> A
 * `notification_preference` table keyed by (account, type) alongside ADR-034's
 * `notification`, and a decision about what the rows are. The two shown —
 * "Notifications" and "Messages" — were seeded from the topbar's two badge
 * icons and map to nothing in `NotificationType`, which today has
 * `registration.pending` and `auth.new-device`. Picking the real list is a
 * product decision, not a refactor.
 *
 * <p>One of them should probably never be a preference at all: a new-device
 * sign-in alert is a security notice, and an account that has switched it off
 * is an account nobody can warn.
 */
export function NotificationsCard({ data }: { data: NotificationPreference[] }) {
  return (
    <div className="divide-y divide-border">
      {data.map((pref) => {
        const Icon = ROW_ICONS[pref.id] ?? BellIcon;
        return (
          <div key={pref.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-dash-ink">{pref.label}</p>
                <p className="text-xs text-muted">{pref.description}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              {/* Said out loud rather than left for somebody to discover by
                  turning it off and still getting notified. */}
              <span className="text-xs font-medium text-muted">Coming soon</span>
              <span
                role="switch"
                aria-checked={pref.enabled}
                aria-disabled="true"
                aria-label={`${pref.label} — not configurable yet`}
                className="relative h-6 w-11 rounded-full bg-border opacity-40"
              >
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
