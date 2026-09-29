import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceDateNav } from "./AttendanceDateNav";

const TODAY = "2026-09-28"; // matches the fixed system time below

// The middle button's label changes ("Today" vs "Wed, 22 Sep"), so it must
// be found by something stable — its title, not its changing accessible name.
function todayButton() {
  return screen.getByTitle("Go to today");
}

describe("AttendanceDateNav", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 8, 28)); // local, not UTC — Sep 28 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the Today button active when the selected date is today", () => {
    render(<AttendanceDateNav date={TODAY} onChange={() => {}} />);

    expect(todayButton()).toHaveTextContent("Today");
    expect(todayButton()).toHaveAttribute("aria-pressed", "true");
    expect(todayButton().className).toContain("bg-brand-purple/10");
    expect(todayButton().className).toContain("text-brand-purple");
  });

  it("shows the selected date's short label and neutral style, same as Previous/Next, when it is not today", () => {
    render(<AttendanceDateNav date="2026-09-22" onChange={() => {}} />);

    const today = todayButton();
    expect(today).toHaveTextContent("Tue, 22 Sep");
    expect(today).toHaveAttribute("aria-pressed", "false");
    expect(today.className).not.toContain("bg-brand-purple/10");
    expect(today.className).not.toContain("text-brand-purple");
    // The exact neutral classes Previous/Next already use.
    expect(today.className).toContain("text-muted");
    expect(today.className).toContain("hover:bg-page");
    expect(today.className).toContain("hover:text-dash-ink");
  });

  it("is compared by local calendar date only, ignoring time of day", () => {
    // The system clock above is set to a specific instant on Sep 28; the
    // component must still read "today" as the calendar day, not an exact
    // timestamp match — there is no time-of-day in an ISO date string to
    // begin with, so this also guards against a future regression that
    // compares full Date objects instead.
    render(<AttendanceDateNav date="2026-09-28" onChange={() => {}} />);
    expect(todayButton()).toHaveAttribute("aria-pressed", "true");
  });

  it("does not shift the toolbar's width between the Today label and a date label", () => {
    const { rerender } = render(<AttendanceDateNav date={TODAY} onChange={() => {}} />);
    expect(todayButton().className).toContain("min-w-[108px]");

    rerender(<AttendanceDateNav date="2026-09-22" onChange={() => {}} />);
    expect(todayButton().className).toContain("min-w-[108px]");
  });

  it("clicking Previous from today makes Today inactive, and clicking Today makes it active again", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let date = TODAY;
    const onChange = vi.fn((next: string) => {
      date = next;
    });

    const { rerender } = render(<AttendanceDateNav date={date} onChange={onChange} />);
    expect(todayButton()).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Previous day" }));
    expect(onChange).toHaveBeenCalledWith("2026-09-27");
    rerender(<AttendanceDateNav date={date} onChange={onChange} />);
    expect(todayButton()).toHaveAttribute("aria-pressed", "false");
    expect(todayButton()).toHaveTextContent("Sun, 27 Sep");

    await user.click(todayButton());
    expect(onChange).toHaveBeenLastCalledWith(TODAY);
    rerender(<AttendanceDateNav date={date} onChange={onChange} />);
    expect(todayButton()).toHaveAttribute("aria-pressed", "true");
    expect(todayButton()).toHaveTextContent("Today");
  });
});
