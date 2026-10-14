import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DropdownMenuItem, RowActions } from "./dropdown-menu";

describe("RowActions", () => {
  it("names its trigger after the row and runs the chosen action", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(
      <RowActions label="Actions for Dana Lee">
        <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
      </RowActions>,
    );

    await user.click(screen.getByRole("button", { name: "Actions for Dana Lee" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("opens its menu inside the page's shell, so the shell's dark mode reaches it", async () => {
    const user = userEvent.setup();
    render(
      <div data-shell="admin" data-testid="shell">
        <RowActions label="Actions for Dana Lee">
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </RowActions>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Actions for Dana Lee" }));

    expect(screen.getByTestId("shell")).toContainElement(screen.getByRole("menu"));
  });
});
