import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listNotifications, useSession } = vi.hoisted(() => ({
  listNotifications: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock("@/lib/notify/activity", async () => {
  // The real module, with only the fetch replaced — actorName/timeAgo are pure
  // and a stub of them would test the stub.
  const actual = await vi.importActual<typeof import("@/lib/notify/activity")>(
    "@/lib/notify/activity",
  );
  return { ...actual, listNotifications };
});
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));

import { useActivityFeed } from "./useActivityFeed";

const STORAGE_KEY = "coc.activity.read.acct-1";

function signedInAs(id: string | null) {
  useSession.mockReturnValue({
    status: id ? "authenticated" : "anonymous",
    user: id ? { id, role: "admin" } : null,
    refresh: vi.fn(),
  });
}

/** One row of the feed, as `GET /api/v1/notifications` sends it. */
function event(id: string, summary = "Signed in successfully") {
  return {
    id,
    actorEmail: "someone@example.com",
    summary,
    occurredAt: "2026-09-18T08:00:00Z",
  };
}

describe("useActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    signedInAs("acct-1");
    listNotifications.mockResolvedValue([event("a1"), event("a2")]);
  });

  describe("the badge", () => {
    it("counts unread, not everything in the window", async () => {
      const { result } = renderHook(() => useActivityFeed());
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      expect(result.current.count).toBe(2);

      act(() => result.current.markRead("a1"));
      expect(result.current.count).toBe(1);
      expect(result.current.items.find((i) => i.id === "a1")?.read).toBe(true);
      expect(result.current.items.find((i) => i.id === "a2")?.read).toBe(false);
    });

    it("reaches zero on mark all as read", async () => {
      const { result } = renderHook(() => useActivityFeed());
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      act(() => result.current.markAllRead());

      expect(result.current.count).toBe(0);
      expect(result.current.items.every((i) => i.read)).toBe(true);
    });

    it("comes back for activity that arrives after the marks", async () => {
      const { result } = renderHook(() => useActivityFeed());
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      act(() => result.current.markAllRead());

      // The whole point of marking read rather than dismissing the badge: a
      // new event has to be able to raise it again.
      listNotifications.mockResolvedValue([event("a3"), event("a1"), event("a2")]);
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.count).toBe(1);
      expect(result.current.items.find((i) => i.id === "a3")?.read).toBe(false);
    });
  });

  describe("stored marks", () => {
    it("survive a reload", async () => {
      const first = renderHook(() => useActivityFeed());
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      act(() => first.result.current.markRead("a1"));
      first.unmount();

      const second = renderHook(() => useActivityFeed());
      await waitFor(() => expect(second.result.current.items).toHaveLength(2));

      expect(second.result.current.count).toBe(1);
    });

    it("belong to one account, not to the browser", async () => {
      const first = renderHook(() => useActivityFeed());
      await waitFor(() => expect(first.result.current.items).toHaveLength(2));
      act(() => first.result.current.markAllRead());
      first.unmount();

      // Somebody else signs in on the same machine. Their feed is their own,
      // and so is what they have read of it.
      signedInAs("acct-2");
      const second = renderHook(() => useActivityFeed());
      await waitFor(() => expect(second.result.current.items).toHaveLength(2));

      expect(second.result.current.count).toBe(2);
    });

    it("are pruned to the feed window, so the list cannot grow forever", async () => {
      const { result } = renderHook(() => useActivityFeed());
      await waitFor(() => expect(result.current.items).toHaveLength(2));
      act(() => result.current.markAllRead());
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toHaveLength(2);

      // a1 and a2 have aged out. A newest-first list can never show them
      // again, so keeping their marks is dead weight.
      listNotifications.mockResolvedValue([event("a9")]);
      await act(async () => {
        await result.current.refresh();
      });

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([]);
    });

    it("do not throw the topbar down when storage is unavailable", async () => {
      // Safari in private mode, and any browser with site data switched off:
      // the accessor throws rather than returning null.
      const setItem = vi
        .spyOn(Storage.prototype, "setItem")
        .mockImplementation(() => {
          throw new Error("QuotaExceededError");
        });

      const { result } = renderHook(() => useActivityFeed());
      await waitFor(() => expect(result.current.items).toHaveLength(2));

      expect(() => act(() => result.current.markAllRead())).not.toThrow();
      // Still right for the life of the tab, which is the whole of what a
      // storage-less browser can offer.
      expect(result.current.count).toBe(0);

      setItem.mockRestore();
    });
  });

  it("shows nothing for a signed-out visitor", async () => {
    signedInAs(null);
    const { result } = renderHook(() => useActivityFeed());

    await waitFor(() => expect(result.current.items).toEqual([]));
    expect(result.current.count).toBe(0);
    expect(listNotifications).not.toHaveBeenCalled();
  });
});
