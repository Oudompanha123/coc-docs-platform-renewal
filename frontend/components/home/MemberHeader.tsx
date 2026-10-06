"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { ActivityAvatar } from "@/components/layout/ActivityAvatar";
import { UserAvatar } from "@/components/layout/UserAvatar";
import {
  BarChartIcon,
  BellIcon,
  CalendarCheckIcon,
  ChevronDownIcon,
  GearIcon,
  LayersIcon,
  LogOutIcon,
  MailIcon,
  PersonIcon,
} from "@/components/layout/icons";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import { Spinner } from "@/components/layout/Spinner";
import { actorName, isHrmsReport, timeAgo, type NotificationItem } from "@/lib/notify/activity";
import { HrmsReportModal } from "@/components/layout/HrmsReportModal";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { useActivityFeed } from "@/lib/notify/useActivityFeed";
import { useNotifications } from "@/lib/notify/useNotifications";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { productHref } from "@/lib/home/product-links";
import { MemberThemeSync } from "@/components/home/MemberThemeSync";
import type { NavProduct } from "@/lib/docs/nav-api";

type MenuKey = "bell" | "mail" | "user" | "products" | "reports";

/**
 * Which half of a panel's list is showing. Mirrors the admin Topbar's, and is
 * shared by both panels here — the bell and the activity feed answer the same
 * question and should not answer it in two different shapes.
 */
type PanelFilter = "unread" | "all";

const PANEL_CLASSES = "absolute right-0 z-30 mt-2 w-80 rounded-xl border border-border bg-white shadow-lg";

function CountIcon({
  count,
  label,
  active,
  onClick,
  children,
}: {
  count: number;
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}, ${count}`}
      aria-haspopup="menu"
      aria-expanded={active}
      className="relative rounded-xl bg-gray-100 p-2.5 text-ink/70 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
    >
      {children}
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </button>
  );
}

/** Products mega-dropdown — 2-col grid with large lavender icon tiles. */
function ProductsDropdown({
  products,
  onClose,
}: {
  products: NavProduct[];
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      role="menu"
      className="absolute left-0 top-[72px] z-30 w-80 rounded-2xl border border-border bg-white p-4 shadow-xl"
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
        PRODUCTS
      </p>
      <div className="grid grid-cols-2 gap-2">
        {products.map((product) => {
          const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;
          const href = productHref(product.key);
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={product.key}
              href={href}
              role="menuitem"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-brand-purple/10 ${
                active ? "bg-brand-purple/10" : ""
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-brand-purple ${
                  active ? "bg-brand-purple/20" : "bg-brand-purple/10"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span
                className={`truncate text-[15px] font-medium ${
                  active ? "text-brand-purple" : "text-ink"
                }`}
              >
                {product.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Reports & Records dropdown — a single-column list, deliberately built so
 * more items can be added later rather than hand-coding one link. Styled
 * after {@link ProductsDropdown}'s own active/hover treatment, just a
 * single column instead of a 2-col grid since there is only ever a handful
 * of report kinds, not a whole product catalogue.
 */
function ReportsDropdown({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const attendanceActive = pathname === "/reports/attendance";

  return (
    <div
      role="menu"
      className="absolute left-0 top-[72px] z-30 w-72 rounded-2xl border border-border bg-white p-2 shadow-xl"
    >
      <Link
        href="/reports/attendance"
        role="menuitem"
        onClick={onClose}
        className={`flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-brand-purple/10 ${
          attendanceActive ? "bg-brand-purple/10" : ""
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-brand-purple ${
            attendanceActive ? "bg-brand-purple/20" : "bg-brand-purple/10"
          }`}
        >
          <CalendarCheckIcon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className={`block truncate text-sm font-medium ${attendanceActive ? "text-brand-purple" : "text-ink"}`}>
            Attendance
          </span>
          <span className="block truncate text-xs text-muted">Your daily check-in &amp; out</span>
        </span>
      </Link>

      {/* Not a link: a placeholder so the menu's "room for more" shape is
          visible before a second report kind actually exists. */}
      <div className="flex cursor-not-allowed items-start gap-3 rounded-xl px-3 py-2.5 opacity-60">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-page text-muted">
          <BarChartIcon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 truncate text-sm font-medium text-muted">
            More reports
            <span className="rounded-full bg-page px-1.5 py-0.5 text-[10px] font-semibold text-muted">Later</span>
          </span>
          <span className="block truncate text-xs text-muted">New items can be added here</span>
        </span>
      </div>
    </div>
  );
}

/**
 * The signed-in Member's header for `/home`.
 * Nav: Home | Products ▾ | Claude Usage | Reports & Records ▾
 * Right: Notifications, Activity, User chip.
 */
// onOpenNotifications is gone from this header on purpose: notification
// settings now live on /account/settings, so the user menu here is
// Profile, Settings, and Log out.
//
// `onOpenProfile` is accepted (not required) only so existing callers that
// still pass it down to HomeFooter's own, separate Profile trigger don't
// need to change. This header's own "Profile" item opens its own
// ProfileModal instead, so it works on every page that renders this header —
// including /account/settings, which passes no callback.
export function MemberHeader({
  products,
}: {
  products: NavProduct[];
  onOpenProfile?: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const clusterRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const user = useCurrentUser();
  const { signOut, isSigningOut } = useSession();
  const notifications = useNotifications();
  const activity = useActivityFeed();
  // Same rule as the admin Topbar's panel: this lists what the badge counts and
  // nothing else. A `user` never sees that header — /home is where this role
  // lands — so a fix made only there is a fix most of the people using this
  // product never get.
  const [activityFilter, setActivityFilter] = useState<PanelFilter>("all");
  // "Unread" is live, not a snapshot: a clicked row is read, so it leaves this
  // list at once. "All" is where it can still be read back.
  const visibleActivity =
    activityFilter === "unread" ? activity.items.filter((item) => !item.read) : activity.items;

  const [notificationFilter, setNotificationFilter] = useState<PanelFilter>("all");
  const visibleNotifications =
    notificationFilter === "unread"
      ? notifications.items.filter((n) => !n.read)
      : notifications.items;

  // See the open-effect below: read through refs so choosing a tab does not
  // re-run every time a count moves.
  const activityCountRef = useRef(activity.count);
  activityCountRef.current = activity.count;
  const unreadCountRef = useRef(notifications.unreadCount);
  unreadCountRef.current = notifications.unreadCount;

  // The HRMS report a feed row was clicked to open. Held here only while the
  // dialog is up; the report itself never reaches this component (ADR-042).
  const [openReport, setOpenReport] = useState<NotificationItem | null>(null);

  /**
   * Opens the activity panel on whichever tab has something in it — "Unread"
   * while anything is unread, "All" once nothing is. Without this, clearing
   * the last row while on "Unread" left every later open showing an empty
   * panel over a feed that still had rows in it. Only on open, and the count
   * is read through a ref so the tab cannot move mid-click. The bell opens the
   * same way, for the same reason.
   */
  useEffect(() => {
    if (openMenu === "mail") {
      setActivityFilter(activityCountRef.current > 0 ? "unread" : "all");
    }
    if (openMenu === "bell") {
      setNotificationFilter(unreadCountRef.current > 0 ? "unread" : "all");
    }
  }, [openMenu]);

  const isProductsActive =
    pathname?.startsWith("/docs/") || pathname?.startsWith("/admin/products");
  const isReportsActive = pathname?.startsWith("/reports/") ?? false;
  const isSettingsActive = pathname?.startsWith("/account/settings") ?? false;

  // Close right-side cluster on outside click
  useEffect(() => {
    if (!openMenu || openMenu === "products" || openMenu === "reports") return;
    function onClick(e: MouseEvent) {
      if (clusterRef.current && !clusterRef.current.contains(e.target as Node))
        setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  // Close products dropdown on outside click
  useEffect(() => {
    if (openMenu !== "products") return;
    function onClick(e: MouseEvent) {
      if (productsRef.current && !productsRef.current.contains(e.target as Node))
        setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  // Close reports dropdown on outside click
  useEffect(() => {
    if (openMenu !== "reports") return;
    function onClick(e: MouseEvent) {
      if (reportsRef.current && !reportsRef.current.contains(e.target as Node))
        setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  function toggleMenu(key: MenuKey) {
    setOpenMenu((current) => (current === key ? null : key));
  }

  const navLinkClass = (active: boolean) =>
    `header-nav-link flex h-[72px] items-center gap-1.5 border-b-2 text-[16px] font-medium transition-all hover:border-brand-purple hover:font-bold hover:text-ink ${
      active ? "header-nav-link-active border-brand-purple font-bold text-ink" : "border-transparent text-muted"
    }`;

  return (
    <>
      <MemberThemeSync />
      <header className="sticky top-0 z-30 border-b border-border bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">

        {/* Logo — two images, dark mode's own CSS (globals.css) shows/hides
            each one; no JS theme read needed, consistent with how every
            other dark-mode rule in this shell works. */}
        <Link href="/home" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-coc-docs-platform.png"
            alt="Coc Docs Platform"
            className="logo-light h-[55px] w-auto rounded-lg"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-coc-docs-platform-dark-mode.png"
            alt="Coc Docs Platform"
            className="logo-dark hidden h-[55px] w-auto rounded-lg"
          />
        </Link>

        {/* Primary nav */}
        <nav className="hidden items-center gap-7 md:flex">
          {/* Home */}
          <Link href="/home" className={navLinkClass(pathname === "/home")}>
            Home
          </Link>

          {/* Products dropdown */}
          <div ref={productsRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openMenu === "products"}
              onClick={() => toggleMenu("products")}
              className={`${navLinkClass(isProductsActive)} gap-1`}
            >
              Products
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-150 ${
                  openMenu === "products" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMenu === "products" && (
              <ProductsDropdown
                products={products.filter((p) => p.key !== "ax-renewal")}
                onClose={() => setOpenMenu(null)}
              />
            )}
          </div>

          {/* Claude Usage's own nav link retired: the personal view moved
              into /account/settings's own Claude Usage section instead of
              being a page of its own (/my-claude-usage now redirects
              there). Admin/super_admin still reach the team-wide roster,
              `/claude-usage`, from the admin sidebar's own ADMINISTRATION
              section (nav-config.ts) — unaffected, unchanged. */}

          {/* Reports & Records dropdown — Attendance today, built so a
              second report kind has somewhere to go without another nav
              item. Visible to every role that reaches this header at all
              (RequireMemberSession already gates that), including
              `user`/`developer`, who have no admin-app equivalent since
              ADR-086. */}
          <div ref={reportsRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openMenu === "reports"}
              onClick={() => toggleMenu("reports")}
              className={`${navLinkClass(isReportsActive)} gap-1`}
            >
              Reports &amp; Records
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-150 ${
                  openMenu === "reports" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openMenu === "reports" && <ReportsDropdown onClose={() => setOpenMenu(null)} />}
          </div>
        </nav>

        {/* Right-side chrome */}
        <div className="flex items-center gap-2" ref={clusterRef}>

          {/* Notifications */}
          <div className="relative">
            <CountIcon
              count={notifications.unreadCount}
              label="Notifications"
              active={openMenu === "bell"}
              onClick={() => toggleMenu("bell")}
            >
              <BellIcon className="h-5 w-5" />
            </CountIcon>

            {openMenu === "bell" && (
              <div role="menu" className={PANEL_CLASSES}>
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-ink">Notifications</p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {(["unread", "all"] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNotificationFilter(key)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                          notificationFilter === key
                            ? "bg-brand-purple/10 text-brand-purple"
                            : "border border-border text-muted hover:bg-page"
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => notifications.markAllRead()}
                      disabled={notifications.unreadCount === 0}
                      className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
                    >
                      Read all
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {visibleNotifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted">
                      {notificationFilter === "unread"
                        ? "You're all caught up."
                        : "Nothing needs your attention."}
                    </p>
                  ) : (
                    visibleNotifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        role="menuitem"
                        // Marks read and nothing else, unlike the admin Topbar's
                        // bell, which opens an approval or sign-in dialog on the
                        // same click. Those dialogs are a super_admin's tools and
                        // this header never mounts them — a click that silently
                        // did nothing would be worse than one that plainly
                        // acknowledges. "Notifications" in the footer opens the
                        // full list for anything that needs more than a glance.
                        onClick={() => notifications.markRead(n.id)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page ${
                          n.read ? "" : "bg-brand-purple/5"
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm text-ink ${
                              n.read ? "font-medium" : "font-semibold"
                            }`}
                          >
                            {n.title}
                          </span>
                          <span className="block truncate text-xs text-muted">{n.detail}</span>
                        </span>
                        {!n.read && (
                          <span
                            aria-label="Unread"
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-purple"
                          />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="relative">
            <CountIcon
              count={activity.count}
              label="Activity"
              active={openMenu === "mail"}
              onClick={() => toggleMenu("mail")}
            >
              <MailIcon className="h-5 w-5" />
            </CountIcon>

            {openMenu === "mail" && (
              <div role="menu" className={PANEL_CLASSES}>
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-ink">Activity</p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {(["unread", "all"] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActivityFilter(key)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                          activityFilter === key
                            ? "bg-brand-purple/10 text-brand-purple"
                            : "border border-border text-muted hover:bg-page"
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                    {/* Not a filter, so it never shows "active" — a one-shot
                        action grouped with the tabs because that is where the
                        person is already looking when they want it. */}
                    <button
                      type="button"
                      onClick={() => activity.markAllRead()}
                      disabled={activity.count === 0}
                      className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
                    >
                      Read all
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {visibleActivity.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-muted">
                      {activityFilter === "unread" ? "You're all caught up." : "Nothing recent."}
                    </p>
                  ) : (
                    visibleActivity.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                        activity.markRead(item.id);
                        // An HRMS row has a report behind it; every other row
                        // is the whole of what happened and has nothing to open.
                        if (isHrmsReport(item)) {
                          setOpenReport(item);
                          setOpenMenu(null);
                        }
                      }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page ${
                          item.read ? "" : "bg-brand-purple/5"
                        }`}
                      >
                        <ActivityAvatar item={item} />
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm text-ink ${
                              item.read ? "font-medium" : "font-semibold"
                            }`}
                          >
                            {actorName(item)}
                          </span>
                          <span className="block truncate text-xs text-muted">{item.summary}</span>
                          <span className="mt-0.5 block text-[11px] text-muted">{timeAgo(item.occurredAt)}</span>
                        </span>
                        {/* A status now that "All" exists: under that tab it is
                            what tells the two kinds of row apart. */}
                        {!item.read && (
                          <span
                            aria-label="Unread"
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-purple"
                          />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User chip */}
          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => toggleMenu("user")}
              aria-haspopup="menu"
              aria-expanded={openMenu === "user"}
              className="flex min-w-0 items-center gap-2 rounded-xl bg-gray-100 py-0.5 pl-1 pr-2.5 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
            >
              <UserAvatar
                avatarUrl={user?.avatarUrl ?? null}
                initials={user?.initials ?? "?"}
                name={user?.name ?? "Guest"}
                className={`h-8 w-8 ${AVATAR_GRADIENTS.purple}`}
              />
              <div className="hidden min-w-0 text-left sm:block">
                <p className="truncate text-sm font-semibold text-ink">{user?.name ?? "Guest"}</p>
                <p className="truncate text-xs text-muted">{user?.role ?? ""}</p>
              </div>
              <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" />
            </button>

            {openMenu === "user" && (
              <div role="menu" className={`${PANEL_CLASSES} w-[200px]`}>
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                  <UserAvatar
                    avatarUrl={user?.avatarUrl ?? null}
                    initials={user?.initials ?? "?"}
                    name={user?.name ?? "Guest"}
                    className={`h-9 w-9 ${AVATAR_GRADIENTS.purple}`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user?.name ?? "Guest"}</p>
                    <p className="truncate text-xs text-muted">{user?.role ?? ""}</p>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null);
                      setShowProfile(true);
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-page"
                  >
                    <PersonIcon className="h-4 w-4 text-muted" />
                    Profile
                  </button>
                  <Link
                    href="/account/settings"
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                    className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors hover:bg-page ${
                      isSettingsActive ? "bg-brand-purple/10 text-brand-purple" : "text-ink"
                    }`}
                  >
                    <GearIcon className={`h-4 w-4 ${isSettingsActive ? "text-brand-purple" : "text-muted"}`} />
                    Settings
                  </Link>
                </div>
                <div className="border-t border-border py-1">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isSigningOut}
                    aria-busy={isSigningOut}
                    onClick={() => void signOut()}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? <Spinner /> : <LogOutIcon className="h-4 w-4" />}
                    {isSigningOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    {openReport && <HrmsReportModal item={openReport} onClose={() => setOpenReport(null)} />}
    {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </header>
    </>
  );
}
