import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fieldTextareaClass } from "@/components/docs/editor/FormField";
import { Textarea } from "./textarea";

describe("Textarea", () => {
  it("has soft corners, never the single-line field's pill", () => {
    render(<Textarea aria-label="Notes" />);

    const className = screen.getByLabelText("Notes").className;
    expect(className).toContain("rounded-xl");
    expect(className).not.toContain("rounded-full");
    // Nor the input's fixed 40px height, which would clip it to one line.
    expect(className).not.toMatch(/(^|\s)h-10(\s|$)/);
  });

  it("shares the field surface with Input", () => {
    render(<Textarea aria-label="Notes" />);

    const className = screen.getByLabelText("Notes").className;
    expect(className).toContain("bg-muted-surface");
    expect(className).toContain("border-transparent");
  });
});

describe("fieldTextareaClass (product editor)", () => {
  it("is the textarea surface at 120px — the pill and 40px height do not leak in", () => {
    // It used to be `${inputBaseClass} ... rounded-2xl`: a plain concatenation,
    // so the input's `rounded-full h-10` stayed on the element beside the
    // overrides and the pill won on stylesheet order.
    expect(fieldTextareaClass).toContain("h-[120px]");
    expect(fieldTextareaClass).toContain("rounded-xl");
    expect(fieldTextareaClass).not.toContain("rounded-full");
    expect(fieldTextareaClass).not.toMatch(/(^|\s)h-10(\s|$)/);
  });
});
