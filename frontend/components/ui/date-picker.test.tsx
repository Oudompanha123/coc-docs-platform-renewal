import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DatePicker, parseIsoDate, toIsoDate } from "./date-picker";
import { pickDate } from "./date-picker.test-utils";

describe("DatePicker", () => {
  it("shows the value as a readable date, and a placeholder when empty", () => {
    const { rerender } = render(<DatePicker aria-label="From" value="2026-09-01" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "From" })).toHaveTextContent("Sep 1, 2026");
    rerender(<DatePicker aria-label="From" value="" onChange={() => {}} placeholder="Pick a date" />);
    expect(screen.getByRole("button", { name: "From" })).toHaveTextContent("Pick a date");
  });

  it("returns the chosen day as YYYY-MM-DD and closes", async () => {
    const onChange = vi.fn();
    render(<DatePicker aria-label="From" value="2026-09-01" onChange={onChange} />);
    await pickDate(userEvent.setup(), "From", "2026-08-15");
    expect(onChange).toHaveBeenCalledWith("2026-08-15");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  it("does not offer days outside min/max", async () => {
    render(<DatePicker aria-label="To" value="2026-09-10" min="2026-09-05" max="2026-09-20" onChange={() => {}} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "To" }));
    expect(screen.getByRole("button", { name: /September 4th, 2026/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /September 21st, 2026/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /September 12th, 2026/ })).toBeEnabled();
  });

  it("reads and writes dates in local time, never shifting a day", () => {
    expect(toIsoDate(parseIsoDate("2026-01-01")!)).toBe("2026-01-01");
    expect(parseIsoDate("not-a-date")).toBeUndefined();
  });
});
