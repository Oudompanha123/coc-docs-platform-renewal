import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalDocument } from "./LegalDocument";
import type { LegalDocumentContent } from "@/lib/legal/legal-document";

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return {
    title: "Terms of Service",
    subtitle: "Coc Docs Platform · Legal Information",
    lastUpdated: "2026-10-01",
    updatedBy: "the Platform Team",
    body: "## Agreement\n\nBy using it you agree.\n\n## Contact\n\nWrite to us.",
    ...overrides,
  };
}

describe("LegalDocument", () => {
  it("renders the title, subtitle and byline", () => {
    render(<LegalDocument content={content()} />);
    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.getByText("Coc Docs Platform · Legal Information")).toBeInTheDocument();
    expect(screen.getByText("Last updated by the Platform Team on 1 Oct 2026")).toBeInTheDocument();
  });

  it("turns every ## heading into a section heading with an anchor, and shows no contents box", () => {
    render(<LegalDocument content={content()} />);
    expect(screen.getByRole("heading", { level: 2, name: "Agreement" })).toHaveAttribute("id", "agreement");
    expect(screen.getByRole("heading", { level: 2, name: "Contact" })).toHaveAttribute("id", "contact");
    expect(screen.queryByRole("navigation", { name: "Contents" })).not.toBeInTheDocument();
    expect(screen.queryByText("On this page")).not.toBeInTheDocument();
  });

});
