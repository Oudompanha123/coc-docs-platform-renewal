import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellProvider } from "@/lib/layout/ShellContext";
import type { InboxNotification, InboxPage } from "@/lib/notify/inbox-api";
import type { NotificationItem } from "@/lib/notify/useNotifications";

// req: FR-AUTH-008, ADR-104 — "View all notifications" expands the bell in place.

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ name: "Sam Admin", role: "Super Admin", initials: "SA", avatarUrl: null }),
}));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ signOut: vi.fn(), isSigningOut: false }),
}));
vi.mock("@/lib/notify/useActivityFeed", () => ({
  useActivityFeed: () => ({ items: [], count: 0, markRead: vi.fn(), markAllRead: vi.fn(), refresh: vi.fn() }),
}));

const raw = (i: number, read = true): InboxNotification => ({
  id: `n${i}`,
  type: "announcement.published",
  targetId: `a${i}`,
  payload: { body: `Body ${i}`, title: `Item ${i}` },
  createdAt: new Date(Date.UTC(2026, 9, 9, 9, 0, 0) - i * 60_000).toISOString(),
  readAt: read ? "2026-10-09T09:00:00Z" : undefined,
});

const { bell, fetchInboxPage, markNotificationRead } = vi.hoisted(() => ({
  bell: {
    items: [] as NotificationItem[],
    unreadCount: 0,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    open: vi.fn(),
    refresh: vi.fn(),
  },
  fetchInboxPage: vi.fn(),
  markNotificationRead: vi.fn(),
}));
vi.mock("@/lib/notify/useNotifications", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/notify/useNotifications")>()),
  useNotifications: () => bell,
}));
vi.mock("@/lib/notify/inbox-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/notify/inbox-api")>()),
  fetchInboxPage,
  markNotificationRead,
}));

import { toNotificationItem } from "@/lib/notify/useNotifications";
import { Topbar } from "./Topbar";

const page = (from: number, to: number, hasMore: boolean): InboxPage => ({
  items: Array.from({ length: to - from + 1 }, (_, k) => raw(from + k)),
  hasMore,
  unreadCount: 0,
});

/** Puts the list at its bottom edge and fires the scroll the browser would. */
function scrollToBottom(list: HTMLElement) {
  Object.defineProperty(list, "scrollHeight", { configurable: true, value: 1000 });
  Object.defineProperty(list, "clientHeight", { configurable: true, value: 320 });
  list.scrollTop = 680;
  fireEvent.scroll(list);
}

function renderTopbar() {
  return render(
    <ShellProvider>
      <Topbar onMenuClick={vi.fn()} />
    </ShellProvider>,
  );
}

async function openBell(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /^Notifications/ }));
}

describe("Topbar bell — View all notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // A full first answer from the bell's endpoint: thirty, all read.
    bell.items = Array.from({ length: 30 }, (_, i) => toNotificationItem(raw(i + 1)));
    markNotificationRead.mockResolvedValue(undefined);
  });

  it("shows the latest ten until expanded, without leaving the page", async () => {
    const user = userEvent.setup();
    renderTopbar();
    await openBell(user);

    const list = screen.getByTestId("notification-list");
    expect(within(list).getAllByRole("menuitem")).toHaveLength(10);
    expect(within(list).getByText("Item 10")).toBeInTheDocument();
    expect(within(list).queryByText("Item 11")).not.toBeInTheDocument();
    // A button, not a link: expanding never navigates.
    expect(screen.getByRole("button", { name: "View all notifications" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /View all/ })).not.toBeInTheDocument();
  });

  it("loads ten at a time on scroll, after the last row held, until there are no more", async () => {
    fetchInboxPage
      .mockResolvedValueOnce(page(1, 10, true))
      .mockResolvedValueOnce(page(11, 20, true))
      .mockResolvedValueOnce(page(21, 25, false));
    const user = userEvent.setup();
    renderTopbar();
    await openBell(user);
    await user.click(screen.getByRole("button", { name: "View all notifications" }));

    const list = screen.getByTestId("notification-list");
    await within(list).findByText("Item 10");
    expect(fetchInboxPage).toHaveBeenLastCalledWith({ after: undefined, unreadOnly: false, limit: 10 });
    expect(screen.queryByRole("button", { name: "View all notifications" })).not.toBeInTheDocument();

    scrollToBottom(list);
    await within(list).findByText("Item 20");
    expect(fetchInboxPage).toHaveBeenLastCalledWith(
      expect.objectContaining({ after: expect.objectContaining({ id: "n10" }), limit: 10 }),
    );

    scrollToBottom(list);
    await within(list).findByText("You're all caught up.");
    expect(within(list).getAllByRole("menuitem")).toHaveLength(25);

    // At the end: scrolling again asks for nothing.
    scrollToBottom(list);
    expect(fetchInboxPage).toHaveBeenCalledTimes(3);
  });

  it("shows a loading indicator while the next page is in flight, and never duplicates rows", async () => {
    let release!: (p: InboxPage) => void;
    fetchInboxPage
      .mockResolvedValueOnce(page(1, 10, true))
      .mockReturnValueOnce(new Promise<InboxPage>((resolve) => (release = resolve)));
    const user = userEvent.setup();
    renderTopbar();
    await openBell(user);
    await user.click(screen.getByRole("button", { name: "View all notifications" }));
    const list = screen.getByTestId("notification-list");
    await within(list).findByText("Item 10");

    scrollToBottom(list);
    expect(await within(list).findByRole("status")).toHaveTextContent("Loading");
    // A second scroll while loading does not request the same page again.
    scrollToBottom(list);
    expect(fetchInboxPage).toHaveBeenCalledTimes(2);

    // The server overlaps by one row (n10); it is shown once.
    await act(async () => release({ items: [raw(10), raw(11)], hasMore: false, unreadCount: 0 }));
    await within(list).findByText("Item 11");
    expect(within(list).getAllByText("Item 10")).toHaveLength(1);
    expect(within(list).queryByRole("status")).not.toBeInTheDocument();
  });

  it("keeps the bell's click behavior for an older row: marks it read and opens it", async () => {
    fetchInboxPage.mockResolvedValueOnce({ items: [raw(40, false)], hasMore: false, unreadCount: 1 });
    const user = userEvent.setup();
    renderTopbar();
    await openBell(user);
    await user.click(screen.getByRole("button", { name: "View all notifications" }));

    await user.click(await screen.findByText("Item 40"));

    expect(markNotificationRead).toHaveBeenCalledWith("n40");
    expect(bell.open).toHaveBeenCalledWith(expect.objectContaining({ id: "n40", targetId: "a40" }));
    // The bell's own list and badge re-read once the write lands.
    await waitFor(() => expect(bell.refresh).toHaveBeenCalled());
  });

  it("collapses back to the latest ten when the bell is reopened", async () => {
    fetchInboxPage.mockResolvedValueOnce(page(1, 10, true));
    const user = userEvent.setup();
    renderTopbar();
    await openBell(user);
    await user.click(screen.getByRole("button", { name: "View all notifications" }));
    await screen.findByText("Item 10");

    await openBell(user); // close
    await openBell(user); // reopen

    expect(screen.getByRole("button", { name: "View all notifications" })).toBeInTheDocument();
  });
});
