import {
  BarChartIcon,
  DatabaseIcon,
  DocumentIcon,
  FolderIcon,
  LayersIcon,
  PersonIcon,
  PulseIcon,
  UsersIcon,
} from "@/components/layout/icons";
import { Card } from "@/components/ui/card";
import type { StatCardData } from "@/lib/mock/overview";

const STAT_ICONS = {
  document: DocumentIcon,
  layers: LayersIcon,
  users: UsersIcon,
  database: DatabaseIcon,
  folder: FolderIcon,
  person: PersonIcon,
  pulse: PulseIcon,
  barChart: BarChartIcon,
} as const;

/**
 * One headline number — the coc-docs dashboard pattern's stat card
 * (ADR-104 r2.7): label top-left, a small muted icon top-right, the value in
 * tabular figures, and the trend as a quiet line under it. A flat surface with
 * a hairline border, rather than the old gradient icon tile and lifting hover
 * shadow — on a dashboard the number is the subject, not the card.
 */
export function StatCard({ data }: { data: StatCardData }) {
  const Icon = STAT_ICONS[data.icon];
  const trendColour =
    data.trendTone === "positive" ? "text-[#00a544] dark:text-[#4ade80]" : "text-[#c2410c] dark:text-[#fb923c]";

  return (
    <Card className="gap-2 p-4 shadow-none transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{data.label}</p>
        <Icon className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">{data.value}</p>
      <p className={`text-xs font-medium ${trendColour}`}>{data.trend}</p>
    </Card>
  );
}
