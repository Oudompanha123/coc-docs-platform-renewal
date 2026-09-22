import type { MeResponse } from "@/lib/auth/api";
import type { NotificationItem } from "@/lib/notify/activity";
import { xlsxBlob, type CellValue, type SheetData } from "@/lib/export/xlsx";
import { ROLE_LABELS } from "@/lib/mock/users-roles";

/**
 * "Export your data" (Settings → Danger zone) — a personal-data download,
 * not an admin report. Built entirely from endpoints the signed-in caller
 * already has standing to read for themselves: `GET /api/v1/auth/me`
 * (session) and `GET /api/v1/notifications` (own activity — any signed-in
 * role, unlike the Overview "Recent Activity" panel's super_admin-only
 * `/api/v1/admin/audit/recent`; see `useActivityFeed`'s own note on that
 * split). Opens no new server surface and discloses nothing the caller could
 * not already see across the Profile card and the topbar's own Activity
 * panel — the same "client-side export of what the screen already shows"
 * reasoning `lib/admin/export-users.ts` gives for the Users & Roles sheet,
 * whose `.xlsx` writer (`lib/export/xlsx.ts`) this reuses unchanged.
 *
 * <p><b>One sheet, two stacked sections, not two files.</b> `xlsx.ts` only
 * ever builds a single-sheet workbook (its `workbook.xml`/relationships are
 * hardcoded to one `sheet1.xml`), and extending a hand-rolled OOXML writer
 * to support multiple sheets was not worth the added surface for this one
 * export. Profile rows come first as plain Field/Value pairs — the sheet's
 * real, styled header row — followed by a blank spacer, then "Recent
 * activity" and "Occurred at"/"Summary" as `sectionRows` (a shaded, bold
 * banner and sub-header `xlsx.ts` now supports precisely for a second block
 * stacked into the same two columns) rather than plain, unstyled data rows,
 * so the activity list reads as its own table instead of bleeding into the
 * profile fields above it.
 */

/** A "Field"/"Value" pair — the whole sheet is this shape, both sections through it. */
function row(field: string, value: CellValue): CellValue[] {
  return [field, value];
}

const HEADERS = ["Field", "Value"];
const COLUMN_WIDTHS = [22, 56];

/** 0-based indices into `rows` (below) of the "Recent activity" banner and its "Occurred at"/"Summary" sub-header. */
const SECTION_ROWS = [8, 9];

/**
 * A date the browser cannot parse becomes an empty cell rather than
 * `Invalid Date`, same reasoning `export-users.ts`'s `parseDate` gives.
 */
function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function roleLabel(role: string | null): string {
  if (!role) return "";
  return role === "guest" ? "User" : (ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role);
}

/** The workbook, ready to write — see this module's own doc comment for the layout. */
export function myDataSheet(user: MeResponse, activity: NotificationItem[], now: Date = new Date()): SheetData {
  const rows: CellValue[][] = [
    row("Email", user.email),
    row("Display name", user.displayName),
    row("Role", roleLabel(user.role)),
    row("Joined", parseDate(user.createdAt)),
    row("Last sign-in", parseDate(user.lastSignInAt) ?? "Never"),
    row("Has password", user.hasPassword ? "Yes" : "No"),
    row("Exported", now),
    row("", ""),
    row("Recent activity", ""),
    row("Occurred at", "Summary"),
    ...activity.map((item): CellValue[] => [parseDate(item.occurredAt), item.summary]),
  ];

  return {
    sheetName: "My data",
    headers: HEADERS,
    columnWidths: COLUMN_WIDTHS,
    rows,
    sectionRows: SECTION_ROWS,
  };
}

/**
 * Dated `YYYY-MM-DD`, same reasoning as `lib/admin/export-users.ts`'s
 * `usersFileName`: a folder of these sorts chronologically by name, and the
 * local date is what matches the day the person pressing the button thinks
 * it is.
 */
export function myDataFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `my-data-${day}.xlsx`;
}

/**
 * Hands the export to the browser as a download.
 *
 * <p>The object URL is revoked on the next turn of the event loop rather
 * than immediately — same Safari timing note as `downloadUsersXlsx`: it
 * reads the URL asynchronously after the click, and revoking it in the same
 * tick cancels the download with no error anywhere.
 */
export function downloadMyData(user: MeResponse, activity: NotificationItem[], now: Date = new Date()): void {
  const blob = xlsxBlob(myDataSheet(user, activity, now));
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = myDataFileName(now);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
