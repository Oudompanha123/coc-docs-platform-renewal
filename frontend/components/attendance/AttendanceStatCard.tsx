import type { ComponentType, SVGProps } from "react";

/**
 * The Attendance page's own stat card — a local variant of
 * components/claude-usage/UsageStatCard.tsx rather than a shared-component
 * edit, since this page needs "emerald"/"red" tones that card's tone map
 * doesn't have and this task is scoped to page-level components only.
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
    purple: "bg-[linear-gradient(135deg,#6D3CE0,#4C6FF0)]",
    emerald: "bg-[linear-gradient(135deg,#20A163,#3EC98B)]",
    amber: "bg-[linear-gradient(135deg,#D97706,#F59E0B)]",
    red: "bg-[linear-gradient(135deg,#DC2626,#EF4444)]",
  }[tone];

  return (
    <div className="rounded-[10px] border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${tileFill}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-bold text-dash-ink">{value}</p>
      {note && <p className="mt-1 text-xs font-semibold text-muted">{note}</p>}
    </div>
  );
}
