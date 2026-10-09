import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarGroupMenu } from "./SidebarGroupMenu";

function renderMenu(overrides: Partial<Parameters<typeof SidebarGroupMenu>[0]> = {}) {
  return render(
    <SidebarGroupMenu
      groupName="LEGAL TEAM"
      canDelete={false}
      deleteDisabledReason="Move items out first"
      onRename={vi.fn()}
      onDelete={vi.fn()}
      {...overrides}
    />,
  );
}

describe("SidebarGroupMenu", () => {
  it("opens the menu with Rename group and Delete group rows", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More options for LEGAL TEAM" }));

    expect(screen.getByRole("menuitem", { name: /Rename group/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Delete group/ })).toBeInTheDocument();
  });

  it("Rename group closes the menu and calls onRename", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderMenu({ onRename });

    await user.click(screen.getByRole("button", { name: "More options for LEGAL TEAM" }));
    await user.click(screen.getByRole("menuitem", { name: /Rename group/ }));

    expect(onRename).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Delete group is disabled with a tooltip, and refuses the click, when canDelete is false", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderMenu({ canDelete: false, onDelete, deleteDisabledReason: "Move items out first" });

    await user.click(screen.getByRole("button", { name: "More options for LEGAL TEAM" }));
    const deleteRow = screen.getByRole("menuitem", { name: /Delete group/ });

    expect(deleteRow).toBeDisabled();
    expect(deleteRow).toHaveAttribute("title", "Move items out first");
    await user.click(deleteRow);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("Delete group calls onDelete when canDelete is true", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderMenu({ canDelete: true, onDelete });

    await user.click(screen.getByRole("button", { name: "More options for LEGAL TEAM" }));
    await user.click(screen.getByRole("menuitem", { name: /Delete group/ }));

    expect(onDelete).toHaveBeenCalled();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "More options for LEGAL TEAM" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("ArrowDown/ArrowUp move focus between the two rows", async () => {
    const user = userEvent.setup();
    renderMenu({ canDelete: true });

    await user.click(screen.getByRole("button", { name: "More options for LEGAL TEAM" }));
    expect(screen.getByRole("menuitem", { name: /Rename group/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Delete group/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Rename group/ })).toHaveFocus();
  });

  it("the R and D letter shortcuts trigger Rename/Delete while the menu is open", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    const onDelete = vi.fn();
    renderMenu({ canDelete: true, onRename, onDelete });

    await user.click(screen.getByRole("button", { name: "More options for LEGAL TEAM" }));
    await user.keyboard("r");
    expect(onRename).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "More options for LEGAL TEAM" }));
    await user.keyboard("d");
    expect(onDelete).toHaveBeenCalled();
  });
});
