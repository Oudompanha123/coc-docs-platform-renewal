import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse } from "@/lib/auth/api";
import type { StepsContent } from "@/lib/docs/content-types";
import { ContentRenderer } from "./ContentRenderer";

const { createUsageToken } = vi.hoisted(() => ({ createUsageToken: vi.fn() }));
vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, createUsageToken };
});

const { downloadPersonalizedScript } = vi.hoisted(() => ({ downloadPersonalizedScript: vi.fn() }));
vi.mock("@/lib/admin/reporterConfig", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin/reporterConfig")>("@/lib/admin/reporterConfig");
  return { ...actual, downloadPersonalizedScript };
});

const { useSession } = vi.hoisted(() => ({ useSession: vi.fn() }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));

const SCRIPT_TEMPLATE = "#!/usr/bin/env node\nconst EMBEDDED_CONFIG = null;\n";

const sessionUser: MeResponse = {
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
};

/** Minimal one-step setup-guide-shaped content with the exact download link the setup guide itself uses. */
const CONTENT: StepsContent = {
  kind: "steps",
  eyebrow: "Setup guide",
  heading: "Report your usage",
  intro: "Intro",
  steps: [
    {
      title: "Manual setup",
      body: "body",
      downloads: [
        { label: "push-usage.mjs", href: "/downloads/push-usage.mjs" },
        { label: "fix-node-ca.ps1", href: "/downloads/fix-node-ca.ps1" },
      ],
    },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve(SCRIPT_TEMPLATE) }));
});

describe("ContentRenderer's push-usage.mjs download link", () => {
  it("signed in: personalizes push-usage.mjs instead of downloading the plain generic file", async () => {
    useSession.mockReturnValue({ status: "authenticated", user: sessionUser });
    createUsageToken.mockResolvedValue({
      id: "tok-1",
      label: "Machine — Sep 28",
      token: "coc_abcdef0123456789", // gitleaks:allow — fixture, not a credential
      createdAt: "2026-09-28T00:00:00Z",
    });

    const user = userEvent.setup();
    render(<ContentRenderer content={CONTENT} variant="docs" />);

    await user.click(screen.getByRole("link", { name: /push-usage\.mjs/i }));

    await waitFor(() => expect(createUsageToken).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith("/downloads/push-usage.mjs", { cache: "no-store" });
    await waitFor(() =>
      expect(downloadPersonalizedScript).toHaveBeenCalledWith(
        expect.stringContaining('"USER_EMAIL":"dana@example.com"'),
      ),
    );
  });

  it("signed out: leaves push-usage.mjs as a plain download — no session to mint a token with", async () => {
    useSession.mockReturnValue({ status: "anonymous", user: null });

    render(<ContentRenderer content={CONTENT} variant="docs" />);
    const link = screen.getByRole("link", { name: /push-usage\.mjs/i });

    expect(link).toHaveAttribute("href", "/downloads/push-usage.mjs");
    expect(link).toHaveAttribute("download");

    const user = userEvent.setup();
    await user.click(link);
    expect(createUsageToken).not.toHaveBeenCalled();
  });

  it("never personalizes any other download, even when signed in", async () => {
    useSession.mockReturnValue({ status: "authenticated", user: sessionUser });

    const user = userEvent.setup();
    render(<ContentRenderer content={CONTENT} variant="docs" />);

    await user.click(screen.getByRole("link", { name: /fix-node-ca\.ps1/i }));

    expect(createUsageToken).not.toHaveBeenCalled();
    expect(downloadPersonalizedScript).not.toHaveBeenCalled();
  });

  it("shows a clear error and does not crash when personalizing fails, without touching the other link", async () => {
    useSession.mockReturnValue({ status: "authenticated", user: sessionUser });
    createUsageToken.mockRejectedValue(new Error("network error"));

    const user = userEvent.setup();
    render(<ContentRenderer content={CONTENT} variant="docs" />);

    await user.click(screen.getByRole("link", { name: /push-usage\.mjs/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't personalize/i);
    expect(downloadPersonalizedScript).not.toHaveBeenCalled();
  });
});
