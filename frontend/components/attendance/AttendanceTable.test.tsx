import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { openSelect } from "@/components/ui/select.test-utils";
import { describe, expect, it } from "vitest";
import type { HrmsAttendanceReport } from "@/lib/notify/activity";
import { AttendanceTable } from "./AttendanceTable";

function report(): HrmsAttendanceReport {
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
      {
        name: "In Thythavarak",
        yesterdayCheckOut: { scheduled: "17:00", actual: "17:29", status: "Normal" },
        todayCheckIn: { scheduled: "08:00", actual: "08:04", status: "Late Check-In" },
      },
    ],
    details: [],
    note: "",
    scopedToViewer: false,
    viewerLinked: true,
  };
}

describe("AttendanceTable", () => {
  it("is built from the shared compact table parts (ADR-104 r2.9)", () => {
    render(<AttendanceTable report={report()} search="" onSearchChange={() => {}} status={{}} onStatusChange={() => {}} />);

    const nameHeader = screen.getByRole("columnheader", { name: "Name" });
    expect(nameHeader).toHaveAttribute("data-slot", "table-head");
    // Sentence-case muted header, not the old uppercase tinted band.
    expect(nameHeader.className).not.toContain("uppercase");
    expect(nameHeader.closest("tr")!.className).not.toContain("bg-[#f8fafc]");

    const bodyRow = screen.getByText("Svay Kong").closest("tr")!;
    expect(bodyRow).toHaveAttribute("data-slot", "table-row");
    expect(screen.getByText("Svay Kong").closest("td")).toHaveAttribute("data-slot", "table-cell");
  });

  it("has a compact footer on the theme's border and muted tokens", () => {
    render(<AttendanceTable report={report()} search="" onSearchChange={() => {}} status={{}} onStatusChange={() => {}} />);

    const footer = screen.getByText(/Scheduled:/).closest("div")!;
    expect(footer.className).toContain("border-t border-surface-border");
    expect(footer.className).toContain("text-muted-foreground");
    expect(footer.className).toContain("px-4 py-3");
  });

  it("uses the shared search field", () => {
    render(<AttendanceTable report={report()} search="" onSearchChange={() => {}} status={{}} onStatusChange={() => {}} />);

    expect(screen.getByRole("searchbox", { name: "Search name" })).toHaveAttribute("placeholder", "Search name...");
  });

  it("keeps every column, the schedule chips, --:-- for a missing time, and status pills", () => {
    render(<AttendanceTable report={report()} search="" onSearchChange={() => {}} status={{}} onStatusChange={() => {}} />);

    for (const header of ["Name", "Yesterday Check-Out", "Out Status", "Today Check-In", "In Status"]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
    expect(screen.getByText("Svay Kong")).toBeInTheDocument();
    expect(screen.getAllByText("17:00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("08:00").length).toBeGreaterThan(0);
    expect(screen.getByText("--:--")).toBeInTheDocument(); // Svay Kong's 00:00 check-out
    expect(screen.getByText("Missed Check-Out")).toBeInTheDocument();
    // "Normal" also appears in the footer legend, so there are two.
    expect(screen.getAllByText("Normal").length).toBeGreaterThan(0);
    expect(screen.getByText("Late Check-In")).toBeInTheDocument();
    expect(screen.getByText(/Scheduled:/)).toBeInTheDocument();
  });

  it("keeps the card header (department name, member count, search input)", () => {
    render(<AttendanceTable report={report()} search="" onSearchChange={() => {}} status={{}} onStatusChange={() => {}} />);

    expect(screen.getByRole("heading", { name: "COOCON Department" })).toBeInTheDocument();
    expect(screen.getByText("2 members")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search name...")).toBeInTheDocument();
  });
});

/**
 * Filtering by the two status columns.
 *
 * <p>The fixture is deliberately crossed: Svay Kong missed his check-out but
 * was Normal in; In Thythavarak was Normal out but Late in. So a filter that
 * read the wrong column, or applied one column's choice to both, would still
 * return one row and look like it worked — these assert *which* row.
 */
describe("AttendanceTable status filters", () => {
  const noop = () => {};

  it("filters by out status alone", () => {
    render(
      <AttendanceTable report={report()} search="" onSearchChange={noop} status={{ out: "missed" }} onStatusChange={noop} />,
    );

    expect(screen.getByText("Svay Kong")).toBeInTheDocument();
    expect(screen.queryByText("In Thythavarak")).not.toBeInTheDocument();
  });

  it("filters by in status alone", () => {
    render(
      <AttendanceTable report={report()} search="" onSearchChange={noop} status={{ in: "late" }} onStatusChange={noop} />,
    );

    expect(screen.getByText("In Thythavarak")).toBeInTheDocument();
    expect(screen.queryByText("Svay Kong")).not.toBeInTheDocument();
  });

  /** The combination is the point — "missed out AND late in" is its own question. */
  it("applies both columns together", () => {
    render(
      <AttendanceTable
        report={report()}
        search=""
        onSearchChange={noop}
        status={{ out: "missed", in: "late" }}
        onStatusChange={noop}
      />,
    );

    expect(screen.queryByText("Svay Kong")).not.toBeInTheDocument();
    expect(screen.queryByText("In Thythavarak")).not.toBeInTheDocument();
    expect(screen.getByText("No one matches these statuses.")).toBeInTheDocument();
  });

  it("combines a status filter with the name search", () => {
    render(
      <AttendanceTable
        report={report()}
        search="svay"
        onSearchChange={noop}
        status={{ in: "normal" }}
        onStatusChange={noop}
      />,
    );

    expect(screen.getByText("Svay Kong")).toBeInTheDocument();
  });

  /**
   * An empty table caused by a status filter used to read: No one matches "".
   */
  it("names the status filter, not the search box, when the search is empty", () => {
    render(
      <AttendanceTable report={report()} search="" onSearchChange={noop} status={{ out: "other" }} onStatusChange={noop} />,
    );

    expect(screen.getByText("No one matches these statuses.")).toBeInTheDocument();
  });

  it("offers only the statuses present in the report", async () => {
    render(<AttendanceTable report={report()} search="" onSearchChange={noop} status={{}} onStatusChange={noop} />);

    // Normal and Missed appear in the out column; Late and Other do not.
    expect(await openSelect(userEvent.setup(), "Out status")).toEqual(["Out status: all", "Normal", "Missed"]);
  });

  it("shows Clear only once something is filtered", () => {
    const { rerender } = render(
      <AttendanceTable report={report()} search="" onSearchChange={noop} status={{}} onStatusChange={noop} />,
    );
    expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();

    rerender(
      <AttendanceTable report={report()} search="" onSearchChange={noop} status={{ in: "late" }} onStatusChange={noop} />,
    );
    expect(screen.getByRole("button", { name: "Clear" })).toBeInTheDocument();
  });
});
