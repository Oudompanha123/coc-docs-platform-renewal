/**
 * Test helpers for `SimpleSelect` / `Select` (ADR-104 r2.10).
 *
 * The native `<select>` these replaced could be driven with
 * `user.selectOptions(...)` and read through `.value`. A Radix select is a
 * combobox button that opens a listbox in a portal, so a test does what a
 * person does instead: open it, then click the option. Only imported by
 * tests.
 */
import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/** Opens the select named `name` and returns the option names it lists. */
export async function openSelect(user: UserEvent, name: string | RegExp): Promise<string[]> {
  await user.click(screen.getByRole("combobox", { name }));
  return screen.getAllByRole("option").map((o) => o.textContent ?? "");
}

/** Opens the select named `name` and chooses the option named `option`. */
export async function pickOption(user: UserEvent, name: string | RegExp, option: string | RegExp): Promise<void> {
  await user.click(screen.getByRole("combobox", { name }));
  await user.click(screen.getByRole("option", { name: option }));
}
