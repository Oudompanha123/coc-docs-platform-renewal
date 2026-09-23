import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, SessionExpiredError, type MeResponse } from "@/lib/auth/api";
import type { NotificationItem } from "@/lib/notify/activity";
import { DangerZoneCard } from "./DangerZoneCard";

const { listNotifications, downloadMyData, deactivateMyAccount } = vi.hoisted(() => ({
  listNotifications: vi.fn(),
  downloadMyData: vi.fn(),
  deactivateMyAccount: vi.fn(),
}));
vi.mock("@/lib/notify/activity", () => ({ listNotifications }));
vi.mock("@/lib/settings/export-my-data", () => ({ downloadMyData }));
// The real AuthApiError class, kept — the component does `err instanceof
// AuthApiError`, and a stubbed module would give the test a different class
// that never matches.
vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, deactivateMyAccount };
});

const { sessionUser, signOut, refresh } = vi.hoisted(() => ({
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
    deactivationCancelled: false,
  } satisfies MeResponse,
  signOut: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ status: "authenticated", user: sessionUser, signOut, refresh }),
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
 * Self-deactivation schedules a grace period rather than deactivating
 * immediately (revision of ADR-042): `POST /api/v1/auth/me/deactivate`,
 * reachable by any signed-in account, with a chosen number of days. The
 * button opens an in-place confirm panel — no popup — and only the confirm
 * action inside it calls the API. 7 days is the default preset.
 */
describe("DangerZoneCard — Deactivate account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens an in-place confirm panel defaulting to 7 days, without calling any endpoint yet", async () => {
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));

    expect(await screen.findByText("Deactivate your account?")).toBeInTheDocument();
    expect(screen.getByText(/signed out on every device immediately/)).toBeInTheDocument();
    expect(screen.getByText(/stays active for 7 days/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "true");
    expect(deactivateMyAccount).not.toHaveBeenCalled();
    expect(listNotifications).not.toHaveBeenCalled();
    expect(downloadMyData).not.toHaveBeenCalled();
  });

  it("closes on Cancel without calling the endpoint", async () => {
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Deactivate your account?")).not.toBeInTheDocument();
    expect(deactivateMyAccount).not.toHaveBeenCalled();
  });

  it("switching the grace period preset updates the copy and the confirm action", async () => {
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));
    await user.click(await screen.findByRole("button", { name: "30 days" }));

    expect(screen.getByText(/stays active for 30 days/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 days" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Yes, deactivate in 30 days" })).toBeInTheDocument();
  });

  it("deactivates with the chosen grace period and signs out locally on confirm", async () => {
    deactivateMyAccount.mockResolvedValue({ scheduledFor: "2026-09-29T09:00:00Z" });
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));
    await user.click(await screen.findByRole("button", { name: "14 days" }));
    await user.click(await screen.findByRole("button", { name: "Yes, deactivate in 14 days" }));

    await waitFor(() => expect(deactivateMyAccount).toHaveBeenCalledWith(14));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });

  it("shows a busy state while the request is in flight, and disables both buttons", async () => {
    let resolve!: (value: { scheduledFor: string }) => void;
    deactivateMyAccount.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));
    await user.click(await screen.findByRole("button", { name: "Yes, deactivate in 7 days" }));

    expect(screen.getByRole("button", { name: "Deactivating…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    resolve({ scheduledFor: "2026-09-29T09:00:00Z" });
    await waitFor(() => expect(signOut).toHaveBeenCalled());
  });

  it("surfaces a refusal (e.g. the only active super admin) in place, and keeps the panel open", async () => {
    deactivateMyAccount.mockRejectedValue(
      new AuthApiError("you're the only active super admin; promote someone else before deactivating your account"),
    );
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));
    await user.click(await screen.findByRole("button", { name: "Yes, deactivate in 7 days" }));

    expect(await screen.findByText(/only active super admin/)).toBeInTheDocument();
    expect(screen.getByText("Deactivate your account?")).toBeInTheDocument();
    expect(signOut).not.toHaveBeenCalled();
  });

  it("on a 401 (session already ended), shows why and refreshes the session instead of retrying", async () => {
    deactivateMyAccount.mockRejectedValue(new SessionExpiredError("Your session has ended. Please sign in again."));
    const user = userEvent.setup();
    render(<DangerZoneCard />);

    await user.click(screen.getByRole("button", { name: "Deactivate account" }));
    await user.click(await screen.findByRole("button", { name: "Yes, deactivate in 7 days" }));

    expect(await screen.findByText("Your session has ended. Please sign in again.")).toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    // Not the same recovery as an ordinary refusal — this session is gone,
    // so there is nothing for the local sign-out cleanup to do.
    expect(signOut).not.toHaveBeenCalled();
  });
});
