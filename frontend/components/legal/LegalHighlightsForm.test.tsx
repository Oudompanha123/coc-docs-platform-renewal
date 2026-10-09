import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LegalHighlightsForm } from "./LegalHighlightsForm";
import type { LegalContent } from "@/lib/legal/content-types";

function content(): LegalContent {
  return {
    title: "Terms",
    lead: "",
    eyebrow: "",
    lastUpdated: "2026-10-01",
    status: "draft",
    bulletStyle: "circle",
    highlights: [
      { icon: "person", title: "Your account", text: "Keep it safe." },
      { icon: "document", title: "Your work", text: "For your team only." },
      { icon: "ban", title: "Fair use", text: "Stay in your role." },
    ],
    plainLanguage: "Summary.",
    sections: [{ id: "s1", title: "Section One", icon: "document", body: "Some text." }],
    cta: { title: "Have a question?", text: "We can help." },
  };
}

describe("LegalHighlightsForm", () => {
  it("renders exactly 3 cards with their title and text", () => {
    render(<LegalHighlightsForm value={content()} onChange={vi.fn()} issues={{}} />);

    expect(screen.getByText("Card 1")).toBeInTheDocument();
    expect(screen.getByText("Card 2")).toBeInTheDocument();
    expect(screen.getByText("Card 3")).toBeInTheDocument();
    expect(screen.queryByText("Card 4")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Your account")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Keep it safe.")).toBeInTheDocument();
  });

  it("edits a card's title", () => {
    const onChange = vi.fn();
    render(<LegalHighlightsForm value={content()} onChange={onChange} issues={{}} />);

    const titleInputs = screen.getAllByDisplayValue(/Your account|Your work|Fair use/);
    fireEvent.change(titleInputs[0]!, { target: { value: "Your account, your rules" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        highlights: [
          expect.objectContaining({ title: "Your account, your rules" }),
          expect.objectContaining({ title: "Your work" }),
          expect.objectContaining({ title: "Fair use" }),
        ],
      }),
    );
  });

  it("edits a card's text", () => {
    const onChange = vi.fn();
    render(<LegalHighlightsForm value={content()} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByDisplayValue("Keep it safe."), { target: { value: "Keep it very safe." } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        highlights: expect.arrayContaining([expect.objectContaining({ text: "Keep it very safe." })]),
      }),
    );
  });

  it("changes a card's icon through the icon picker", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalHighlightsForm value={content()} onChange={onChange} issues={{}} />);

    const toggles = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-haspopup") === "listbox");
    await user.click(toggles[0]!);

    const listbox = screen.getByRole("listbox", { name: "Icon" });
    const careOption = Array.from(listbox.querySelectorAll('[role="option"]')).find(
      (el) => el.getAttribute("title") === "Care",
    );
    expect(careOption).toBeTruthy();
    fireEvent.click(careOption!);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        highlights: [
          expect.objectContaining({ icon: "heart" }),
          expect.objectContaining({ icon: "document" }),
          expect.objectContaining({ icon: "ban" }),
        ],
      }),
    );
  });

  it("surfaces a per-highlight validation issue", () => {
    render(
      <LegalHighlightsForm
        value={content()}
        onChange={vi.fn()}
        issues={{ "highlights[0].title": "Title is required" }}
      />,
    );
    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });

  it("surfaces the highlight-count validation issue", () => {
    render(
      <LegalHighlightsForm
        value={content()}
        onChange={vi.fn()}
        issues={{ highlights: "There must be exactly 3 highlight cards" }}
      />,
    );
    expect(screen.getByText("There must be exactly 3 highlight cards")).toBeInTheDocument();
  });

  it("disables every control when disabled", () => {
    render(<LegalHighlightsForm value={content()} onChange={vi.fn()} issues={{}} disabled />);

    expect(screen.getByDisplayValue("Your account")).toBeDisabled();
    expect(screen.getByDisplayValue("Keep it safe.")).toBeDisabled();
    const toggles = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-haspopup") === "listbox");
    expect(toggles[0]).toBeDisabled();
  });
});
