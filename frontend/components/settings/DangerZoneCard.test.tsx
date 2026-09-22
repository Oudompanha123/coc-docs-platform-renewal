import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse } from "@/lib/auth/api";
import type { NotificationItem } from "@/lib/notify/activity";
import { DangerZoneCard } from "./DangerZoneCard";

const { listNotifications, downloadMyData } = vi.hoisted(() => ({
  listNotifications: vi.fn(),
  downloadMyData: vi.fn(),
}));
vi.mock("@/lib/notify/activity", () => ({ listNotifications }));
vi.mock("@/lib/settings/export-my-data", () => ({ downloadMyData }));

const { sessionUser } = vi.hoisted(() => ({
  sessionUser: {
    id: "acct-1",
    email: "dana@example.com",
    displayName: "Dana Lee",
    role: "user",
    createdAt: "2026-01-01T00:00:00Z",
    lastSignInAt: "2026-09-20T08:00:00Z",
    avatarUrl: null,
    authenticated: true,
    mustChangePassword: false,
    hasPassword: true,
    roles: ["user"],
  } satisfies MeResponse,
}));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ status: "authenticated", user: sessionUser }),
}));

const ACTIVITY: NotificationItem[] = [
  {
    id: "1",
    actorEmail: "dana@example.com",
    actorAvatarUrl: null,
    summary: "Saved a documentation section",
    occurredAt: "2026-09-21T10:00:00Z",
    actionType: "docs_content.save",
    targetType: "docs_content",
    targetId: "page-1",
    href: null,
  },
];

/**
 * "Export data" used to do nothing at all (see this component's own
 * docstring history) — these pin that it now reads the caller's own
 * activity and hands both it and the session to `downloadMyData`, the one
 * seam that actually touches the DOM (untested here, same as
 * `downloadUsersXlsx` in `export-users.test.ts` — a one-line Blob/anchor
 * glue function isn't worth mocking `URL.createObjectURL` for).
 */
describe("DangerZoneCard — Export data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the caller's own activity and hands it to the download, with the session", async () => {
    listNotifications.mockResolvedValue(ACTIVITY);
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: /Export data/ }));

    await waitFor(() => expect(downloadMyData).toHaveBeenCalledWith(sessionUser, ACTIVITY));
    expect(listNotifications).toHaveBeenCalledWith(50);
  });

  it("shows a busy state while the export is in flight, and disables the button", async () => {
    let resolve!: (value: NotificationItem[]) => void;
    listNotifications.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: /Export data/ }));

    expect(screen.getByRole("button", { name: "Exporting…" })).toBeDisabled();
    resolve(ACTIVITY);
    await waitFor(() => expect(downloadMyData).toHaveBeenCalled());
  });

  it("explains it in place, on the row, when the activity fetch fails", async () => {
    listNotifications.mockRejectedValue(new Error("Couldn't load your notifications."));
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: /Export data/ }));

    expect(await screen.findByText("Couldn't load your notifications.")).toBeInTheDocument();
    expect(downloadMyData).not.toHaveBeenCalled();
  });
});

/**
 * `AccountService.setActive` refuses self-deactivation outright, for every
 * account including a super_admin's own — see the backend's own comment on
 * that guard. There is no endpoint this button could call that would not
 * always 400, so it explains that instead of attempting one, the same
 * message the admin-side `DeactivateModal` already shows a super_admin who
 * tries this on their own row.
 */
describe("DangerZoneCard — Deactivate account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("explains why, rather than calling any endpoint", async () => {
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));

    expect(await screen.findByText("Can't deactivate your own account")).toBeInTheDocument();
    expect(screen.getByText(/Ask a/)).toHaveTextContent("Ask a super admin on your team to deactivate this account");
    expect(listNotifications).not.toHaveBeenCalled();
    expect(downloadMyData).not.toHaveBeenCalled();
  });

  it("closes on 'Got it'", async () => {
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));
    await user.click(await screen.findByRole("button", { name: "Got it" }));

    expect(screen.queryByText("Can't deactivate your own account")).not.toBeInTheDocument();
  });
});
