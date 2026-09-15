"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { UserAvatar } from "./UserAvatar";
import { NAV_BOTTOM, NAV_TOP, isNavItemActive, visibleNavSections, type NavItem } from "./nav-config";
import { XIcon } from "./icons";

type SidebarProps = {
  /** Mobile/tablet off-canvas drawer state — always visible at lg+ regardless of this. */
  isOpen: boolean;
  onClose: () => void;
};

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue ${
        active
          ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow"
          : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {item.label}
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
  const navSections = visibleNavSections(session?.role);
  const userAvatar = AVATAR_GRADIENTS.purple;

  const content = (
    <div className="flex h-full flex-col bg-sidebar px-4 py-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-sm font-bold text-white">
            CD
          </div>
          <span className="text-sm font-semibold text-white">Coc Docs Platform</span>
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

      <nav className="mt-6 flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          <NavLink item={NAV_TOP} active={isNavItemActive(pathname, NAV_TOP.href)} onClick={onClose} />
        </div>

        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <p className="px-3 text-[11px] font-semibold tracking-wider text-sidebar-muted/70">{section.label}</p>
            {section.items.map((item) => {
              const active = isNavItemActive(pathname, item.href);
              return (
                <div key={item.href}>
                  <NavLink item={item} active={active} onClick={onClose} />
                  {active && item.subItems && (
                    <div className="ml-[22px] mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {item.subItems.map((sub) => {
                        const subActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={onClose}
                            aria-current={subActive ? "page" : undefined}
                            className={`block rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                              subActive
                                ? "font-semibold text-white"
                                : "text-sidebar-muted hover:text-white"
                            }`}
                          >
                            {sub.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 pt-4">
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
