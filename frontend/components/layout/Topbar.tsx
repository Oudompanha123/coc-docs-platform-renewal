"use client";

import { useEffect, useRef, useState } from "react";
import { PanelLeft } from "lucide-react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useSession } from "@/lib/auth/SessionProvider";
import { useNotifications } from "@/lib/notify/useNotifications";
import { HISTORY_PAGE_SIZE, useNotificationHistory } from "@/lib/notify/useNotificationHistory";
import { useActivityFeed, type ActivityItem } from "@/lib/notify/useActivityFeed";
import { actorName, isHrmsReport, timeAgo } from "@/lib/notify/activity";
import { HrmsReportModal } from "./HrmsReportModal";
import { ApproveRegistrationModal } from "./ApproveRegistrationModal";
import { NewSignInModal } from "./NewSignInModal";
import { ApplicantAvatar } from "./ApplicantAvatar";
import { ActivityAvatar } from "./ActivityAvatar";
import type { PendingAccount } from "@/lib/admin/accounts";
import type { SessionSummary } from "@/lib/auth/api";
import { UserAvatar } from "./UserAvatar";
import { ShieldIcon } from "@/components/auth/icons";
import {
  BellIcon,
  LogOutIcon,
  AuditIcon,
  MenuIcon,
  MoonIcon,
  PersonIcon,
  SettingsIcon,
  SunIcon,
} from "./icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileModal } from "./ProfileModal";
import { AnnouncementModal } from "@/components/announcements/AnnouncementModal";
import { AnnouncementBellIcon } from "@/components/announcements/AnnouncementBellIcon";
import { Spinner } from "./Spinner";
import { useShell } from "@/lib/layout/ShellContext";

type TopbarProps = {
  onMenuClick: () => void;
};

type MenuKey = "notifications" | "mail" | "user";

/** Same panel container the Users & Roles ⋯ menu uses: rounded-xl border
 *  border-surface-border bg-card shadow-lg, with hover:bg-accent on each item. */
const PANEL_CLASSES = "absolute right-0 z-20 mt-2 overflow-hidden rounded-lg border border-surface-border bg-popover text-popover-foreground shadow-md";

function CountBadge({
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
      aria-label={`${label}, ${count} unread`}
      aria-haspopup="menu"
      aria-expanded={active}
      className="relative flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

type NotificationFilter = "unread" | "all";

export function Topbar({ onMenuClick }: TopbarProps) {
  const { header: { title, subtitle, titleIcon }, sidebarCollapsed, toggleSidebar } = useShell();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  // Which of the bell's own items are shown — a client-side filter over the
  // same list useNotifications already holds, not a second fetch: this
  // panel never needs more than the 30 rows the inbox already returns.
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("all");
  // "View all notifications" expands the bell in place (ADR-106): the list
  // switches to the paged history and loads ten more each time it is
  // scrolled to the bottom. Collapsed again whenever the panel reopens.
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const notificationListRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  // The signed-in caller's real name/role (GET /api/v1/auth/me) — "Guest"
  // until that resolves or for a visitor with no session, since this shell
  // has no route guard of its own yet.
  const user = useCurrentUser();
  const { signOut, isSigningOut } = useSession();
  // The bell no longer renders three invented items that never changed. It
  // carries two real things: who is waiting for approval, which only a super
  // admin sees (ADR-025), and whether this account was signed in to from a
  // device it has not been used on, which only its owner sees (ADR-027).
  const notifications = useNotifications({
    // A clicked banner, or an app opened by one, lands in the same dialog as
    // clicking the item in the bell. The reader acts from wherever they are.
    onOpenApproval: (account) => setApproving(account),
    onOpenSignIn: (session) => setReviewingSignIn(session),
    // A new tab, the same as the sidebar's own AX Renewal link: the workspace
    // is its own full-screen app, not a page of this shell (ADR-075).
    onOpenProject: (projectId) =>
      window.open(`/ax-renewal?project=${encodeURIComponent(projectId)}`, "_blank", "noopener,noreferrer"),
    onOpenAnnouncement: (announcementId) => setOpenAnnouncement(announcementId),
  });
  const filteredNotifications =
    notificationFilter === "unread"
      ? notifications.items.filter((n) => !n.read)
      : notifications.items;
  const history = useNotificationHistory(
    openMenu === "notifications" && notificationsExpanded,
    notificationFilter === "unread",
    notifications.refresh,
  );
  const visibleNotifications = notificationsExpanded
    ? history.items
    : filteredNotifications.slice(0, HISTORY_PAGE_SIZE);
  // Offered when there is more than the first ten to see: more in the list
  // already held, or a full list from the bell's endpoint (thirty newest),
  // which means older rows exist on the server.
  const canExpandNotifications =
    !notificationsExpanded &&
    (filteredNotifications.length > HISTORY_PAGE_SIZE || notifications.items.length >= 30);

  /** Loads the next page once the list is scrolled to within a row of its end. */
  function onNotificationListScroll() {
    const list = notificationListRef.current;
    if (!notificationsExpanded || !list) return;
    if (list.scrollTop + list.clientHeight >= list.scrollHeight - 48) history.loadMore();
  }

  // The mail icon, likewise, no longer renders five invented names. A
  // super_admin sees everyone's activity here; every other role sees only
  // their own, decided server-side (NFR-SEC-PII).
  const activity = useActivityFeed();
  // Same two-way filter as the bell above, for the same reason: a panel that
  // listed only unread had no way back to what you had just cleared, and a
  // panel that listed everything made a badge saying zero sit over a full
  // list. The tab is the answer to both — "Unread" is what the badge counts,
  // "All" is the history — and it costs no second fetch, being a filter over
  // the twenty rows the feed already holds.
  const [activityFilter, setActivityFilter] = useState<NotificationFilter>("all");
  // "Unread" is live, not a snapshot: a clicked row is read, so it leaves this
  // list at once. "All" is where it can still be read back.
  const visibleActivity =
    activityFilter === "unread" ? activity.items.filter((item) => !item.read) : activity.items;
  // Read by the open-effect below without making them dependencies: a tab is
  // chosen when its panel opens, not re-chosen every time a count moves.
  const activityCountRef = useRef(activity.count);
  activityCountRef.current = activity.count;
  const unreadCountRef = useRef(notifications.unreadCount);
  unreadCountRef.current = notifications.unreadCount;
  // The applicant whose notification was clicked — approving from the bell
  // rather than making the reader navigate to another page to act on a
  // one-line decision.
  const [approving, setApproving] = useState<PendingAccount | null>(null);
  // The unfamiliar session whose alert was clicked, shown with the detail and
  // the button that ends it. Same reasoning: the answer to "was that you?"
  // belongs where the question was asked.
  const [reviewingSignIn, setReviewingSignIn] = useState<SessionSummary | null>(null);
  // The announcement a bell row was clicked to open (ADR-098). Just the id:
  // the modal fetches the current text itself.
  const [openAnnouncement, setOpenAnnouncement] = useState<string | null>(null);
  // The HRMS report a feed row was clicked to open. Held here only while the
  // dialog is up; the report itself never reaches this component (ADR-042).
  const [openReport, setOpenReport] = useState<ActivityItem | null>(null);
  const userAvatar = AVATAR_GRADIENTS.purple;

  // Topbar renders on every admin page (via AppShell), so this is what
  // actually re-applies a previously-chosen theme on a fresh page load —
  // without this, the stored choice would only ever be re-applied while
  // the Settings page's own Appearance card happened to be mounted.
  useEffect(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    setDarkMode(stored === "dark");
  }, []);

  /**
   * Opens the activity panel on whichever tab has something in it.
   *
   * <p>The tab is component state and this header never unmounts, so a choice
   * made once held for the rest of the session. Clear the last unread item
   * while on "Unread" and every reopen after that showed an empty panel —
   * over a feed with four things in it. The badge said zero and the list
   * agreed, and both were answering a question nobody had asked.
   *
   * <p>Only on open. The count is read through a ref so that clearing the last
   * row does not flip the tab out from under the person mid-click. The bell
   * opens the same way: its tabs came from elsewhere without this, so it had
   * the same trap — read everything while on "Unread" and it stayed empty.
   */
  useEffect(() => {
    if (openMenu === "mail") {
      setActivityFilter(activityCountRef.current > 0 ? "unread" : "all");
    }
    if (openMenu === "notifications") {
      setNotificationFilter(unreadCountRef.current > 0 ? "unread" : "all");
    }
    setNotificationsExpanded(false);
  }, [openMenu]);

  useEffect(() => {
    if (!openMenu) return;
    function onClick(e: MouseEvent) {
      if (clusterRef.current && !clusterRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenu]);

  function toggleTheme() {
    const next = darkMode ? "light" : "dark";
    applyTheme(next);
    setDarkMode(!darkMode);
    setOpenMenu(null);
  }

  function toggleMenu(key: MenuKey) {
    setOpenMenu((current) => (current === key ? null : key));
  }

  return (
    <div className="contents">
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-surface-border bg-background px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="-ml-1 flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        >
          <MenuIcon className="size-4" />
        </button>
        {/* Desktop: folds the sidebar to its icon rail and back — shadcn's
            SidebarTrigger, with the same panel glyph (ADR-104 r2.9). Below lg
            the sidebar is a drawer, opened by the menu button above. */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!sidebarCollapsed}
          aria-controls="admin-sidebar"
          className="-ml-1 hidden size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:flex"
        >
          <PanelLeft className="size-4" aria-hidden="true" />
        </button>
        <span aria-hidden="true" className="mr-1 hidden h-4 w-px bg-surface-border lg:block" />
        {titleIcon}
        <div className="min-w-0">
          <h1 className="truncate text-lg leading-tight font-semibold text-foreground">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2" ref={clusterRef}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          aria-pressed={darkMode}
          className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {darkMode ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
        </button>

        <div className="relative">
          <CountBadge
            count={notifications.unreadCount}
            label="Notifications"
            active={openMenu === "notifications"}
            onClick={() => toggleMenu("notifications")}
          >
            <BellIcon className="size-4" />
          </CountBadge>

          {openMenu === "notifications" && (
            <div role="menu" className={`${PANEL_CLASSES} w-80`}>
              <div className="border-b border-surface-border px-4 py-3">
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
                          : "border border-surface-border text-muted-foreground hover:bg-accent"
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
                    onClick={() => {
                      notifications.markAllRead();
                      if (notificationsExpanded) history.markAllReadLocal();
                    }}
                    disabled={notifications.unreadCount === 0}
                    className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
                  >
                    Read all
                  </button>
                </div>
              </div>
              <div
                ref={notificationListRef}
                onScroll={onNotificationListScroll}
                data-testid="notification-list"
                className="max-h-80 overflow-y-auto py-1"
              >
                {visibleNotifications.length === 0 && notificationsExpanded && (history.loading || history.error) ? null : visibleNotifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
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
                      onClick={() => {
                        // Read on open, not on acting: the person has seen it
                        // either way, and leaving it bold after they looked and
                        // decided not to act makes the badge mean "unread or
                        // ignored", which is not a number anyone can act on.
                        if (notificationsExpanded) history.markRead(n.id);
                        else notifications.markRead(n.id);
                        // The hook resolves what this is about and opens the
                        // right dialog. It is one fetch, made on the click,
                        // because the notification is the record and the queue
                        // is the current state — only acting needs both.
                        void notifications.open(n);
                        setOpenMenu(null);
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                        n.read ? "" : "bg-secondary"
                      }`}
                    >
                      {n.type === "auth.new-device" ? (
                        // A shield, not a face. This notification is about a
                        // browser, and the account owner's own picture beside
                        // it would read as "we know who this was" — which is
                        // the one thing nobody knows yet.
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
                          <ShieldIcon className="h-4 w-4" />
                        </span>
                      ) : n.type === "announcement.published" ? (
                        // Nobody's face: an announcement is from the team, not
                        // a person the reader needs to recognise. Its
                        // category's icon instead.
                        <AnnouncementBellIcon category={n.category} className="mt-0.5" />
                      ) : (
                        <ApplicantAvatar
                          name={n.subjectName ?? n.title}
                          avatarUrl={n.iconUrl}
                          className="mt-0.5 h-8 w-8 text-[11px]"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm text-foreground ${
                            n.read ? "font-medium" : "font-semibold"
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{n.detail}</span>
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
                {notificationsExpanded && history.loading && (
                  <div role="status" className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                    <Spinner className="size-4" />
                    Loading…
                  </div>
                )}
                {notificationsExpanded && !history.loading && history.error && (
                  <p role="alert" className="px-4 py-3 text-center text-xs text-danger">
                    {history.error}
                  </p>
                )}
                {notificationsExpanded &&
                  !history.loading &&
                  !history.error &&
                  !history.hasMore &&
                  history.items.length > 0 && (
                    <p className="px-4 py-3 text-center text-xs text-muted-foreground">You&apos;re all caught up.</p>
                  )}
              </div>
              {canExpandNotifications && (
                <button
                  type="button"
                  onClick={() => setNotificationsExpanded(true)}
                  className="block w-full border-t border-surface-border px-4 py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  View all notifications
                </button>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <CountBadge
            count={activity.count}
            label="Activity"
            active={openMenu === "mail"}
            onClick={() => toggleMenu("mail")}
          >
            <AuditIcon className="size-4" />
          </CountBadge>

          {openMenu === "mail" && (
            <div role="menu" className={`${PANEL_CLASSES} w-80`}>
              <div className="border-b border-surface-border px-4 py-3">
                {/* "Activity", not "Messages": these are recorded events, not
                    mail from a person. The old label invited people to look
                    for a Reply button that was never going to exist. */}
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
                          : "border border-surface-border text-muted-foreground hover:bg-accent"
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
                    className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent"
                  >
                    Read all
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {visibleActivity.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                    {/* Two different facts. Under "Unread" an empty list means
                        caught up; under "All" it means nothing has happened. */}
                    {activityFilter === "unread" ? "You're all caught up." : "Nothing recent."}
                  </p>
                ) : (
                  visibleActivity.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      // Clears this line and only this line — the badge goes
                      // down by one, and then one of two things, or neither.
                      //
                      // An HRMS row opens its report over the panel (ADR-042):
                      // the mail is fetched on this click and there is no page
                      // to send anyone to. Every other row with somewhere to go
                      // (item.href — set server-side, per target type and the
                      // caller's own role) navigates there instead, the same
                      // shape the bell's own items use. A row that is neither
                      // is the whole of what happened, and the click is just
                      // the acknowledgement, as it was before either existed.
                      //
                      // "Mark all as read" in the header still clears the lot
                      // without leaving the panel.
                      onClick={() => {
                        activity.markRead(item.id);
                        if (isHrmsReport(item)) {
                          setOpenReport(item);
                          setOpenMenu(null);
                        } else if (item.href) {
                          setOpenMenu(null);
                          router.push(item.href);
                        }
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                        item.read ? "" : "bg-secondary"
                      }`}
                    >
                      <ActivityAvatar item={item} />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm text-foreground ${
                            item.read ? "font-medium" : "font-semibold"
                          }`}
                        >
                          {actorName(item)}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">{item.summary}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {timeAgo(item.occurredAt)}
                        </span>
                      </span>
                      {/* Now that "All" exists, the dot is a status again and
                          not just an affordance: under that tab it is what
                          tells the two kinds of row apart. */}
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

        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => toggleMenu("user")}
            aria-haspopup="menu"
            aria-expanded={openMenu === "user"}
            // Avatar only, as on the member header: the name and role are the
            // first thing in the menu this opens, and stay in the accessible
            // name so the button is still announced as the person.
            aria-label={`${user?.name ?? "Guest"}${user?.role ? `, ${user.role}` : ""}`}
            title={user?.name ?? "Guest"}
            className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar
              avatarUrl={user?.avatarUrl ?? null}
              initials={user?.initials ?? "?"}
              name={user?.name ?? "Guest"}
              className={`h-8 w-8 ${userAvatar}`}
            />
          </button>

          {openMenu === "user" && (
            <div role="menu" className={`${PANEL_CLASSES} w-64`}>
              <div className="flex items-center gap-3 border-b border-surface-border px-4 py-3">
                <UserAvatar
                  avatarUrl={user?.avatarUrl ?? null}
                  initials={user?.initials ?? "?"}
                  name={user?.name ?? "Guest"}
                  className={`h-9 w-9 ${userAvatar}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "Guest"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.role ?? ""}</p>
                </div>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setOpenMenu(null); setShowProfile(true); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <PersonIcon className="h-4 w-4 text-muted-foreground" />
                  My Profile
                </button>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setOpenMenu(null)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                >
                  <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                  Settings
                </Link>
              </div>
              <div className="border-t border-surface-border py-1">
                <button
                  type="button"
                  role="menuitem"
                  disabled={isSigningOut}
                  aria-busy={isSigningOut}
                  onClick={() => void signOut()}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? <Spinner /> : <LogOutIcon className="h-4 w-4" />}
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {showProfile && <ProfileModal onClose={() => setShowProfile(false)} editHref="/settings" />}

    {approving && (
      <ApproveRegistrationModal
        account={approving}
        onClose={() => setApproving(null)}
        onApproved={() => void notifications.refresh()}
      />
    )}

    {reviewingSignIn && (
      <NewSignInModal
        session={reviewingSignIn}
        onClose={() => setReviewingSignIn(null)}
        onEnded={() => void notifications.refresh()}
      />
    )}

    {openReport && <HrmsReportModal item={openReport} onClose={() => setOpenReport(null)} />}

    {openAnnouncement && <AnnouncementModal id={openAnnouncement} onClose={() => setOpenAnnouncement(null)} />}
    </div>
  );
}
