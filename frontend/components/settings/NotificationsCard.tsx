"use client";

import { useState } from "react";
import { BellIcon, MailIcon } from "@/components/layout/icons";
import type { NotificationPreference } from "@/lib/mock/settings";

const ROW_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  notifications: BellIcon,
  messages: MailIcon,
};

/** Mock/local-state only — no real notifications exist yet to suppress. */
export function NotificationsCard({ data }: { data: NotificationPreference[] }) {
  const [preferences, setPreferences] = useState(data);

  function toggle(id: string) {
    setPreferences((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  }

  return (
    <div className="divide-y divide-border">
      {preferences.map((pref) => {
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
            <button
              type="button"
              role="switch"
              aria-checked={pref.enabled}
              aria-label={`Toggle ${pref.label}`}
              onClick={() => toggle(pref.id)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${
                pref.enabled ? "bg-gradient-to-r from-brand-purple to-brand-blue" : "bg-border"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${
                  pref.enabled ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
