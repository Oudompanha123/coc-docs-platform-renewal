/**
 * Test helper for `DatePicker` (ADR-104 r2.11).
 *
 * The `<input type="date">` it replaced could be driven with
 * `fireEvent.change(..., { target: { value } })`. The picker is a button that
 * opens a calendar in a popover, so a test does what a person does: open it,
 * page to the month, click the day. Only imported by tests.
 */
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

/** Opens the picker named `name` and chooses `iso` (`YYYY-MM-DD`). */
export async function pickDate(user: UserEvent, name: string | RegExp, iso: string): Promise<void> {
  const [y = 0, m = 1, d = 1] = iso.split("-").map(Number);
  const target = new Date(y, m - 1, 1);
  await user.click(screen.getByRole("button", { name }));

  for (let i = 0; i < 120; i++) {
    const grid = screen.getByRole("grid");
    const [monthName = "", yearText = ""] = (grid.getAttribute("aria-label") ?? "").split(" ");
    const shown = new Date(Number(yearText), MONTHS.indexOf(monthName), 1);
    if (shown.getTime() === target.getTime()) break;
    await user.click(
      screen.getByRole("button", { name: shown < target ? /next month/i : /previous month/i }),
    );
  }

  await user.click(screen.getByRole("button", { name: new RegExp(`${MONTHS[m - 1]} ${ordinal(d)}, ${y}`) }));
}
