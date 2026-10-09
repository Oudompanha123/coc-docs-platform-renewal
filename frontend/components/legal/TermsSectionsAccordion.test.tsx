import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TermsSectionsAccordion } from "./TermsSectionsAccordion";
import type { LegalDocSection } from "@/lib/legal/legal-document";

beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

function sections(): LegalDocSection[] {
  return [
    { id: "intro", title: "Intro", body: "Hello there, friend." },
    { id: "rules", title: "Rules", body: "Follow the rules here, now." },
  ];
}

describe("TermsSectionsAccordion", () => {
  it("shows the empty state and adds the first section from it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TermsSectionsAccordion sections={[]} onChange={onChange} issues={{}} />);

    expect(screen.getByText("No sections yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add your first section" }));

    expect(onChange).toHaveBeenCalledWith([{ id: "new-section-1", title: "New section 1", body: "" }]);
  });

  it("lists every section's heading, number, and word count", () => {
    render(<TermsSectionsAccordion sections={sections()} onChange={vi.fn()} issues={{}} />);

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("3 words")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("Rules")).toBeInTheDocument();
    expect(screen.getByText("5 words")).toBeInTheDocument();
  });

  it("expands/collapses all sections at once", async () => {
    const user = userEvent.setup();
    render(<TermsSectionsAccordion sections={sections()} onChange={vi.fn()} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getAllByPlaceholderText("Section heading")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryByPlaceholderText("Section heading")).not.toBeInTheDocument();
  });

  it("renaming a section updates its anchor, disambiguated against the others", async () => {
    const onChange = vi.fn();
    render(<TermsSectionsAccordion sections={sections()} onChange={onChange} issues={{}} />);

    // "Intro" (index 0) starts expanded by default.
    fireEvent.change(screen.getByPlaceholderText("Section heading"), { target: { value: "Rules" } });

    expect(onChange).toHaveBeenCalledWith([
      { id: "rules-2", title: "Rules", body: "Hello there, friend." },
      sections()[1],
    ]);
  });

  it("deletes a section after confirming", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TermsSectionsAccordion sections={sections()} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith([sections()[1]]);
  });

  it("does not delete when the confirmation is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TermsSectionsAccordion sections={sections()} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("duplicates a section right after the original, with a disambiguated anchor", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TermsSectionsAccordion sections={sections()} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "Duplicate" }));

    expect(onChange).toHaveBeenCalledWith([
      sections()[0],
      { id: "intro-copy", title: "Intro (copy)", body: "Hello there, friend." },
      sections()[1],
    ]);
  });

  it("moves a section up and down", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TermsSectionsAccordion sections={sections()} onChange={onChange} issues={{}} />);

    expect(screen.getByRole("button", { name: "Move section 1 up" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Move section 1 down" }));

    expect(onChange).toHaveBeenCalledWith([sections()[1], sections()[0]]);
  });

  it("shows a red error dot only for a section with an issue", () => {
    render(<TermsSectionsAccordion sections={sections()} onChange={vi.fn()} issues={{ "sections[1].title": "Heading is required" }} />);
    expect(screen.getByLabelText("Has an error")).toBeInTheDocument();
  });

  it("adds a new section from the dashed button at the bottom, and focuses its heading", () => {
    const onChange = vi.fn();
    const { rerender } = render(<TermsSectionsAccordion sections={sections()} onChange={onChange} issues={{}} />);

    fireEvent.click(screen.getByRole("button", { name: "+ Add section" }));
    const added = onChange.mock.calls[0]![0] as LegalDocSection[];
    expect(added).toHaveLength(3);
    expect(added[2]!.title).toBe("New section 3");

    rerender(<TermsSectionsAccordion sections={added} onChange={onChange} issues={{}} />);
    expect(document.activeElement).toHaveAttribute("placeholder", "Section heading");
  });

  it("disables every row action and the add buttons when disabled", () => {
    render(<TermsSectionsAccordion sections={sections()} onChange={vi.fn()} issues={{}} disabled />);

    expect(screen.getByPlaceholderText("Section heading")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move section 1 up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move section 1 down" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Duplicate" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "+ Add section" })).toBeDisabled();
  });

  it("shows the empty state's disabled Add button, and no between-row + buttons, when disabled", () => {
    render(<TermsSectionsAccordion sections={[]} onChange={vi.fn()} issues={{}} disabled />);
    expect(screen.getByRole("button", { name: "Add your first section" })).toBeDisabled();
  });

  it("disables adding once at the 30-section maximum", () => {
    const thirty = Array.from({ length: 30 }, (_, i) => ({ id: `s${i}`, title: `S${i}`, body: "x" }));
    render(<TermsSectionsAccordion sections={thirty} onChange={vi.fn()} issues={{}} />);
    expect(screen.getByRole("button", { name: "+ Add section" })).toBeDisabled();
  });
});
