import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MeResponse } from "@/lib/auth/api";
import type { HeroContent, StepsContent } from "@/lib/docs/content-types";
import { contentId, SEED_CONTENT } from "@/lib/docs/content-store";
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
      ingestUrl: "http://localhost:8080/api/ingest",
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

function heroContent(overrides: Partial<HeroContent> = {}): HeroContent {
  return {
    kind: "hero",
    heading: "jexmcp",
    tagline: "JEX Studio automation for Claude Code.",
    subline: "One install. Every workspace.",
    ctaLabel: "Get started",
    ctaHref: "/docs/jex3-0/get-started",
    eyebrow: "Overview",
    sectionHeading: "Your whole JEX workflow. In one plugin.",
    sectionIntro: "Intro",
    features: [],
    ...overrides,
  };
}

describe("ContentRenderer's Hero download buttons", () => {
  it("renders only Get started when every download URL is empty — the Hero looks exactly like before", () => {
    render(<ContentRenderer content={heroContent()} variant="docs" />);

    expect(screen.getByRole("link", { name: "Get started" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /download for/i })).not.toBeInTheDocument();
  });

  it("old saved content with no downloadButtons field at all loads with no errors", () => {
    // heroContent()'s own default already omits the field entirely — this is
    // exactly what a pre-existing saved row (written by an older editor)
    // deserialises to, not `downloadButtons: undefined` set explicitly.
    const oldContent = heroContent();
    expect("downloadButtons" in oldContent).toBe(false);
    expect(() => render(<ContentRenderer content={oldContent} variant="docs" />)).not.toThrow();
    expect(screen.getByRole("link", { name: "Get started" })).toBeInTheDocument();
  });

  it("shows Get started + Download for Windows only, when only Windows is filled in", () => {
    render(
      <ContentRenderer
        content={heroContent({ downloadButtons: { windows: "https://example.com/app.exe" } })}
        variant="docs"
      />,
    );

    expect(screen.getByRole("link", { name: "Get started" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download for Windows" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Download for macOS" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Download for Linux" })).not.toBeInTheDocument();
  });

  it("shows all 4 buttons, in order, when all three OSes are filled in", () => {
    render(
      <ContentRenderer
        content={heroContent({
          downloadButtons: {
            windows: "https://example.com/app.exe",
            macos: "https://example.com/app.dmg",
            linux: "/downloads/app.AppImage",
          },
        })}
        variant="docs"
      />,
    );

    const links = screen.getAllByRole("link").map((el) => el.textContent?.trim());
    expect(links).toEqual(["Get started", "Download for Windows", "Download for macOS", "Download for Linux"]);
  });

  it("adds rel=noopener noreferrer to an external https:// URL, but not to a same-site relative path", () => {
    render(
      <ContentRenderer
        content={heroContent({
          downloadButtons: { windows: "https://example.com/app.exe", linux: "/downloads/app.AppImage" },
        })}
        variant="docs"
      />,
    );

    expect(screen.getByRole("link", { name: "Download for Windows" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(screen.getByRole("link", { name: "Download for Linux" })).not.toHaveAttribute("rel");
  });

  it("shows version and size on line 2, joined by a middle dot, when both are set", () => {
    render(
      <ContentRenderer
        content={heroContent({
          downloadButtons: {
            windows: { url: "https://example.com/app.exe", version: "v2.1.0", size: "84 MB" },
          },
        })}
        variant="docs"
      />,
    );

    expect(screen.getByText("v2.1.0 · 84 MB")).toBeInTheDocument();
  });

  it("shows only version, or only size, when just one of the two is set", () => {
    const { rerender } = render(
      <ContentRenderer
        content={heroContent({ downloadButtons: { windows: { url: "https://example.com/app.exe", version: "v2.1.0" } } })}
        variant="docs"
      />,
    );
    expect(screen.getByText("v2.1.0")).toBeInTheDocument();

    rerender(
      <ContentRenderer
        content={heroContent({ downloadButtons: { windows: { url: "https://example.com/app.exe", size: "84 MB" } } })}
        variant="docs"
      />,
    );
    expect(screen.getByText("84 MB")).toBeInTheDocument();
  });

  it("hides line 2 entirely when both version and size are empty — including the legacy bare-URL shape", () => {
    render(
      <ContentRenderer
        content={heroContent({ downloadButtons: { windows: "https://example.com/app.exe" } })}
        variant="docs"
      />,
    );

    const link = screen.getByRole("link", { name: "Download for Windows" });
    // Only one text node inside the label/meta wrapper — the label itself.
    expect(link.querySelectorAll("span > span")).toHaveLength(1);
  });

  it("a custom label and a show: false entry on another OS — the custom label renders and the off one stays hidden", () => {
    render(
      <ContentRenderer
        content={heroContent({
          downloadButtons: {
            windows: { url: "https://example.com/app.exe", label: "Get it now" },
            macos: { url: "https://example.com/app.dmg", show: false },
          },
        })}
        variant="docs"
      />,
    );

    expect(screen.getByRole("link", { name: "Get it now" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /macos/i })).not.toBeInTheDocument();
  });

  it("Get started sits in its own row, ahead of the download buttons row", () => {
    render(
      <ContentRenderer
        content={heroContent({ downloadButtons: { windows: "https://example.com/app.exe" } })}
        variant="docs"
      />,
    );

    const getStarted = screen.getByRole("link", { name: "Get started" });
    const download = screen.getByRole("link", { name: "Download for Windows" });
    // Get started's row and the download row are siblings, not the same element.
    expect(getStarted.parentElement).not.toBe(download.parentElement);
  });
});

describe("ContentRenderer's Hero second button", () => {
  it("shows the second button beside the CTA, linking where it says", () => {
    render(
      <ContentRenderer
        content={heroContent({ ctaLabel: "Quick start", secondaryCta: { label: "AX Renewal", href: "/ax-renewal" } })}
        variant="docs"
      />,
    );

    const primary = screen.getByRole("link", { name: "Quick start" });
    const second = screen.getByRole("link", { name: "AX Renewal" });
    expect(second).toHaveAttribute("href", "/ax-renewal");
    // Same row as the CTA, after it — a same-site link, so no new tab.
    expect(second.parentElement).toBe(primary.parentElement);
    expect(primary.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(second).not.toHaveAttribute("target");
  });

  it("is absent for content with no second button — the Hero looks exactly like before", () => {
    render(<ContentRenderer content={heroContent()} variant="docs" />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("opens an external https:// link in a new tab, safely", () => {
    render(
      <ContentRenderer content={heroContent({ secondaryCta: { label: "Site", href: "https://example.com/x" } })} variant="docs" />,
    );

    const link = screen.getByRole("link", { name: "Site" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it.each([
    ["no label", { label: "  ", href: "/ax-renewal" }],
    ["no link", { label: "AX Renewal", href: "" }],
    ["an unsafe link", { label: "AX Renewal", href: "javascript:alert(1)" }],
    ["a plain http:// link", { label: "AX Renewal", href: "http://example.com" }],
  ])("stays hidden with %s", (_case, secondaryCta) => {
    render(<ContentRenderer content={heroContent({ secondaryCta })} variant="docs" />);

    expect(screen.queryByRole("link", { name: /AX Renewal/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get started" })).toBeInTheDocument();
  });
});

describe("AX Renewal docs overview", () => {
  it("offers Quick start and a button straight into the AX Renewal workspace", () => {
    const overview = SEED_CONTENT[contentId("ax-renewal-docs", "")];
    if (overview?.kind !== "hero") throw new Error("expected the AX Renewal overview to be a hero");

    render(<ContentRenderer content={overview} variant="docs" />);

    expect(screen.getByRole("link", { name: "Quick start" })).toHaveAttribute("href", "/docs/ax-renewal-docs/quick-start");
    expect(screen.getByRole("link", { name: "AX Renewal" })).toHaveAttribute("href", "/ax-renewal");
  });
});
