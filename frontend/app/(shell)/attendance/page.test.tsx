import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ShellProvider } from "@/lib/layout/ShellContext";
import type { HrmsAttendanceReport } from "@/lib/notify/activity";

const { fetchAttendanceReports } = vi.hoisted(() => ({ fetchAttendanceReports: vi.fn() }));
vi.mock("@/lib/admin/attendance", async () => {
  const actual = await vi.importActual<typeof import("@/lib/admin/attendance")>("@/lib/admin/attendance");
  return { ...actual, fetchAttendanceReports };
});

import AttendancePage from "./page";

function renderPage() {
  return render(
    <ShellProvider>
      <AttendancePage />
    </ShellProvider>,
  );
}

function report(overrides: Partial<HrmsAttendanceReport> = {}): HrmsAttendanceReport {
  return {
    subject: "Attendance on 07-Sep-2026",
    reportDate: "2026-09-07",
    department: "COOCON Department",
    rows: [
      {
        name: "Svay Kong",
        yesterdayCheckOut: { scheduled: "17:00", actual: "00:00", status: "Missed Check-Out" },
        todayCheckIn: { scheduled: "08:00", actual: "07:50", status: "Normal" },
      },
    ],
    details: [],
    note: "",
    scopedToViewer: false,
    viewerLinked: true,
    ...overrides,
  };
}

describe("AttendancePage", () => {
  beforeEach(() => {
    fetchAttendanceReports.mockReset();
  });

  it("shows a loading skeleton while the fetch is in flight", async () => {
    fetchAttendanceReports.mockReturnValue(new Promise(() => {})); // never resolves

    renderPage();

    expect(screen.getByRole("status", { name: /loading attendance/i })).toBeInTheDocument();
  });

  it("renders stat cards and the table once data arrives", async () => {
    fetchAttendanceReports.mockResolvedValue([report()]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "COOCON Department" })).toBeInTheDocument();
    expect(screen.getByText("Svay Kong")).toBeInTheDocument();
    expect(screen.getByText("Total Scheduled")).toBeInTheDocument();
    expect(screen.getByText("Members scheduled")).toBeInTheDocument();
    // The one row is a Missed Check-Out / Normal check-in — Total Scheduled
    // should read 1, not a stale or hard-coded number.
    expect(screen.getAllByText("1")).not.toHaveLength(0);
  });

  it("shows the empty state when no department reported for the date", async () => {
    fetchAttendanceReports.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("No attendance records for this date.")).toBeInTheDocument();
  });

  it("shows an error with a working Retry button on a failed fetch", async () => {
    fetchAttendanceReports.mockRejectedValueOnce(new Error("Couldn't reach the server."));
    fetchAttendanceReports.mockResolvedValueOnce([report()]);

    renderPage();

    expect(await screen.findByText("Couldn't reach the server.")).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByRole("heading", { name: "COOCON Department" })).toBeInTheDocument());
    expect(fetchAttendanceReports).toHaveBeenCalledTimes(2);
  });

  it("filters the table by name without calling fetch again", async () => {
    fetchAttendanceReports.mockResolvedValue([
      report({
        rows: [
          {
            name: "Svay Kong",
            yesterdayCheckOut: { scheduled: "17:00", actual: "17:00", status: "Normal" },
            todayCheckIn: { scheduled: "08:00", actual: "08:00", status: "Normal" },
          },
          {
            name: "Yean Bona",
            yesterdayCheckOut: { scheduled: "17:00", actual: "17:00", status: "Normal" },
            todayCheckIn: { scheduled: "08:00", actual: "08:00", status: "Normal" },
          },
        ],
      }),
    ]);

    renderPage();
    await screen.findByText("Svay Kong");
    expect(screen.getByText("Yean Bona")).toBeInTheDocument();

    const calls = fetchAttendanceReports.mock.calls.length;
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Search name..."), "Yean");

    await waitFor(() => expect(screen.queryByText("Svay Kong")).not.toBeInTheDocument());
    expect(screen.getByText("Yean Bona")).toBeInTheDocument();
    expect(fetchAttendanceReports).toHaveBeenCalledTimes(calls);
  });

  it("keeps the department dropdown visible with its last options when a later date has no data", async () => {
    fetchAttendanceReports.mockResolvedValueOnce([report(), report({ department: "Engineering" })]);
    fetchAttendanceReports.mockResolvedValueOnce([]);

    renderPage();
    await screen.findByRole("heading", { name: "COOCON Department" });

    const select = screen.getByRole("combobox", { name: "Department" }) as HTMLSelectElement;
    expect(select).not.toBeDisabled();
    expect(select.value).toBe("COOCON Department");

    await userEvent.setup().click(screen.getByRole("button", { name: "Next day" }));

    await waitFor(() => expect(screen.getByText("No attendance records for this date.")).toBeInTheDocument());
    expect(select).not.toBeDisabled();
    expect(select.value).toBe("COOCON Department");
    expect(screen.getByRole("option", { name: "COOCON Department" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Engineering" })).toBeInTheDocument();
  });

  it("shows the dropdown disabled with 'No departments' on a fresh load with no data yet", async () => {
    fetchAttendanceReports.mockResolvedValue([]);

    renderPage();

    await screen.findByText("No attendance records for this date.");
    const select = screen.getByRole("combobox", { name: "Department" }) as HTMLSelectElement;
    expect(select).toBeDisabled();
    expect(screen.getByRole("option", { name: "No departments" })).toBeInTheDocument();
  });

  it("keeps the selected department when a new date has data but not for it, and shows the specific empty state", async () => {
    fetchAttendanceReports.mockResolvedValueOnce([report(), report({ department: "Engineering" })]);
    // The next date only has COOCON's report — Engineering is missing.
    fetchAttendanceReports.mockResolvedValueOnce([report()]);

    renderPage();
    await screen.findByRole("heading", { name: "COOCON Department" });

    const select = screen.getByRole("combobox", { name: "Department" });
    await userEvent.setup().selectOptions(select, "Engineering");

    // Engineering should stay selected, and the page must say so
    // specifically rather than falling back to some other department's
    // data or the generic "no records at all" message.
    await userEvent.setup().click(screen.getByRole("button", { name: "Next day" }));

    expect(await screen.findByText("No records for Engineering on this date.")).toBeInTheDocument();
    expect((select as HTMLSelectElement).value).toBe("Engineering");
  });
});
