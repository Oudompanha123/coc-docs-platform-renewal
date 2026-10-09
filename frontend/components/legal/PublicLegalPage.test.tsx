import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicLegalPage } from "./PublicLegalPage";
import { LEGAL_FALLBACK_CONTENT } from "@/lib/legal/fallback-content";
import type { LegalContent } from "@/lib/legal/content-types";

const { fetchPublicLegalPage } = vi.hoisted(() => ({ fetchPublicLegalPage: vi.fn() }));
vi.mock("@/lib/legal/legal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/legal/legal-api")>("@/lib/legal/legal-api");
  return { ...actual, fetchPublicLegalPage };
});

beforeEach(() => {
  fetchPublicLegalPage.mockReset();
});

describe("PublicLegalPage", () => {
  it("renders the fallback content immediately, before the fetch resolves", () => {
    fetchPublicLegalPage.mockReturnValue(new Promise(() => {})); // never resolves
    render(<PublicLegalPage slug="privacy" />);

    expect(screen.getByRole("heading", { name: LEGAL_FALLBACK_CONTENT.privacy.title })).toBeInTheDocument();
  });

  it("swaps in the live published content once the fetch resolves", async () => {
    const live: LegalContent = { ...LEGAL_FALLBACK_CONTENT.privacy, title: "Privacy Policy (live)" };
    fetchPublicLegalPage.mockResolvedValue(live);

    render(<PublicLegalPage slug="privacy" />);

    expect(await screen.findByRole("heading", { name: "Privacy Policy (live)" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: LEGAL_FALLBACK_CONTENT.privacy.title })).not.toBeInTheDocument();
  });

  it("stays on the fallback content when the API returns nothing (unreachable backend)", async () => {
    fetchPublicLegalPage.mockResolvedValue(undefined);

    render(<PublicLegalPage slug="privacy" />);

    expect(await screen.findByRole("heading", { name: LEGAL_FALLBACK_CONTENT.privacy.title })).toBeInTheDocument();
  });

  it("renders the CTA box with a link back to Register", () => {
    fetchPublicLegalPage.mockReturnValue(new Promise(() => {}));
    render(<PublicLegalPage slug="privacy" />);

    expect(screen.getByText(LEGAL_FALLBACK_CONTENT.privacy.cta.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to Register/ })).toHaveAttribute("href", "/register");
  });

  it("links back to the site", () => {
    fetchPublicLegalPage.mockReturnValue(new Promise(() => {}));
    render(<PublicLegalPage slug="privacy" />);

    expect(screen.getByRole("link", { name: /Coc Docs Platform/ })).toHaveAttribute("href", "/login");
  });
});
