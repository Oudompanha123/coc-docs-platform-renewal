import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttendanceRangeToggle } from "./AttendanceRangeToggle";

describe("AttendanceRangeToggle", () => {
  it("marks Day as pressed by default and shows no range label", () => {
    render(<AttendanceRangeToggle value="day" onChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Day" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/^This /)).not.toBeInTheDocument();
  });

  it.each([
    ["week", "This Week"],
    ["month", "This Month"],
    ["year", "This Year"],
  ] as const)("shows '%s' as pressed and labels it '%s'", (value, label) => {
    render(<AttendanceRangeToggle value={value} onChange={() => {}} />);

    expect(screen.getByRole("button", { name: new RegExp(`^${value}$`, "i") })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("calls onChange with the clicked range, without changing anything else", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<AttendanceRangeToggle value="day" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Month" }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("month");
  });
});
