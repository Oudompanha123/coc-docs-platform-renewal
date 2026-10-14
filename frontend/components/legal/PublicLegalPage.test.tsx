import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PublicLegalPage } from "./PublicLegalPage";
import { LEGAL_FALLBACK_CONTENT } from "@/lib/legal/fallback-content";
import type { LegalDocumentContent } from "@/lib/legal/legal-document";

const { fetchPublicLegalPage } = vi.hoisted(() => ({ fetchPublicLegalPage: vi.fn() }));
vi.mock("@/lib/legal/legal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/legal/legal-api")>("@/lib/legal/legal-api");
  return { ...actual, fetchPublicLegalPage };
});

beforeEach(() => {
  fetchPublicLegalPage.mockReset();
});

describe("PublicLegalPage", () => {
  it.each(["terms", "privacy"] as const)("renders the %s fallback immediately, before the fetch resolves", (slug) => {
    fetchPublicLegalPage.mockReturnValue(new Promise(() => {}));
    render(<PublicLegalPage slug={slug} />);
    expect(screen.getByRole("heading", { level: 1, name: LEGAL_FALLBACK_CONTENT[slug].title })).toBeInTheDocument();
  });

  it("swaps in the live published content once the fetch resolves", async () => {
    const live: LegalDocumentContent = { ...LEGAL_FALLBACK_CONTENT.privacy, title: "Privacy Policy (live)" };
    fetchPublicLegalPage.mockResolvedValue(live);
    render(<PublicLegalPage slug="privacy" />);
    expect(await screen.findByRole("heading", { level: 1, name: "Privacy Policy (live)" })).toBeInTheDocument();
  });

  it("keeps the fallback when the API returns nothing, or a row without a body", async () => {
    fetchPublicLegalPage.mockResolvedValue({ title: "Old shape" });
    render(<PublicLegalPage slug="privacy" />);
    expect(await screen.findByRole("heading", { level: 1, name: LEGAL_FALLBACK_CONTENT.privacy.title })).toBeInTheDocument();
    expect(screen.queryByText("Old shape")).not.toBeInTheDocument();
  });

  it("links back to the site", () => {
    fetchPublicLegalPage.mockReturnValue(new Promise(() => {}));
    render(<PublicLegalPage slug="privacy" />);
    expect(screen.getByRole("link", { name: /Coc Docs Platform/ })).toHaveAttribute("href", "/login");
  });
});
