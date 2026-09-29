import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceDatePicker } from "./AttendanceDatePicker";

// Local Sep 28 2026 — matches the "28-Sep-2026" date button label used below.
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 8, 28));
});

afterEach(() => {
  vi.useRealTimers();
});

function openButton() {
  return screen.getByRole("button", { name: "28-Sep-2026" });
}

function newUser() {
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

describe("AttendanceDatePicker", () => {
  it("is closed by default and opens on click", async () => {
    render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton()).toHaveAttribute("aria-haspopup", "dialog");
    expect(openButton()).toHaveAttribute("aria-expanded", "false");

    await newUser().click(openButton());

    expect(screen.getByRole("dialog", { name: "Pick a date" })).toBeInTheDocument();
    expect(openButton()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("September 2026")).toBeInTheDocument();
  });

  it("picking a day calls onChange with that date and closes the popup", async () => {
    const onChange = vi.fn();
    render(<AttendanceDatePicker date="2026-09-28" onChange={onChange} />);

    await newUser().click(openButton());
    await newUser().click(screen.getByRole("button", { name: "7" }));

    expect(onChange).toHaveBeenCalledWith("2026-09-07");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("disables future days and ignores a click on one", async () => {
    const onChange = vi.fn();
    render(<AttendanceDatePicker date="2026-09-28" onChange={onChange} />);

    await newUser().click(openButton());

    const future = screen.getByRole("button", { name: "29" }); // Sep 29, after "today"
    expect(future).toBeDisabled();
    await newUser().click(future);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables the next-month arrow once viewing the current month", async () => {
    render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);
    await newUser().click(openButton());

    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous month" })).not.toBeDisabled();
  });

  it("lets Previous month go back, and Next month forward again, without passing the current month", async () => {
    const user = newUser();
    render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);
    await user.click(openButton());

    await user.click(screen.getByRole("button", { name: "Previous month" }));
    expect(screen.getByText("August 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).not.toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByText("September 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
  });

  it("shows the selected date as a filled circle and today as a ring when they differ", async () => {
    render(<AttendanceDatePicker date="2026-09-07" onChange={() => {}} />);
    await newUser().click(screen.getByRole("button", { name: "07-Sep-2026" }));

    const selected = screen.getByRole("button", { name: "7" });
    expect(selected).toHaveAttribute("aria-pressed", "true");
    expect(selected.className).toContain("bg-brand-purple");

    const today = screen.getByRole("button", { name: "28" });
    expect(today).toHaveAttribute("aria-current", "date");
    expect(today).toHaveAttribute("aria-pressed", "false");
    expect(today.className).toContain("ring-brand-purple");
    expect(today.className).not.toContain("bg-brand-purple");
  });

  it("closes on Escape and returns focus to the date button", async () => {
    const user = newUser();
    render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);

    await user.click(openButton());
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton()).toHaveFocus();
  });

  it("closes on an outside click", async () => {
    const user = newUser();
    render(
      <div>
        <button type="button">Somewhere else</button>
        <AttendanceDatePicker date="2026-09-28" onChange={() => {}} />
      </div>,
    );

    await user.click(openButton());
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Somewhere else" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
