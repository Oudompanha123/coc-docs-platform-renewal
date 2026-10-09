"use client";

import { useEffect, useState } from "react";
import { BellIcon } from "@/components/layout/icons";
import {
  disableNotifications,
  enableNotifications,
  isBackgroundPushConfigured,
  isNotificationsEnabled,
  notificationSupport,
  type NotificationSupport,
} from "@/lib/notify/push";

/**
 * The one control that asks the browser for notification permission (ADR-025).
 *
 * <p>Separate from {@link NotificationsCard}, which is per-type preferences.
 * This is whether this browser is a destination at all.
 *
 * <p><b>It is enabled whenever the browser can grant permission</b>, whether or
 * not this deployment has a Firebase project. An earlier version disabled it
 * without Firebase, which meant permission was never requested, which meant the
 * banners that need no Firebase at all could never fire — nothing appeared and
 * nothing said why. Background push is an extra this reports on, not a
 * prerequisite it hides behind.
 *
 * <p>It has to be a deliberate press: a browser only honours a permission
 * prompt raised from a user gesture, and one raised on page load is often
 * refused outright — permanently, because a denial cannot be re-raised from
 * script.
 */
export function PushNotificationsCard() {
  const [support, setSupport] = useState<NotificationSupport>("unsupported");
  const [enabled, setEnabled] = useState(false);
  const [background, setBackground] = useState(false);
  const [busy, setBusy] = useState(false);

  // In an effect, not during render: these read browser APIs that do not exist
  // during prerendering, and reading them in the render body makes the server
  // and the first client render disagree.
  useEffect(() => {
    setSupport(notificationSupport());
    setEnabled(isNotificationsEnabled());
    setBackground(isBackgroundPushConfigured());
  }, []);

  async function toggle() {
    setBusy(true);
    try {
      if (enabled) {
        await disableNotifications();
        setEnabled(false);
      } else {
        const granted = await enableNotifications();
        setEnabled(granted);
        // A refusal changes what this should say next time, so re-read rather
        // than assuming it is still merely "off".
        if (!granted) setSupport(notificationSupport());
      }
    } finally {
      setBusy(false);
    }
  }

  function description(): string {
    if (support === "unsupported") return "This browser cannot show notifications.";
    if (support === "denied") {
      return "Notifications are blocked for this site. Allow them in your browser settings to turn this on.";
    }
    if (!enabled) return "Get a browser alert when someone registers.";
    // Enabled: say honestly how far the alerts reach, because the difference
    // is invisible until the moment somebody closes the tab and misses one.
    return background
      ? "You will be alerted while this app is open, and while it is closed."
      : "You will be alerted while this app is open. Alerts when it is closed need a Firebase project.";
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
          <BellIcon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Browser notifications on this device</p>
          <p className="text-xs text-muted-foreground">{description()}</p>
        </div>
      </div>
      {/* role="switch" — waiting on the Switch primitive, same as
          NotificationsCard (ADR-104 §4.3). */}
      {/* eslint-disable-next-line react/forbid-elements */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle browser notifications on this device"
        disabled={support !== "ready" || busy}
        onClick={() => void toggle()}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 ${
          enabled ? "bg-primary" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-[left] ${
            enabled ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
