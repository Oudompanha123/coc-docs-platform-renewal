import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LegalPageDetailsForm } from "./LegalPageDetailsForm";
import type { LegalContent } from "@/lib/legal/content-types";

function content(overrides: Partial<LegalContent> = {}): LegalContent {
  return {
    title: "Terms of Service",
    lead: "The simple rules.",
    eyebrow: "Coc Docs Platform · Legal",
    lastUpdated: "2026-10-01",
    status: "draft",
    bulletStyle: "circle",
    highlights: [
      { icon: "person", title: "A", text: "a" },
      { icon: "document", title: "B", text: "b" },
      { icon: "ban", title: "C", text: "c" },
    ],
    plainLanguage: "one two three",
    sections: [{ id: "s1", title: "Section One", icon: "document", body: "four five six seven" }],
    cta: { title: "Have a question?", text: "We can help." },
    ...overrides,
  };
}

describe("LegalPageDetailsForm", () => {
  it("edits the title and shows the characters-left counter", () => {
    const onChange = vi.fn();
    render(<LegalPageDetailsForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByDisplayValue("Terms of Service"), { target: { value: "New Title" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ title: "New Title" }));
    expect(screen.getAllByText(/characters left/).length).toBeGreaterThan(0);
  });

  it("shows the estimated read time next to Last updated", () => {
    // 7 total words across plainLanguage + the one section body, well under
    // 200 words/minute, so this rounds up to the 1-minute floor.
    render(<LegalPageDetailsForm value={content()} onChange={vi.fn()} issues={{}} />);
    expect(screen.getByText("1 min read")).toBeInTheDocument();
  });

  it("edits the eyebrow field", () => {
    const onChange = vi.fn();
    render(<LegalPageDetailsForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByDisplayValue("Coc Docs Platform · Legal"), { target: { value: "New eyebrow" } });

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ eyebrow: "New eyebrow" }));
  });

  it("switches status between draft and approved", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalPageDetailsForm value={content()} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("radio", { name: /Approved/ }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: "approved" }));
  });

  it("switches bullet style", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalPageDetailsForm value={content()} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "check" }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ bulletStyle: "check" }));
  });

  it("surfaces validation issues for title, eyebrow, lead, lastUpdated, and bulletStyle", () => {
    render(
      <LegalPageDetailsForm
        value={content()}
        onChange={vi.fn()}
        issues={{
          title: "Title is required",
          eyebrow: "Eyebrow exceeds 40 characters",
          lead: "Lead line exceeds 160 characters",
          lastUpdated: "Last updated is required",
          bulletStyle: 'Bullet style must be "circle" or "check"',
        }}
      />,
    );
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Eyebrow exceeds 40 characters")).toBeInTheDocument();
    expect(screen.getByText("Lead line exceeds 160 characters")).toBeInTheDocument();
    expect(screen.getByText("Last updated is required")).toBeInTheDocument();
    expect(screen.getByText('Bullet style must be "circle" or "check"')).toBeInTheDocument();
  });

  it("disables every control when disabled", () => {
    render(<LegalPageDetailsForm value={content()} onChange={vi.fn()} issues={{}} disabled />);
    expect(screen.getByDisplayValue("Terms of Service")).toBeDisabled();
    expect(screen.getByDisplayValue("Coc Docs Platform · Legal")).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Approved/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "check" })).toBeDisabled();
  });
});
