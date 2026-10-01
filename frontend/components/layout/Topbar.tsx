"use client";

import { useEffect, useRef, useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useSession } from "@/lib/auth/SessionProvider";
import { useNotifications } from "@/lib/notify/useNotifications";
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
  ChevronDownIcon,
  LogOutIcon,
  MailIcon,
  MenuIcon,
  MoonIcon,
  PersonIcon,
  SettingsIcon,
  SunIcon,
} from "./icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileModal } from "./ProfileModal";
import { Spinner } from "./Spinner";
import { useShell } from "@/lib/layout/ShellContext";

type TopbarProps = {
  onMenuClick: () => void;
};

type MenuKey = "notifications" | "mail" | "user";

/** Same panel container the Users & Roles ⋯ menu uses: rounded-xl border
 *  border-border bg-white shadow-lg, with hover:bg-page on each item. */
const PANEL_CLASSES = "absolute right-0 z-20 mt-2 rounded-xl border border-border bg-white shadow-lg";

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
      className="relative rounded-xl bg-gray-100 p-2.5 text-dash-ink/70 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
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

type NotificationFilter = "unread" | "all";

export function Topbar({ onMenuClick }: TopbarProps) {
  const { header: { title, subtitle, titleIcon } } = useShell();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  // Which of the bell's own items are shown — a client-side filter over the
  // same list useNotifications already holds, not a second fetch: this
  // panel never needs more than the 30 rows the inbox already returns.
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>("all");
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
    // is its own full-screen app, not a page of this shell (ADR-074).
    onOpenProject: (projectId) =>
      window.open(`/ax-renewal?project=${encodeURIComponent(projectId)}`, "_blank", "noopener,noreferrer"),
  });
  const visibleNotifications =
    notificationFilter === "unread"
      ? notifications.items.filter((n) => !n.read)
      : notifications.items;

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
    <header className="flex items-center justify-between border-b border-border bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-start gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-xl p-2 text-dash-ink transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        {titleIcon}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-dash-ink sm:text-2xl">{title}</h1>
          <p className="truncate text-sm text-muted">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2" ref={clusterRef}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          aria-pressed={darkMode}
          className="rounded-xl bg-gray-100 p-2.5 text-dash-ink/70 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        >
          {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        <div className="relative">
          <CountBadge
            count={notifications.unreadCount}
            label="Notifications"
            active={openMenu === "notifications"}
            onClick={() => toggleMenu("notifications")}
          >
            <BellIcon className="h-5 w-5" />
          </CountBadge>

          {openMenu === "notifications" && (
            <div role="menu" className={`${PANEL_CLASSES} w-80`}>
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-dash-ink">Notifications</p>
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
                  {/* Not a filter, so it never shows "active" — a one-shot
                      action grouped with the tabs because that is where the
                      person is already looking when they want it. */}
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
                      onClick={() => {
                        // Read on open, not on acting: the person has seen it
                        // either way, and leaving it bold after they looked and
                        // decided not to act makes the badge mean "unread or
                        // ignored", which is not a number anyone can act on.
                        notifications.markRead(n.id);
                        // The hook resolves what this is about and opens the
                        // right dialog. It is one fetch, made on the click,
                        // because the notification is the record and the queue
                        // is the current state — only acting needs both.
                        void notifications.open(n);
                        setOpenMenu(null);
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page ${
                        n.read ? "" : "bg-brand-purple/5"
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
                      ) : (
                        <ApplicantAvatar
                          name={n.subjectName ?? n.title}
                          avatarUrl={n.iconUrl}
                          className="mt-0.5 h-8 w-8 text-[11px]"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm text-dash-ink ${
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
              {notifications.items.some((n) => n.type === "registration.pending") && (
                <Link
                  href="/users-roles?tab=pending"
                  onClick={() => setOpenMenu(null)}
                  className="block w-full rounded-b-xl border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-brand-purple transition-colors hover:bg-page"
                >
                  View all
                </Link>
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
            <MailIcon className="h-5 w-5" />
          </CountBadge>

          {openMenu === "mail" && (
            <div role="menu" className={`${PANEL_CLASSES} w-80`}>
              <div className="border-b border-border px-4 py-3">
                {/* "Activity", not "Messages": these are recorded events, not
                    mail from a person. The old label invited people to look
                    for a Reply button that was never going to exist. */}
                <p className="text-sm font-semibold text-dash-ink">Activity</p>
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
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page ${
                        item.read ? "" : "bg-brand-purple/5"
                      }`}
                    >
                      <ActivityAvatar item={item} />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm text-dash-ink ${
                            item.read ? "font-medium" : "font-semibold"
                          }`}
                        >
                          {actorName(item)}
                        </span>
                        <span className="block truncate text-xs text-muted">{item.summary}</span>
                        <span className="mt-0.5 block text-[11px] text-muted">
                          {timeAgo(item.occurredAt)}
                        </span>
                      </span>
                      {/* Now that "All" exists, the dot is a status again and
                          not just an affordance: under that tab it is what
                          tells the two kinds of row apart. */}
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
              className={`h-8 w-8 ${userAvatar}`}
            />
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-semibold text-dash-ink">{user?.name ?? "Guest"}</p>
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
                  className={`h-9 w-9 ${userAvatar}`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dash-ink">{user?.name ?? "Guest"}</p>
                  <p className="truncate text-xs text-muted">{user?.role ?? ""}</p>
                </div>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setOpenMenu(null); setShowProfile(true); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-dash-ink transition-colors hover:bg-page"
                >
                  <PersonIcon className="h-4 w-4 text-muted" />
                  My Profile
                </button>
                <Link
                  href="/settings"
                  role="menuitem"
                  onClick={() => setOpenMenu(null)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-dash-ink transition-colors hover:bg-page"
                >
                  <SettingsIcon className="h-4 w-4 text-muted" />
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
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}

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
    </div>
  );
}
