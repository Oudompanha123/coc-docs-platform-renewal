"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { createProduct, deleteProduct, fetchNavStructure } from "@/lib/docs/nav-api";
import { useNavStructure } from "@/lib/docs/useNavStructure";
import { openInNewTabWithLoadingDim } from "./LoadingDim";
import { UserAvatar } from "./UserAvatar";
import { NAV_BOTTOM, NAV_TOP, isNavItemActive, visibleNavSections, type NavItem } from "./nav-config";
import { MonitorIcon, PlusIcon, XIcon } from "./icons";

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
  /** e.g. the PRODUCTS section's remove button — `group-hover`/`group-focus-visible` on it key off this Link's own `group` class, not an external wrapper. */
  trailingAction?: ReactNode;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      target={item.newTab ? "_blank" : undefined}
      rel={item.newTab ? "noopener noreferrer" : undefined}
      aria-current={active ? "page" : undefined}
      title={rail ? item.label : undefined}
      className={`group relative flex h-10 items-center gap-2.5 rounded-full text-sm transition-colors ${rail ? "mx-auto w-10 justify-center px-0" : "px-3"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? "bg-nav-accent font-medium text-nav-foreground"
          : "text-nav-muted hover:bg-nav-accent hover:text-nav-foreground"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span className={rail ? "sr-only" : "min-w-0 flex-1 truncate"}>{item.label}</span>
      {!rail && trailingAction}
    </Link>
  );
}

export function Sidebar({ isOpen, onClose, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  // Same session-backed name/role as the Topbar (GET /api/v1/auth/me) — the
  // two must never show a different name for the one signed-in caller.
  const user = useCurrentUser();
  // The raw role, not the display label useCurrentUser() formats: what a
  // caller may see is decided against the enum the server sent, never against
  // a translated string.
  const { user: session } = useSession();
  const fetchedProducts = useNavStructure();
  const [products, setProducts] = useState<typeof fetchedProducts>(null);
  useEffect(() => {
    if (fetchedProducts) setProducts(fetchedProducts);
  }, [fetchedProducts]);
  const navSections = visibleNavSections(session?.roles, products ?? []);
  const userAvatar = AVATAR_GRADIENTS.purple;

  // Same role floor the backend enforces on /api/v1/admin/nav/** — hiding
  // these controls for anyone else is presentation, not the actual control;
  // a "user" caller who reached the endpoint directly still gets refused
  // server-side.
  const canManage = session?.role === "admin" || session?.role === "super_admin";

  const [addingProduct, setAddingProduct] = useState(false);
  const [newProductLabel, setNewProductLabel] = useState("");
  const [addProductBusy, setAddProductBusy] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    const key = slugify(newProductLabel);
    if (!key) return;
    setProductsError(null);
    setAddProductBusy(true);
    try {
      await createProduct(key, newProductLabel.trim(), "document");
      setProducts(await fetchNavStructure());
      setNewProductLabel("");
      setAddingProduct(false);
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Couldn't add that product.");
    } finally {
      setAddProductBusy(false);
    }
  }

  async function handleDeleteProduct(key: string, label: string) {
    if (!window.confirm(`Remove "${label}"? This only works while it has no sub-items left.`)) return;
    setProductsError(null);
    try {
      await deleteProduct(key);
      setProducts(await fetchNavStructure());
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : "Couldn't remove that product.");
    }
  }

  // A function of `rail` rather than one tree, so the desktop sidebar can fold
  // while the mobile drawer — the same markup — always renders in full.
  const renderContent = (rail: boolean) => (
    <div className="admin-sidebar flex h-full flex-col border-r border-nav-border bg-nav py-3">
      <div className={`flex h-10 items-center justify-between ${rail ? "px-2" : "px-4"}`}>
        <div className={rail ? "hidden" : "flex items-center gap-2.5"}>
          {/* Two logos, one per theme: the admin artwork's lettering is white and
              would vanish on the light sidebar. `dark:` is the shell-scoped
              variant from globals.css. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
          <img src="/logo-coc-docs-platform.png" alt="Coc Docs Platform" className="h-7 w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
          <img src="/logo-coc-docs-platform-adminPage.png" alt="Coc Docs Platform" className="hidden h-7 w-auto dark:block" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-full p-1.5 text-nav-muted transition-colors hover:bg-nav-accent hover:text-nav-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-4 flex-1 space-y-5 overflow-y-auto px-2">
        <div className="space-y-0.5">
          <NavLink rail={rail} item={NAV_TOP} active={isNavItemActive(pathname, NAV_TOP.href)} onClick={onClose} />
        </div>

        {navSections.map((section) => (
          <div key={section.label} className="space-y-0.5">
            {rail ? (
              <div aria-hidden="true" className="mx-2 my-2 h-px bg-nav-border" />
            ) : (
              <p className="flex h-8 items-center px-2 text-xs font-medium text-nav-muted">{section.label}</p>
            )}
            {section.items.map((item) =>
              section.label === "PRODUCTS" ? (
                <NavLink
                  rail={rail}
                  key={item.href}
                  item={item}
                  active={isNavItemActive(pathname, item.href)}
                  onClick={onClose}
                  trailingAction={
                    canManage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          // This button now sits inside the Link's own anchor
                          // (moved in from an external sibling) — without
                          // these, a click would also follow the link.
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteProduct(item.href.slice(1), item.label);
                        }}
                        aria-label={`Remove ${item.label}`}
                        className="absolute right-[5px] top-1/2 -translate-y-1/2 shrink-0 rounded-full p-1.5 text-nav-muted opacity-0 transition-opacity hover:bg-nav hover:text-nav-foreground focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    )
                  }
                />
              ) : (
                <NavLink rail={rail} key={item.href} item={item} active={isNavItemActive(pathname, item.href)} onClick={onClose} />
              ),
            )}

            {section.label === "PRODUCTS" && canManage && !rail && (
              <>
                {productsError && <p className="px-2 text-xs text-destructive">{productsError}</p>}

                {!addingProduct && (
                  <button
                    type="button"
                    onClick={() => setAddingProduct(true)}
                    className="flex h-10 w-full items-center gap-2.5 rounded-full border border-dashed border-nav-border px-3 text-sm text-nav-muted transition-colors hover:bg-nav-accent hover:text-nav-foreground"
                  >
                    <PlusIcon className="size-4 shrink-0" />
                    Add product
                  </button>
                )}

                {addingProduct && (
                  <form onSubmit={handleAddProduct} className="rounded-lg border border-nav-border bg-background p-2">
                                        <Input
                      autoFocus
                      value={newProductLabel}
                      onChange={(e) => setNewProductLabel(e.target.value)}
                      placeholder="Product name"
                      required
                      className="h-9 text-sm"
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
        ))}
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
          className={`flex h-10 items-center gap-2.5 rounded-full text-sm text-nav-muted transition-colors hover:bg-nav-accent hover:text-nav-foreground ${rail ? "mx-auto w-10 justify-center px-0" : "px-3"}`}
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
      <aside
        id="admin-sidebar"
        data-collapsed={collapsed}
        className={`hidden transition-[width] duration-200 ease-out lg:block lg:shrink-0 ${collapsed ? "lg:w-14" : "lg:w-64"}`}
      >
        <div className={`sticky top-0 h-screen overflow-hidden transition-[width] duration-200 ease-out ${collapsed ? "w-14" : "w-64"}`}>
          {renderContent(collapsed)}
        </div>
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
        {renderContent(false)}
      </aside>
    </>
  );
}
