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

  it("is a filled pill with no visible border — the reference design, not shadcn's default", () => {
    render(<Input aria-label="Email" />);

    const className = screen.getByLabelText("Email").className;
    expect(className).toContain("rounded-full");
    expect(className).toContain("bg-muted-surface");
    expect(className).toContain("border-transparent");
  });

  it("lets a caller's one-sided padding win over the base padding", () => {
    // Only works because the base spells the sides out. Written `px-4`, the
    // base would survive alongside `pl-10` and the winner would be whichever
    // rule Tailwind emitted last. See the note in input.tsx.
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

  it("lets a caller override the typography without losing the field's shape", () => {
    render(<Input aria-label="Code" className="text-xl tracking-[0.4em]" />);

    const className = screen.getByLabelText("Code").className;
    expect(className).toContain("text-xl");
    expect(className).toContain("tracking-[0.4em]");
    expect(className).toContain("rounded-full");
  });

  it("shows an invalid field as invalid, not only to a screen reader", () => {
    render(<Input aria-label="Email" aria-invalid />);

    const field = screen.getByLabelText("Email");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field.className).toContain("aria-invalid:border-destructive");
  });
});
