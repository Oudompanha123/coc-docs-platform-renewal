"use client";

/**
 * Turning push notifications on and off in this browser (ADR-025).
 *
 * <p><b>Permission is asked for once, and a refusal is permanent.</b> A denied
 * Notification prompt cannot be re-raised by script — the person has to change
 * it in browser settings, and most never will. So nothing here fires on page
 * load: {@link enablePush} is called from a deliberate control, and until
 * somebody presses it this module does nothing at all.
 *
 * <p><b>Firebase is loaded on demand.</b> A dynamic import keeps the SDK out of
 * the bundle every visitor downloads, for a feature only super admins use and
 * only after opting in.
 *
 * <p><b>Everything degrades to "unsupported" rather than throwing.</b> Safari
 * before 16.4, Firefox in private mode, any browser without a service worker,
 * and the server during prerendering all land in the same branch. A settings
 * toggle must be able to say "not available here" without taking the page down.
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

/** The public key that lets Google verify pushes come from this project. */
function vapidKey(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? "";
}

export type PushSupport =
  | "ready"
  /** The browser can, but Firebase is not configured for this deployment. */
  | "not-configured"
  /** No service worker, no Notification API, or server-side. */
  | "unsupported"
  /** Asked before and refused. Cannot be re-asked from script. */
  | "denied";

/** What the settings control should render, without asking for anything. */
export function pushSupport(): PushSupport {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
    return "unsupported";
  }
  if (!firebaseConfig().projectId || !vapidKey()) {
    return "not-configured";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  return "ready";
}

/** The token this browser last registered, so it can be unregistered on sign-out. */
const TOKEN_KEY = "coc_push_token";

function rememberToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Private mode. Push still works for this session; the token just cannot
    // be revoked from here later, and the server's purge will collect it.
  }
}

function takeToken(): string | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return token;
  } catch {
    return null;
  }
}

/**
 * Registers the service worker with the config it cannot read for itself.
 *
 * <p>The query string is how a static file gets its configuration — see the
 * comment at the top of {@code public/firebase-messaging-sw.js}.
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const params = new URLSearchParams(firebaseConfig() as unknown as Record<string, string>);
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`);
}

/**
 * Asks for permission, obtains a token, and tells the backend about it.
 *
 * @returns true when this browser is now registered.
 * @throws never — a refusal is a false, not an exception, because the caller
 *     is a toggle and a rejected promise there is just an unhandled error.
 */
export async function enablePush(): Promise<boolean> {
  if (pushSupport() !== "ready") {
    return false;
  }

  try {
    // Must come from a user gesture. Called anywhere else, the browser may
    // refuse outright and remember the refusal.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return false;
    }

    const registration = await registerServiceWorker();
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");

    const app = initializeApp(firebaseConfig());
    const token = await getToken(getMessaging(app), {
      vapidKey: vapidKey(),
      serviceWorkerRegistration: registration,
    });
    if (!token) {
      return false;
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/notifications/devices`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: "web" }),
    });
    if (!response.ok) {
      return false;
    }

    rememberToken(token);
    return true;
  } catch {
    // A blocked SDK, a service worker that will not install, an offline
    // network. None of it should break the settings page.
    return false;
  }
}

/**
 * Stops notifications to this browser.
 *
 * <p>Called from the toggle and from sign-out. Without the sign-out call, the
 * next person to use a shared browser would keep receiving the previous
 * person's notifications until FCM happened to rotate the token.
 */
export async function disablePush(): Promise<void> {
  const token = takeToken();
  if (!token) {
    return;
  }
  try {
    await fetch(`${BACKEND_URL}/api/v1/notifications/devices/${encodeURIComponent(token)}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // Best effort. The row is also removed when FCM reports the token dead,
    // and by the scheduled purge.
  }
}

/** True when this browser is currently registered. Drives the toggle's initial state. */
export function isPushEnabled(): boolean {
  try {
    return typeof window !== "undefined" && localStorage.getItem(TOKEN_KEY) !== null;
  } catch {
    return false;
  }
}
