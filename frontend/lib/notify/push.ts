"use client";

/**
 * Turning notifications on and off in this browser (ADR-025).
 *
 * <p><b>Two capabilities, not one.</b> This got conflated once and the result
 * was a settings toggle that could never be pressed:
 *
 * <ol>
 *   <li><b>Browser notification permission</b> — needed for any banner at all,
 *       including the ones the bell raises from polling. Needs nothing but a
 *       browser.</li>
 *   <li><b>FCM registration</b> — needed only to be reached while the tab is
 *       closed. Needs a Firebase project.</li>
 * </ol>
 *
 * <p>Gating the first on the second meant that with no Firebase project the
 * toggle was disabled, so permission was never requested, so
 * {@code Notification.permission} stayed "default", so the polling alerts —
 * which need no Firebase whatever — could never fire either. Nothing appeared
 * and nothing explained why.
 *
 * <p>So permission is asked for whenever the browser can grant it, and FCM is
 * attempted afterwards on a best-effort basis. Without Firebase you get banners
 * while the app is open; with it you also get them while it is closed.
 *
 * <p><b>A refusal is permanent.</b> A denied prompt cannot be re-raised by
 * script — the person must change it in browser settings. So nothing here fires
 * on page load: {@link enableNotifications} is called from a deliberate press.
 */

import { BACKEND_URL } from "@/lib/auth/api";

/** Everything the service worker and the SDK need. None of it is secret. */
function firebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };
}

function vapidKey(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";
}

/** Whether this deployment can deliver to a closed tab. */
export function isBackgroundPushConfigured(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    Boolean(firebaseConfig().projectId) &&
    Boolean(vapidKey())
  );
}

export type NotificationSupport =
  /** The browser can show notifications and has not been refused. */
  | "ready"
  /** No Notification API, or running on the server during prerendering. */
  | "unsupported"
  /** Asked before and refused. Cannot be re-asked from script. */
  | "denied";

/** What the settings control should render, without asking for anything. */
export function notificationSupport(): NotificationSupport {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  return "ready";
}

/** Set once the person has opted in here, so the toggle and the poll agree. */
const ENABLED_KEY = "coc_notifications_enabled";
/** The FCM token this browser registered, so it can be unregistered later. */
const TOKEN_KEY = "coc_push_token";

function setFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(ENABLED_KEY, "1");
    else localStorage.removeItem(ENABLED_KEY);
  } catch {
    // Private mode. The toggle then resets on reload; alerts still work for
    // this session because permission is granted at the browser level.
  }
}

/**
 * True when banners should be shown.
 *
 * <p>Both halves matter: permission can be granted and the person can still
 * have turned this off here, and the flag can survive a permission they later
 * revoked in browser settings.
 */
export function isNotificationsEnabled(): boolean {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    return Notification.permission === "granted" && localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Registers this browser with FCM so it can be reached while closed.
 *
 * <p>Best effort. A deployment with no Firebase project still gets banners
 * while the app is open, which is the whole point of separating this from
 * permission.
 */
async function registerForBackgroundPush(): Promise<void> {
  if (!isBackgroundPushConfigured()) {
    return;
  }
  try {
    // The query string is how a static service worker gets configuration it
    // cannot read — see the comment atop public/firebase-messaging-sw.js.
    const params = new URLSearchParams(firebaseConfig() as unknown as Record<string, string>);
    const registration = await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${params.toString()}`,
    );

    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");
    const token = await getToken(getMessaging(initializeApp(firebaseConfig())), {
      vapidKey: vapidKey(),
      serviceWorkerRegistration: registration,
    });
    if (!token) return;

    const response = await fetch(`${BACKEND_URL}/api/v1/notifications/devices`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: "web" }),
    });
    if (response.ok) {
      try {
        localStorage.setItem(TOKEN_KEY, token);
      } catch {
        // The server's purge collects it eventually.
      }
    }
  } catch {
    // A blocked SDK, a service worker that will not install, an offline
    // network. In-app banners are unaffected.
  }
}

/**
 * Asks the browser for permission and turns banners on.
 *
 * @returns true when notifications are now enabled here.
 * @throws never — the caller is a toggle, and a rejected promise there is just
 *     an unhandled error.
 */
export async function enableNotifications(): Promise<boolean> {
  if (notificationSupport() !== "ready") {
    return false;
  }
  try {
    // Must come from a user gesture. Raised anywhere else, the browser may
    // refuse outright and remember the refusal.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }
    setFlag(true);
    // After the flag, so a failure here still leaves in-app banners working.
    await registerForBackgroundPush();
    return true;
  } catch {
    return false;
  }
}

/**
 * Turns banners off here, and stops background push.
 *
 * <p>Also called on sign-out: without it, the next person to use a shared
 * browser would keep receiving the previous person's notifications until FCM
 * happened to rotate the token.
 */
export async function disableNotifications(): Promise<void> {
  setFlag(false);

  let token: string | null = null;
  try {
    token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing to unregister.
  }
  if (!token) return;

  try {
    await fetch(`${BACKEND_URL}/api/v1/notifications/devices/${encodeURIComponent(token)}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // Best effort: the row also goes when FCM reports the token dead, and on
    // the scheduled purge.
  }
}

/**
 * Shows a banner for a push that arrives while the tab is open.
 *
 * <p>The service worker's {@code onBackgroundMessage} fires only when the app
 * is <em>not</em> in the foreground, so without this a message landing while
 * somebody is looking at another page is delivered and silently dropped.
 *
 * @returns a function that stops listening, for React to call on unmount.
 */
export async function listenForForegroundPush(): Promise<() => void> {
  if (!isBackgroundPushConfigured() || !isNotificationsEnabled()) {
    return () => {};
  }
  try {
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, onMessage } = await import("firebase/messaging");
    const messaging = getMessaging(initializeApp(firebaseConfig()));

    return onMessage(messaging, (payload) => {
      if (Notification.permission !== "granted") return;
      new Notification(payload.notification?.title ?? "Coc Docs Platform", {
        body: payload.notification?.body ?? "",
        icon: "/favicon.ico",
        // Same tag as the service worker, so a foreground and a background
        // copy of the same event replace one another rather than stacking.
        tag: payload.data?.type ?? "coc-docs",
      });
    });
  } catch {
    return () => {};
  }
}
