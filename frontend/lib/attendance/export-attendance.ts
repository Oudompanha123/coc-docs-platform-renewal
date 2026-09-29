import { xlsxBlob, type SheetData } from "@/lib/export/xlsx";
import type { HrmsAttendanceRow } from "@/lib/notify/activity";
import { actualTimeOrNull } from "./stats";

/**
 * One department's attendance rows as a spreadsheet — the Attendance page's
 * own Export button, built the same way `export-users.ts` builds the Users
 * & Roles one: entirely client-side, over rows the page already has, so it
 * discloses nothing the screen does not and leaves nothing to guard.
 */

const HEADERS = [
  "Name",
  "Yesterday Check-Out (Scheduled)",
  "Yesterday Check-Out (Actual)",
  "Yesterday Check-Out Status",
  "Today Check-In (Scheduled)",
  "Today Check-In (Actual)",
  "Today Check-In Status",
];

const COLUMN_WIDTHS = [26, 24, 22, 22, 24, 22, 22];

/** The six check columns — short, fixed-vocabulary text, centred so it doesn't read as ragged against the bordered grid. */
const CENTERED_COLUMNS = [1, 2, 3, 4, 5, 6];

/** The sheet, ready to write. */
export function attendanceSheet(department: string, rows: HrmsAttendanceRow[]): SheetData {
  return {
    sheetName: department || "Attendance",
    headers: HEADERS,
    columnWidths: COLUMN_WIDTHS,
    centeredColumns: CENTERED_COLUMNS,
    rows: rows.map((row) => [
      row.name,
      row.yesterdayCheckOut.scheduled || "--:--",
      // Same `00:00`/empty-means-missing rule the table itself renders with
      // (see `actualTimeOrNull`) — the file should never disagree with the
      // screen about who actually checked in or out.
      actualTimeOrNull(row.yesterdayCheckOut) ?? "--:--",
      row.yesterdayCheckOut.status,
      row.todayCheckIn.scheduled || "--:--",
      actualTimeOrNull(row.todayCheckIn) ?? "--:--",
      row.todayCheckIn.status,
    ]),
  };
}

/** A department name as a filename fragment — never empty, since a blank segment would leave a bare `attendance--2026-09-07.xlsx`. */
function slug(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.length > 0 ? cleaned : "attendance";
}

/**
 * The download's file name — dated with the date the page has selected
 * (`yyyy-MM-dd`), not `report.reportDate`, which can be null when the
 * subject failed to parse.
 */
export function attendanceFileName(department: string, date: string): string {
  return `attendance-${slug(department)}-${date}.xlsx`;
}

/**
 * Builds the workbook and hands it to the browser as a download.
 *
 * <p>The object URL is revoked on the next turn of the event loop rather than
 * immediately — see `export-users.ts`'s `downloadUsersXlsx` for why.
 *
 * <p>Returns the row count so a caller can say what it exported.
 */
export function downloadAttendanceXlsx(department: string, date: string, rows: HrmsAttendanceRow[]): number {
  const blob = xlsxBlob(attendanceSheet(department, rows));
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = attendanceFileName(department, date);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
  return rows.length;
}
