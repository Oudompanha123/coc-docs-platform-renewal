import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LegalSummaryForm } from "./LegalSummaryForm";
import type { LegalContent } from "@/lib/legal/content-types";

function content(overrides: Partial<LegalContent> = {}): LegalContent {
  return {
    title: "Terms",
    lead: "",
    eyebrow: "",
    lastUpdated: "2026-10-01",
    status: "draft",
    bulletStyle: "circle",
    highlights: [
      { icon: "person", title: "A", text: "a" },
      { icon: "document", title: "B", text: "b" },
      { icon: "ban", title: "C", text: "c" },
    ],
    plainLanguage: "The short version.",
    sections: [{ id: "s1", title: "Section One", icon: "document", body: "Some text." }],
    cta: { title: "Have a question?", text: "We can help." },
    ...overrides,
  };
}

describe("LegalSummaryForm", () => {
  it("edits the plain-language text through the Markdown editor", () => {
    const onChange = vi.fn();
    render(<LegalSummaryForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByPlaceholderText("Summarize this page in a sentence or two…"), {
      target: { value: "New summary." },
    });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ plainLanguage: "New summary." }));
  });

  it("edits the CTA title and text", () => {
    const onChange = vi.fn();
    render(<LegalSummaryForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByDisplayValue("Have a question?"), { target: { value: "Need help?" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cta: { title: "Need help?", text: "We can help." } }));

    fireEvent.change(screen.getByDisplayValue("We can help."), { target: { value: "Email us." } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ cta: { title: "Have a question?", text: "Email us." } }));
  });

  it("surfaces validation issues", () => {
    render(
      <LegalSummaryForm
        value={content()}
        onChange={vi.fn()}
        issues={{ plainLanguage: "Plain language is required", "cta.title": "CTA title is required" }}
      />,
    );
    expect(screen.getByText("Plain language is required")).toBeInTheDocument();
    expect(screen.getByText("CTA title is required")).toBeInTheDocument();
  });

  it("disables every control when disabled", () => {
    render(<LegalSummaryForm value={content()} onChange={vi.fn()} issues={{}} disabled />);
    expect(screen.getByPlaceholderText("Summarize this page in a sentence or two…")).toBeDisabled();
    expect(screen.getByDisplayValue("Have a question?")).toBeDisabled();
    expect(screen.getByDisplayValue("We can help.")).toBeDisabled();
  });
});
