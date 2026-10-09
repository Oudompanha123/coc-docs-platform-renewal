import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TermsOutlineNav } from "./TermsOutlineNav";
import type { LegalDocSection } from "@/lib/legal/legal-document";

function sections(): LegalDocSection[] {
  return [
    { id: "intro", title: "Intro", body: "a" },
    { id: "rules", title: "Rules", body: "b" },
  ];
}

describe("TermsOutlineNav", () => {
  it("shows an empty-state message when there are no sections", () => {
    render(<TermsOutlineNav sections={[]} onChange={vi.fn()} onSelect={vi.fn()} issues={{}} />);
    expect(screen.getByText("No sections yet.")).toBeInTheDocument();
  });

  it("lists every section numbered, and calls onSelect with its index on click", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TermsOutlineNav sections={sections()} onChange={vi.fn()} onSelect={onSelect} issues={{}} />);

    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();

    await user.click(screen.getByText("Rules"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("disables drag-reorder when disabled, but navigation still works", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TermsOutlineNav sections={sections()} onChange={vi.fn()} onSelect={onSelect} issues={{}} disabled />);

    expect(screen.getByText("Intro").closest("li")).toHaveAttribute("draggable", "false");

    await user.click(screen.getByText("Intro"));
    expect(onSelect).toHaveBeenCalledWith(0);
  });

  it("shows a red error dot only for a section with an issue", () => {
    render(
      <TermsOutlineNav
        sections={sections()}
        onChange={vi.fn()}
        onSelect={vi.fn()}
        issues={{ "sections[0].title": "Heading is required" }}
      />,
    );
    expect(screen.getAllByLabelText("Has an error")).toHaveLength(1);
  });
});
