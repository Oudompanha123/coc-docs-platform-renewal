import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TermsDocumentForm } from "./TermsDocumentForm";
import { BLANK_LEGAL_DOCUMENT, type LegalDocumentContent } from "@/lib/legal/legal-document";

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return {
    ...BLANK_LEGAL_DOCUMENT,
    title: "Terms of Service",
    subtitle: "Coc Docs Platform · Legal Information",
    lastUpdated: "2026-10-01",
    ...overrides,
  };
}

describe("TermsDocumentForm", () => {
  it("edits the title and shows the characters-left counter", () => {
    const onChange = vi.fn();
    render(<TermsDocumentForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByDisplayValue("Terms of Service"), { target: { value: "New Title" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: "New Title" }));
    expect(screen.getAllByText(/characters left/).length).toBeGreaterThan(0);
  });

  it("edits the subtitle", () => {
    const onChange = vi.fn();
    render(<TermsDocumentForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByDisplayValue("Coc Docs Platform · Legal Information"), { target: { value: "New subtitle" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ subtitle: "New subtitle" }));
  });

  it("switches status between draft and approved", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TermsDocumentForm value={content()} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("radio", { name: /Approved/ }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: "approved" }));
  });

  it("edits the end note through the Markdown editor", () => {
    const onChange = vi.fn();
    render(<TermsDocumentForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByPlaceholderText(/italic closing note/), { target: { value: "*Bye.*" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ endNote: "*Bye.*" }));
  });

  it("edits last updated and updated by", () => {
    const onChange = vi.fn();
    render(<TermsDocumentForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByDisplayValue("2026-10-01"), { target: { value: "2026-11-15" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ lastUpdated: "2026-11-15" }));

    fireEvent.change(screen.getByPlaceholderText("Updated by"), { target: { value: "Legal Team" } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ updatedBy: "Legal Team" }));
  });

  it("surfaces validation issues", () => {
    render(
      <TermsDocumentForm
        value={content()}
        onChange={vi.fn()}
        issues={{ title: "Title is required", lastUpdated: "Last updated is required", updatedBy: "Updated by is required" }}
      />,
    );
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Last updated is required")).toBeInTheDocument();
    expect(screen.getByText("Updated by is required")).toBeInTheDocument();
  });

  it("disables every control when disabled", () => {
    render(<TermsDocumentForm value={content()} onChange={vi.fn()} issues={{}} disabled />);
    expect(screen.getByDisplayValue("Terms of Service")).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Approved/ })).toBeDisabled();
    expect(screen.getByPlaceholderText("Updated by")).toBeDisabled();
  });
});
