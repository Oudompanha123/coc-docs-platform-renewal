import type { ActivityItemData } from "@/lib/mock/overview";

export function ActivityItem({ data, isLast }: { data: ActivityItemData; isLast: boolean }) {
  return (
    <li className="relative flex gap-3 pb-5 pl-1 last:pb-0">
      {!isLast && <span className="absolute left-[8px] top-3 h-full w-px bg-border" aria-hidden="true" />}
      <span className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-dash-ink">{data.title}</p>
        <p className="truncate text-xs text-muted">
          {data.detail} · {data.timeAgo}
        </p>
      </div>
    </li>
  );
}
