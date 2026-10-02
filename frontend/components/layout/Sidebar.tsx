"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
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
};

function NavLink({
  item,
  active,
  onClick,
  trailingAction,
}: {
  item: NavItem;
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
      className={`group relative flex h-[42px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
        active
          ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {trailingAction}
    </Link>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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

  const content = (
    <div className="flex h-full flex-col bg-sidebar px-0 py-5">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
          <img src="/logo-coc-docs-platform-adminPage.png" alt="Coc Docs Platform" className="h-8 w-auto rounded-lg" />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue lg:hidden"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto px-4">
        <div className="space-y-1">
          <NavLink item={NAV_TOP} active={isNavItemActive(pathname, NAV_TOP.href)} onClick={onClose} />
        </div>

        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted/70">{section.label}</p>
            {section.items.map((item) =>
              section.label === "PRODUCTS" ? (
                <NavLink
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
                        className="absolute right-[5px] top-1/2 -translate-y-1/2 shrink-0 rounded-lg p-2 text-sidebar-muted opacity-0 transition-opacity hover:bg-sidebar-hover hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    )
                  }
                />
              ) : (
                <NavLink key={item.href} item={item} active={isNavItemActive(pathname, item.href)} onClick={onClose} />
              ),
            )}

            {section.label === "PRODUCTS" && canManage && (
              <>
                {productsError && <p className="px-3 text-xs text-[#ff9b9b]">{productsError}</p>}

                {!addingProduct && (
                  <button
                    type="button"
                    onClick={() => setAddingProduct(true)}
                    className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:border-white/30 hover:bg-sidebar-hover hover:text-white"
                  >
                    <PlusIcon className="h-[18px] w-[18px] shrink-0" />
                    Add product
                  </button>
                )}

                {addingProduct && (
                  <form onSubmit={handleAddProduct} className="rounded-xl border border-white/15 bg-white/5 p-2.5">
                    <input
                      autoFocus
                      value={newProductLabel}
                      onChange={(e) => setNewProductLabel(e.target.value)}
                      placeholder="Product name"
                      required
                      className="w-full rounded-lg border border-white/15 bg-transparent px-2.5 py-1.5 text-sm text-white placeholder:text-sidebar-muted focus:outline-none"
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        type="submit"
                        disabled={addProductBusy}
                        className="flex-1 rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue px-3 py-1.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-sidebar-muted transition-colors hover:text-white"
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

      <div className="space-y-3 border-t border-white/10 px-4 pt-4">
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
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white"
        >
          <MonitorIcon className="h-[18px] w-[18px] shrink-0" />
          View site
        </Link>
        <NavLink item={NAV_BOTTOM} active={isNavItemActive(pathname, NAV_BOTTOM.href)} onClick={onClose} />

        <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
          <UserAvatar
            avatarUrl={user?.avatarUrl ?? null}
            initials={user?.initials ?? "?"}
            name={user?.name ?? "Guest"}
            className={`h-8 w-8 ${userAvatar}`}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.name ?? "Guest"}</p>
            <p className="truncate text-xs text-sidebar-muted">{user?.role ?? ""}</p>
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
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="sticky top-0 h-screen w-64">{content}</div>
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
        {content}
      </aside>
    </>
  );
}
