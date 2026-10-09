import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SimpleSelect } from "./select";

const OPTIONS = [
  { value: "", label: "All departments" },
  { value: "eng", label: "Engineering" },
  { value: "ops", label: "Operations" },
];

function Harness({ onChange = vi.fn() }: { onChange?: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <SimpleSelect
      aria-label="Department"
      value={value}
      onValueChange={(v) => {
        setValue(v);
        onChange(v);
      }}
      options={OPTIONS}
    />
  );
}

describe("SimpleSelect", () => {
  it("is a combobox showing the current option, not a native select", () => {
    const { container } = render(<Harness />);

    expect(screen.getByRole("combobox", { name: "Department" })).toHaveTextContent("All departments");
    expect(container.querySelector("select:not([aria-hidden])")).toBeNull();
  });

  it("opens its own list and reports the chosen value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Department" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Operations" }));

    expect(onChange).toHaveBeenCalledWith("ops");
    expect(screen.getByRole("combobox", { name: "Department" })).toHaveTextContent("Operations");
  });

  it("round-trips the empty string that means 'All'", async () => {
    // Radix forbids "" as an item value; SimpleSelect maps it to a sentinel
    // and back, so a caller's "" never leaks out as "__empty__".
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: "Department" }));
    await user.click(screen.getByRole("option", { name: "Engineering" }));
    await user.click(screen.getByRole("combobox", { name: "Department" }));
    await user.click(screen.getByRole("option", { name: "All departments" }));

    expect(onChange).toHaveBeenLastCalledWith("");
    expect(onChange).not.toHaveBeenCalledWith("__empty__");
  });

  it("is a pill on the shared field surface", () => {
    render(<Harness />);
    const trigger = screen.getByRole("combobox", { name: "Department" });
    expect(trigger).toHaveClass("rounded-full", "bg-muted-surface");
  });
});

describe("SimpleSelect theming", () => {
  it("opens its list inside the page's shell, so the shell's dark mode reaches it", async () => {
    // Portalled to <body>, the list sat outside [data-shell] — where dark
    // mode is scoped — and drew as a white panel on a dark page.
    const user = userEvent.setup();
    render(
      <div data-shell="admin" data-testid="shell">
        <Harness />
      </div>,
    );

    await user.click(screen.getByRole("combobox", { name: "Department" }));

    expect(screen.getByTestId("shell")).toContainElement(screen.getByRole("listbox"));
  });
});
