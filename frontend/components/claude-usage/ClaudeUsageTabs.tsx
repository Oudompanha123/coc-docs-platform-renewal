"use client";

import Link from "next/link";
import { usePathname } from "@/lib/i18n/navigation";

const TABS = [
  { href: "/claude-usage", label: "Dashboard" },
  { href: "/claude-usage/monitoring", label: "Scan Logs" },
] as const;

/** The Claude Usage section's own pages, as links. Same underline-tab look as
 *  settings/Tabs.tsx — that one switches panels in place, this one navigates,
 *  so it is a nav of links rather than a tablist of buttons. The sidebar keeps
 *  one "Claude Usage" item, active on both (isNavItemActive's prefix match).
 *
 *  `showDashboard`: off for anyone but a super_admin, whose Scan Logs are
 *  only their own (ADR-107) and for whom the team dashboard is closed. */
export function ClaudeUsageTabs({ showDashboard = true }: { showDashboard?: boolean }) {
  const pathname = usePathname();
  const tabs = showDashboard ? TABS : TABS.filter((tab) => tab.href !== "/claude-usage");
  return (
    <nav aria-label="Claude Usage" className="mb-4 flex gap-6 border-b border-surface-border">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-9 items-center text-sm font-medium transition-colors focus-visible:outline-none ${
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
