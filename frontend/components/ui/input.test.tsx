import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "./input";

describe("Input", () => {
  it("renders a real input, so labels, FormData and password managers still find it", () => {
    render(<Input name="username" defaultValue="someone@example.com" aria-label="Email" />);

    const field = screen.getByLabelText("Email");
    expect(field.tagName).toBe("INPUT");
    expect(field).toHaveAttribute("name", "username");
    expect(field).toHaveValue("someone@example.com");
  });

  it("lets a caller's one-sided padding win over the base padding", () => {
    // FormField relies on exactly this to inset the leading icon, and it only
    // works because the base spells the sides out. Written `px-4`, the base
    // would survive alongside `pl-10` and the winner would be whichever rule
    // Tailwind emitted last. See the note in input.tsx.
    render(<Input aria-label="Email" className="pl-10" />);

    const className = screen.getByLabelText("Email").className;
    expect(className).toContain("pl-10");
    expect(className).not.toContain("pl-4");
    expect(className).toContain("pr-4");
  });

  it("lets a caller inset both sides independently", () => {
    render(<Input aria-label="Password" className="pl-10 pr-10" />);

    const className = screen.getByLabelText("Password").className;
    expect(className).toContain("pl-10");
    expect(className).toContain("pr-10");
    expect(className).not.toContain("pl-4");
    expect(className).not.toContain("pr-4");
  });

  it("lets a caller replace the placeholder colour without losing the rest", () => {
    render(<Input aria-label="Code" className="placeholder:text-muted/40 text-2xl" />);

    const className = screen.getByLabelText("Code").className;
    expect(className).toContain("placeholder:text-muted/40");
    expect(className).not.toContain("placeholder:text-muted ");
    expect(className).toContain("text-2xl");
    expect(className).toContain("border-border");
  });

  it("forwards aria-invalid without restyling the field", () => {
    // Phase 1 changes no pixels: an invalid field is announced, not reddened.
    render(<Input aria-label="Email" aria-invalid />);

    const field = screen.getByLabelText("Email");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field.className).not.toContain("border-destructive");
  });
});
