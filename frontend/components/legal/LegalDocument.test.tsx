import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalDocument } from "./LegalDocument";
import type { LegalDocumentContent } from "@/lib/legal/legal-document";

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return {
    title: "Terms of Service",
    subtitle: "Coc Docs Platform · Legal Information",
    status: "approved",
    sections: [
      { id: "your-account", title: "Your Account", body: "Register with your work email." },
      { id: "acceptable-use", title: "Acceptable Use", body: "- don't share secrets;\n- don't upload stolen material." },
    ],
    endNote: "*This page may change without notice.*",
    lastUpdated: "2026-10-01",
    updatedBy: "the Platform Team",
    ...overrides,
  };
}

describe("LegalDocument", () => {
  it("renders the title, subtitle, and every section as a heading + body", () => {
    render(<LegalDocument content={content()} />);

    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.getByText("Coc Docs Platform · Legal Information")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Your Account" })).toBeInTheDocument();
    expect(screen.getByText("Register with your work email.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Acceptable Use" })).toBeInTheDocument();
    expect(screen.getByText(/don't share secrets/)).toBeInTheDocument();
  });

  it("gives each section an anchor id matching its section.id", () => {
    const { container } = render(<LegalDocument content={content()} />);
    expect(container.querySelector("#your-account")).toBeInTheDocument();
    expect(container.querySelector("#acceptable-use")).toBeInTheDocument();
  });

  it("shows the sample-text badge only when status is draft", () => {
    const { rerender } = render(<LegalDocument content={content({ status: "draft" })} />);
    expect(screen.getByText("Sample text — replace with approved legal content")).toBeInTheDocument();

    rerender(<LegalDocument content={content({ status: "approved" })} />);
    expect(screen.queryByText("Sample text — replace with approved legal content")).not.toBeInTheDocument();
  });

  it("renders the end note and the last-updated byline", () => {
    render(<LegalDocument content={content()} />);
    expect(screen.getByText("This page may change without notice.")).toBeInTheDocument();
    expect(screen.getByText("Last updated by the Platform Team on 1 Oct 2026")).toBeInTheDocument();
  });

  it("omits the subtitle and end note entirely when they're empty", () => {
    const { container } = render(<LegalDocument content={content({ subtitle: "", endNote: "" })} />);
    expect(container.textContent).not.toContain("Coc Docs Platform · Legal Information");
    // Only the byline paragraph should carry the italic end-note styling class; none should exist.
    expect(container.querySelector(".italic")).not.toBeInTheDocument();
  });
});
