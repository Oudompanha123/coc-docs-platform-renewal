"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/layout/UserAvatar";
import {
  BellIcon,
  ChevronDownIcon,
  LogOutIcon,
  MailIcon,
  PersonIcon,
  SettingsIcon,
} from "@/components/layout/icons";
import { ProductNavDropdown } from "@/components/home/ProductNavDropdown";
import { Spinner } from "@/components/layout/Spinner";
import { actorInitials, actorName, timeAgo } from "@/lib/notify/activity";
import { useActivityFeed } from "@/lib/notify/useActivityFeed";
import { useNotifications } from "@/lib/notify/useNotifications";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import type { NavProduct } from "@/lib/docs/nav-api";

type MenuKey = "bell" | "mail" | "user";

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

/**
 * The signed-in Member's own header for `/home` — same product links as
 * `/welcome`'s nav, but the right side shows real account chrome (bell, mail,
 * user chip) instead of Log in/Start free, since this reader is already
 * signed in. Built independently of `/welcome`'s header rather than importing
 * it, per this task's own "independent file" decision.
 */
export function MemberHeader({
  products,
  onOpenProfile,
  onOpenNotifications,
}: {
  products: NavProduct[];
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}) {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!openMenu) return;
    function onClick(e: MouseEvent) {
      if (clusterRef.current && !clusterRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  function toggleMenu(key: MenuKey) {
    setOpenMenu((current) => (current === key ? null : key));
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
          <img src="/logo-coc-docs-platform.png" alt="Coc Docs Platform" className="h-[55px] w-auto rounded-lg" />
        </div>

        <nav className="hidden items-center gap-7 text-[18px] font-medium text-muted md:flex">
          <Link
            href="/home"
            className={`flex h-[72px] items-center border-b-2 transition-all hover:border-brand-purple hover:font-bold hover:text-ink ${
              pathname === "/home" ? "border-brand-purple font-bold text-ink" : "border-transparent"
            }`}
          >
            Home
          </Link>
          {products.map((product) => (
            <ProductNavDropdown key={product.key} product={product} />
          ))}
        </nav>

        <div className="flex items-center gap-2" ref={clusterRef}>
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
                        // Clears this line only — the badge goes down by one.
                        // "Mark all as read" in the header clears the lot.
                        onClick={() => activity.markRead(item.id)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page ${
                          item.read ? "" : "bg-brand-purple/5"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_GRADIENTS.purple}`}
                        >
                          {actorInitials(item)}
                        </span>
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
              <div role="menu" className={`${PANEL_CLASSES} w-64`}>
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
                      onOpenProfile();
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-page"
                  >
                    <PersonIcon className="h-4 w-4 text-muted" />
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenu(null);
                      onOpenNotifications();
                    }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-page"
                  >
                    <SettingsIcon className="h-4 w-4 text-muted" />
                    Notifications
                  </button>
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
    </header>
  );
}
