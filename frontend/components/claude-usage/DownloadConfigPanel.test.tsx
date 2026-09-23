import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse, MintedUsageToken, UsageToken } from "@/lib/auth/api";
import { DownloadConfigPanel } from "./DownloadConfigPanel";

const { listUsageTokens, createUsageToken, revokeUsageToken } = vi.hoisted(() => ({
  listUsageTokens: vi.fn(),
  createUsageToken: vi.fn(),
  revokeUsageToken: vi.fn(),
}));
// The real error classes are kept, same reasoning DangerZoneCard.test.tsx
// gives for its own lib/auth/api mock: a stubbed module would give the
// component a different class than the one it does `instanceof` against.
vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, listUsageTokens, createUsageToken, revokeUsageToken };
});

const { downloadReporterConfig } = vi.hoisted(() => ({ downloadReporterConfig: vi.fn() }));
vi.mock("@/lib/admin/reporterConfig", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin/reporterConfig")>("@/lib/admin/reporterConfig");
  return { ...actual, downloadReporterConfig };
});

const sessionUser: MeResponse = {
  id: "acct-1",
  email: "dana@example.com",
  displayName: "Dana Lee",
  role: "admin",
  createdAt: "2026-01-01T00:00:00Z",
  lastSignInAt: "2026-09-20T08:00:00Z",
  avatarUrl: null,
  authenticated: true,
  mustChangePassword: false,
  hasPassword: true,
  roles: ["admin"],
  deactivationCancelled: false,
};
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ status: "authenticated", user: sessionUser, signOut: vi.fn(), refresh: vi.fn() }),
}));

const EXISTING_TOKEN: UsageToken = {
  id: "tok-1",
  label: "Work Desktop",
  createdAt: "2026-09-01T00:00:00Z",
  lastUsedAt: "2026-09-20T00:00:00Z",
};

beforeEach(() => {
  // resetAllMocks, not restoreAllMocks: these are plain vi.fn()s from
  // vi.hoisted (not vi.spyOn), so restoreAllMocks — which only restores a
  // spy's original implementation — leaves their call history and queued
  // resolved/rejected values from the previous test in place. reset clears
  // both, for every mock, spy or not.
  vi.resetAllMocks();
  listUsageTokens.mockResolvedValue([EXISTING_TOKEN]);
});

describe("DownloadConfigPanel", () => {
  it("lists the caller's existing tokens without ever showing a raw secret", async () => {
    render(<DownloadConfigPanel />);

    expect(await screen.findByText("Work Desktop")).toBeInTheDocument();
    expect(screen.queryByText(/coc_/)).not.toBeInTheDocument();
  });

  it("mints a token, downloads the config built from it, and never puts the raw value in the DOM", async () => {
    const minted: MintedUsageToken = {
      id: "tok-2",
      label: "My Laptop",
      token: "coc_abcdef0123456789",
      createdAt: "2026-09-23T00:00:00Z",
    };
    createUsageToken.mockResolvedValue(minted);
    listUsageTokens.mockResolvedValueOnce([EXISTING_TOKEN]).mockResolvedValueOnce([EXISTING_TOKEN, minted]);

    const user = userEvent.setup();
    render(<DownloadConfigPanel />);
    await screen.findByText("Work Desktop");

    await user.type(screen.getByPlaceholderText(/label this machine/i), "My Laptop");
    await user.click(screen.getByRole("button", { name: /generate & download/i }));

    await waitFor(() => expect(createUsageToken).toHaveBeenCalledWith("My Laptop"));
    expect(downloadReporterConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        USER_EMAIL: "dana@example.com",
        USER_NAME: "Dana Lee",
        INGEST_SECRET: "coc_abcdef0123456789",
      }),
    );
    expect(await screen.findByText(/downloaded/i)).toBeInTheDocument();
    expect(screen.queryByText("coc_abcdef0123456789")).not.toBeInTheDocument();
  });

  it("shows a clear error and does not crash when minting fails", async () => {
    createUsageToken.mockRejectedValue(new Error("Couldn't generate a token. Please try again."));

    const user = userEvent.setup();
    render(<DownloadConfigPanel />);
    await screen.findByText("Work Desktop");

    await user.click(screen.getByRole("button", { name: /generate & download/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't generate a token. Please try again.");
    expect(downloadReporterConfig).not.toHaveBeenCalled();
  });

  it("revokes a token after the confirm prompt, and refreshes the list", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    revokeUsageToken.mockResolvedValue(undefined);
    listUsageTokens.mockResolvedValueOnce([EXISTING_TOKEN]).mockResolvedValueOnce([]);

    const user = userEvent.setup();
    render(<DownloadConfigPanel />);
    await screen.findByText("Work Desktop");

    await user.click(screen.getByRole("button", { name: /revoke/i }));

    expect(revokeUsageToken).toHaveBeenCalledWith("tok-1");
    await waitFor(() => expect(screen.queryByText("Work Desktop")).not.toBeInTheDocument());
  });

  it("does nothing when the revoke confirm prompt is dismissed", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const user = userEvent.setup();
    render(<DownloadConfigPanel />);
    await screen.findByText("Work Desktop");

    await user.click(screen.getByRole("button", { name: /revoke/i }));

    expect(revokeUsageToken).not.toHaveBeenCalled();
  });

  it("shows a load error rather than an empty list when the token list fails to load", async () => {
    listUsageTokens.mockReset().mockRejectedValue(new Error("Couldn't load your usage tokens."));

    render(<DownloadConfigPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your usage tokens.");
  });
});
