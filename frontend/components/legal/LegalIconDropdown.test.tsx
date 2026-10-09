import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LegalIconDropdown } from "./LegalIconDropdown";

describe("LegalIconDropdown", () => {
  it("shows the selected icon's label on the closed button", () => {
    render(<LegalIconDropdown value="key" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Access/ })).toBeInTheDocument();
  });

  it("falls back to the first option's label for an unrecognised value", () => {
    render(<LegalIconDropdown value="not-a-real-icon" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Person/ })).toBeInTheDocument();
  });

  it("opens a listbox of every option on click", async () => {
    const user = userEvent.setup();
    render(<LegalIconDropdown value="person" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Person/ }));

    expect(screen.getByRole("listbox", { name: "Icon" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Access" })).toBeInTheDocument();
  });

  it("calls onChange with the clicked option's key and closes the listbox", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LegalIconDropdown value="person" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /Person/ }));
    await user.click(screen.getByRole("option", { name: "Access" }));

    expect(onChange).toHaveBeenCalledWith("key");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("marks the current value as the selected option", async () => {
    const user = userEvent.setup();
    render(<LegalIconDropdown value="key" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /Access/ }));

    expect(screen.getByRole("option", { name: "Access" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: "Person" })).toHaveAttribute("aria-selected", "false");
  });

  it("closes when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <LegalIconDropdown value="person" onChange={vi.fn()} />
        <button type="button">outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: /Person/ }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("disables the toggle button when disabled", () => {
    render(<LegalIconDropdown value="person" onChange={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: /Person/ })).toBeDisabled();
  });
});
