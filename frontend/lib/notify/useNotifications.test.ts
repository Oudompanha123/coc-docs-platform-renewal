import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  listPending,
  listSessions,
  revokeSession,
  useSession,
  isNotificationsEnabled,
  ensureBackgroundPushRegistered,
  subscribeToNotifications,
} = vi.hoisted(
  () => ({
    listPending: vi.fn(),
    listSessions: vi.fn(),
    revokeSession: vi.fn(),
    useSession: vi.fn(),
    isNotificationsEnabled: vi.fn(),
    ensureBackgroundPushRegistered: vi.fn(),
    subscribeToNotifications: vi.fn(),
  }),
);

vi.mock("@/lib/admin/accounts", () => ({ listPending }));
vi.mock("@/lib/auth/api", async () => {
  // The real module, with only the two calls replaced. The error classes have
  // to be the real ones: the hook does `instanceof SessionExpiredError`, and a
  // stubbed module would give the test a different class that never matches.
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, listSessions, revokeSession };
});
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));
vi.mock("@/lib/notify/push", () => ({ isNotificationsEnabled, ensureBackgroundPushRegistered }));
vi.mock("@/lib/notify/stream", () => ({ subscribeToNotifications }));

import { useNotifications } from "./useNotifications";

function signedInAs(role: string | null) {
  useSession.mockReturnValue({
    status: role ? "authenticated" : "anonymous",
    user: role ? { id: "1", role } : null,
  });
}

/** A session row as the server sends it. */
function session(overrides: Record<string, unknown> = {}) {
  return {
    id: "s1",
    userAgent: "ua",
    ipAddress: "203.0.113.4",
    issuedAt: "2026-09-16T08:00:00Z",
    expiresAt: "2026-09-17T08:00:00Z",
    device: "Firefox on Windows",
    newDevice: true,
    current: false,
    ...overrides,
  };
}

const dana = {
  id: "a",
  email: "dana@example.com",
  displayName: "Dana Lee",
  role: "guest",
  status: "PENDING",
};
const sam = { id: "b", email: "sam@example.com", displayName: "Sam Ray", role: "guest", status: "PENDING" };

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    isNotificationsEnabled.mockReturnValue(true);
    // Most cases are about the approval queue; an empty session list keeps
    // them from also asserting about sign-in alerts they do not set up.
    listSessions.mockResolvedValue([]);
    listPending.mockResolvedValue([]);
    // Returns the unsubscribe the hook calls on unmount. Overridden in the
    // stream cases below to capture the handler and fire it.
    subscribeToNotifications.mockReturnValue(() => {});
    ensureBackgroundPushRegistered.mockResolvedValue(undefined);
  });

  it("lists who is actually waiting, not a fixed array", async () => {
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana, sam]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.items[0]?.detail).toContain("dana@example.com");
    // Everything is unread until somebody looks at it.
    expect(result.current.unreadCount).toBe(2);
  });

  it("drops the badge when an item is read, and keeps the item in the list", async () => {
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana, sam]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(2));

    act(() => result.current.markRead("a"));

    // Read is not the same as handled: they are still waiting for approval, so
    // the item stays. Only the count changes.
    await waitFor(() => expect(result.current.unreadCount).toBe(1));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find((i) => i.id === "a")?.read).toBe(true);
  });

  it("marks everything read at once", async () => {
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana, sam]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(2));

    act(() => result.current.markAllRead());

    await waitFor(() => expect(result.current.unreadCount).toBe(0));
    expect(result.current.items).toHaveLength(2);
  });

  it("remembers what was read across a remount", async () => {
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana, sam]);

    const first = renderHook(() => useNotifications());
    await waitFor(() => expect(first.result.current.unreadCount).toBe(2));
    act(() => first.result.current.markRead("a"));
    await waitFor(() => expect(first.result.current.unreadCount).toBe(1));
    first.unmount();

    const second = renderHook(() => useNotifications());

    // Otherwise every page navigation would re-bold everything and the badge
    // would be noise.
    await waitFor(() => expect(second.result.current.unreadCount).toBe(1));
  });

  /**
   * Read marks are stored by id, so without this they would accumulate for
   * people who were approved months ago and never come back.
   */
  it("forgets read marks for people who have left the queue", async () => {
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana, sam]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(2));
    act(() => result.current.markAllRead());
    await waitFor(() => expect(result.current.unreadCount).toBe(0));

    // Dana is approved and leaves the queue.
    listPending.mockResolvedValue([sam]);
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(JSON.parse(localStorage.getItem("coc_read_notifications") ?? "[]")).toEqual(["b"]);
  });

  it("shows nothing, and asks nothing, for a non-approver", async () => {
    signedInAs("user");

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.unreadCount).toBe(0));
    // The queue sits behind a super_admin floor, so asking as anyone else is a
    // guaranteed 403 on every page load.
    expect(listPending).not.toHaveBeenCalled();
  });

  it("asks nothing while the session is still loading", async () => {
    useSession.mockReturnValue({ status: "loading", user: null });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.unreadCount).toBe(0));
    expect(listPending).not.toHaveBeenCalled();
  });

  it("empties rather than throwing when the queue cannot be read", async () => {
    signedInAs("super_admin");
    listPending.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useNotifications());

    // This drives the topbar, which is on every page: an error thrown here
    // takes the whole page down, and an empty bell does not.
    await waitFor(() => expect(result.current.items).toHaveLength(0));
  });

  it("does not raise a browser alert for people already in the queue at sign-in", async () => {
    const notificationSpy = vi.fn();
    vi.stubGlobal("Notification", notificationSpy);
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana, sam]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    // A banner per waiting applicant on every page load would teach people to
    // ignore the banners.
    expect(notificationSpy).not.toHaveBeenCalled();
  });

  it("raises a browser alert for somebody who arrives while you are watching", async () => {
    const notificationSpy = vi.fn();
    vi.stubGlobal("Notification", notificationSpy);
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    listPending.mockResolvedValue([dana, sam]);
    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => expect(notificationSpy).toHaveBeenCalledTimes(1));
    expect(notificationSpy.mock.calls[0]?.[0]).toBe("New registration");
  });

  it("raises no alert when notifications are switched off in Settings", async () => {
    const notificationSpy = vi.fn();
    vi.stubGlobal("Notification", notificationSpy);
    isNotificationsEnabled.mockReturnValue(false);
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana]);

    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    listPending.mockResolvedValue([dana, sam]);
    await act(async () => {
      await result.current.refresh();
    });

    // Permission at the browser level is not consent here: somebody who turned
    // this off in Settings must stop being interrupted.
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(notificationSpy).not.toHaveBeenCalled();
  });

  it("opens the approval dialog when the banner is clicked", async () => {
    const notificationSpy = vi.fn();
    vi.stubGlobal("Notification", notificationSpy);
    const onOpenApproval = vi.fn();
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana]);

    const { result } = renderHook(() => useNotifications({ onOpenApproval }));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    listPending.mockResolvedValue([dana, sam]);
    await act(async () => {
      await result.current.refresh();
    });
    await waitFor(() => expect(notificationSpy).toHaveBeenCalledTimes(1));

    // A banner that does nothing when clicked is worse than none: it says
    // something needs doing and then makes the reader go and find it.
    const banner = notificationSpy.mock.instances[0] as { onclick?: () => void; close?: () => void };
    banner.close = vi.fn();
    act(() => banner.onclick?.());

    expect(onOpenApproval).toHaveBeenCalledTimes(1);
    expect(onOpenApproval.mock.calls[0]?.[0]).toMatchObject({ id: "b" });
  });

  it("opens the approval dialog for an ?approve= deep link, then clears it", async () => {
    const onOpenApproval = vi.fn();
    window.history.replaceState({}, "", "/users-roles?tab=pending&approve=a");
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana, sam]);

    renderHook(() => useNotifications({ onOpenApproval }));

    // This is how a notification clicked while the app was closed arrives.
    await waitFor(() => expect(onOpenApproval).toHaveBeenCalledTimes(1));
    expect(onOpenApproval.mock.calls[0]?.[0]).toMatchObject({ id: "a" });
    // Cleared, so a refresh does not reopen the dialog.
    expect(window.location.search).not.toContain("approve=");
  });

  it("does nothing for a deep link to somebody already approved", async () => {
    const onOpenApproval = vi.fn();
    window.history.replaceState({}, "", "/users-roles?approve=gone");
    signedInAs("super_admin");
    listPending.mockResolvedValue([dana]);

    const { result } = renderHook(() => useNotifications({ onOpenApproval }));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // Approved by a colleague between the notification and the click. The
    // queue on screen is already the answer; a dialog about nobody is not.
    expect(onOpenApproval).not.toHaveBeenCalled();
    expect(window.location.search).not.toContain("approve=");
  });

  describe("new-device sign-in alerts (ADR-027)", () => {
    it("alerts an ordinary user, who never sees the approval queue", async () => {
      // The report this was built from: signing in from another browser
      // produced nothing at all. Note the role — a user, not a super admin.
      // The bell used to be empty for everyone but an approver.
      signedInAs("user");
      listSessions.mockResolvedValue([session()]);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.items).toHaveLength(1));
      expect(result.current.items[0]?.kind).toBe("sign-in");
      expect(result.current.items[0]?.detail).toContain("Firefox on Windows");
      expect(result.current.items[0]?.detail).toContain("203.0.113.4");
      expect(listPending).not.toHaveBeenCalled();
    });

    it("says nothing about the device being used to read it", async () => {
      signedInAs("user");
      // A first sign-in flags itself, and the browser it happened in is
      // reading this. Telling somebody their own sign-in was suspicious is how
      // an alert becomes noise on its first outing.
      listSessions.mockResolvedValue([session({ newDevice: true, current: true })]);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(listSessions).toHaveBeenCalled());
      expect(result.current.items).toHaveLength(0);
    });

    it("says nothing about devices the server recognises", async () => {
      signedInAs("user");
      listSessions.mockResolvedValue([
        session({ id: "s1", newDevice: false }),
        session({ id: "s2", newDevice: false }),
      ]);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(listSessions).toHaveBeenCalled());
      expect(result.current.items).toHaveLength(0);
    });

    it("puts sign-in alerts above approvals", async () => {
      signedInAs("super_admin");
      listPending.mockResolvedValue([dana]);
      listSessions.mockResolvedValue([session()]);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.items).toHaveLength(2));
      // One of these might mean somebody else is in the account. The other is
      // a queue that has waited this long already.
      expect(result.current.items[0]?.kind).toBe("sign-in");
      expect(result.current.items[1]?.kind).toBe("registration");
    });

    it("still shows sign-in alerts when the approval queue fails", async () => {
      signedInAs("super_admin");
      listPending.mockRejectedValue(new Error("backend down"));
      listSessions.mockResolvedValue([session()]);

      const { result } = renderHook(() => useNotifications());

      // Settled separately for exactly this reason: the less important of the
      // two sources must not be able to suppress the more important one.
      await waitFor(() => expect(result.current.items).toHaveLength(1));
      expect(result.current.items[0]?.kind).toBe("sign-in");
    });

    it("keeps the bell empty when nobody is signed in", async () => {
      signedInAs(null);
      listSessions.mockResolvedValue([session()]);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.items).toHaveLength(0));
      expect(listSessions).not.toHaveBeenCalled();
    });

    it("forgets the read mark once the session is gone", async () => {
      signedInAs("user");
      listSessions.mockResolvedValue([session()]);
      const { result } = renderHook(() => useNotifications());
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      act(() => result.current.markRead("s1"));
      expect(result.current.unreadCount).toBe(0);

      // Ended from Settings, or expired. The stored id would otherwise sit in
      // localStorage forever, and would silence a later session that happened
      // to be issued the same id.
      listSessions.mockResolvedValue([]);
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.items).toHaveLength(0);
      expect(JSON.parse(localStorage.getItem("coc_read_notifications") ?? "[]")).toEqual([]);
    });
  });

  describe("the live stream", () => {
    it("re-reads as soon as the server says something changed", async () => {
      // The complaint this answers: a notification did not appear until the
      // page was reloaded. Polling every sixty seconds looks exactly like
      // nothing happening, and the immediate path was a Firebase push that
      // almost nobody is configured for.
      let fire: () => void = () => {};
      subscribeToNotifications.mockImplementation((onEvent: () => void) => {
        fire = onEvent;
        return () => {};
      });
      signedInAs("user");
      listSessions.mockResolvedValue([]);

      const { result } = renderHook(() => useNotifications());
      await waitFor(() => expect(listSessions).toHaveBeenCalledTimes(1));

      listSessions.mockResolvedValue([session()]);
      await act(async () => {
        fire();
      });

      // No timer advanced, no reload.
      await waitFor(() => expect(result.current.items).toHaveLength(1));
    });

    it("closes the connection when the bell goes away", async () => {
      const close = vi.fn();
      subscribeToNotifications.mockReturnValue(close);
      signedInAs("user");

      const { unmount } = renderHook(() => useNotifications());
      await waitFor(() => expect(subscribeToNotifications).toHaveBeenCalled());

      unmount();

      // A connection per mount that is never closed is a connection per
      // navigation, held open on the server for half an hour each.
      expect(close).toHaveBeenCalledTimes(1);
    });

    it("opens no connection for a visitor who is not signed in", async () => {
      signedInAs(null);

      renderHook(() => useNotifications());

      await waitFor(() => expect(listSessions).not.toHaveBeenCalled());
      expect(subscribeToNotifications).not.toHaveBeenCalled();
    });
  });

  describe("a session that has ended underneath the tab", () => {
    it("re-reads the session rather than showing an empty bell", async () => {
      // What this replaces: a 401 was caught and turned into no items, so a
      // tab whose session had been revoked — which is what signing in again in
      // the same browser does — went on looking signed in, with a bell that
      // said there was nothing to report. Indistinguishable from working.
      const { SessionExpiredError } = await import("@/lib/auth/api");
      signedInAs("user");
      listSessions.mockRejectedValue(new SessionExpiredError("ended"));
      const refresh = vi.fn();
      useSession.mockReturnValue({
        status: "authenticated",
        user: { id: "1", role: "user" },
        refresh,
      });

      const { result } = renderHook(() => useNotifications());

      // The provider is the one authority on session state; RequireSession
      // already knows what to do when it turns anonymous.
      await waitFor(() => expect(refresh).toHaveBeenCalled());
      expect(result.current.items).toHaveLength(0);
    });

    it("leaves the bell alone for an ordinary failure", async () => {
      const { AuthApiError } = await import("@/lib/auth/api");
      signedInAs("user");
      listSessions.mockRejectedValue(new AuthApiError("backend down"));
      const refresh = vi.fn();
      useSession.mockReturnValue({
        status: "authenticated",
        user: { id: "1", role: "user" },
        refresh,
      });

      renderHook(() => useNotifications());

      // A backend that is merely unreachable must not sign anybody out.
      await waitFor(() => expect(listSessions).toHaveBeenCalled());
      expect(refresh).not.toHaveBeenCalled();
    });
  });

  describe("push registration is reconciled, not only set on a press", () => {
    it("registers this browser when the bell mounts", async () => {
      // The bug: registerForBackgroundPush ran only from the Settings toggle.
      // Turn notifications on before the deployment has a Firebase project —
      // which everyone here did, because banners work without one — and the
      // flag is stored, the toggle reads as on for ever, and the only path
      // that could register a token is behind the press that now turns it off.
      // Add Firebase later and nothing retries: no token, no push, no error.
      signedInAs("user");

      renderHook(() => useNotifications());

      await waitFor(() => expect(ensureBackgroundPushRegistered).toHaveBeenCalled());
    });

    it("asks nothing of a visitor who is not signed in", async () => {
      // Registering a token is an authenticated call; there is nobody to
      // register it to yet.
      signedInAs(null);

      renderHook(() => useNotifications());

      await waitFor(() => expect(listSessions).not.toHaveBeenCalled());
      expect(ensureBackgroundPushRegistered).not.toHaveBeenCalled();
    });
  });
});
