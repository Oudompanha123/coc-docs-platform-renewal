"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { ActivityAvatar } from "@/components/layout/ActivityAvatar";
import { UserAvatar } from "@/components/layout/UserAvatar";
import {
  BellIcon,
  LogOutIcon,
  MailIcon,
  MoonIcon,
  PersonIcon,
  SettingsIcon,
  SunIcon,
} from "@/components/layout/icons";
import { NavMenu, NavMenuItem, productPagesBlurb } from "@/components/ui/nav-menu";
import { Spinner } from "@/components/layout/Spinner";
import { actorName, isHrmsReport, timeAgo, type NotificationItem } from "@/lib/notify/activity";
import { HrmsReportModal } from "@/components/layout/HrmsReportModal";
import { AnnouncementModal } from "@/components/announcements/AnnouncementModal";
import { AnnouncementBellIcon } from "@/components/announcements/AnnouncementBellIcon";
import { ProfilePopup } from "@/components/home/ProfilePopup";
import { useActivityFeed } from "@/lib/notify/useActivityFeed";
import { useNotifications } from "@/lib/notify/useNotifications";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { productHref } from "@/lib/home/product-links";
import { STORE_HREF, isStorePath } from "@/lib/store/store-api";
import { MemberThemeSync } from "@/components/home/MemberThemeSync";
import { applyTheme, getResolvedTheme } from "@/lib/theme";
import type { NavProduct } from "@/lib/docs/nav-api";

type MenuKey = "bell" | "mail" | "user";

/**
 * Which half of a panel's list is showing. Mirrors the admin Topbar's, and is
 * shared by both panels here — the bell and the activity feed answer the same
 * question and should not answer it in two different shapes.
 */
type PanelFilter = "unread" | "all";

// No width here: each panel sets its own. A width in this shared string
// could not be overridden by appending another — both classes would land on
// the element and the wider one won on stylesheet order.
const PANEL_CLASSES = "absolute right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-surface-border bg-popover text-popover-foreground shadow-lg";

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
      className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none font-semibold text-white ring-2 ring-background">
          {count}
        </span>
      )}
    </button>
  );
}

/** Products mega-dropdown — 2-col grid with large lavender icon tiles. */
/**
 * The signed-in Member's header for `/home`.
 * Nav: Home | Products ▾ (Attendance moved into /account/settings#attendance)
 * Right: Notifications, Activity, User chip.
 */
// onOpenNotifications is gone from this header on purpose: notification
// settings now live on /account/settings, so the user menu here is
// Profile, Settings, and Log out.
//
// `onOpenProfile` is accepted (not required) only so existing callers that
// still pass it down to HomeFooter's own, separate Profile trigger don't
// need to change — this header's own "Profile" item opens its own
// `ProfilePopup` (read-only), never that older, editable modal, so this
// prop is never called from here. "Settings" still navigates to
// /account/settings directly, same as ProfilePopup's own "Open settings".
export function MemberHeader({
  products,
}: {
  products: NavProduct[];
  onOpenProfile?: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const clusterRef = useRef<HTMLDivElement>(null);
  const userChipRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const user = useCurrentUser();
  const { signOut, isSigningOut } = useSession();
  // The announcement a bell row was clicked to open (ADR-098) — the one kind
  // of bell row on this header that has something behind it to read.
  const [openAnnouncement, setOpenAnnouncement] = useState<string | null>(null);
  const notifications = useNotifications({
    onOpenAnnouncement: (announcementId) => setOpenAnnouncement(announcementId),
  });
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
  const isSettingsActive = pathname?.startsWith("/account/settings") ?? false;

  // `MemberThemeSync` (mounted below) already re-applies a previously-chosen
  // theme to `<html>` on every load of a `data-shell="home"` page — this is
  // only what makes the button itself reflect that choice, same split
  // Topbar.tsx uses for the admin shell's own toggle.
  useEffect(() => {
    setDarkMode(getResolvedTheme() === "dark");
  }, []);

  function toggleTheme() {
    const next = darkMode ? "light" : "dark";
    applyTheme(next);
    setDarkMode(!darkMode);
  }

  // Close right-side cluster on outside click
  useEffect(() => {
    if (!openMenu) return;
    function onClick(e: MouseEvent) {
      if (clusterRef.current && !clusterRef.current.contains(e.target as Node))
        setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  function toggleMenu(key: MenuKey) {
    setOpenMenu((current) => (current === key ? null : key));
  }

  return (
    <>
      <MemberThemeSync />
      {/* Border only, no shadow — matching the admin Topbar and the AX Renewal
          bar, which were already built that way. */}
      <header className="sticky top-0 z-40 border-b border-surface-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">

        {/* Logo — two images, dark mode's own CSS (globals.css) shows/hides
            each one; no JS theme read needed, consistent with how every
            other dark-mode rule in this shell works. */}
        <Link href="/home" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-coc-docs-platform.png"
            alt="Coc Docs Platform"
            className="logo-light h-8 w-auto rounded-lg"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-coc-docs-platform-dark-mode.png"
            alt="Coc Docs Platform"
            className="logo-dark hidden h-8 w-auto rounded-lg"
          />
        </Link>

        {/* Primary nav */}
        <nav className="ml-8 mr-auto hidden items-center gap-1 md:flex">
          {/* Home */}
          <Link
            href="/home"
            aria-current={pathname === "/home" ? "page" : undefined}
            className={`inline-flex h-9 items-center rounded-3xl px-3.5 text-[15px] transition-colors outline-none hover:bg-muted-surface/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              pathname === "/home" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Home
          </Link>

          {/* Products — the shared NavMenu (ADR-104 r2.9): hover to open, a
              two-column grid of each product over its first few pages. It
              keeps its own open state, separate from the right-hand cluster's
              `openMenu`, since it now opens on hover as well as click. */}
          <NavMenu label="Products" active={isProductsActive} panelClassName="w-[440px] grid-cols-2">
            {products
              .filter((p) => p.key !== "ax-renewal")
              .map((product) => {
                const href = productHref(product.key);
                return (
                  <NavMenuItem
                    key={product.key}
                    href={href}
                    title={product.label}
                    description={productPagesBlurb(product.items) ?? "Documentation"}
                    active={pathname === href || (pathname?.startsWith(`${href}/`) ?? false)}
                  />
                );
              })}
          </NavMenu>

          {/* Store (ADR-108) — the listing, /store, and each app's page, /store-<number>. */}
          <Link
            href={STORE_HREF}
            aria-current={isStorePath(pathname) ? "page" : undefined}
            className={`inline-flex h-9 items-center rounded-3xl px-3.5 text-[15px] transition-colors outline-none hover:bg-muted-surface/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              isStorePath(pathname) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Store
          </Link>

          {/* Claude Usage's own nav link retired: the personal view moved
              into /account/settings's own Claude Usage section instead of
              being a page of its own (/my-claude-usage now redirects
              there). Admin/super_admin still reach the team-wide roster,
              `/claude-usage`, from the admin sidebar's own ADMINISTRATION
              section (nav-config.ts) — unaffected, unchanged. */}

          {/* Reports & Records dropdown retired: its one real item, Attendance,
              moved into /account/settings#attendance (/reports/attendance
              redirects there, next.config.ts). */}
        </nav>

        {/* Right-side chrome */}
        <div className="flex items-center gap-2" ref={clusterRef}>

          {/* Theme toggle — the same round ghost button as the bell and mail beside it */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            aria-pressed={darkMode}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {darkMode ? <SunIcon className="size-[18px]" /> : <MoonIcon className="size-[18px]" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <CountIcon
              count={notifications.unreadCount}
              label="Notifications"
              active={openMenu === "bell"}
              onClick={() => toggleMenu("bell")}
            >
              <BellIcon className="size-[18px]" />
            </CountIcon>

            {openMenu === "bell" && (
              <div role="menu" className={`${PANEL_CLASSES} w-80`}>
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {(["unread", "all"] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setNotificationFilter(key)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                          notificationFilter === key
                            ? "bg-secondary text-foreground"
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
                      className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
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
                        //
                        // The exception is an announcement (ADR-098), which is
                        // for every reader and has its text behind it: that
                        // click opens it, too.
                        onClick={() => {
                          notifications.markRead(n.id);
                          if (n.type === "announcement.published") {
                            void notifications.open(n);
                            setOpenMenu(null);
                          }
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page ${
                          n.read ? "" : "bg-secondary"
                        }`}
                      >
                        {n.type === "announcement.published" && (
                          <AnnouncementBellIcon category={n.category} className="mt-0.5" />
                        )}
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
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
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
              <MailIcon className="size-[18px]" />
            </CountIcon>

            {openMenu === "mail" && (
              <div role="menu" className={`${PANEL_CLASSES} w-80`}>
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">Activity</p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    {(["unread", "all"] as const).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActivityFilter(key)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                          activityFilter === key
                            ? "bg-secondary text-foreground"
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
                      className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
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
                          item.read ? "" : "bg-secondary"
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
                            className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
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
              ref={userChipRef}
              type="button"
              onClick={() => toggleMenu("user")}
              aria-haspopup="menu"
              aria-expanded={openMenu === "user"}
              // Avatar only, at the product owner's request: the name and role
              // are already the first thing in the menu this opens. They stay
              // in the accessible name, so the button is still "Dana Lee",
              // not an unlabelled picture.
              aria-label={`${user?.name ?? "Guest"}${user?.role ? `, ${user.role}` : ""}`}
              title={user?.name ?? "Guest"}
              className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <UserAvatar
                avatarUrl={user?.avatarUrl ?? null}
                initials={user?.initials ?? "?"}
                name={user?.name ?? "Guest"}
                className={`size-8 ${AVATAR_GRADIENTS.purple}`}
              />
            </button>

            {openMenu === "user" && (
              // shadcn's dropdown-menu shape (ADR-104 r2.9): a padded panel of
              // rounded rows with a grey hover, rather than full-bleed stripes.
              <div role="menu" className={`${PANEL_CLASSES} w-48 p-1`}>
                <div className="flex items-center gap-3 px-2 py-2">
                  <UserAvatar
                    avatarUrl={user?.avatarUrl ?? null}
                    initials={user?.initials ?? "?"}
                    name={user?.name ?? "Guest"}
                    className={`h-9 w-9 ${AVATAR_GRADIENTS.purple}`}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "Guest"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.role ?? ""}</p>
                  </div>
                </div>
                <div aria-hidden="true" className="-mx-1 my-1 h-px bg-surface-border" />
                <div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null);
                      setShowProfilePopup(true);
                    }}
                    className="flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm text-foreground transition-colors outline-none hover:bg-accent focus-visible:bg-accent"
                  >
                    <PersonIcon className="size-4 text-muted-foreground" />
                    Profile
                  </button>
                  <Link
                    href="/account/settings"
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                    className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm text-foreground transition-colors outline-none hover:bg-accent focus-visible:bg-accent ${
                      isSettingsActive ? "bg-accent" : ""
                    }`}
                  >
                    <SettingsIcon className="size-4 text-muted-foreground" />
                    Settings
                  </Link>
                </div>
                <div aria-hidden="true" className="-mx-1 my-1 h-px bg-surface-border" />
                <div>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isSigningOut}
                    aria-busy={isSigningOut}
                    onClick={() => void signOut()}
                    className="flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm text-destructive transition-colors outline-none hover:bg-destructive/10 focus-visible:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSigningOut ? <Spinner /> : <LogOutIcon className="size-4" />}
                    {isSigningOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Outside <header> on purpose: the header is sticky and blurred, and a
        `backdrop-filter` makes an element the containing block for its
        `position: fixed` descendants — inside it, these full-screen dialogs
        were sized to the 60px bar and stuck to the top of the page. */}
    {openReport && <HrmsReportModal item={openReport} onClose={() => setOpenReport(null)} />}
    {openAnnouncement && <AnnouncementModal id={openAnnouncement} onClose={() => setOpenAnnouncement(null)} />}
    {showProfilePopup && (
      <ProfilePopup
        onClose={() => {
          setShowProfilePopup(false);
          userChipRef.current?.focus();
        }}
      />
    )}
    </>
  );
}
