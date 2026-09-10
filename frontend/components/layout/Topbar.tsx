"use client";

import { useState } from "react";
import { CURRENT_USER, TOPBAR_COUNTS } from "@/lib/mock/overview";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { BellIcon, ChevronDownIcon, MailIcon, MenuIcon, MoonIcon } from "./icons";

type TopbarProps = {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
};

function CountBadge({ count, label, children }: { count: number; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={`${label}, ${count} unread`}
      className="relative rounded-xl bg-page p-2.5 text-dash-ink/70 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
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

export function Topbar({ title, subtitle, onMenuClick }: TopbarProps) {
  const [darkMode, setDarkMode] = useState(false);
  const userAvatar = AVATAR_GRADIENTS[CURRENT_USER.tone];

  return (
    <header className="flex items-center justify-between border-b border-border bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-xl p-2 text-dash-ink transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-dash-ink sm:text-2xl">{title}</h1>
          <p className="truncate text-sm text-muted">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setDarkMode((v) => !v)}
          aria-label="Toggle dark mode"
          aria-pressed={darkMode}
          className="rounded-xl bg-page p-2.5 text-dash-ink/70 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        >
          <MoonIcon className="h-5 w-5" />
        </button>

        <CountBadge count={TOPBAR_COUNTS.notifications} label="Notifications">
          <BellIcon className="h-5 w-5" />
        </CountBadge>

        <CountBadge count={TOPBAR_COUNTS.mail} label="Messages">
          <MailIcon className="h-5 w-5" />
        </CountBadge>

        <button
          type="button"
          className="ml-1 flex items-center gap-2 rounded-xl bg-page py-0.5 pl-1 pr-2.5 transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${userAvatar}`}>
            {CURRENT_USER.initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-dash-ink">{CURRENT_USER.name}</p>
            <p className="text-xs text-muted">{CURRENT_USER.role}</p>
          </div>
          <ChevronDownIcon className="hidden h-4 w-4 text-muted sm:block" />
        </button>
      </div>
    </header>
  );
}
