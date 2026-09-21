import type { ComponentType, SVGProps } from "react";

/** Same white-card + soft-shadow shape as dashboard/StatCard.tsx, generalized
 *  to take any icon/value pair instead of that component's overview-specific
 *  StatCardData shape. */
export function UsageStatCard({
  icon: Icon,
  label,
  value,
  tone,
  note,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  tone: "purple" | "blue" | "green" | "orange";
  note?: string;
}) {
  const tileFill = {
    purple: "bg-[linear-gradient(135deg,#6D3CE0,#4C6FF0)]",
    blue: "bg-[linear-gradient(135deg,#4C6FF0,#6D3CE0)]",
    green: "bg-[linear-gradient(135deg,#20A163,#3EC98B)]",
    orange: "bg-[linear-gradient(135deg,#E8763F,#F0B429)]",
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
