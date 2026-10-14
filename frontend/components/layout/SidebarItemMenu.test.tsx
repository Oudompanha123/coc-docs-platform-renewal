import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarItemMenu } from "./SidebarItemMenu";
import type { NavGroupConfig } from "@/lib/docs/nav-api";

const GROUPS: NavGroupConfig[] = [
  { id: "admin", name: "ADMINISTRATION", builtin: true, sortOrder: 1 },
  { id: "dev", name: "DEVELOPER", builtin: true, sortOrder: 2 },
];

function renderMenu(props: Partial<Parameters<typeof SidebarItemMenu>[0]> = {}) {
  const handlers = { onRename: vi.fn(), onMove: vi.fn(), onCreateGroupAndMove: vi.fn(), onDeleteProduct: vi.fn() };
  render(
    <div className="group relative">
      <SidebarItemMenu
        itemLabel="Claude Usage"
        kind="static"
        groups={GROUPS}
        currentGroupId="admin"
        canDelete={false}
        deleteDisabledReason="Only Super Admins can delete products"
        {...handlers}
        {...props}
      />
    </div>,
  );
  return handlers;
}

async function open(user = userEvent.setup(), label = "Claude Usage") {
  await user.click(screen.getByRole("button", { name: `More options for ${label}` }));
  return { user, menu: screen.getByRole("menu", { name: `${label} options` }) };
}

/** jsdom has no layout, so moving the pointer off the sub-trigger would close the submenu — open it from the keyboard. */
async function openMoveSubmenu(user: ReturnType<typeof userEvent.setup>) {
  screen.getByRole("menuitem", { name: /Move to group/ }).focus();
  await user.keyboard("{ArrowRight}");
  return screen.getByRole("menu", { name: "Move to group" });
}

describe("SidebarItemMenu", () => {
  it("is closed until the ⋮ trigger is clicked, then names the item it acts on", async () => {
    renderMenu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    const { menu } = await open();
    expect(within(menu).getByText("Claude Usage")).toBeInTheDocument();
  });

  it("a system page offers Rename and Move to group — and no Delete, since it can never be deleted", async () => {
    renderMenu();
    const { menu } = await open();
    expect(within(menu).getAllByRole("menuitem").map((el) => el.textContent)).toEqual(["Rename", "Move to group"]);
    expect(within(menu).queryByRole("menuitem", { name: /Delete/ })).not.toBeInTheDocument();
  });

  it("Rename closes the menu and calls onRename", async () => {
    const { onRename } = renderMenu();
    const { user } = await open();
    await user.click(screen.getByRole("menuitem", { name: "Rename" }));
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("Move to group lists every group, the current one checked and not selectable", async () => {
    const { onMove } = renderMenu();
    const { user } = await open();
    const sub = await openMoveSubmenu(user);
    const current = within(sub).getByRole("menuitemradio", { name: /ADMINISTRATION/ });
    expect(current).toHaveAttribute("aria-checked", "true");
    expect(current).toHaveAttribute("aria-disabled", "true");
    expect(current).toHaveTextContent("Current");

    fireEvent.click(within(sub).getByRole("menuitemradio", { name: /DEVELOPER/ }));
    expect(onMove).toHaveBeenCalledWith("dev");
  });

  it("New group… asks for a name in place, refuses a blank or existing one, then creates and moves", async () => {
    const { onCreateGroupAndMove } = renderMenu();
    const { user } = await open();
    const sub = await openMoveSubmenu(user);
    fireEvent.click(within(sub).getByRole("menuitem", { name: /New group/ }));

    const input = screen.getByRole("textbox", { name: "New group name" });
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByText("Enter a name.")).toBeInTheDocument();

    await user.type(input, "developer");
    fireEvent.submit(input.closest("form")!);
    expect(screen.getByText('"developer" already exists.')).toBeInTheDocument();
    expect(onCreateGroupAndMove).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "Ops");
    fireEvent.submit(input.closest("form")!);
    expect(onCreateGroupAndMove).toHaveBeenCalledWith("Ops");
  });

  it("a product has Delete and no Move to group", async () => {
    const { onDeleteProduct } = renderMenu({ itemLabel: "Jex3.0", kind: "product", groups: [], canDelete: true });
    const { user, menu } = await open(undefined, "Jex3.0");
    expect(within(menu).queryByRole("menuitem", { name: /Move to group/ })).not.toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: /Delete/ }));
    expect(onDeleteProduct).toHaveBeenCalledTimes(1);
  });

  it("a product the caller may not delete shows Delete disabled, with the reason written in the row", async () => {
    const { onDeleteProduct } = renderMenu({ itemLabel: "Jex3.0", kind: "product", groups: [], canDelete: false });
    const { menu } = await open(undefined, "Jex3.0");
    const row = within(menu).getByRole("menuitem", { name: /Delete/ });
    expect(row).toHaveAttribute("aria-disabled", "true");
    expect(row).toHaveTextContent("Only Super Admins can delete products");
    fireEvent.click(row);
    expect(onDeleteProduct).not.toHaveBeenCalled();
  });

  it("Escape closes the menu and returns focus to the trigger", async () => {
    renderMenu();
    const { user } = await open();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More options for Claude Usage" })).toHaveFocus();
  });
});
