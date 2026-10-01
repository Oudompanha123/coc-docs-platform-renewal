"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listPending, type PendingAccount } from "@/lib/admin/accounts";
import { listSessions, SessionExpiredError, type SessionSummary } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";
import {
  fetchInbox,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxNotification,
} from "@/lib/notify/inbox-api";
import { ensureBackgroundPushRegistered, isNotificationsEnabled } from "@/lib/notify/push";
import { subscribeToNotifications } from "@/lib/notify/stream";

/**
 * What the bell shows, and which of it has been read.
 *
 * <p><b>Stored, not derived.</b> This used to build its list from live state —
 * the pending queue and the session list — which meant a new-device sign-in
 * alert was a filter over sessions that still existed. It vanished when that
 * session was revoked or expired, so the case the alert exists for (somebody
 * signed in, did something, and left) was the case that left nothing behind.
 * The PM found it exactly that way: "I see notify but next time I don't see
 * notify at list". Rows now, per ADR-034.
 *
 * <p><b>Read state is the server's.</b> It was `localStorage`, so reading an
 * alert on a laptop left it unread on a phone and clearing site data lost
 * every mark. `read_at` belongs to the person.
 *
 * <p><b>The live sources are consulted only to act.</b> Opening a registration
 * needs the applicant, and ending a session needs the session — both fetched
 * on the click rather than polled, so the list costs one request and the queue
 * stays the authority on who is actually still waiting.
 *
 * <p><b>Live, with polling underneath.</b> An open stream (ADR-028) says when
 * to re-read. The sixty-second poll stays as the floor: a stream can be cut by
 * a proxy or a frozen tab without telling either end, and a minute late is a
 * poor experience where never is a bug.
 */

const POLL_INTERVAL_MS = 60_000;

export type NotificationItem = {
  id: string;
  /** `NotificationType.key()` — what to render and where a click leads. */
  type: string;
  title: string;
  detail: string;
  read: boolean;
  createdAt: string;
  targetId: string | null;
  iconUrl: string | null;
  /** The applicant's name, when this is about one — for the avatar's initials. */
  subjectName: string | null;
};

export type Notifications = {
  items: NotificationItem[];
  /** Badge count. Every unread, not only what is listed. */
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Re-reads the inbox. */
  refresh: () => Promise<void>;
  /** Resolves what an item is about and hands it to the right dialog. */
  open: (item: NotificationItem) => Promise<void>;
};

/**
 * The sentence, built from the type and the facts.
 *
 * <p>No wording is stored (ADR-034 decision 2), so improving one of these
 * applies to every notification already sent rather than only to new ones.
 *
 * <p>An unrecognised type falls back to `payload.body`, which every sender
 * writes: a build older than a type, or one after a type was retired, shows
 * something true rather than a blank row.
 */
function render(n: InboxNotification): { title: string; detail: string } {
  const body = typeof n.payload.body === "string" ? n.payload.body : "";
  switch (n.type) {
    case "registration.pending":
      return {
        title: "New registration",
        detail: body || "Someone is waiting for approval",
      };
    case "auth.new-device":
      return {
        title: "New sign-in",
        detail: body ? `${body} · ${formatWhen(n.createdAt)}` : "From a device you have not used",
      };
    // ADR-074. The project's name is deliberately not in the row — the same
    // sentence goes to a lock screen — so it is one click away instead.
    case "ax-renewal.member-added":
      return {
        title: "Added to a project",
        detail: body || "You were added to an AX Renewal project",
      };
    default:
      return { title: "Notification", detail: body || "Something happened" };
  }
}

/** A readable timestamp, or something honest when the value will not parse. */
function formatWhen(iso: string): string {
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? "recently" : when.toLocaleString();
}

function toItem(n: InboxNotification): NotificationItem {
  const { title, detail } = render(n);
  return {
    id: n.id,
    type: n.type,
    title,
    detail,
    read: n.readAt !== null,
    createdAt: n.createdAt,
    targetId: n.targetId,
    iconUrl: typeof n.payload.iconUrl === "string" ? n.payload.iconUrl : null,
    subjectName: typeof n.payload.subjectName === "string" ? n.payload.subjectName : null,
  };
}

/**
 * Draws initials on the brand gradient and returns it as a data URL.
 *
 * <p>The banner icon for somebody with no provider picture. The alternative
 * was the app favicon, which is the Next.js logo and says nothing about who
 * the notification is about.
 */
function initialsIcon(name: string): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const gradient = ctx.createLinearGradient(0, 0, 96, 96);
    gradient.addColorStop(0, "#6d3ce0");
    gradient.addColorStop(1, "#4c6ff0");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(48, 48, 48, 0, Math.PI * 2);
    ctx.fill();

    const initials =
      name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .join("")
        .slice(0, 2)
        .toUpperCase() || "?";

    ctx.fillStyle = "#ffffff";
    ctx.font = "600 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, 48, 52);

    return canvas.toDataURL();
  } catch {
    return undefined;
  }
}

/**
 * Raises a browser banner, and makes clicking it do something.
 *
 * <p>The fallback for a deployment with no Firebase project, and for a tab
 * that is open — FCM background handling covers neither. Requires the same
 * permission the Settings toggle asks for, and does nothing without it.
 *
 * <p>`tag` collapses repeats: five registrations replace one another rather
 * than stacking five identical banners. Each type gets its own, because a
 * sign-in alert must never be the banner a registration quietly replaces.
 */
function alertBrowser(item: NotificationItem, onClick: () => void) {
  try {
    // Both halves: permission at the browser level, and the person having
    // turned this on in Settings. Permission alone would alert somebody who
    // switched it off here.
    if (!isNotificationsEnabled()) {
      return;
    }
    const banner = new Notification(item.title, {
      body: item.detail,
      icon: item.iconUrl ?? (item.subjectName ? initialsIcon(item.subjectName) : undefined),
      tag: item.type,
    });

    // A banner that does nothing when clicked is worse than none: it says
    // something needs doing and then makes the reader go and find it.
    banner.onclick = () => {
      window.focus();
      banner.close();
      onClick();
    };
  } catch {
    // Some browsers throw on the constructor rather than returning; a banner
    // is never worth breaking the page for.
  }
}

export function useNotifications(
  options: {
    /** Called when a registration notification is opened. */
    onOpenApproval?: (account: PendingAccount) => void;
    /** Called when a new-device sign-in notification is opened. */
    onOpenSignIn?: (session: SessionSummary) => void;
    /**
     * Called with the project's id when an "added to a project" notification
     * is opened (ADR-074). The caller decides how to get there — the admin
     * shell's Topbar opens the workspace in a new tab. Without it, opening
     * one does nothing, which is right for the member area: a plain `user`
     * can never be added to a project.
     */
    onOpenProject?: (projectId: string) => void;
  } = {},
): Notifications {
  // Refs so the polling effect does not restart every render just because the
  // caller passed new closures.
  const onOpenApproval = useRef(options.onOpenApproval);
  onOpenApproval.current = options.onOpenApproval;
  const onOpenSignIn = useRef(options.onOpenSignIn);
  onOpenSignIn.current = options.onOpenSignIn;
  const onOpenProject = useRef(options.onOpenProject);
  onOpenProject.current = options.onOpenProject;

  const { status, refresh: refreshSession } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Ids already announced by this tab, so polling does not re-alert on every
  // pass. A ref, not state: changing it must not re-render.
  const announced = useRef<Set<string> | null>(null);

  const signedIn = status === "authenticated";

  /**
   * Finds what an item is about and opens the dialog for it.
   *
   * <p>Fetched on the click rather than polled. The notification is the
   * record; the queue and the session list are the current state, and only
   * acting needs both. It also means the ordinary case — a bell nobody opens —
   * costs one request instead of three.
   */
  const open = useCallback(async (item: NotificationItem) => {
    if (!item.targetId) return;
    // No lookup first: the project page itself is the check. If the project
    // has since been deleted, or the reader removed from it, it says so —
    // the same 404 any non-member gets (ADR-070).
    if (item.type === "ax-renewal.member-added") {
      onOpenProject.current?.(item.targetId);
      return;
    }
    try {
      if (item.type === "auth.new-device") {
        const session = (await listSessions()).find((s) => s.id === item.targetId);
        // Absent means it has already been dealt with — the session ended, or
        // somebody signed out. The notification stays; there is simply nothing
        // left to act on, and saying so is the honest outcome.
        if (session) onOpenSignIn.current?.(session);
        return;
      }
      if (item.type === "registration.pending") {
        const account = (await listPending()).find((a) => a.id === item.targetId);
        // Approved by somebody else between the notification and the click.
        if (account) onOpenApproval.current?.(account);
      }
    } catch {
      // A failed lookup costs the dialog, not the notification. The bell is
      // still right about what happened.
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    try {
      const inbox = await fetchInbox();
      const next = inbox.items.map(toItem);
      setItems(next);
      setUnreadCount(inbox.unreadCount);

      // First pass after sign-in seeds the set without alerting: everything
      // already here is old news, and a banner per item on every page load
      // would teach people to ignore the banners.
      if (announced.current === null) {
        announced.current = new Set(next.map((n) => n.id));
      } else {
        for (const item of next) {
          if (announced.current.has(item.id) || item.read) continue;
          announced.current.add(item.id);
          alertBrowser(item, () => void open(item));
        }
      }
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        // Not "could not load" but "you are not signed in any more". Showing
        // an empty bell for it is how a tab that had been signed out for an
        // hour went on looking normal. The provider is the authority on
        // session state and RequireSession knows what to do when it turns
        // anonymous.
        void refreshSession();
      }
      // Anything else: the bell keeps what it had. This drives the topbar on
      // every page, and a thrown error in a layout component takes the page
      // down.
      setItems([]);
      setUnreadCount(0);
    }
  }, [signedIn, refreshSession, open]);

  useEffect(() => {
    void refresh();
    if (!signedIn) return;

    // Register this browser for push if it should be and is not.
    void ensureBackgroundPushRegistered();

    // The live connection: the server says something changed and this re-reads
    // at once. This is what makes the bell change while somebody is watching
    // it, with no Firebase project and no granted permission.
    const stopStream = subscribeToNotifications(() => void refresh());

    // The floor under it. A stream can be cut by a proxy that strips
    // buffering, a corporate middlebox, or a tab the OS froze — none of which
    // announce themselves.
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);

    return () => {
      stopStream();
      clearInterval(timer);
    };
  }, [refresh, signedIn]);

  const markRead = useCallback((id: string) => {
    // Optimistic: the row is already read from the reader's point of view, and
    // making them watch a round trip to see a dot disappear would be worse
    // than being briefly wrong. The next poll corrects it either way.
    setItems((prev) =>
      prev.map((item) => (item.id === id && !item.read ? { ...item, read: true } : item)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    void markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    void markAllNotificationsRead();
  }, []);

  // A notification clicked while the app was closed lands here, as
  // ?approve=<id> or ?session=<id> on whatever page the service worker
  // opened. Acted on once the inbox has loaded; the parameter is then removed
  // so a refresh does not reopen it.
  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;

    const url = new URL(window.location.href);
    const wantedSession = url.searchParams.get("session");
    const wantedAccount = url.searchParams.get("approve");
    if (!wantedSession && !wantedAccount) return;

    const wanted = wantedSession ?? wantedAccount;
    const item = items.find((n) => n.targetId === wanted);

    url.searchParams.delete("session");
    url.searchParams.delete("approve");
    window.history.replaceState({}, "", url.toString());

    if (item) void open(item);
  }, [items, open]);

  return { items, unreadCount, markRead, markAllRead, refresh, open };
}
