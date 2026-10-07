import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchAnnouncement } = vi.hoisted(() => ({ fetchAnnouncement: vi.fn() }));

vi.mock("@/lib/announcements/announcements-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/announcements/announcements-api")>(
    "@/lib/announcements/announcements-api",
  );
  return { ...actual, fetchAnnouncement };
});

import { AnnouncementGoneError } from "@/lib/announcements/announcements-api";
import { AnnouncementModal } from "./AnnouncementModal";

const maintenance = {
  id: "a1",
  title: "System Maintenance",
  body: "Line one.\nLine two.",
  category: "maintenance" as const,
  publishedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  expiresAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
};

describe("AnnouncementModal (ADR-098)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the category, the title as the dialog's name, when it was posted and until when", async () => {
    fetchAnnouncement.mockResolvedValue(maintenance);
    render(<AnnouncementModal id="a1" onClose={() => {}} />);

    expect(await screen.findByRole("dialog", { name: "System Maintenance" })).toBeInTheDocument();
    expect(screen.getByText("Announcement · Maintenance")).toBeInTheDocument();
    expect(screen.getByText(/^Posted .* · 2h ago$/)).toBeInTheDocument();
    expect(screen.getByText(/^Until /)).toBeInTheDocument();
    // Line breaks are the author's; the text is rendered as text, never HTML.
    expect(screen.getByText(/Line one\.\s+Line two\./)).toBeInTheDocument();
  });

  it("closes from Got it, the corner button and Escape", async () => {
    fetchAnnouncement.mockResolvedValue(maintenance);
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AnnouncementModal id="a1" onClose={onClose} />);

    const gotIt = await screen.findByRole("button", { name: "Got it" });
    expect(gotIt).toHaveFocus();
    await user.click(gotIt);
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it("says plainly when the announcement has been withdrawn", async () => {
    fetchAnnouncement.mockRejectedValue(new AnnouncementGoneError("This announcement is no longer available."));
    render(<AnnouncementModal id="gone" onClose={() => {}} />);

    expect(await screen.findByRole("dialog", { name: "Announcement unavailable" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("This announcement is no longer available.");
  });
});
