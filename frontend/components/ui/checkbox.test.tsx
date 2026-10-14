import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";
import { Radio } from "./radio";

/**
 * The point of these two is that they stayed native while changing how they
 * look. These tests guard that, not the styling — if either is ever swapped
 * for a Radix `<button role="checkbox">`, every one of them fails and says so
 * before a form quietly stops submitting.
 */
describe("Checkbox", () => {
  it("is a real input, so labels and FormData still find it", () => {
    render(
      <label>
        <Checkbox name="agree" defaultChecked />
        I agree
      </label>,
    );

    const box = screen.getByRole("checkbox", { name: "I agree" });
    expect(box.tagName).toBe("INPUT");
    expect(box).toHaveAttribute("name", "agree");
    expect(box).toBeChecked();
  });

  it("toggles on a click anywhere in its label, the way a native one does", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <label>
        <Checkbox onChange={onChange} />
        Remember me
      </label>,
    );

    await user.click(screen.getByText("Remember me"));

    expect(onChange).toHaveBeenCalledOnce();
  });

  it("toggles on Space, because the browser is still doing the work", async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Remember me" />);

    const box = screen.getByRole("checkbox", { name: "Remember me" });
    box.focus();
    await user.keyboard(" ");

    expect(box).toBeChecked();
  });

  it("keeps a caller's class alongside its own", () => {
    render(<Checkbox aria-label="Agree" className="mt-0.5" />);

    const className = screen.getByRole("checkbox", { name: "Agree" }).className;
    expect(className).toContain("mt-0.5");
    expect(className).toContain("appearance-none");
    expect(className).toContain("checked:bg-primary");
  });

  it("is not accidentally wearing the text field's styling", () => {
    // It was, once: the sweep that pointed every field at `inputBaseClass`
    // matched on the class string rather than the input's type, and gave a
    // 16px checkbox a 40px full-width pill.
    render(<Checkbox aria-label="Agree" />);

    const className = screen.getByRole("checkbox", { name: "Agree" }).className;
    expect(className).not.toContain("rounded-full");
    expect(className).not.toContain("h-10");
    expect(className).toContain("size-4");
  });

  it("disables as a native control, not just visually", () => {
    render(<Checkbox aria-label="Agree" disabled />);

    expect(screen.getByRole("checkbox", { name: "Agree" })).toBeDisabled();
  });
});

describe("Radio", () => {
  it("is a real input the browser groups by name", () => {
    render(
      <>
        <Radio name="role" value="user" aria-label="User" defaultChecked />
        <Radio name="role" value="admin" aria-label="Admin" />
      </>,
    );

    const user = screen.getByRole("radio", { name: "User" });
    expect(user.tagName).toBe("INPUT");
    expect(user).toBeChecked();
    expect(screen.getByRole("radio", { name: "Admin" })).not.toBeChecked();
  });

  it("lets the browser move the selection within the group", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Radio name="role" value="user" aria-label="User" defaultChecked />
        <Radio name="role" value="admin" aria-label="Admin" />
      </>,
    );

    await user.click(screen.getByRole("radio", { name: "Admin" }));

    expect(screen.getByRole("radio", { name: "Admin" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "User" })).not.toBeChecked();
  });

  it("is round, where the checkbox is square", () => {
    render(<Radio aria-label="User" />);

    expect(screen.getByRole("radio", { name: "User" }).className).toContain("rounded-full");
  });
});
