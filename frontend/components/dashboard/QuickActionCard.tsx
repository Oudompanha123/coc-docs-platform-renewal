import Link from "next/link";
import { BarChartIcon, PlugIcon, PlusIcon, UserPlusIcon } from "@/components/layout/icons";
import type { QuickActionData } from "@/lib/mock/overview";
import { TONE_STYLES } from "./tone";

const QUICK_ACTION_ICONS = {
  plus: PlusIcon,
  userPlus: UserPlusIcon,
  plug: PlugIcon,
  barChart: BarChartIcon,
} as const;

/**
 * Real navigation, not a decorative card — {@code href} is required so this
 * always goes somewhere real once wired up on the Overview page (each of the
 * four now has a genuine destination: the product needing the most
 * attention, `/users-roles`, `/claude-usage`, `/integrations`).
 */
export function QuickActionCard({ data, href }: { data: QuickActionData; href: string }) {
  const Icon = QUICK_ACTION_ICONS[data.icon];
  const tone = TONE_STYLES[data.tone];

  return (
    <Link
      href={href}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-[10px] border border-border bg-white p-4 text-left shadow-sm transition-transform duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple active:scale-[0.98]"
    >
      {/* Same brand gradient as the primary "New Document" button, faded in via
          opacity on hover — background-image itself can't be transitioned, but
          opacity animates natively, so this is how the gradient hover animates. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-purple to-brand-blue opacity-0 transition-opacity duration-200 group-hover:opacity-20"
      />
      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.bg} ${tone.fg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="relative z-10 min-w-0">
        <p className="truncate text-sm font-semibold text-dash-ink">{data.title}</p>
        <p className="truncate text-xs text-muted">{data.subtitle}</p>
      </div>
    </Link>
  );
}
