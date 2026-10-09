import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import type { NavProduct } from "@/lib/docs/nav-api";

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const { pathname } = vi.hoisted(() => ({ pathname: { current: "/overview" } }));
vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ push, replace }),
}));

const { sessionRole } = vi.hoisted(() => ({ sessionRole: { current: "super_admin" as string | undefined } }));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ user: { role: sessionRole.current, roles: [sessionRole.current] } }),
}));
vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ name: "Jane Doe", role: "Super Admin", initials: "JD", avatarUrl: null }),
}));

const { useNavStructure, applyProductRename, refreshNavStructure } = vi.hoisted(() => ({
  useNavStructure: vi.fn(),
  applyProductRename: vi.fn(),
  refreshNavStructure: vi.fn(),
}));
vi.mock("@/lib/docs/useNavStructure", () => ({ useNavStructure, applyProductRename, refreshNavStructure }));

const {
  createProduct,
  deleteProduct,
  fetchNavStructure,
  updateProduct,
  fetchAdminNavConfig,
  updateNavItemOverride,
  createNavGroup,
  renameNavGroup,
  deleteNavGroup,
} = vi.hoisted(() => ({
  createProduct: vi.fn(),
  deleteProduct: vi.fn(),
  fetchNavStructure: vi.fn(),
  updateProduct: vi.fn(),
  fetchAdminNavConfig: vi.fn(),
  updateNavItemOverride: vi.fn(),
  createNavGroup: vi.fn(),
  renameNavGroup: vi.fn(),
  deleteNavGroup: vi.fn(),
}));
vi.mock("@/lib/docs/nav-api", () => ({
  createProduct,
  deleteProduct,
  fetchNavStructure,
  updateProduct,
  fetchAdminNavConfig,
  updateNavItemOverride,
  createNavGroup,
  renameNavGroup,
  deleteNavGroup,
}));

function fixtureProducts(): NavProduct[] {
  return [{ key: "jex3-0", label: "Jex3.0", icon: "layers", minRole: "user", items: [] }];
}

// Captured once, before any test spies over it — see the beforeEach below.
const realInputFocus = HTMLInputElement.prototype.focus;

beforeEach(() => {
  vi.clearAllMocks();
  sessionRole.current = "super_admin";
  pathname.current = "/overview";
  useNavStructure.mockReturnValue(fixtureProducts());
  fetchNavStructure.mockResolvedValue(fixtureProducts());
  fetchAdminNavConfig.mockResolvedValue({ products: fixtureProducts(), groups: [], itemOverrides: [] });
  vi.spyOn(window, "confirm").mockReturnValue(true);
  // Sidebar renders its whole nav twice (a `lg:block` desktop copy and an
  // `lg:hidden` mobile drawer copy of the same `content`) so exactly one is
  // visible at a given viewport — real CSS makes that true in a browser, but
  // this suite runs with `css: false` (vitest.config.mts), so jsdom has no
  // stylesheet telling it the mobile copy is `display:none` at desktop width
  // and treats both copies as equally focusable. `renamingKey` is Sidebar-
  // level state, so starting a rename mounts an autoFocus input in BOTH
  // copies; the second one's mount then steals focus from the first, firing
  // a blur that saves the still-unchanged value before the test can type
  // into it. Restoring the one fact jsdom is missing — the mobile copy is
  // never really focusable here — avoids the race without faking focus
  // everywhere else (user-event's own clear()/type() still need it real).
  vi.spyOn(HTMLInputElement.prototype, "focus").mockImplementation(function (this: HTMLInputElement) {
    if (this.closest(".lg\\:hidden")) return;
    realInputFocus.call(this);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderSidebar(onClose: () => void = vi.fn()) {
  return render(<Sidebar isOpen onClose={onClose} />);
}

describe("Sidebar — kebab menu integration", () => {
  it("clicking the kebab opens the menu without navigating or closing the mobile drawer", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderSidebar(onClose);
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    // The row's own <Link onClick={onClose}> is what used to also fire when
    // the kebab (once nested inside it) was clicked — onClose firing here
    // would mean that happened again.
    await user.click(screen.getAllByRole("button", { name: "More options for Jex3.0" })[0]!);

    expect(onClose).not.toHaveBeenCalled();
    expect(pathname.current).toBe("/overview");
    expect(screen.getByRole("menu", { name: "Jex3.0 options" })).toBeInTheDocument();
  });

  it("activating the kebab from the keyboard (Enter) opens the menu without navigating", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderSidebar(onClose);
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    screen.getAllByRole("button", { name: "More options for Jex3.0" })[0]!.focus();
    await user.keyboard("{Enter}");

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("menu", { name: "Jex3.0 options" })).toBeInTheDocument();
  });

  it("clicking the row label itself still navigates (closes the mobile drawer)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderSidebar(onClose);
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await user.click(screen.getAllByRole("link", { name: "Jex3.0" })[0]!);

    expect(onClose).toHaveBeenCalled();
  });

  it("shows a kebab for a super_admin on both a static item and a product", async () => {
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    expect(screen.getAllByRole("button", { name: "More options for Legal pages" })[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "More options for Jex3.0" })[0]).toBeInTheDocument();
  });

  it("shows no kebab for an admin on items they can't even see (Users & Roles), but still one for Legal pages", async () => {
    sessionRole.current = "admin";
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    expect(screen.queryByRole("button", { name: "More options for Users & Roles" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "More options for Legal pages" })[0]).toBeInTheDocument();
  });

  it("renaming a static item switches to an inline input and calls the item-override API on save", async () => {
    const user = userEvent.setup();
    updateNavItemOverride.mockResolvedValue({ itemKey: "/legal-pages", customLabel: "Legal Docs", groupId: null, sortOrder: null });
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await user.click(screen.getAllByRole("button", { name: "More options for Legal pages" })[0]!);
    await user.click(screen.getByRole("menuitem", { name: /Rename/ }));

    const input = screen.getAllByRole("textbox", { name: "Rename Legal pages" })[0]!;
    await user.clear(input);
    await user.type(input, "Legal Docs{Enter}");

    await waitFor(() => expect(updateNavItemOverride).toHaveBeenCalledWith("/legal-pages", { label: "Legal Docs" }));
  });

  it("renaming a product calls updateProduct with its existing icon, and applies the result to the shared nav cache", async () => {
    const user = userEvent.setup();
    const renamed: NavProduct = { key: "jex-3", label: "Jex 3", icon: "layers", minRole: "user", items: [] };
    updateProduct.mockResolvedValue({ previousKey: "jex3-0", product: renamed });
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await user.click(screen.getAllByRole("button", { name: "More options for Jex3.0" })[0]!);
    await user.click(screen.getByRole("menuitem", { name: /Rename/ }));

    const input = screen.getAllByRole("textbox", { name: "Rename Jex3.0" })[0]!;
    await user.clear(input);
    await user.type(input, "Jex 3{Enter}");

    await waitFor(() => expect(updateProduct).toHaveBeenCalledWith("jex3-0", "Jex 3", "layers"));
    expect(applyProductRename).toHaveBeenCalledWith("jex3-0", renamed);
    // The admin wasn't on Jex3.0's own page (pathname is "/overview" by
    // default), so its URL has nothing to move — only the shared cache update.
    expect(replace).not.toHaveBeenCalled();
  });

  it("renaming the product whose page the admin is currently on replaces the URL to the new slug", async () => {
    const user = userEvent.setup();
    pathname.current = "/jex3-0";
    const renamed: NavProduct = { key: "jex", label: "Jex", icon: "layers", minRole: "user", items: [] };
    updateProduct.mockResolvedValue({ previousKey: "jex3-0", product: renamed });
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await user.click(screen.getAllByRole("button", { name: "More options for Jex3.0" })[0]!);
    await user.click(screen.getByRole("menuitem", { name: /Rename/ }));
    const input = screen.getAllByRole("textbox", { name: "Rename Jex3.0" })[0]!;
    await user.clear(input);
    await user.type(input, "Jex{Enter}");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/jex"));
  });

  it("a static item's Delete row is always disabled — no dialog, no API call", async () => {
    const user = userEvent.setup();
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await user.click(screen.getAllByRole("button", { name: "More options for Legal pages" })[0]!);
    const deleteRow = screen.getByRole("menuitem", { name: /Delete/ });
    expect(deleteRow).toBeDisabled();
    expect(deleteRow).toHaveAttribute("title", "System pages can't be deleted");
  });

  it("deleting a product opens the typed-confirmation dialog, then deletes, notifies, and redirects if it was the active page", async () => {
    const user = userEvent.setup();
    pathname.current = "/jex3-0";
    deleteProduct.mockResolvedValue(undefined);
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await user.click(screen.getAllByRole("button", { name: "More options for Jex3.0" })[0]!);
    await user.click(screen.getByRole("menuitem", { name: /Delete/ }));

    expect(screen.getByRole("dialog", { name: "Delete Jex3.0?" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox"), "Jex3.0");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(deleteProduct).toHaveBeenCalledWith("jex3-0"));
    // The notice renders once per aside copy (desktop + mobile drawer, see
    // the beforeEach comment above) — both show it, so assert on all of them.
    const notices = await screen.findAllByText("Jex3.0 deleted");
    expect(notices.length).toBeGreaterThan(0);
    expect(push).toHaveBeenCalledWith("/overview");
  });

  it("an admin sees Delete disabled (not absent) on a product, with the super-admin-only tooltip", async () => {
    sessionRole.current = "admin";
    const user = userEvent.setup();
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await user.click(screen.getAllByRole("button", { name: "More options for Jex3.0" })[0]!);
    const deleteRow = screen.getByRole("menuitem", { name: /Delete/ });
    expect(deleteRow).toBeDisabled();
    expect(deleteRow).toHaveAttribute("title", "Only Super Admins can delete");
  });

  it("moving a static item into a group calls the item-override API with the group id", async () => {
    const user = userEvent.setup();
    fetchAdminNavConfig.mockResolvedValue({
      products: fixtureProducts(),
      groups: [{ id: "dev-1", name: "DEVELOPER", builtin: true, sortOrder: 2 }],
      itemOverrides: [],
    });
    updateNavItemOverride.mockResolvedValue({ itemKey: "/legal-pages", customLabel: null, groupId: "dev-1", sortOrder: 1 });
    renderSidebar();
    await waitFor(() => expect(fetchAdminNavConfig).toHaveBeenCalled());

    await user.click(screen.getAllByRole("button", { name: "More options for Legal pages" })[0]!);
    await user.click(screen.getByRole("menuitem", { name: /Move to group/ }));
    await user.click(screen.getByRole("menuitemradio", { name: /DEVELOPER/ }));

    await waitFor(() => expect(updateNavItemOverride).toHaveBeenCalledWith("/legal-pages", { groupId: "dev-1" }));
  });
});
