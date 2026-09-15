import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPending, useSession, isNotificationsEnabled } = vi.hoisted(() => ({
  listPending: vi.fn(),
  useSession: vi.fn(),
  isNotificationsEnabled: vi.fn(),
}));

vi.mock("@/lib/admin/accounts", () => ({ listPending }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));
vi.mock("@/lib/notify/push", () => ({ isNotificationsEnabled }));

import { useNotifications } from "./useNotifications";

function signedInAs(role: string | null) {
  useSession.mockReturnValue({
    status: role ? "authenticated" : "anonymous",
    user: role ? { id: "1", role } : null,
  });
}

const dana = {
  id: "a",
  email: "dana@example.com",
  displayName: "Dana Lee",
  role: "GUEST",
  status: "PENDING",
};
const sam = { id: "b", email: "sam@example.com", displayName: "Sam Ray", role: "GUEST", status: "PENDING" };

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    isNotificationsEnabled.mockReturnValue(true);
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
});
