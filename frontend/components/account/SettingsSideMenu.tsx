"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChartIcon,
  BellIcon,
  CalendarCheckIcon,
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
import { getVisibleSettingsSections, type SettingsSectionId } from "@/lib/account/settingsSections";

type IconComponent = (props: { className?: string }) => React.JSX.Element;

const SECTION_LABELS: Record<SettingsSectionId, { label: string; Icon: IconComponent }> = {
  account: { label: "Account", Icon: PersonIcon },
  appearance: { label: "Appearance", Icon: SunIcon },
  notifications: { label: "Notifications", Icon: BellIcon },
  "claude-usage": { label: "Claude Usage", Icon: BarChartIcon },
  attendance: { label: "Attendance", Icon: CalendarCheckIcon },
  "connected-accounts": { label: "Connected accounts", Icon: LinkIcon },
  security: { label: "Security", Icon: ShieldIcon },
  sessions: { label: "Sessions", Icon: MonitorIcon },
};

type ButtonRefs = React.MutableRefObject<Partial<Record<SettingsSectionId, HTMLButtonElement | null>>>;

/**
 * The left side menu / tab list on `/account/settings` (ADR-094; switched
 * from scroll-spy to a real `role="tablist"` afterward, on direct
 * instruction) — one tab per section, plus (for `admin`/`super_admin` only)
 * Open Dashboard and Log out as plain actions outside the tablist. Renders
 * both the desktop sticky column and the mobile horizontal tab row, each
 * hidden at the other's breakpoint via CSS only — both stay mounted, so
 * there's exactly one set of button refs/keyboard handling per layout.
 *
 * <p>Selection is controlled by the parent (`active`/`onActivate`) so the
 * page can keep the URL hash and the visible tabpanel in sync. This
 * component owns only focus and the manual-activation keyboard pattern:
 * arrow keys/Home/End move focus among tabs without selecting them; a
 * native `<button>` already activates on Enter/Space via its own `onClick`.
 *
 * <p>Open Dashboard moved here from the header's user menu — same
 * `admin`/`super_admin` floor, same `/overview` destination. Log out here is
 * the same single-session sign-out the header's user menu already offers.
 */
export function SettingsSideMenu({
  active,
  onActivate,
}: {
  active: SettingsSectionId;
  onActivate: (id: SettingsSectionId) => void;
}) {
  const { user, signOut, isSigningOut } = useSession();
  const canSeeClaudeUsage = user?.role === "user" || user?.role === "admin" || user?.role === "super_admin";
  const canOpenDashboard = user?.role === "admin" || user?.role === "super_admin";
  const sections = getVisibleSettingsSections(canSeeClaudeUsage).map((id) => ({ id, ...SECTION_LABELS[id] }));

  const [focusedId, setFocusedId] = useState<SettingsSectionId>(active);
  useEffect(() => setFocusedId(active), [active]);

  const desktopRefs: ButtonRefs = useRef({});
  const mobileRefs: ButtonRefs = useRef({});

  // The mobile row is the only one that scrolls horizontally — desktop's
  // column always shows every tab at once — so only it needs the active
  // one brought into view after a switch (e.g. one driven by the URL hash
  // rather than a click inside the row itself).
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    mobileRefs.current[active]?.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [active]);

  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number, refs: ButtonRefs) {
    let nextIndex: number;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        nextIndex = (index + 1) % sections.length;
        break;
      case "ArrowUp":
      case "ArrowLeft":
        nextIndex = (index - 1 + sections.length) % sections.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = sections.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    const next = sections[nextIndex];
    if (!next) return;
    setFocusedId(next.id);
    refs.current[next.id]?.focus();
  }

  return (
    <>
      <nav aria-label="Settings sections" className="hidden w-[220px] shrink-0 md:block">
        <div className="sticky top-20 space-y-1">
          <div role="tablist" aria-orientation="vertical" className="space-y-1">
            {sections.map(({ id, label, Icon }, index) => (
              // A tab, not a button. It carries role="tab", a roving
              // tabIndex and this component's own arrow-key handling, and it
              // is styled to match the <Link> rows beside it rather than any
              // Button variant. Tabs are a phase-3 primitive (ADR-104 §2.5),
              // and that primitive owns the keyboard pattern this file
              // currently implements by hand.
              // eslint-disable-next-line react/forbid-elements
              <button
                key={id}
                ref={(el) => {
                  desktopRefs.current[id] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${id}`}
                aria-selected={active === id}
                aria-controls={`panel-${id}`}
                tabIndex={focusedId === id ? 0 : -1}
                onClick={() => onActivate(id)}
                onKeyDown={(e) => handleTabKeyDown(e, index, desktopRefs)}
                className={`settings-nav-item flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium transition-colors ${
                  active === id
                    ? "settings-nav-item-active bg-secondary text-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </button>
            ))}
          </div>
          <div className="my-2 border-t border-surface-border" />
          {canOpenDashboard && (
            <Link
              href="/overview"
              className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <ReturnIcon className="size-4 shrink-0" />
              <span className="flex-1">Open Dashboard</span>
              <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
            </Link>
          )}
          {/* A nav row that happens to act rather than navigate. Its styling
              is deliberately identical to the <Link> directly above it, and a
              Button variant would break that match for no gain. Left as it
              is (ADR-104 decision 7). */}
          {/* eslint-disable-next-line react/forbid-elements */}
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={isSigningOut}
            className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOutIcon className="size-4 shrink-0" />
            {isSigningOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </nav>

      <nav
        role="tablist"
        aria-label="Settings sections"
        aria-orientation="horizontal"
        className="no-scrollbar-arrows -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:hidden"
      >
        {sections.map(({ id, label, Icon }, index) => (
          // The same tab list at mobile width — see the note on the desktop
          // one above.
          // eslint-disable-next-line react/forbid-elements
          <button
            key={id}
            ref={(el) => {
              mobileRefs.current[id] = el;
            }}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls={`panel-${id}`}
            tabIndex={focusedId === id ? 0 : -1}
            onClick={() => onActivate(id)}
            onKeyDown={(e) => handleTabKeyDown(e, index, mobileRefs)}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors ${
              active === id
                ? "settings-nav-item-active border-primary bg-secondary text-foreground"
                : "border-surface-border text-foreground"
            }`}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
