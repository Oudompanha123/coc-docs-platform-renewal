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
import type { StatCardData } from "@/lib/mock/overview";
import { AVATAR_GRADIENTS } from "./tone";

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

export function StatCard({ data }: { data: StatCardData }) {
  const Icon = STAT_ICONS[data.icon];
  const tileFill = AVATAR_GRADIENTS[data.tone];

  return (
    <div className="rounded-[10px] border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${tileFill}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{data.label}</p>
      </div>
      <p className="mt-4 text-3xl font-bold text-dash-ink">{data.value}</p>
      <p className={`mt-1 text-xs font-bold ${data.trendTone === "positive" ? "text-[#1f9d6b]" : "text-[#e0873c]"}`}>
        {data.trend}
      </p>
    </div>
  );
}
