/**
 * Real backend client for the caller's own notification preferences
 * (ADR-041) — `GET/PUT /api/v1/notifications/preferences`. Backs
 * `NotificationsCard` on the Settings page, replacing its earlier
 * `lib/mock/settings.ts`-seeded, disabled "Coming soon" switches.
 */

import { BACKEND_URL } from "@/lib/auth/api";

export class NotificationPreferenceApiError extends Error {}

/** {@code type} is {@link NotificationType#key()} on the backend — the
 *  stable identifier used to address a preference, not a display label. */
export type NotificationPreference = {
  type: string;
  label: string;
  description: string;
  enabled: boolean;
};

const PREFERENCES_URL = `${BACKEND_URL}/api/v1/notifications/preferences`;

/** Every real notification type, defaulted to enabled where the caller has never touched it. */
export async function fetchNotificationPreferences(): Promise<NotificationPreference[]> {
  let response: Response;
  try {
    response = await fetch(PREFERENCES_URL, { credentials: "include" });
  } catch {
    throw new NotificationPreferenceApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new NotificationPreferenceApiError("Couldn't load notification preferences. Please try again.");
  }
  const { items } = (await response.json()) as { items: NotificationPreference[] };
  return items;
}

/** Turns one notification type on or off for the caller. Requires an authenticated session. */
export async function updateNotificationPreference(type: string, enabled: boolean): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${PREFERENCES_URL}/${encodeURIComponent(type)}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
  } catch {
    throw new NotificationPreferenceApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new NotificationPreferenceApiError("You need to be signed in to change this.");
  }
  if (!response.ok) {
    throw new NotificationPreferenceApiError("Couldn't save that setting. Please try again.");
  }
}
