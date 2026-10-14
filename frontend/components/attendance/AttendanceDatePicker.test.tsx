import { fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("dialog", { name: "Pick dates" })).toBeInTheDocument();
    expect(openButton()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("September 2026")).toBeInTheDocument();
  });

  it("picking a day calls onChange with that date and keeps the popup open for more picks", async () => {
    const onChange = vi.fn();
    render(<AttendanceDatePicker date="2026-09-28" onChange={onChange} />);

    await newUser().click(openButton());
    await newUser().click(screen.getByRole("button", { name: "7" }));

    expect(onChange).toHaveBeenCalledWith("2026-09-07");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("Done closes the popup and returns focus to the date button", async () => {
    const user = newUser();
    render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);

    await user.click(openButton());
    await user.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton()).toHaveFocus();
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
    expect(selected.className).toContain("bg-primary");

    const today = screen.getByRole("button", { name: "28" });
    expect(today).toHaveAttribute("aria-current", "date");
    expect(today).toHaveAttribute("aria-pressed", "false");
    expect(today.className).toContain("ring-ring");
    expect(today.className).not.toContain("bg-primary");
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

  describe("multi-select", () => {
    it("highlights more than one day at once, and reports how many are selected", async () => {
      const user = newUser();
      render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);

      await user.click(openButton());
      expect(screen.getByText("1 date selected")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "7" }));
      expect(screen.getByText("2 dates selected")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "7" })).toHaveAttribute("aria-pressed", "true");
      // The date the popup opened with (28) stays highlighted too.
      expect(screen.getByRole("button", { name: "28" })).toHaveAttribute("aria-pressed", "true");
    });

    it("clicking an already-selected day toggles it back off, without calling onChange again", async () => {
      const user = newUser();
      const onChange = vi.fn();
      render(<AttendanceDatePicker date="2026-09-28" onChange={onChange} />);

      await user.click(openButton());
      await user.click(screen.getByRole("button", { name: "7" }));
      onChange.mockClear();

      await user.click(screen.getByRole("button", { name: "7" }));

      expect(screen.getByRole("button", { name: "7" })).toHaveAttribute("aria-pressed", "false");
      expect(screen.getByText("1 date selected")).toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });

    it("shows no Clear button for a single selected date, and Clear resets a multi-select back to just the active date", async () => {
      const user = newUser();
      render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);

      await user.click(openButton());
      expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "7" }));
      expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Clear" }));
      expect(screen.getByText("1 date selected")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "28" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "7" })).toHaveAttribute("aria-pressed", "false");
    });

    it("persists the multi-select across closing and reopening the popup", async () => {
      const user = newUser();
      render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);

      await user.click(openButton());
      await user.click(screen.getByRole("button", { name: "7" }));
      await user.click(screen.getByRole("button", { name: "Done" }));

      await user.click(openButton());
      expect(screen.getByText("2 dates selected")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "7" })).toHaveAttribute("aria-pressed", "true");
    });

    it("only Clear resets the selection — reopening alone does not", async () => {
      const user = newUser();
      render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);

      await user.click(openButton());
      await user.click(screen.getByRole("button", { name: "7" }));
      await user.click(screen.getByRole("button", { name: "Clear" }));
      await user.click(screen.getByRole("button", { name: "Done" }));

      await user.click(openButton());
      expect(screen.getByText("1 date selected")).toBeInTheDocument();
    });

    it("keeps the active date represented in the selection when it changes from outside the popup", async () => {
      const user = newUser();
      const onChange = vi.fn();
      const { rerender } = render(<AttendanceDatePicker date="2026-09-28" onChange={onChange} />);

      // Simulate the Prev/Next arrows moving `date` while the popup is closed.
      rerender(<AttendanceDatePicker date="2026-09-21" onChange={onChange} />);

      await user.click(screen.getByRole("button", { name: "21-Sep-2026" }));
      // Both the newly-active day and the one the popup first opened with
      // stay represented — the active date is added, never substituted in.
      expect(screen.getByRole("button", { name: "21" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "28" })).toHaveAttribute("aria-pressed", "true");
    });
  });

  describe("week row highlight", () => {
    // Sep 9 2026 is a Wednesday; its Monday-first week runs Sep 7 to Sep 13.
    const WEEK_DAYS = ["7", "8", "9", "10", "11", "12", "13"];

    // The row band sits on the week wrapper, one level above each day's own
    // per-cell div (which the multi-select span band lives on instead).
    function rowClass(dayLabel: string) {
      return screen.getByRole("button", { name: dayLabel }).parentElement?.parentElement?.className ?? "";
    }

    it("adds no row highlight outside Week mode", async () => {
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} range="day" />);
      await newUser().click(screen.getByRole("button", { name: "09-Sep-2026" }));

      for (const day of WEEK_DAYS) {
        expect(rowClass(day)).not.toContain("bg-secondary");
      }
    });

    it("highlights the full Monday-to-Sunday row containing the active date in Week mode", async () => {
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} range="week" />);
      await newUser().click(screen.getByRole("button", { name: "09-Sep-2026" }));

      for (const day of WEEK_DAYS) {
        expect(rowClass(day)).toContain("bg-secondary");
      }
      // The adjacent weeks stay unhighlighted.
      expect(rowClass("6")).not.toContain("bg-secondary");
      expect(rowClass("14")).not.toContain("bg-secondary");
    });

    it("moves the highlighted row to whichever day is currently active", async () => {
      const user = newUser();
      let date = "2026-09-09";
      const onChange = vi.fn((next: string) => {
        date = next;
      });
      const { rerender } = render(<AttendanceDatePicker date={date} onChange={onChange} range="week" />);

      await user.click(screen.getByRole("button", { name: "09-Sep-2026" }));
      await user.click(screen.getByRole("button", { name: "21" })); // Monday of a later week
      rerender(<AttendanceDatePicker date={date} onChange={onChange} range="week" />);

      expect(rowClass("21")).toContain("bg-secondary");
      expect(rowClass("9")).not.toContain("bg-secondary");
    });

    it("still shows the active day's own solid circle on top of the row tint", async () => {
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} range="week" />);
      await newUser().click(screen.getByRole("button", { name: "09-Sep-2026" }));

      const day9 = screen.getByRole("button", { name: "9" });
      expect(day9.className).toContain("bg-primary");
      expect(day9.className).not.toContain("bg-secondary");
      expect(rowClass("9")).toContain("bg-secondary");
    });
  });

  describe("multi-select span highlight (the \"snake\")", () => {
    function cellClass(dayLabel: string) {
      return screen.getByRole("button", { name: dayLabel }).parentElement?.className ?? "";
    }

    it("adds no span for a single selection", async () => {
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} />);
      await newUser().click(screen.getByRole("button", { name: "09-Sep-2026" }));

      expect(cellClass("9")).not.toContain("bg-secondary");
    });

    it("bands exactly the days between the earliest and latest pick — not the whole row", async () => {
      const user = newUser();
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} />);

      await user.click(screen.getByRole("button", { name: "09-Sep-2026" }));
      await user.click(screen.getByRole("button", { name: "26" })); // a later, non-adjacent week

      // Every day from 9 to 26 inclusive bands, including the whole
      // no-pick-of-its-own middle row (14-20).
      for (const day of ["9", "13", "14", "20", "21", "26"]) {
        expect(cellClass(day)).toContain("bg-secondary");
      }
      // Days before the earliest pick or after the latest one, even within
      // the same partial row as a pick, don't band.
      for (const day of ["7", "8", "27", "28"]) {
        expect(cellClass(day)).not.toContain("bg-secondary");
      }
    });

    it("rounds off only the two true ends of the span, leaving every day in between square", async () => {
      const user = newUser();
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} />);

      await user.click(screen.getByRole("button", { name: "09-Sep-2026" }));
      await user.click(screen.getByRole("button", { name: "26" }));

      expect(cellClass("9")).toContain("rounded-l-full");
      expect(cellClass("9")).not.toContain("rounded-r-full");
      expect(cellClass("26")).toContain("rounded-r-full");
      expect(cellClass("26")).not.toContain("rounded-l-full");
      // A day in between, including one at a row's own edge where the span
      // merely wraps to the next line, stays square on both sides.
      for (const day of ["13", "14", "20", "21"]) {
        expect(cellClass(day)).not.toContain("rounded-l-full");
        expect(cellClass(day)).not.toContain("rounded-r-full");
      }
    });

    it("is independent of the Day/Week/Month/Year toggle", async () => {
      const user = newUser();
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} range="day" />);

      await user.click(screen.getByRole("button", { name: "09-Sep-2026" }));
      await user.click(screen.getByRole("button", { name: "26" }));

      expect(cellClass("14")).toContain("bg-secondary");
    });

    it("removes the span once Clear brings the selection back down to one date", async () => {
      const user = newUser();
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} />);

      await user.click(screen.getByRole("button", { name: "09-Sep-2026" }));
      await user.click(screen.getByRole("button", { name: "26" }));
      expect(cellClass("14")).toContain("bg-secondary");

      await user.click(screen.getByRole("button", { name: "Clear" }));

      expect(cellClass("14")).not.toContain("bg-secondary");
    });
  });

  describe("mouse drag select", () => {
    it("sweeps every day the pointer passes over into the selection", async () => {
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} />);
      await newUser().click(screen.getByRole("button", { name: "09-Sep-2026" }));

      fireEvent.mouseDown(screen.getByRole("button", { name: "7" }));
      fireEvent.mouseEnter(screen.getByRole("button", { name: "8" }));
      fireEvent.mouseEnter(screen.getByRole("button", { name: "9" }));
      fireEvent.mouseUp(document);

      for (const day of ["7", "8"]) {
        expect(screen.getByRole("button", { name: day })).toHaveAttribute("aria-pressed", "true");
      }
      expect(screen.getByText("3 dates selected")).toBeInTheDocument();
    });

    it("fires onChange exactly once, for the day the drag ended on — not once per day swept over", async () => {
      const onChange = vi.fn();
      render(<AttendanceDatePicker date="2026-09-09" onChange={onChange} />);
      await newUser().click(screen.getByRole("button", { name: "09-Sep-2026" }));
      onChange.mockClear();

      fireEvent.mouseDown(screen.getByRole("button", { name: "7" }));
      fireEvent.mouseEnter(screen.getByRole("button", { name: "8" }));
      fireEvent.mouseEnter(screen.getByRole("button", { name: "10" }));
      fireEvent.mouseUp(document);

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("2026-09-10");
    });

    it("does not fire onChange from the drag path for a plain click with no movement", async () => {
      const onChange = vi.fn();
      render(<AttendanceDatePicker date="2026-09-09" onChange={onChange} />);
      await newUser().click(screen.getByRole("button", { name: "09-Sep-2026" }));
      onChange.mockClear();

      // A real click still raises mousedown/mouseup/click on the same
      // element, exercising both the drag-end listener and toggleDay.
      await newUser().click(screen.getByRole("button", { name: "7" }));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith("2026-09-07");
    });

    it("still lets an already-selected day toggle back off on a plain click after a drag", async () => {
      render(<AttendanceDatePicker date="2026-09-09" onChange={() => {}} />);
      await newUser().click(screen.getByRole("button", { name: "09-Sep-2026" }));

      fireEvent.mouseDown(screen.getByRole("button", { name: "7" }));
      fireEvent.mouseEnter(screen.getByRole("button", { name: "8" }));
      fireEvent.mouseUp(document);
      expect(screen.getByRole("button", { name: "8" })).toHaveAttribute("aria-pressed", "true");

      await newUser().click(screen.getByRole("button", { name: "8" }));

      expect(screen.getByRole("button", { name: "8" })).toHaveAttribute("aria-pressed", "false");
    });

    it("ignores a drag that starts or passes over a disabled future day", async () => {
      render(<AttendanceDatePicker date="2026-09-28" onChange={() => {}} />);
      await newUser().click(screen.getByRole("button", { name: "28-Sep-2026" }));

      const future = screen.getByRole("button", { name: "29" });
      expect(future).toBeDisabled();
      fireEvent.mouseDown(future);
      fireEvent.mouseUp(document);

      expect(screen.getByText("1 date selected")).toBeInTheDocument();
    });
  });
});
