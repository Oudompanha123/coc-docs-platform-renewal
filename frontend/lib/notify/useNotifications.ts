"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listPending, type PendingAccount } from "@/lib/admin/accounts";
import { listSessions, type SessionSummary } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";
import { isNotificationsEnabled } from "@/lib/notify/push";

/**
 * What the bell in the topbar shows, and which of it has been looked at.
 *
 * <p>It used to render a hardcoded array from `lib/mock/overview` — three
 * invented items that never changed. It now carries the two things the system
 * has to say: who is waiting for approval (ADR-017), and whether anybody
 * signed in to your account from a device you have not used (ADR-027).
 *
 * <p><b>The two have different audiences, and that is the point.</b> Approvals
 * go to a super admin, because only they can act on one. A sign-in alert goes
 * to the account it happened to and to nobody else — no administrator either,
 * because who signed in where is not something this product should let one
 * person read about another.
 *
 * <p><b>The list is derived, the read marks are stored.</b> Items come from the
 * queue and the session list on every read, so they cannot drift from the
 * truth — approve somebody and they leave the list because they left the
 * queue; end a session and its alert goes with it. Read state is the one thing
 * neither source can answer, so it is kept separately.
 *
 * <p><b>Read marks are per-browser.</b> localStorage, not the server. Reading a
 * notification on your laptop leaves it unread on your phone. That is a real
 * limitation and the honest fix is a server-side notification table — see the
 * follow-up in ADR-027, where it is now the second notification type's problem
 * as well.
 *
 * <p><b>Polling, at a deliberately unhurried interval.</b> The badge should not
 * need a page reload to be right. Sixty seconds is chosen against the thing it
 * competes with: FCM, which is immediate. This is the floor for somebody who
 * has not enabled push, not the mechanism.
 */

const READ_KEY = "coc_read_notifications";
const POLL_INTERVAL_MS = 60_000;

/** Shared by both kinds; `kind` says which of the two payloads is present. */
type NotificationBase = {
  id: string;
  title: string;
  detail: string;
  read: boolean;
};

export type NotificationItem = NotificationBase &
  (
    | { kind: "registration"; account: PendingAccount; session?: undefined }
    | { kind: "sign-in"; session: SessionSummary; account?: undefined }
  );

export type Notifications = {
  items: NotificationItem[];
  /** Badge count — unread only. Zero renders no badge. */
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Re-reads both sources. Called after approving or ending a session. */
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
    // Only ids still live are kept, so this cannot grow without bound as
    // people are approved and sessions end.
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    // Private mode. Everything shows as unread, which is wrong but harmless —
    // neither source is affected.
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
 * Raises a browser notification, and makes clicking it do something.
 *
 * <p>The fallback for a deployment with no Firebase project, and for a tab
 * that is open — FCM background handling covers neither. Requires the same
 * permission the Settings toggle asks for, and does nothing without it, so it
 * can never be the thing that prompts.
 *
 * <p>`tag` collapses repeats: five registrations replace one another rather
 * than stacking five banners saying the same thing. The two kinds use
 * different tags, because a sign-in alert must never be the banner a
 * registration quietly replaces.
 */
function alertBrowser(
  options: { title: string; body: string; icon?: string; tag: string },
  onClick: () => void,
) {
  try {
    // Both halves: permission at the browser level, and the person having
    // turned this on in Settings. Permission alone would alert somebody who
    // switched it off here.
    if (!isNotificationsEnabled()) {
      return;
    }
    const banner = new Notification(options.title, {
      body: options.body,
      icon: options.icon,
      tag: options.tag,
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

/** A readable timestamp, or something honest when the value will not parse. */
function formatWhen(iso: string): string {
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? "recently" : when.toLocaleString();
}

export function useNotifications(
  options: {
    /**
     * Called when a registration banner is clicked, and when the app is opened
     * by one. The bell answers it by opening the approval dialog, so the
     * reader acts from where they already are.
     */
    onOpenApproval?: (account: PendingAccount) => void;
    /** The same, for a sign-in alert: opens the dialog that can end it. */
    onOpenSignIn?: (session: SessionSummary) => void;
  } = {},
): Notifications {
  // Refs so the polling effect does not restart every render just because the
  // caller passed new closures.
  const onOpenApproval = useRef(options.onOpenApproval);
  onOpenApproval.current = options.onOpenApproval;
  const onOpenSignIn = useRef(options.onOpenSignIn);
  onOpenSignIn.current = options.onOpenSignIn;

  const { status, user } = useSession();
  const [pending, setPending] = useState<PendingAccount[]>([]);
  const [signIns, setSignIns] = useState<SessionSummary[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());

  // Ids already announced by this tab, so polling does not re-alert on every
  // pass. A ref, not state: changing it must not re-render.
  const announced = useRef<Set<string> | null>(null);

  const signedIn = status === "authenticated";
  const isApprover = signedIn && user?.role === "super_admin";

  useEffect(() => {
    setRead(readIds());
  }, []);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setPending([]);
      setSignIns([]);
      return;
    }

    // Independent sources, fetched together and settled separately: a failing
    // approval queue must not cost a super admin their sign-in alerts, which
    // are the more serious of the two.
    const [queueResult, sessionResult] = await Promise.allSettled([
      isApprover ? listPending() : Promise.resolve<PendingAccount[]>([]),
      listSessions(),
    ]);

    const queue = queueResult.status === "fulfilled" ? queueResult.value : [];
    // Only sessions the server flagged as unfamiliar, and never the one being
    // used to read this: a new sign-in is not news to the device that made it.
    const alerts =
      sessionResult.status === "fulfilled"
        ? sessionResult.value.filter((s) => s.newDevice && !s.current)
        : [];

    setPending(queue);
    setSignIns(alerts);

    const liveIds = new Set([...queue.map((a) => a.id), ...alerts.map((s) => s.id)]);

    // First pass after sign-in seeds the set without alerting: everything
    // already here is old news, and a banner per waiting applicant on every
    // page load would teach people to ignore the banners.
    if (announced.current === null) {
      announced.current = new Set(liveIds);
    } else {
      for (const session of alerts) {
        if (announced.current.has(session.id)) continue;
        announced.current.add(session.id);
        alertBrowser(
          {
            title: "New sign-in",
            body: `${session.device} · ${formatWhen(session.issuedAt)}`,
            tag: "auth.new-device",
          },
          () => onOpenSignIn.current?.(session),
        );
      }
      for (const account of queue) {
        if (announced.current.has(account.id)) continue;
        announced.current.add(account.id);
        alertBrowser(
          {
            title: "New registration",
            body: `${account.displayName} is waiting for approval`,
            // Their own picture when Google gave one; initials otherwise.
            // Never the app logo, which tells the reader nothing about who
            // this is.
            icon: account.avatarUrl ?? initialsIcon(account.displayName),
            tag: "registration.pending",
          },
          () => onOpenApproval.current?.(account),
        );
      }
    }

    // Forget read marks for anything no longer live.
    setRead((prev) => {
      const kept = new Set([...prev].filter((id) => liveIds.has(id)));
      if (kept.size !== prev.size) storeReadIds(kept);
      return kept.size === prev.size ? prev : kept;
    });
  }, [signedIn, isApprover]);

  useEffect(() => {
    void refresh();
    if (!signedIn) return;
    const timer = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [refresh, signedIn]);

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
      const next = new Set([...pending.map((a) => a.id), ...signIns.map((s) => s.id)]);
      storeReadIds(next);
      return next;
    });
  }, [pending, signIns]);

  // A notification clicked while the app was closed lands here, as
  // ?approve=<id> or ?session=<id> on whatever page the service worker opened.
  // Acted on once the lists have loaded, so the dialog has something to show;
  // the parameter is then removed so a refresh does not reopen it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pending.length === 0 && signIns.length === 0) return;

    const url = new URL(window.location.href);
    const wantedSession = url.searchParams.get("session");
    const wantedAccount = url.searchParams.get("approve");
    if (!wantedSession && !wantedAccount) return;

    const session = wantedSession ? signIns.find((s) => s.id === wantedSession) : undefined;
    const account = wantedAccount ? pending.find((a) => a.id === wantedAccount) : undefined;

    url.searchParams.delete("session");
    url.searchParams.delete("approve");
    window.history.replaceState({}, "", url.toString());

    // Absent means it was dealt with between the notification and the click —
    // approved by somebody else, or a session already ended. Silently doing
    // nothing is right: what is on screen is already the answer.
    if (session) onOpenSignIn.current?.(session);
    else if (account) onOpenApproval.current?.(account);
  }, [pending, signIns]);

  const items: NotificationItem[] = [
    // Sign-in alerts first, and not by date: one of these is the only item in
    // the bell that might mean somebody else is in the account.
    ...signIns.map(
      (session): NotificationItem => ({
        kind: "sign-in",
        id: session.id,
        title: "New sign-in",
        detail: `${session.device} · ${session.ipAddress ?? "unknown address"} · ${formatWhen(
          session.issuedAt,
        )}`,
        read: read.has(session.id),
        session,
      }),
    ),
    ...pending.map(
      (account): NotificationItem => ({
        kind: "registration",
        id: account.id,
        title: "New registration",
        detail: `${account.displayName} (${account.email}) is waiting for approval`,
        read: read.has(account.id),
        account,
      }),
    ),
  ];

  return {
    items,
    unreadCount: items.filter((item) => !item.read).length,
    markRead,
    markAllRead,
    refresh,
  };
}
