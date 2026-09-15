"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listPending, type PendingAccount } from "@/lib/admin/accounts";
import { useSession } from "@/lib/auth/SessionProvider";
import { isNotificationsEnabled } from "@/lib/notify/push";

/**
 * What the bell in the topbar shows, and which of it has been looked at.
 *
 * <p>It used to render a hardcoded array from `lib/mock/overview` — three
 * invented items that never changed. This is the one real thing the system
 * currently has to say: who is waiting for approval (ADR-017), which is also
 * exactly what the push notification (ADR-025) deep-links to.
 *
 * <p><b>The list is derived, the read marks are stored.</b> Items come from the
 * queue on every read, so they cannot drift from the truth — approve somebody
 * and they leave the list because they left the queue, not because anything
 * here remembered to remove them. Read state is the one thing the queue cannot
 * answer, so it is kept separately.
 *
 * <p><b>Read marks are per-browser.</b> localStorage, not the server. Reading a
 * notification on your laptop leaves it unread on your phone. That is a real
 * limitation and the honest fix is a server-side notification table — worth
 * building when the second notification type arrives and there is something to
 * share the design with, not for one type that already has a queue behind it
 * (ADR-025, "Alternatives Considered").
 *
 * <p><b>Polling, at a deliberately unhurried interval.</b> The badge should not
 * need a page reload to be right. Sixty seconds is chosen against the thing it
 * competes with: FCM, which is immediate. This is the floor for somebody who
 * has not enabled push, not the mechanism.
 */

const READ_KEY = "coc_read_notifications";
const POLL_INTERVAL_MS = 60_000;

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  read: boolean;
  /** The applicant, for the approval popup. */
  account: PendingAccount;
};

export type Notifications = {
  items: NotificationItem[];
  /** Badge count — unread only. Zero renders no badge. */
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Re-reads the queue. Called after approving, so the item leaves at once. */
  refresh: () => Promise<void>;
};

function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function storeReadIds(ids: Set<string>) {
  try {
    // Only ids still in the queue are kept, so this cannot grow without bound
    // as people are approved and their notifications disappear.
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    // Private mode. Everything shows as unread, which is wrong but harmless —
    // the queue itself is unaffected.
  }
}

/**
 * Draws initials on the brand gradient and returns it as a data URL.
 *
 * <p>The banner icon for somebody with no provider picture. The alternative
 * was the app favicon, which is the Next.js logo and says nothing about who
 * the notification is about — the same reason the in-app list shows initials
 * rather than a stand-in face.
 *
 * <p>Returns undefined when canvas is unavailable, and the banner then simply
 * has no icon, which is better than a wrong one.
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
 * Raises a browser notification for an applicant nobody has seen yet.
 *
 * <p>The fallback for a deployment with no Firebase project, and for a tab
 * that is open — FCM's background handler covers neither. Requires the same
 * permission the Settings toggle asks for, and does nothing without it, so it
 * can never be the thing that prompts.
 */
function alertBrowser(account: PendingAccount, onClick: (account: PendingAccount) => void) {
  try {
    // Both halves: permission at the browser level, and the person having
    // turned this on in Settings. Permission alone would alert somebody who
    // switched it off here.
    if (!isNotificationsEnabled()) {
      return;
    }
    // tag collapses repeats: five registrations replace one another rather
    // than stacking five banners saying the same thing.
    const banner = new Notification("New registration", {
      body: `${account.displayName} is waiting for approval`,
      // Their own picture when Google gave one; initials otherwise. Never the
      // app logo, which tells the reader nothing about who this is.
      icon: account.avatarUrl ?? initialsIcon(account.displayName),
      tag: "registration.pending",
    });

    // A banner that does nothing when clicked is worse than none: it says
    // something needs doing and then makes the reader go and find it.
    banner.onclick = () => {
      window.focus();
      banner.close();
      onClick(account);
    };
  } catch {
    // Some browsers throw on the constructor rather than returning; a banner
    // is never worth breaking the page for.
  }
}

export function useNotifications(options: {
  /**
   * Called when a browser banner is clicked, and when the app is opened by a
   * notification deep link. The bell answers it by opening the approval
   * dialog, so the reader acts from where they already are.
   */
  onOpenApproval?: (account: PendingAccount) => void;
} = {}): Notifications {
  // A ref so the polling effect does not restart every render just because the
  // caller passed a new closure.
  const onOpenApproval = useRef(options.onOpenApproval);
  onOpenApproval.current = options.onOpenApproval;

  const { status, user } = useSession();
  const [pending, setPending] = useState<PendingAccount[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());

  // Ids already announced by this tab, so polling does not re-alert on every
  // pass. A ref, not state: changing it must not re-render.
  const announced = useRef<Set<string> | null>(null);

  const isApprover = status === "authenticated" && user?.role === "super_admin";

  useEffect(() => {
    setRead(readIds());
  }, []);

  const refresh = useCallback(async () => {
    if (!isApprover) {
      setPending([]);
      return;
    }
    try {
      const queue = await listPending();
      setPending(queue);

      // First pass after sign-in seeds the set without alerting: everything
      // already in the queue is old news, and a banner per waiting applicant
      // on every page load would teach people to ignore the banners.
      if (announced.current === null) {
        announced.current = new Set(queue.map((a) => a.id));
      } else {
        for (const account of queue) {
          if (!announced.current.has(account.id)) {
            announced.current.add(account.id);
            alertBrowser(account, (clicked) => onOpenApproval.current?.(clicked));
          }
        }
      }

      // Forget read marks for people no longer in the queue.
      setRead((prev) => {
        const live = new Set(queue.map((a) => a.id));
        const kept = new Set([...prev].filter((id) => live.has(id)));
        if (kept.size !== prev.size) storeReadIds(kept);
        return kept.size === prev.size ? prev : kept;
      });
    } catch {
      // This drives the topbar, which is on every page. An empty bell is wrong
      // but harmless; a thrown error in a layout component takes the page down.
      setPending([]);
    }
  }, [isApprover]);

  useEffect(() => {
    void refresh();
    if (!isApprover) return;
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh, isApprover]);

  const markRead = useCallback((id: string) => {
    setRead((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      storeReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setRead(() => {
      const next = new Set(pending.map((a) => a.id));
      storeReadIds(next);
      return next;
    });
  }, [pending]);

  // A notification clicked while the app was closed lands here, as
  // ?approve=<id> on whatever page the service worker opened. Acted on once
  // the queue has loaded, so the dialog has somebody to show; the parameter is
  // then removed so a refresh does not reopen it.
  useEffect(() => {
    if (typeof window === "undefined" || pending.length === 0) return;
    const url = new URL(window.location.href);
    const wanted = url.searchParams.get("approve");
    if (!wanted) return;

    const account = pending.find((a) => a.id === wanted);
    url.searchParams.delete("approve");
    window.history.replaceState({}, "", url.toString());
    // Absent means already approved by somebody else between the notification
    // and the click. Silently doing nothing is right: the queue on screen is
    // already the answer.
    if (account) onOpenApproval.current?.(account);
  }, [pending]);

  const items: NotificationItem[] = pending.map((account) => ({
    id: account.id,
    title: "New registration",
    detail: `${account.displayName} (${account.email}) is waiting for approval`,
    read: read.has(account.id),
    account,
  }));

  return {
    items,
    unreadCount: items.filter((item) => !item.read).length,
    markRead,
    markAllRead,
    refresh,
  };
}
