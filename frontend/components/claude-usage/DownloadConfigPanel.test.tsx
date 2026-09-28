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

const { downloadPersonalizedScript } = vi.hoisted(() => ({ downloadPersonalizedScript: vi.fn() }));
vi.mock("@/lib/admin/reporterConfig", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin/reporterConfig")>("@/lib/admin/reporterConfig");
  return { ...actual, downloadPersonalizedScript };
});

const SCRIPT_TEMPLATE = "#!/usr/bin/env node\nconst EMBEDDED_CONFIG = null;\n";

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
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(SCRIPT_TEMPLATE) }),
  );
});

describe("DownloadConfigPanel", () => {
  it("lists the caller's existing tokens without ever showing a raw secret", async () => {
    render(<DownloadConfigPanel />);

    expect(await screen.findByText("Work Desktop")).toBeInTheDocument();
    expect(screen.queryByText(/coc_/)).not.toBeInTheDocument();
  });

  it("is a true one-click download — no label to type in first", async () => {
    render(<DownloadConfigPanel />);
    await screen.findByText("Work Desktop");

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^push-usage\.mjs$/i })).toBeInTheDocument();
  });

  it("mints a token, fetches the script template, downloads the personalized script, and never puts the raw value in the DOM", async () => {
    const minted: MintedUsageToken = {
      id: "tok-2",
      label: "My Laptop",
      token: "coc_abcdef0123456789", // gitleaks:allow — fixture, not a credential
      createdAt: "2026-09-23T00:00:00Z",
    };
    createUsageToken.mockResolvedValue(minted);
    listUsageTokens.mockResolvedValueOnce([EXISTING_TOKEN]).mockResolvedValueOnce([EXISTING_TOKEN, minted]);

    const user = userEvent.setup();
    render(<DownloadConfigPanel />);
    await screen.findByText("Work Desktop");

    await user.click(screen.getByRole("button", { name: /^push-usage\.mjs$/i }));

    // No label typed anywhere — a one-click download still needs *some*
    // label for "Your tokens" to show, so it's auto-generated.
    await waitFor(() => expect(createUsageToken).toHaveBeenCalledWith(expect.stringMatching(/^Machine — /)));
    expect(fetch).toHaveBeenCalledWith("/downloads/push-usage.mjs", { cache: "no-store" });
    await waitFor(() =>
      expect(downloadPersonalizedScript).toHaveBeenCalledWith(
        expect.stringContaining('"INGEST_SECRET":"coc_abcdef0123456789"'), // gitleaks:allow — fixture, not a credential
      ),
    );
    const downloadedScript = downloadPersonalizedScript.mock.calls[0]?.[0] as string;
    expect(downloadedScript).toContain('"USER_EMAIL":"dana@example.com"');
    expect(downloadedScript).not.toContain("const EMBEDDED_CONFIG = null;");

    expect(await screen.findByText(/downloaded/i)).toBeInTheDocument();
    expect(await screen.findByText(/treat it like a password/i)).toBeInTheDocument();
    expect(screen.queryByText("coc_abcdef0123456789")).not.toBeInTheDocument();
  });

  it("shows a clear error and does not crash when minting fails", async () => {
    createUsageToken.mockRejectedValue(new Error("Couldn't generate a token. Please try again."));

    const user = userEvent.setup();
    render(<DownloadConfigPanel />);
    await screen.findByText("Work Desktop");

    await user.click(screen.getByRole("button", { name: /^push-usage\.mjs$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't generate a token. Please try again.");
    expect(downloadPersonalizedScript).not.toHaveBeenCalled();
  });

  it("shows a clear error when the script template can't be fetched, without downloading a partial file", async () => {
    createUsageToken.mockResolvedValue({
      id: "tok-2",
      label: "My Laptop",
      token: "coc_abcdef0123456789", // gitleaks:allow — fixture, not a credential
      createdAt: "2026-09-23T00:00:00Z",
    } satisfies MintedUsageToken);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const user = userEvent.setup();
    render(<DownloadConfigPanel />);
    await screen.findByText("Work Desktop");

    await user.click(screen.getByRole("button", { name: /^push-usage\.mjs$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load the reporter script/i);
    expect(downloadPersonalizedScript).not.toHaveBeenCalled();
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
