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
  fetchInbox,
  markNotificationRead,
  markAllNotificationsRead,
} = vi.hoisted(() => ({
  listPending: vi.fn(),
  listSessions: vi.fn(),
  revokeSession: vi.fn(),
  useSession: vi.fn(),
  isNotificationsEnabled: vi.fn(),
  ensureBackgroundPushRegistered: vi.fn(),
  subscribeToNotifications: vi.fn(),
  fetchInbox: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

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
vi.mock("@/lib/notify/inbox-api", () => ({
  fetchInbox,
  markNotificationRead,
  markAllNotificationsRead,
}));

import { useNotifications } from "./useNotifications";

const refreshSession = vi.fn();

function signedInAs(role: string | null) {
  useSession.mockReturnValue({
    status: role ? "authenticated" : "anonymous",
    user: role ? { id: "1", role } : null,
    refresh: refreshSession,
  });
}

/** One stored notification, as the server sends it. */
function stored(overrides: Record<string, unknown> = {}) {
  return {
    id: "n1",
    type: "auth.new-device",
    targetId: "session-1",
    payload: { body: "Firefox on Windows" },
    createdAt: "2026-09-17T08:00:00Z",
    readAt: null,
    ...overrides,
  };
}

function inbox(items: ReturnType<typeof stored>[]) {
  return { items, unreadCount: items.filter((i) => i.readAt === null).length };
}

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    isNotificationsEnabled.mockReturnValue(true);
    ensureBackgroundPushRegistered.mockResolvedValue(undefined);
    subscribeToNotifications.mockReturnValue(() => {});
    fetchInbox.mockResolvedValue(inbox([]));
    listPending.mockResolvedValue([]);
    listSessions.mockResolvedValue([]);
    markNotificationRead.mockResolvedValue(undefined);
    markAllNotificationsRead.mockResolvedValue(undefined);
  });

  it("shows what the server stored, rendered from the type and its facts", async () => {
    signedInAs("user");
    fetchInbox.mockResolvedValue(inbox([stored()]));

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.title).toBe("New sign-in");
    // Rendered here, not stored: improving this sentence applies to every
    // notification already sent (ADR-034 decision 2).
    expect(result.current.items[0]?.detail).toContain("Firefox on Windows");
    expect(result.current.unreadCount).toBe(1);
  });

  it("survives the session it describes — the whole point of storing it", async () => {
    // Before ADR-034 this list was a filter over live sessions, so an alert
    // vanished when its session was revoked or expired. The PM found it that
    // way: "I see notify but next time I don't see notify at list".
    signedInAs("user");
    listSessions.mockResolvedValue([]);
    fetchInbox.mockResolvedValue(inbox([stored()]));

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
  });

  it("renders an unknown type from its body rather than a blank row", async () => {
    // A build older than a type, or one after a type was retired. Every sender
    // writes `body` so there is always something true to show.
    signedInAs("user");
    fetchInbox.mockResolvedValue(
      inbox([stored({ type: "something.new", payload: { body: "A thing happened" } })]),
    );

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.detail).toBe("A thing happened");
  });

  it("marks read on the server, not in this browser", async () => {
    signedInAs("user");
    fetchInbox.mockResolvedValue(inbox([stored()]));
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(1));

    act(() => result.current.markRead("n1"));

    // Optimistic locally so the dot disappears at once, and persisted so it is
    // still read on another device — which localStorage could never do.
    expect(result.current.unreadCount).toBe(0);
    expect(result.current.items[0]?.read).toBe(true);
    expect(markNotificationRead).toHaveBeenCalledWith("n1");
  });

  it("marks everything read in one call", async () => {
    signedInAs("user");
    fetchInbox.mockResolvedValue(inbox([stored(), stored({ id: "n2", targetId: "s2" })]));
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.unreadCount).toBe(2));

    act(() => result.current.markAllRead());

    expect(result.current.unreadCount).toBe(0);
    expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it("keeps the badge counting everything unread, not only what is listed", async () => {
    signedInAs("user");
    // The server caps the list; the count is of the whole table.
    fetchInbox.mockResolvedValue({ items: [stored()], unreadCount: 47 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.unreadCount).toBe(47));
    expect(result.current.items).toHaveLength(1);
  });

  describe("opening one", () => {
    it("fetches the session a sign-in alert is about, on the click", async () => {
      const onOpenSignIn = vi.fn();
      const session = { id: "session-1", device: "Firefox on Windows" };
      listSessions.mockResolvedValue([session]);
      signedInAs("user");
      fetchInbox.mockResolvedValue(inbox([stored()]));

      const { result } = renderHook(() => useNotifications({ onOpenSignIn }));
      await waitFor(() => expect(result.current.items).toHaveLength(1));

      // Not polled. The notification is the record; the session list is the
      // current state, and only acting needs both.
      expect(listSessions).not.toHaveBeenCalled();
      await act(async () => {
        await result.current.open(result.current.items[0]!);
      });

      expect(onOpenSignIn).toHaveBeenCalledWith(session);
    });

    it("fetches the applicant a registration is about", async () => {
      const onOpenApproval = vi.fn();
      const applicant = { id: "acc-1", displayName: "Dana Lee" };
      listPending.mockResolvedValue([applicant]);
      signedInAs("super_admin");
      fetchInbox.mockResolvedValue(
        inbox([stored({ type: "registration.pending", targetId: "acc-1" })]),
      );

      const { result } = renderHook(() => useNotifications({ onOpenApproval }));
      await waitFor(() => expect(result.current.items).toHaveLength(1));
      await act(async () => {
        await result.current.open(result.current.items[0]!);
      });

      expect(onOpenApproval).toHaveBeenCalledWith(applicant);
    });

    it("opens nothing when the thing is already dealt with, and keeps the notification", async () => {
      const onOpenSignIn = vi.fn();
      // Session already ended, or the applicant approved by somebody else
      // between the notification and the click.
      listSessions.mockResolvedValue([]);
      signedInAs("user");
      fetchInbox.mockResolvedValue(inbox([stored()]));

      const { result } = renderHook(() => useNotifications({ onOpenSignIn }));
      await waitFor(() => expect(result.current.items).toHaveLength(1));
      await act(async () => {
        await result.current.open(result.current.items[0]!);
      });

      expect(onOpenSignIn).not.toHaveBeenCalled();
      // The record of what happened is not the same thing as what is still
      // actionable, which is why one outliving the other is correct.
      expect(result.current.items).toHaveLength(1);
    });

    it("costs the dialog and not the bell when the lookup fails", async () => {
      const onOpenSignIn = vi.fn();
      listSessions.mockRejectedValue(new Error("backend down"));
      signedInAs("user");
      fetchInbox.mockResolvedValue(inbox([stored()]));

      const { result } = renderHook(() => useNotifications({ onOpenSignIn }));
      await waitFor(() => expect(result.current.items).toHaveLength(1));
      await act(async () => {
        await result.current.open(result.current.items[0]!);
      });

      expect(onOpenSignIn).not.toHaveBeenCalled();
      expect(result.current.items).toHaveLength(1);
    });
  });

  describe("session and connection", () => {
    it("re-reads the session when the inbox says it has ended", async () => {
      const { SessionExpiredError } = await import("@/lib/auth/api");
      signedInAs("user");
      fetchInbox.mockRejectedValue(new SessionExpiredError("ended"));

      renderHook(() => useNotifications());

      // A tab whose session was revoked underneath it used to show an empty
      // bell, which is indistinguishable from having nothing to report.
      await waitFor(() => expect(refreshSession).toHaveBeenCalled());
    });

    it("leaves nobody signed out for an ordinary failure", async () => {
      const { AuthApiError } = await import("@/lib/auth/api");
      signedInAs("user");
      fetchInbox.mockRejectedValue(new AuthApiError("backend down"));

      renderHook(() => useNotifications());

      await waitFor(() => expect(fetchInbox).toHaveBeenCalled());
      expect(refreshSession).not.toHaveBeenCalled();
    });

    it("asks nothing of a visitor who is not signed in", async () => {
      signedInAs(null);

      const { result } = renderHook(() => useNotifications());

      await waitFor(() => expect(result.current.items).toHaveLength(0));
      expect(fetchInbox).not.toHaveBeenCalled();
      expect(subscribeToNotifications).not.toHaveBeenCalled();
      expect(ensureBackgroundPushRegistered).not.toHaveBeenCalled();
    });

    it("re-reads the moment the stream says something changed", async () => {
      let fire: () => void = () => {};
      subscribeToNotifications.mockImplementation((onEvent: () => void) => {
        fire = onEvent;
        return () => {};
      });
      signedInAs("user");

      const { result } = renderHook(() => useNotifications());
      await waitFor(() => expect(fetchInbox).toHaveBeenCalledTimes(1));

      fetchInbox.mockResolvedValue(inbox([stored()]));
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

      expect(close).toHaveBeenCalledTimes(1);
    });

    it("registers this browser for push on load", async () => {
      signedInAs("user");

      renderHook(() => useNotifications());

      await waitFor(() => expect(ensureBackgroundPushRegistered).toHaveBeenCalled());
    });
  });
});
