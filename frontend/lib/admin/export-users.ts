import { ROLE_LABELS, type AccountStatus } from "@/lib/mock/users-roles";
import { xlsxBlob, type SheetData } from "@/lib/export/xlsx";
import { type AccountRole, type AdminAccount } from "./accounts";

/**
 * The Users &amp; Roles table as a spreadsheet.
 *
 * <p><b>Built from what the page already has.</b> This runs entirely in the
 * browser over the records the account list endpoint already returned, so it
 * opens no new way to read account data: anyone who can press the button is
 * already looking at every value in the file. That is what makes a client-side
 * export defensible here rather than a lazy shortcut — it discloses nothing
 * the screen does not.
 *
 * <p><b>What it therefore does not do is leave a trace.</b> A server-side
 * export could write to {@code audit_log} and record that a super admin took a
 * copy of the account list, which is the kind of thing NFR-OPS-AUDIT exists
 * for. This does not, and cannot. If that record is wanted, the export has to
 * move behind an endpoint — a deliberate change, not an oversight.
 *
 * <p>The file carries names and email addresses (NFR-SEC-PII) and, once saved,
 * lives outside every control this application has. Only `super_admin` reaches
 * the page at all, enforced by the backend's filter chain.
 */

/**
 * Whether an account reads as active, pending or deactivated.
 *
 * <p>Lives here so the table and the export cannot disagree — the page's
 * `toRow` calls this too. An export whose Status column drifts from the screen
 * is worse than no export, because nobody re-checks a spreadsheet against the
 * page it came from.
 *
 * <p>Pending is a login state rather than the backend's own `active` flag: an
 * invite creates the account already active, so a role can sit waiting for
 * someone who has never signed in. Showing "Active" for them would read as if
 * they had.
 */
export function accountStatus(account: AdminAccount): AccountStatus {
  if (!account.active) return "deactivated";
  return account.mustChangePassword ? "pending" : "active";
}

/**
 * A role's display name.
 *
 * <p>`ROLE_LABELS` covers every role the table can show. The API's
 * `AccountRole` also allows `guest`, which no real account is ever created at
 * — every sign-in auto-provisions at `user` — so the page folds it into
 * "User". Here it is named instead: if one ever does appear, a spreadsheet
 * that says "Guest" is more use than one that quietly calls it something else.
 */
function roleLabel(role: AccountRole): string {
  return role === "guest" ? "Guest" : (ROLE_LABELS[role] ?? role);
}

const STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  pending: "Pending",
  deactivated: "Deactivated",
};

/**
 * Column headers, in the order the sheet writes them.
 *
 * <p>Wider than the table on screen. A spreadsheet is opened to answer
 * questions the page cannot — who was invited and never signed in, who holds
 * more than one role — and the columns that answer those cost nothing here
 * while they would clutter the page.
 */
const HEADERS = [
  "Name",
  "Email",
  "Role",
  "All roles held",
  "Status",
  "Last sign-in",
  "Created",
  "On temporary password",
];

const COLUMN_WIDTHS = [26, 32, 14, 24, 14, 20, 20, 22];

/**
 * Status, Last sign-in, Created, and On temporary password — the four
 * short, fixed-vocabulary columns, centred rather than left-aligned so a
 * "Yes"/"Never"/a date doesn't read as ragged against the bordered grid the
 * way it would beside a long, naturally left-aligned name or email.
 */
const CENTERED_COLUMNS = [4, 5, 6, 7];

/**
 * Parses a backend timestamp, or gives nothing.
 *
 * <p>A date the browser cannot parse becomes an empty cell rather than
 * `Invalid Date`. An empty cell is visibly missing; the string "Invalid Date"
 * in a date column looks like data.
 */
function parseDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** The sheet, ready to write. */
export function usersSheet(accounts: AdminAccount[]): SheetData {
  return {
    sheetName: "Users & Roles",
    headers: HEADERS,
    columnWidths: COLUMN_WIDTHS,
    centeredColumns: CENTERED_COLUMNS,
    rows: accounts.map((account) => [
      account.displayName,
      account.email,
      roleLabel(account.role),
      // Every role held, not just the highest. This is the column the page has
      // no room for and the reason someone exports at all.
      account.roles.map(roleLabel).join(", "),
      STATUS_LABELS[accountStatus(account)],
      // Real dates, not the page's "Today, 2:03 PM" — that is written for
      // someone reading one row, and it cannot be sorted or filtered.
      parseDate(account.lastSignInAt) ?? "Never",
      parseDate(account.createdAt),
      account.mustChangePassword ? "Yes" : "No",
    ]),
  };
}

/**
 * The download's file name.
 *
 * <p>Dated, and dated `YYYY-MM-DD` so a folder of them sorts chronologically
 * by name. Local date rather than UTC: it should match the day the person
 * pressing the button thinks it is.
 */
export function usersFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `users-and-roles-${day}.xlsx`;
}

/**
 * Builds the workbook and hands it to the browser as a download.
 *
 * <p>The object URL is revoked on the next turn of the event loop rather than
 * immediately: Safari reads the URL asynchronously after the click, and
 * revoking it in the same tick cancels the download with no error anywhere.
 *
 * <p>Returns the row count so a caller can say what it exported; a caller that
 * does not care may ignore it.
 */
export function downloadUsersXlsx(accounts: AdminAccount[], now: Date = new Date()): number {
  const blob = xlsxBlob(usersSheet(accounts));
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = usersFileName(now);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 0);
  return accounts.length;
}
