import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LegalSectionsForm } from "./LegalSectionsForm";
import type { LegalContent } from "@/lib/legal/content-types";

function content(sections: LegalContent["sections"]): LegalContent {
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
    plainLanguage: "Summary.",
    sections,
    cta: { title: "Have a question?", text: "We can help." },
  };
}

const TWO_SECTIONS: LegalContent["sections"] = [
  { id: "first", title: "First section", icon: "document", body: "First text" },
  { id: "second", title: "Second section", icon: "person", body: "one\ntwo" },
];

beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("LegalSectionsForm", () => {
  it("renders every section's title and its 1-based number", () => {
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={vi.fn()} issues={{}} />);

    expect(screen.getByText("First section")).toBeInTheDocument();
    expect(screen.getByText("Second section")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("shows the section count", () => {
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={vi.fn()} issues={{}} />);
    expect(screen.getByText("2 sections")).toBeInTheDocument();
  });

  it("adds a new section, up to the max", () => {
    const onChange = vi.fn();
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={onChange} issues={{}} />);

    screen.getByText("+ Add section").click();

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sections: expect.arrayContaining([expect.objectContaining({ title: "New section 3" })]) }),
    );
  });

  it("disables Add section at the maximum", () => {
    const fifteen = Array.from({ length: 15 }, (_, i) => ({
      id: `s${i}`,
      title: `Section ${i}`,
      icon: "document",
      body: "x",
    }));
    render(<LegalSectionsForm value={content(fifteen)} onChange={vi.fn()} issues={{}} />);

    expect(screen.getByText("+ Add section")).toBeDisabled();
  });

  it("removes a section after confirming", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "Delete section 1" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sections: [expect.objectContaining({ id: "second" })] }),
    );
  });

  it("does not remove a section when the confirm is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "Delete section 1" }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves a section down with the keyboard-accessible button", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "Move section 1 down" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sections: [expect.objectContaining({ id: "second" }), expect.objectContaining({ id: "first" })],
      }),
    );
  });

  it("disables moving the first section up and the last section down", () => {
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={vi.fn()} issues={{}} />);

    expect(screen.getByRole("button", { name: "Move section 1 up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move section 2 down" })).toBeDisabled();
  });

  it("changes a section's icon through the icon dropdown (already expanded by default)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={onChange} issues={{}} />);

    const toggles = screen.getAllByRole("button").filter((b) => b.getAttribute("aria-haspopup") === "listbox");
    await user.click(toggles[0]!);
    await user.click(screen.getByRole("option", { name: "Access" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sections: [expect.objectContaining({ icon: "key" }), expect.anything()] }),
    );
  });

  it("edits a section's body text (already expanded by default)", () => {
    const onChange = vi.fn();
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={onChange} issues={{}} />);

    fireEvent.change(screen.getByDisplayValue("First text"), { target: { value: "New body text" } });

    const lastCall = onChange.mock.calls.at(-1)![0] as LegalContent;
    expect(lastCall.sections[0]!.body).toBe("New body text");
  });

  it("shows the derived anchor once a section is expanded", async () => {
    const user = userEvent.setup();
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={vi.fn()} issues={{}} />);

    // First section is expanded by default.
    expect(screen.getByText("#first")).toBeInTheDocument();
    expect(screen.queryByText("#second")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand section 2" }));
    expect(screen.getByText("#second")).toBeInTheDocument();
  });

  it("disambiguates the anchor when a rename collides with another section's id", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={onChange} issues={{}} />);

    await user.click(screen.getByRole("button", { name: "Expand section 2" }));
    const titleInputs = screen.getAllByPlaceholderText("Section title");
    // One change event with the complete final value, not simulated
    // keystrokes: this is a controlled input whose `value` prop never
    // updates in this test (onChange is a bare mock, not real state), so
    // typing character-by-character would fight React's re-render back to
    // the original value between each keystroke.
    // "First" slugifies to "first", colliding with section 1's existing id.
    fireEvent.change(titleInputs[1]!, { target: { value: "First" } });

    const lastCall = onChange.mock.calls.at(-1)![0] as LegalContent;
    expect(lastCall.sections[1]!.id).toBe("first-2");
  });

  it("disables every control when disabled", () => {
    render(<LegalSectionsForm value={content(TWO_SECTIONS)} onChange={vi.fn()} issues={{}} disabled />);

    expect(screen.getByText("+ Add section")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete section 1" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move section 1 down" })).toBeDisabled();
  });

  it("surfaces a per-section validation issue", () => {
    render(
      <LegalSectionsForm
        value={content(TWO_SECTIONS)}
        onChange={vi.fn()}
        issues={{ "sections[0].title": "Title is required" }}
      />,
    );
    expect(screen.getByText("Title is required")).toBeInTheDocument();
  });
});
