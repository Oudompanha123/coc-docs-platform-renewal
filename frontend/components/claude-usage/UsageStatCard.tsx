import type { ComponentType, SVGProps } from "react";
import { Card } from "@/components/ui/card";

/** The house stat tile (dashboard/StatCard.tsx, ADR-104 r2.7), generalized to
 *  take any icon/value pair instead of that component's overview-specific
 *  StatCardData shape: label top-left, a small muted icon top-right, the value
 *  in tabular figures, and an optional quiet note under it. Flat — no shadow,
 *  no gradient icon tile; on a dashboard the number is the subject. */
export function UsageStatCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <Card className="gap-2 p-4 shadow-none">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
      {note && <p className="truncate text-xs text-muted-foreground">{note}</p>}
    </Card>
  );
}
