"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChartIcon,
  BellIcon,
  ExternalLinkIcon,
  LinkIcon,
  LogOutIcon,
  MonitorIcon,
  PersonIcon,
  ReturnIcon,
  SunIcon,
} from "@/components/layout/icons";
import { ShieldIcon } from "@/components/auth/icons";
import { useSession } from "@/lib/auth/SessionProvider";

type SectionDef = { id: string; label: string; Icon: (props: { className?: string }) => React.JSX.Element };

const BEFORE_CLAUDE_USAGE: SectionDef[] = [
  { id: "account", label: "Account", Icon: PersonIcon },
  { id: "appearance", label: "Appearance", Icon: SunIcon },
  { id: "notifications", label: "Notifications", Icon: BellIcon },
];
/** Same floor `RequireMemberSession` always gave `/my-claude-usage` — hidden
 *  here for `developer`/`reviewer`/`lead`, who never reached it before this
 *  section moved off its own page and into this one (which, unlike that old
 *  page, is open to every signed-in role). */
const CLAUDE_USAGE_SECTION: SectionDef = { id: "claude-usage", label: "Claude Usage", Icon: BarChartIcon };
const AFTER_CLAUDE_USAGE: SectionDef[] = [
  { id: "connected-accounts", label: "Connected accounts", Icon: LinkIcon },
  { id: "security", label: "Security", Icon: ShieldIcon },
  { id: "sessions", label: "Sessions", Icon: MonitorIcon },
];

/**
 * The left side menu on `/account/settings` — scroll-spy anchors plus
 * (for `admin`/`super_admin` only) Open Dashboard and Log out. Renders both
 * the desktop sticky column and the mobile horizontal tab row itself, each
 * hidden at the other's breakpoint, so the page only ever mounts one of
 * these at a time — there's exactly one `IntersectionObserver` either way.
 *
 * <p>Open Dashboard moved here from the header's user menu — same
 * `admin`/`super_admin` floor, same `/overview` destination. Unlike the
 * section buttons above it, it is a real navigation (`Link`, not
 * `scrollIntoView`), so it never participates in the scroll-spy and never
 * gets the active-section highlight.
 *
 * <p>Log out here is the same single-session sign-out the header's user
 * menu already offers — not "sign out of all devices", which is the
 * Sessions card's own, different action.
 */
export function SettingsSideMenu() {
  const [active, setActive] = useState<string>("account");
  const { user, signOut, isSigningOut } = useSession();
  const canSeeClaudeUsage = user?.role === "user" || user?.role === "admin" || user?.role === "super_admin";
  const canOpenDashboard = user?.role === "admin" || user?.role === "super_admin";
  const sections = canSeeClaudeUsage
    ? [...BEFORE_CLAUDE_USAGE, CLAUDE_USAGE_SECTION, ...AFTER_CLAUDE_USAGE]
    : [...BEFORE_CLAUDE_USAGE, ...AFTER_CLAUDE_USAGE];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        setActive(topMost.target.id);
      },
      // Counts a section as "current" once it's past the sticky header, and
      // stops counting it once it's scrolled more than 70% up the viewport —
      // the next section below is then the one closest to the top.
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `sections` only ever changes when `canSeeClaudeUsage` does, and re-running per render would re-observe the same elements on every scroll-driven `setActive`.
  }, [canSeeClaudeUsage]);

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActive(id);
  }

  return (
    <>
      <nav aria-label="Settings sections" className="hidden w-[220px] shrink-0 md:block">
        <div className="sticky top-20 space-y-1">
          {sections.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => goTo(id)}
              aria-current={active === id ? "true" : undefined}
              className={`settings-nav-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                active === id
                  ? "settings-nav-item-active bg-brand-purple/10 text-brand-purple"
                  : "text-dash-ink hover:bg-page"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
          <div className="my-2 border-t border-border" />
          {canOpenDashboard && (
            <Link
              href="/overview"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-dash-ink transition-colors hover:bg-page"
            >
              <ReturnIcon className="h-4 w-4 shrink-0" />
              <span className="flex-1">Open Dashboard</span>
              <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={isSigningOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOutIcon className="h-4 w-4 shrink-0" />
            {isSigningOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </nav>

      <nav
        aria-label="Settings sections"
        className="no-scrollbar-arrows -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:hidden"
      >
        {sections.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => goTo(id)}
            aria-current={active === id ? "true" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active === id
                ? "settings-nav-item-active border-brand-purple bg-brand-purple/10 text-brand-purple"
                : "border-border text-dash-ink"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
