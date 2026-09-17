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
 * Names the Firebase settings this build is missing.
 *
 * <p>Empty when everything needed is present. The six are inlined at build
 * time, so a value added to `.env.local` after `next dev` started is still
 * absent here — restarting the dev server is part of the answer and the
 * message says so.
 */
function missingFirebaseSettings(): string[] {
  const required: Record<string, string> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "",
  };
  return Object.entries(required)
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

/**
 * Registers this browser with FCM so it can be reached while closed.
 *
 * <p>Best effort. A deployment with no Firebase project still gets banners
 * while the app is open, which is the whole point of separating this from
 * permission.
 *
 * <p><b>Every failure here says so in the console.</b> It used to say nothing:
 * a toggle that reported success, a device token that was never registered,
 * and push that silently never arrived — with a missing environment variable,
 * a rejected VAPID key and an expired session all looking identical from the
 * outside. This is a setup path, walked once per person per browser, and the
 * hour it costs to guess is worth more than the two lines it takes to say.
 */
async function registerForBackgroundPush(): Promise<void> {
  const missing = missingFirebaseSettings();
  if (missing.length > 0) {
    console.warn(
      "[notifications] banners are on, but push to a closed tab is off: " +
        `${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not set. ` +
        "Add them to frontend/.env.local and restart the dev server — they are " +
        "inlined at build time, so a running server will not pick them up.",
    );
    return;
  }
  if (!isBackgroundPushConfigured()) {
    console.warn(
      "[notifications] push to a closed tab is unavailable: this browser has no " +
        "service worker support, or the page is not on https/localhost.",
    );
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
    if (!token) {
      // FCM answered without one. Almost always a VAPID key that does not
      // belong to this project, or a browser that blocks push at OS level.
      console.warn(
        "[notifications] Firebase returned no device token. Check that " +
          "NEXT_PUBLIC_FIREBASE_VAPID_KEY is the Web Push certificate of " +
          "project " +
          firebaseConfig().projectId +
          ", and that notifications are not blocked for this site.",
      );
      return;
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/notifications/devices`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: "web" }),
    });
    if (!response.ok) {
      // 401 here means the session died between enabling and registering,
      // which is worth saying: the toggle looks successful and the device is
      // reachable by nothing.
      console.warn(
        `[notifications] the backend refused this device token (HTTP ${response.status}). ` +
          "Push to a closed tab will not arrive until it is registered.",
      );
      return;
    }
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // The server's purge collects it eventually.
    }
  } catch (error) {
    // A blocked SDK, a service worker that will not install, an offline
    // network. In-app banners are unaffected, which is why this is a warning
    // and not a failure.
    console.warn("[notifications] could not register this browser for push:", error);
  }
}

/**
 * Asks the browser for permission and turns banners on.
 *
 * @returns true when notifications are now enabled here.
 * @throws never — the caller is a toggle, and a rejected promise there is just
 *     an unhandled error.
 */
/**
 * Registers this browser for push if it should be and is not.
 *
 * <p><b>The gap this closes.</b> {@link registerForBackgroundPush} only ever
 * ran from a press of the Settings toggle. Turn notifications on before the
 * deployment has a Firebase project — which is what everybody here did, because
 * banners work without one — and the opt-in flag is stored, the toggle reads
 * as on for ever after, and the one code path that could register a device
 * token is behind the press that now switches it *off*. Add Firebase later and
 * nothing re-tries: no token, no push, no error, and a Settings page that says
 * notifications are enabled. That is exactly where this project sat on
 * 2026-09-16.
 *
 * <p>So the state is reconciled on load instead of only on the press. Called
 * from the bell, which mounts on every signed-in page, because registering a
 * token is an authenticated call and the person must already be somebody.
 *
 * <p>Skipped when a token is already stored here, so this is one localStorage
 * read on most loads. A token that has rotated, or one left over from a
 * different Firebase project, is not detected — the server prunes what FCM
 * rejects, which covers the first and not the second.
 */
export async function ensureBackgroundPushRegistered(): Promise<void> {
  // Not opted in here: no permission, or the toggle is off. Nothing to do,
  // and nothing to say — this is the ordinary state for most people.
  if (!isNotificationsEnabled()) {
    return;
  }
  // No Firebase project. Silent on purpose: banners work, this deployment
  // simply cannot reach a closed tab, and saying so on every page load would
  // be noise rather than news.
  if (!isBackgroundPushConfigured()) {
    return;
  }
  try {
    if (localStorage.getItem(TOKEN_KEY)) {
      return;
    }
  } catch {
    // Private mode. Registering again is harmless — the server upserts.
  }
  await registerForBackgroundPush();
}

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
 * Stops this browser receiving push, without changing what the person asked
 * for.
 *
 * <p><b>Called on sign-out, and this is the whole reason it is separate from
 * {@link disableNotifications}.</b> A device token is registered against an
 * account, so leaving it behind would deliver the previous person's
 * notifications to whoever signs in next on a shared browser — until FCM
 * happened to rotate it, which it may never do. That token must go.
 *
 * <p>The preference must not. "Do I want banners in this browser" is a
 * property of the browser and the person, not of a session, and the browser
 * permission that backs it already survives sign-out — it is granted per
 * origin, not per login. Clearing our flag as well made the toggle disagree
 * with the browser and turned itself off every time somebody signed out and
 * back in, which is exactly how it was reported.
 *
 * <p>Signing in again re-registers, because {@link ensureBackgroundPushRegistered}
 * finds the preference on and no token stored — and the new token belongs to
 * whoever just signed in.
 */
export async function unregisterThisDevice(): Promise<void> {
  await forgetToken();
}

/**
 * Turns banners off here, at the person's request.
 *
 * <p>Clears the preference as well as the token, which is what distinguishes
 * it from {@link unregisterThisDevice}: this is somebody saying they do not
 * want them, and it should survive their next sign-in exactly as turning it on
 * does.
 */
export async function disableNotifications(): Promise<void> {
  setFlag(false);
  await forgetToken();
}

/**
 * Drops this browser's device token, here and on the server.
 *
 * <p>Best effort on the server side: the row also goes when FCM reports the
 * token dead, and on the scheduled purge. Dropping it locally is what matters
 * for re-registration, and that cannot fail in a way worth reporting.
 */
async function forgetToken(): Promise<void> {
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
    // Best effort, as above.
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
