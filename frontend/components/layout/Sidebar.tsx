"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { createProduct, deleteProduct, updateProduct } from "@/lib/docs/nav-api";
import { applyProductRename, refreshNavStructure, useNavStructure } from "@/lib/docs/useNavStructure";
import { openInNewTabWithLoadingDim } from "./LoadingDim";
import { SidebarDeleteGroupDialog, SidebarDeleteProductDialog } from "./SidebarDeleteProductDialog";
import { SidebarGroupMenu } from "./SidebarGroupMenu";
import { SidebarItemMenu } from "./SidebarItemMenu";
import { SidebarRenameRow } from "./SidebarRenameRow";
import { UserAvatar } from "./UserAvatar";
import { useSidebarNavConfig } from "./useSidebarNavConfig";
import { NAV_BOTTOM, NAV_TOP, isNavItemActive, visibleNavSections, type NavItem } from "./nav-config";
import { MonitorIcon, PlusIcon, XIcon } from "./icons";
import { PanelLeft } from "lucide-react";
import { SIDEBAR_DEFAULT_WIDTH } from "@/lib/layout/ShellContext";
import { SidebarResizeHandle } from "./SidebarResizeHandle";

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type SidebarProps = {
  /** Mobile/tablet off-canvas drawer state — always visible at lg+ regardless of this. */
  isOpen: boolean;
  onClose: () => void;
  /** Desktop only: fold to the icon rail (ADR-104 r2.9). The mobile drawer
   *  always renders in full. */
  collapsed?: boolean;
  /** Desktop only: the expanded width in px, and the drag that sets it
   *  (ADR-104 r2.12). Without `onResize` there is no handle. */
  width?: number;
  onResize?: (width: number) => void;
  /** Desktop only: folds to the rail. The button for it sits in the
   *  sidebar's own header while expanded; folded, the Topbar carries it. */
  onCollapse?: () => void;
};

function NavLink({
  item,
  active,
  onClick,
  trailingAction,
  rail = false,
}: {
  item: NavItem;
  /** Icon-only: the label stays for screen readers and becomes a tooltip. */
  rail?: boolean;
  active: boolean;
  onClick?: () => void;
  /**
   * e.g. this row's "⋮" kebab menu. Rendered as a *sibling* of the `<Link>`,
   * not a child of it — the kebab used to live inside the anchor, so
   * clicking it (or a row in its menu) also triggered the link's own
   * navigation. `group-hover`/`group-focus-visible` on it key off this
   * wrapper's `group` class instead of the link's.
   */
  trailingAction?: ReactNode;
}) {
  const Icon = item.icon;
  return (
    <div className="group relative">
      <Link
        href={item.href}
        onClick={onClick}
        target={item.newTab ? "_blank" : undefined}
        rel={item.newTab ? "noopener noreferrer" : undefined}
        aria-current={active ? "page" : undefined}
        title={rail ? item.label : undefined}
        // Same row as the /account/settings side menu (SettingsSideMenu): a
        // 36px rounded rectangle, medium-weight text in the foreground colour,
        // and a filled background on the selected row.
        className={`flex h-9 items-center gap-2.5 rounded-md text-sm font-medium text-nav-foreground transition-colors ${rail ? "mx-auto w-9 justify-center px-0" : "px-3"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          active ? "bg-nav-accent" : "hover:bg-nav-accent"
        }`}
      >
        <Icon className="size-4 shrink-0" />
        <span className={rail ? "sr-only" : "min-w-0 flex-1 truncate"}>{item.label}</span>
      </Link>
      {!rail && trailingAction}
    </div>
  );
}

export function Sidebar({ isOpen, onClose, collapsed = false, width = SIDEBAR_DEFAULT_WIDTH, onResize, onCollapse }: SidebarProps) {
  const [resizing, setResizing] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Same session-backed name/role as the Topbar (GET /api/v1/auth/me) — the
  // two must never show a different name for the one signed-in caller.
  const user = useCurrentUser();
  // The raw role, not the display label useCurrentUser() formats: what a
  // caller may see is decided against the enum the server sent, never against
  // a translated string.
  const { user: session } = useSession();
  const products = useNavStructure();

  // Same role floor the backend enforces on /api/v1/admin/nav/** — hiding
  // these controls for anyone else is presentation, not the actual control;
  // a "user" caller who reached the endpoint directly still gets refused
  // server-side.
  const canManage = session?.role === "admin" || session?.role === "super_admin";
  const canDelete = session?.role === "super_admin";

  const { groups, itemOverrides, renameItem, moveItem, createGroupAndMove, renameGroup, deleteGroup } =
    useSidebarNavConfig(canManage);
  const navSections = visibleNavSections(session?.roles, products ?? [], groups, itemOverrides);
  const userAvatar = AVATAR_GRADIENTS.purple;

  const [addingProduct, setAddingProduct] = useState(false);
  const [newProductLabel, setNewProductLabel] = useState("");
  const [addProductBusy, setAddProductBusy] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // The sidebar's one "{name} deleted" / error notice (task spec §E) — a
  // plain inline banner, the same lightweight pattern this app's other admin
  // pages already use for a save/delete result, not a floating toast (no
  // such component exists anywhere in this codebase to reuse — Step 1's own
  // investigation confirmed it, and the task forbids a new dependency for
  // one either way). A success notice clears itself; an error waits for the
  // next action instead of vanishing on its own.
  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  useEffect(() => {
    if (notice?.kind !== "success") return;
    const id = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(id);
  }, [notice]);

  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [deletingProduct, setDeletingProduct] = useState<{ key: string; label: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    const key = slugify(newProductLabel);
    if (!key) return;
    setProductsError(null);
    setAddProductBusy(true);
    try {
      await createProduct(key, newProductLabel.trim(), "document");
      await refreshNavStructure();
      setNewProductLabel("");
      setAddingProduct(false);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Couldn't add that product.");
    } finally {
      setAddProductBusy(false);
    }
  }

  /**
   * Unlike every other rename here, a product's URL slug can change along
   * with its label (task: "URL slug follows the new name"). The rename
   * response already carries the full new product, so {@link
   * applyProductRename} updates the shared sidebar/header cache with no
   * extra fetch — and when the caller is on that exact product's admin page
   * right now, its URL is swapped to the new slug via `router.replace`
   * (keeps scroll/state, no reload) rather than left pointing at a slug
   * that's about to start redirecting.
   */
  async function handleRenameProduct(productKey: string, label: string) {
    const current = products?.find((p) => p.key === productKey);
    try {
      const { previousKey, product } = await updateProduct(productKey, label, current?.icon ?? "layers");
      applyProductRename(previousKey, product);
      if (previousKey !== product.key && isNavItemActive(pathname, `/${previousKey}`)) {
        router.replace(`/${product.key}`);
      }
    } catch (err) {
      setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't rename that product." });
    } finally {
      setRenamingKey(null);
    }
  }

  async function handleRenameStaticItem(itemKey: string, label: string) {
    try {
      await renameItem(itemKey, label);
    } catch (err) {
      setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't rename that item." });
    } finally {
      setRenamingKey(null);
    }
  }

  async function handleMoveStaticItem(itemKey: string, groupId: string) {
    try {
      await moveItem(itemKey, groupId);
    } catch (err) {
      setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't move that item." });
    }
  }

  async function handleCreateGroupAndMove(itemKey: string, name: string) {
    try {
      await createGroupAndMove(itemKey, name);
    } catch (err) {
      setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't create that group." });
    }
  }

  async function handleRenameGroup(id: string, name: string) {
    const trimmed = name.trim();
    setRenamingGroupId(null);
    if (!trimmed) return;
    try {
      await renameGroup(id, trimmed);
    } catch (err) {
      setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't rename that group." });
    }
  }

  const [deletingGroup, setDeletingGroup] = useState<{ id: string; name: string } | null>(null);

  async function handleDeleteGroup(id: string, name: string) {
    setDeletingGroup(null);
    try {
      await deleteGroup(id);
      setNotice({ kind: "success", message: `${name} deleted` });
    } catch (err) {
      setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't delete that group." });
    }
  }

  async function confirmDeleteProduct() {
    if (!deletingProduct) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteProduct(deletingProduct.key);
      await refreshNavStructure();
      setNotice({ kind: "success", message: `${deletingProduct.label} deleted` });
      if (isNavItemActive(pathname, `/${deletingProduct.key}`)) {
        router.push("/overview");
      }
      setDeletingProduct(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Couldn't remove that product.");
    } finally {
      setDeleteBusy(false);
    }
  }

  const administrationGroupId = groups.find((g) => g.name === "ADMINISTRATION")?.id ?? null;

  function currentGroupIdFor(itemKey: string): string | null {
    const override = itemOverrides.find((o) => o.itemKey === itemKey);
    return override?.groupId ?? administrationGroupId;
  }

  function renderKebab(item: NavItem) {
    if (!canManage || !item.kebab) return null;
    if (item.kebab.kind === "product") {
      const productKey = item.kebab.productKey;
      return (
        <SidebarItemMenu
          itemLabel={item.label}
          kind="product"
          groups={[]}
          canDelete={canDelete}
          deleteDisabledReason="Only Super Admins can delete products"
          onRename={() => setRenamingKey(item.href)}
          onDeleteProduct={() => setDeletingProduct({ key: productKey, label: item.label })}
        />
      );
    }
    return (
      <SidebarItemMenu
        itemLabel={item.label}
        kind="static"
        groups={groups}
        currentGroupId={currentGroupIdFor(item.href)}
        canDelete={false}
        deleteDisabledReason="System pages can't be deleted"
        onRename={() => setRenamingKey(item.href)}
        onMove={(groupId) => handleMoveStaticItem(item.href, groupId)}
        onCreateGroupAndMove={(name) => handleCreateGroupAndMove(item.href, name)}
      />
    );
  }

  // A function of `rail` rather than one tree, so the desktop sidebar can fold
  // while the mobile drawer — the same markup — always renders in full.
  const renderContent = (rail: boolean, desktop: boolean) => (
    <div className="admin-sidebar flex h-full flex-col border-r border-nav-border bg-nav py-3">
      <div className={`flex h-10 items-center ${rail ? "justify-center px-2" : "justify-between px-4"}`}>
        {/* Collapsed to the icon rail, the wordmark has no room — the "C"
            mark alone keeps the brand at the top of the rail instead of an
            empty gap. Same artwork as the app icon; it reads on both themes. */}
        {rail && (
          // eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content
          <img src="/logo-coc-docs-platform-mark.png" alt="Coc Docs Platform" className="size-8 object-contain" />
        )}
        <div className={rail ? "hidden" : "flex items-center gap-2.5"}>
          {/* Two logos, one per theme: the admin artwork's lettering is white and
              would vanish on the light sidebar. `dark:` is the shell-scoped
              variant from globals.css. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
          <img src="/logo-coc-docs-platform.png" alt="Coc Docs Platform" className="h-9 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
          <img src="/logo-coc-docs-platform-adminPage.png" alt="Coc Docs Platform" className="hidden h-9 w-auto dark:block" />
        </div>
        {/* Desktop, expanded: the fold button lives beside the logo, where
            the eye already is when deciding the menu is in the way. Folded,
            this header has no room, so the Topbar shows it instead. */}
        {desktop && !rail && onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Collapse sidebar"
            aria-expanded={true}
            aria-controls="admin-sidebar"
            className="-mr-1.5 hidden size-8 items-center justify-center rounded-full text-nav-muted transition-colors hover:bg-nav-accent hover:text-nav-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
          >
            <PanelLeft className="size-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-full p-1.5 text-nav-muted transition-colors hover:bg-nav-accent hover:text-nav-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <XIcon className="size-5" />
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-5 overflow-y-auto px-2">
        <div className="space-y-0.5">
          <NavLink rail={rail} item={NAV_TOP} active={isNavItemActive(pathname, NAV_TOP.href)} onClick={onClose} />
        </div>

        {navSections.map((section) => {
          const group = groups.find((g) => g.name === section.label);
          const isCustomGroup = group != null && !group.builtin;
          return (
          <div key={section.label} className="space-y-0.5">
            {rail ? (
              <div aria-hidden="true" className="mx-2 my-2 h-px bg-nav-border" />
            ) : isCustomGroup && renamingGroupId === group!.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameGroup(group!.id, newGroupName);
                }}
                className="px-1"
              >
                <input
                  autoFocus
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onBlur={() => handleRenameGroup(group!.id, newGroupName)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setRenamingGroupId(null);
                    }
                  }}
                  maxLength={24}
                  aria-label={`Rename group ${section.label}`}
                  className="w-full rounded-md border border-nav-border bg-background px-2 py-1 text-xs font-medium text-nav-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </form>
            ) : (
              <div className="group flex h-8 items-center justify-between gap-2 px-2">
                <p className="text-xs font-medium text-nav-muted">{section.label}</p>
                {isCustomGroup && canManage && (
                  <SidebarGroupMenu
                    groupName={section.label}
                    canDelete={canDelete && section.items.length === 0}
                    deleteDisabledReason={canDelete ? "Move its items out first" : "Only Super Admins can delete groups"}
                    onRename={() => {
                      setNewGroupName(section.label);
                      setRenamingGroupId(group!.id);
                    }}
                    onDelete={() => setDeletingGroup({ id: group!.id, name: section.label })}
                  />
                )}
              </div>
            )}
            {section.items.map((item) => {
              if (!rail && renamingKey === item.href) {
                const siblingLabels = section.items.filter((i) => i.href !== item.href).map((i) => i.label);
                return (
                  <SidebarRenameRow
                    key={item.href}
                    item={item}
                    existingLabels={siblingLabels}
                    showUrlPreview={item.kebab?.kind === "product"}
                    onSave={(label) =>
                      item.kebab?.kind === "product"
                        ? handleRenameProduct(item.kebab.productKey, label)
                        : handleRenameStaticItem(item.href, label)
                    }
                    onCancel={() => setRenamingKey(null)}
                  />
                );
              }

              return (
                <NavLink
                  rail={rail}
                  key={item.href}
                  item={item}
                  active={isNavItemActive(pathname, item.href)}
                  onClick={onClose}
                  trailingAction={renderKebab(item)}
                />
              );
            })}

            {section.label === "PRODUCTS" && canManage && !rail && (
              <>
                {productsError && <p className="px-2 text-xs text-destructive">{productsError}</p>}

                {!addingProduct && (
                  <button
                    type="button"
                    onClick={() => setAddingProduct(true)}
                    className="flex h-9 w-full items-center gap-2.5 rounded-md border border-dashed border-nav-border px-3 text-sm font-medium text-nav-muted transition-colors hover:bg-nav-accent hover:text-nav-foreground"
                  >
                    <PlusIcon className="size-4 shrink-0" />
                    Add product
                  </button>
                )}

                {addingProduct && (
                  <form onSubmit={handleAddProduct} className="rounded-lg border border-nav-border bg-background p-2">
                    <input
                      autoFocus
                      value={newProductLabel}
                      onChange={(e) => setNewProductLabel(e.target.value)}
                      placeholder="Product name"
                      required
                      className="h-9 w-full rounded-full border border-transparent bg-muted-surface px-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-surface-border focus-visible:bg-background"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={addProductBusy}
                        className="flex-1 rounded-control bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {addProductBusy ? "Adding…" : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingProduct(false);
                          setNewProductLabel("");
                          setProductsError(null);
                        }}
                        className="rounded-control border border-surface-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
          );
        })}

        {notice && !rail && (
          <p className={`px-2 text-xs ${notice.kind === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>{notice.message}</p>
        )}
      </nav>

      <div className="space-y-0.5 border-t border-nav-border px-2 pt-2">
        {/* Opens in a new tab rather than navigating away: this is the same
            admin session previewing the Member landing page (ADR-033), not
            leaving the admin app. /home admits admin/super_admin as a
            read-only preview (RequireMemberSession) precisely so this link
            works rather than bouncing back to /overview.

            The new tab steals focus the instant it opens, so a LoadingDim
            rendered back here would never actually be seen — the loading
            state has to be written directly into the new tab instead (see
            openInNewTabWithLoadingDim). `target`/`href` stay on the <Link>
            so a middle-click/ctrl-click (which bypasses onClick entirely)
            still opens the right place, just without that loading state. */}
        <Link
          href="/home"
          target="_blank"
          onClick={(e) => {
            e.preventDefault();
            openInNewTabWithLoadingDim("/home");
          }}
          title={rail ? "View site" : undefined}
          className={`flex h-9 items-center gap-2.5 rounded-md text-sm font-medium text-nav-foreground transition-colors hover:bg-nav-accent ${rail ? "mx-auto w-9 justify-center px-0" : "px-3"}`}
        >
          <MonitorIcon className="size-4 shrink-0" />
          <span className={rail ? "sr-only" : undefined}>View site</span>
        </Link>
        <NavLink rail={rail} item={NAV_BOTTOM} active={isNavItemActive(pathname, NAV_BOTTOM.href)} onClick={onClose} />

        <div className={`mt-1.5 flex items-center gap-2 rounded-full py-1.5 ${rail ? "justify-center px-0" : "px-2"}`}>
          <UserAvatar
            avatarUrl={user?.avatarUrl ?? null}
            initials={user?.initials ?? "?"}
            name={user?.name ?? "Guest"}
            className={`h-8 w-8 ${userAvatar}`}
          />
          <div className={rail ? "sr-only" : "min-w-0"}>
            <p className="truncate text-sm font-medium text-nav-foreground">{user?.name ?? "Guest"}</p>
            <p className="truncate text-xs text-nav-muted">{user?.role ?? ""}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sticky, always visible. `sticky` (not `fixed`) so this
          participates in normal layout flow — it stays pinned to the
          viewport while scrolling like `fixed` would, but unlike `fixed` it
          fully renders in full-page screenshot/print tools instead of being
          clipped to one viewport height when the page is taller than 100vh. */}
      {/* Width is inline, not a class: dragging the edge sets any value in
          between. The transition is off while dragging so the edge tracks
          the pointer instead of chasing it. */}
      <aside
        id="admin-sidebar"
        data-collapsed={collapsed}
        style={{ width: collapsed ? 56 : width }}
        className={`relative hidden lg:block lg:shrink-0 ${resizing ? "" : "transition-[width] duration-200 ease-out"}`}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {renderContent(collapsed, true)}
        </div>
        {!collapsed && onResize && onCollapse && (
          <SidebarResizeHandle width={width} onResize={onResize} onCollapse={onCollapse} onDraggingChange={setResizing} />
        )}
      </aside>

      {/* Mobile/tablet: off-canvas drawer */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {renderContent(false, false)}
      </aside>

      {deletingGroup && (
        <SidebarDeleteGroupDialog
          groupName={deletingGroup.name}
          onConfirm={() => void handleDeleteGroup(deletingGroup.id, deletingGroup.name)}
          onCancel={() => setDeletingGroup(null)}
        />
      )}

      {deletingProduct && (
        <SidebarDeleteProductDialog
          productLabel={deletingProduct.label}
          busy={deleteBusy}
          error={deleteError}
          onConfirm={confirmDeleteProduct}
          onCancel={() => {
            setDeletingProduct(null);
            setDeleteError(null);
          }}
        />
      )}
    </>
  );
}
