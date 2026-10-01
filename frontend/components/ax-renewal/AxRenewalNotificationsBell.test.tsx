import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push, useNotifications, markRead, open } = vi.hoisted(() => ({
  push: vi.fn(),
  useNotifications: vi.fn(),
  markRead: vi.fn(),
  open: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/notify/useNotifications", () => ({ useNotifications }));
// The two dialogs it can open are not this test's subject.
vi.mock("@/components/layout/ApproveRegistrationModal", () => ({ ApproveRegistrationModal: () => null }));
vi.mock("@/components/layout/NewSignInModal", () => ({ NewSignInModal: () => null }));

import { AxRenewalNotificationsBell } from "./AxRenewalNotificationsBell";

/**
 * The AX Renewal workspace's own bell (ADR-074). Delivery and rendering are
 * useNotifications' — tested there; this covers what the workspace does with
 * an "added to a project" item.
 */
describe("AxRenewalNotificationsBell", () => {
  const memberAdded = {
    id: "n7",
    type: "ax-renewal.member-added",
    title: "Added to a project",
    detail: "You were added to an AX Renewal project",
    read: false,
    createdAt: "2026-10-01T09:00:00Z",
    targetId: "project-42",
    iconUrl: null,
    subjectName: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNotifications.mockReturnValue({
      items: [memberAdded],
      unreadCount: 1,
      markRead,
      markAllRead: vi.fn(),
      refresh: vi.fn(),
      open,
    });
  });

  it("shows the unread count and the notification", () => {
    render(<AxRenewalNotificationsBell />);

    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));

    expect(screen.getByRole("menuitem", { name: /Added to a project/ })).toBeInTheDocument();
  });

  it("marks it read and opens it when clicked", () => {
    render(<AxRenewalNotificationsBell />);

    fireEvent.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    fireEvent.click(screen.getByRole("menuitem", { name: /Added to a project/ }));

    expect(markRead).toHaveBeenCalledWith("n7");
    expect(open).toHaveBeenCalledWith(memberAdded);
  });

  it("switches to the project in place — already inside the workspace, not a new tab", () => {
    render(<AxRenewalNotificationsBell />);

    // The hook calls this when the item, or its browser banner, is opened.
    const { onOpenProject } = useNotifications.mock.calls[0]![0] as { onOpenProject: (id: string) => void };
    onOpenProject("project-42");

    expect(push).toHaveBeenCalledWith("/ax-renewal?project=project-42");
  });
});
