"use client";

import { useEffect, useState } from "react";
import { ShieldIcon } from "@/components/auth/icons";
import { BellIcon, CheckCircleIcon, MailIcon, UserPlusIcon } from "@/components/layout/icons";
import {
  fetchNotificationPreferences,
  updateNotificationPreference,
  type NotificationPreference,
} from "@/lib/notify/notification-preferences-api";

// registration.pending / auth.new-device / ax-renewal.member-added / ax-renewal.run-ready /
// ax-renewal.comment-added — NotificationType.key() on the
// backend. A type this build doesn't recognise falls back to BellIcon rather
// than crashing, same "skip, don't crash" spirit NotificationType.key()'s own
// doc gives an unrendered row.
const ROW_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "registration.pending": BellIcon,
  "auth.new-device": ShieldIcon,
  "ax-renewal.member-added": UserPlusIcon,
  "ax-renewal.run-ready": CheckCircleIcon,
  "ax-renewal.comment-added": MailIcon,
};

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; items: NotificationPreference[] };

/**
 * Per-type notification preferences (ADR-041) — real now. Reads and writes
 * `GET`/`PUT /api/v1/notifications/preferences`, backed by a real
 * `notification_preference` row per (account, type); a type nobody has
 * touched is shown enabled (opt-out by absence) rather than requiring a row
 * to exist first.
 *
 * <p>Replaces the earlier version of this component, which rendered two
 * switches from `lib/mock/settings.ts` — visibly disabled, labeled "Coming
 * soon" — because at the time neither mapped to anything the backend could
 * actually send. The list here is `NotificationType.values()` itself, so
 * there is nothing left to invent.
 */
export function NotificationsCard() {
  const [state, setState] = useState<State>({ status: "loading" });
  // Which row has a save in flight — only that switch disables, so flipping
  // one preference doesn't freeze the others.
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNotificationPreferences()
      .then((items) => {
        if (!cancelled) setState({ status: "ready", items });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Couldn't load notification preferences.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(pref: NotificationPreference) {
    if (state.status !== "ready") return;
    const previousItems = state.items;
    const next = !pref.enabled;

    // Optimistic: the switch moves immediately: revert only if the save
    // actually fails, rather than waiting on the round trip to move it.
    setState({
      status: "ready",
      items: previousItems.map((p) => (p.type === pref.type ? { ...p, enabled: next } : p)),
    });
    setSaveError(null);
    setPending((p) => new Set(p).add(pref.type));
    try {
      await updateNotificationPreference(pref.type, next);
    } catch (err) {
      setState({ status: "ready", items: previousItems });
      setSaveError(err instanceof Error ? err.message : "Couldn't save that setting.");
    } finally {
      setPending((p) => {
        const copy = new Set(p);
        copy.delete(pref.type);
        return copy;
      });
    }
  }

  if (state.status === "loading") {
    return <p className="py-3.5 text-sm text-muted">Loading…</p>;
  }

  if (state.status === "error") {
    return <p className="py-3.5 text-xs font-semibold text-[#c94040]">{state.message}</p>;
  }

  return (
    <div>
      {saveError && <p className="pb-2 text-xs font-semibold text-[#c94040]">{saveError}</p>}
      <div className="divide-y divide-border">
        {state.items.map((pref) => {
          const Icon = ROW_ICONS[pref.type] ?? BellIcon;
          const busy = pending.has(pref.type);
          return (
            <div key={pref.type} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
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
                aria-label={pref.label}
                disabled={busy}
                onClick={() => void toggle(pref)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:cursor-not-allowed disabled:opacity-60 ${
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
    </div>
  );
}
