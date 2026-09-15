/*
 * Receives push notifications while the app is closed (ADR-025).
 *
 * WHY THIS FILE LOOKS THE WAY IT DOES
 *
 * A service worker is a plain static file served from the origin root. It is
 * not part of the Next.js bundle, so it cannot read NEXT_PUBLIC_* — those are
 * inlined at build time into modules, and this is not a module. The
 * configuration therefore arrives as query parameters on the registration URL
 * (see lib/notify/push.ts), which is the standard way round this.
 *
 * None of these values are secrets. A Firebase web config identifies the
 * project to Google and is designed to ship inside a public client bundle;
 * what protects the project is its server credentials and its security rules,
 * neither of which are here.
 *
 * The compat build is used deliberately: a service worker has no module
 * loader, and importScripts is what it has.
 */

importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const params = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId"),
});

const messaging = firebase.messaging();

/*
 * Fired only when the app is not in the foreground. A tab that is open handles
 * its own message in lib/notify/push.ts; without that split the same event
 * would be shown twice.
 */
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Coc Docs Platform";
  self.registration.showNotification(title, {
    body: payload.notification?.body ?? "",
    // The app's own icon, served from this same origin.
    icon: "/favicon.ico",
    // Collapses repeats: five registrations while the browser is closed
    // replace one another rather than stacking five identical banners. The
    // count is wrong either way — the queue is the authority — and one
    // notification that says "go and look" beats five that say it louder.
    tag: payload.data?.type ?? "coc-docs",
    data: { link: payload.data?.link ?? "/" },
  });
});

/*
 * Clicking the notification should land on the queue, and should reuse a tab
 * that is already open rather than piling up new ones.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === link && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
