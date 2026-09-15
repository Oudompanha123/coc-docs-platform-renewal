"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "@/components/layout/icons";
import { disablePush, enablePush, isPushEnabled, pushSupport, type PushSupport } from "@/lib/notify/push";

/**
 * The one control that asks the browser for notification permission (ADR-025).
 *
 * <p>Separate from {@link NotificationsCard}, which is per-type preferences and
 * still local state. This is the transport: whether *this browser* is a
 * destination at all.
 *
 * <p><b>It has to be a deliberate press.</b> A browser only honours a
 * permission prompt raised from a user gesture, and a prompt raised on page
 * load is often refused outright — permanently, because a denial cannot be
 * re-raised from script. That is why nothing here runs until somebody clicks.
 *
 * <p>Each unavailable state says which one it is. "Notifications are off" when
 * the real answer is "your browser was never asked" or "this deployment has no
 * Firebase project" sends people to look for a setting that would not have
 * helped.
 */
export function PushNotificationsCard() {
  const [support, setSupport] = useState<PushSupport>("unsupported");
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  // In an effect, not during render: both read browser APIs that do not exist
  // during prerendering, and reading them in the render body makes the server
  // and the first client render disagree.
  useEffect(() => {
    setSupport(pushSupport());
    setEnabled(isPushEnabled());
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
      } else {
        const granted = await enablePush();
        setEnabled(granted);
        // A refusal changes what the control should say next time, so re-read
        // rather than assuming it is still merely "off".
        if (!granted) setSupport(pushSupport());
      }
    } finally {
      setBusy(false);
    }
  }

  const unavailable: Partial<Record<PushSupport, string>> = {
    unsupported: "This browser cannot show push notifications.",
    "not-configured": "Push notifications are not set up for this deployment.",
    denied: "Notifications are blocked for this site. Allow them in your browser settings to turn this on.",
  };

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">
          <BellIcon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-dash-ink">Push notifications on this device</p>
          <p className="text-xs text-muted">
            {unavailable[support] ??
              "Get told when someone registers, even when this tab is closed. Each browser is asked separately."}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle push notifications on this device"
        disabled={support !== "ready" || busy}
        onClick={() => void toggle()}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:cursor-not-allowed disabled:opacity-40 ${
          enabled ? "bg-gradient-to-r from-brand-purple to-brand-blue" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
