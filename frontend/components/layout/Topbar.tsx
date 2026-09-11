"use client";

import { useEffect, useRef, useState } from "react";
import { CURRENT_USER, MESSAGES, NOTIFICATIONS, TOPBAR_COUNTS } from "@/lib/mock/overview";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import {
  BellIcon,
  ChevronDownIcon,
  GearIcon,
  LogOutIcon,
  MailIcon,
  MenuIcon,
  MoonIcon,
  PersonIcon,
  SunIcon,
} from "./icons";

type TopbarProps = {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  /** A pre-rendered element, not a component reference — Overview and
   *  Settings are Server Components, and passing a bare function down into
   *  this Client Component isn't serializable across that boundary. Each
   *  page renders its own `<XIcon className="..." />` instead. */
  titleIcon?: React.ReactNode;
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

export function Topbar({ title, subtitle, onMenuClick, titleIcon }: TopbarProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const userAvatar = AVATAR_GRADIENTS[CURRENT_USER.tone];

  // Topbar renders on every admin page (via AppShell), so this is what
  // actually re-applies a previously-chosen theme on a fresh page load —
  // without this, the stored choice would only ever be re-applied while
  // the Settings page's own Appearance card happened to be mounted.
  useEffect(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    setDarkMode(stored === "dark");
  }, []);

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
            count={TOPBAR_COUNTS.notifications}
            label="Notifications"
            active={openMenu === "notifications"}
            onClick={() => toggleMenu("notifications")}
          >
            <BellIcon className="h-5 w-5" />
          </CountBadge>

          {openMenu === "notifications" && (
            <div role="menu" className={`${PANEL_CLASSES} w-80`}>
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-dash-ink">Notifications</p>
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  className="text-xs font-semibold text-brand-purple hover:underline"
                >
                  Mark all as read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {NOTIFICATIONS.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple">
                      <BellIcon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-dash-ink">{n.title}</span>
                      <span className="block truncate text-xs text-muted">{n.detail}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">{n.timeAgo}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpenMenu(null)}
                className="block w-full rounded-b-xl border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-brand-purple transition-colors hover:bg-page"
              >
                View all
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <CountBadge
            count={TOPBAR_COUNTS.mail}
            label="Messages"
            active={openMenu === "mail"}
            onClick={() => toggleMenu("mail")}
          >
            <MailIcon className="h-5 w-5" />
          </CountBadge>

          {openMenu === "mail" && (
            <div role="menu" className={`${PANEL_CLASSES} w-80`}>
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-dash-ink">Messages</p>
              </div>
              <div className="max-h-80 overflow-y-auto py-1">
                {MESSAGES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="menuitem"
                    onClick={() => setOpenMenu(null)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-page"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_GRADIENTS[m.tone]}`}
                    >
                      {m.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-dash-ink">{m.name}</span>
                      <span className="block truncate text-xs text-muted">{m.preview}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">{m.timeAgo}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpenMenu(null)}
                className="block w-full rounded-b-xl border-t border-border px-4 py-2.5 text-center text-sm font-semibold text-brand-purple transition-colors hover:bg-page"
              >
                View all
              </button>
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
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${userAvatar}`}>
              {CURRENT_USER.initials}
            </div>
            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-semibold text-dash-ink">{CURRENT_USER.name}</p>
              <p className="truncate text-xs text-muted">{CURRENT_USER.role}</p>
            </div>
            <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" />
          </button>

          {openMenu === "user" && (
            <div role="menu" className={`${PANEL_CLASSES} w-64`}>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${userAvatar}`}>
                  {CURRENT_USER.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dash-ink">{CURRENT_USER.name}</p>
                  <p className="truncate text-xs text-muted">{CURRENT_USER.role}</p>
                  <p className="truncate text-xs text-muted">{CURRENT_USER.email}</p>
                </div>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setOpenMenu(null)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-dash-ink transition-colors hover:bg-page"
                >
                  <PersonIcon className="h-4 w-4 text-muted" />
                  Profile settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setOpenMenu(null)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-dash-ink transition-colors hover:bg-page"
                >
                  <GearIcon className="h-4 w-4 text-muted" />
                  Preferences
                </button>
              </div>
              <div className="border-t border-border py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setOpenMenu(null)}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                >
                  <LogOutIcon className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
