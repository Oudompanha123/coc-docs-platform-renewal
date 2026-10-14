import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarGroupMenu } from "./SidebarGroupMenu";

function renderMenu(props: Partial<Parameters<typeof SidebarGroupMenu>[0]> = {}) {
  const onRename = vi.fn();
  const onDelete = vi.fn();
  render(
    <div className="group">
      <SidebarGroupMenu groupName="Ops" canDelete deleteDisabledReason="Move its items out first" onRename={onRename} onDelete={onDelete} {...props} />
    </div>,
  );
  return { onRename, onDelete };
}

async function open() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "More options for Ops" }));
  return { user, menu: screen.getByRole("menu", { name: "Ops group options" }) };
}

describe("SidebarGroupMenu", () => {
  it("offers Rename group and Delete group", async () => {
    renderMenu();
    const { menu } = await open();
    expect(within(menu).getAllByRole("menuitem").map((el) => el.textContent)).toEqual(["Rename group", "Delete group"]);
  });

  it("Rename group calls onRename", async () => {
    const { onRename } = renderMenu();
    const { user } = await open();
    await user.click(screen.getByRole("menuitem", { name: "Rename group" }));
    expect(onRename).toHaveBeenCalledTimes(1);
  });

  it("Delete group calls onDelete — the caller asks for confirmation", async () => {
    const { onDelete } = renderMenu();
    const { user } = await open();
    await user.click(screen.getByRole("menuitem", { name: "Delete group" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("when it can't be deleted, the row is disabled with the reason written in it", async () => {
    const { onDelete } = renderMenu({ canDelete: false });
    const { menu } = await open();
    const row = within(menu).getByRole("menuitem", { name: /Delete group/ });
    expect(row).toHaveAttribute("aria-disabled", "true");
    expect(row).toHaveTextContent("Move its items out first");
    fireEvent.click(row);
    expect(onDelete).not.toHaveBeenCalled();
  });
});
