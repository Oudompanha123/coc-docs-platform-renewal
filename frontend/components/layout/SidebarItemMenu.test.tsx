import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarItemMenu } from "./SidebarItemMenu";
import type { NavGroupConfig } from "@/lib/docs/nav-api";

const { pathname } = vi.hoisted(() => ({ pathname: { current: "/overview" } }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

function groups(): NavGroupConfig[] {
  return [
    { id: "admin-1", name: "ADMINISTRATION", builtin: true, sortOrder: 1 },
    { id: "dev-1", name: "DEVELOPER", builtin: true, sortOrder: 2 },
    { id: "custom-1", name: "LEGAL TEAM", builtin: false, sortOrder: 3 },
  ];
}

function renderMenu(overrides: Partial<Parameters<typeof SidebarItemMenu>[0]> = {}) {
  return render(
    <SidebarItemMenu
      itemLabel="Legal pages"
      kind="static"
      groups={groups()}
      currentGroupId="admin-1"
      canDelete={false}
      deleteDisabledReason="System pages can't be deleted"
      onRename={vi.fn()}
      onMove={vi.fn()}
      onCreateGroupAndMove={vi.fn()}
      {...overrides}
    />,
  );
}

describe("SidebarItemMenu", () => {
  beforeEach(() => {
    pathname.current = "/overview";
  });

  it("is closed by default, and opens the menu when the kebab is clicked", async () => {
    const user = userEvent.setup();
    renderMenu();

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));

    expect(screen.getByRole("menu", { name: "Legal pages options" })).toBeInTheDocument();
  });

  it("focuses the first row (Rename) when the menu opens", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));

    expect(screen.getByRole("menuitem", { name: /Rename/ })).toHaveFocus();
  });

  it("Rename closes the menu and calls onRename", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderMenu({ onRename });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.click(screen.getByRole("menuitem", { name: /Rename/ }));

    expect(onRename).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows Rename, Move to group, a divider, and Delete, in that order, for a static item", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));

    const menu = screen.getByRole("menu", { name: "Legal pages options" });
    const rowNames = Array.from(menu.children).map((el) => el.getAttribute("role"));
    expect(rowNames).toEqual(["menuitem", "menuitem", "separator", "menuitem"]);
    expect(screen.getByRole("menuitem", { name: /Rename/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Move to group/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Delete/ })).toBeInTheDocument();
  });

  it("shows Move to group only for a static item, never for a product", async () => {
    const user = userEvent.setup();
    const { rerender } = renderMenu({ kind: "static" });
    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    expect(screen.getByRole("menuitem", { name: /Move to group/ })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    rerender(
      <SidebarItemMenu
        itemLabel="Jex3.0"
        kind="product"
        groups={groups()}
        canDelete={false}
        deleteDisabledReason="Only Super Admins can delete"
        onRename={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "More options for Jex3.0" }));
    expect(screen.queryByRole("menuitem", { name: /Move to group/ })).not.toBeInTheDocument();
  });

  it("opens the submenu listing every group, with the current one checked and disabled", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.click(screen.getByRole("menuitem", { name: /Move to group/ }));

    const submenu = screen.getByRole("menu", { name: "Move to group" });
    expect(submenu).toBeInTheDocument();
    const current = screen.getByRole("menuitemradio", { name: /ADMINISTRATION/ });
    expect(current).toHaveAttribute("aria-checked", "true");
    expect(current).toBeDisabled();
    expect(screen.getByRole("menuitemradio", { name: /DEVELOPER/ })).not.toBeDisabled();
  });

  it("selecting a different group calls onMove and closes everything", async () => {
    const user = userEvent.setup();
    const onMove = vi.fn();
    renderMenu({ onMove });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.click(screen.getByRole("menuitem", { name: /Move to group/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /DEVELOPER/ }));

    expect(onMove).toHaveBeenCalledWith("dev-1");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it('"+ New group…" shows an inline input, and submitting calls onCreateGroupAndMove', async () => {
    const user = userEvent.setup();
    const onCreateGroupAndMove = vi.fn();
    renderMenu({ onCreateGroupAndMove });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.click(screen.getByRole("menuitem", { name: /Move to group/ }));
    await user.click(screen.getByRole("menuitem", { name: "New group…" }));

    const input = screen.getByLabelText("New group name");
    await user.type(input, "Finance{Enter}");

    expect(onCreateGroupAndMove).toHaveBeenCalledWith("Finance");
  });

  it("does nothing when submitting a blank new-group name", async () => {
    const user = userEvent.setup();
    const onCreateGroupAndMove = vi.fn();
    renderMenu({ onCreateGroupAndMove });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.click(screen.getByRole("menuitem", { name: /Move to group/ }));
    await user.click(screen.getByRole("menuitem", { name: "New group…" }));
    fireEvent.submit(screen.getByLabelText("New group name").closest("form")!);

    expect(onCreateGroupAndMove).not.toHaveBeenCalled();
  });

  it("Delete is disabled with a tooltip, and does not call onDeleteProduct, when canDelete is false", async () => {
    const user = userEvent.setup();
    const onDeleteProduct = vi.fn();
    renderMenu({ canDelete: false, onDeleteProduct, deleteDisabledReason: "System pages can't be deleted" });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    const deleteRow = screen.getByRole("menuitem", { name: /Delete/ });

    expect(deleteRow).toBeDisabled();
    expect(deleteRow).toHaveAttribute("title", "System pages can't be deleted");
    await user.click(deleteRow);
    expect(onDeleteProduct).not.toHaveBeenCalled();
  });

  it("Delete calls onDeleteProduct when canDelete is true", async () => {
    const user = userEvent.setup();
    const onDeleteProduct = vi.fn();
    renderMenu({ kind: "product", canDelete: true, onDeleteProduct, onMove: undefined, onCreateGroupAndMove: undefined });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.click(screen.getByRole("menuitem", { name: /Delete/ }));

    expect(onDeleteProduct).toHaveBeenCalled();
  });

  it("closes on Escape and returns focus to the kebab trigger", async () => {
    const user = userEvent.setup();
    renderMenu();

    const trigger = screen.getByRole("button", { name: "More options for Legal pages" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on a scroll anywhere in the document (e.g. the sidebar's own scroll container)", async () => {
    const user = userEvent.setup();
    renderMenu();

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // A capturing window listener is what this relies on — the sidebar's
    // nav list scrolling internally doesn't bubble a "scroll" event up to
    // window, so a non-capturing listener would never see it.
    fireEvent.scroll(window);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on a route change", async () => {
    const user = userEvent.setup();
    const { rerender } = renderMenu();

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    pathname.current = "/legal-pages";
    rerender(
      <SidebarItemMenu
        itemLabel="Legal pages"
        kind="static"
        groups={groups()}
        currentGroupId="admin-1"
        canDelete={false}
        deleteDisabledReason="System pages can't be deleted"
        onRename={vi.fn()}
        onMove={vi.fn()}
        onCreateGroupAndMove={vi.fn()}
      />,
    );

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on an outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <button type="button">Outside</button>
        <SidebarItemMenu
          itemLabel="Legal pages"
          kind="static"
          groups={groups()}
          currentGroupId="admin-1"
          canDelete={false}
          deleteDisabledReason="System pages can't be deleted"
          onRename={vi.fn()}
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("ArrowDown/ArrowUp move focus between rows", async () => {
    const user = userEvent.setup();
    renderMenu({ canDelete: true });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    expect(screen.getByRole("menuitem", { name: /Rename/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Move to group/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Delete/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitem", { name: /Rename/ })).toHaveFocus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("menuitem", { name: /Delete/ })).toHaveFocus();
  });

  it("the R letter shortcut triggers Rename while the menu is open", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    renderMenu({ onRename });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.keyboard("r");

    expect(onRename).toHaveBeenCalled();
  });

  it("the D letter shortcut does nothing when Delete is disabled", async () => {
    const user = userEvent.setup();
    const onDeleteProduct = vi.fn();
    renderMenu({ canDelete: false, onDeleteProduct });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.keyboard("d");

    expect(onDeleteProduct).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("the D letter shortcut triggers Delete when it's enabled", async () => {
    const user = userEvent.setup();
    const onDeleteProduct = vi.fn();
    renderMenu({ canDelete: true, onDeleteProduct });

    await user.click(screen.getByRole("button", { name: "More options for Legal pages" }));
    await user.keyboard("d");

    expect(onDeleteProduct).toHaveBeenCalled();
  });
});
