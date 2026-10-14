import type { ComponentType, SVGProps } from "react";

/**
 * The Attendance page's own stat card — a local variant of
 * components/claude-usage/UsageStatCard.tsx rather than a shared-component
 * edit, since this page needs "emerald"/"red" tones that card's tone map
 * doesn't have and this task is scoped to page-level components only.
 *
 * Flat card, no shadow (ADR-104): the tone is a low-alpha tinted icon tile
 * rather than a gradient, so colour stays reserved for status and the tile
 * still reads in the dark shell. "purple" is the neutral total, not a brand hue.
 */
export function AttendanceStatCard({
  icon: Icon,
  label,
  value,
  tone,
  note,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  tone: "purple" | "emerald" | "amber" | "red";
  note?: string;
}) {
  const tileFill = {
    purple: "bg-muted-surface text-foreground",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
  }[tone];

  return (
    <div className="rounded-xl border border-surface-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <div className={`flex size-8 items-center justify-center rounded-lg ${tileFill}`}>
          <Icon className="size-4" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
