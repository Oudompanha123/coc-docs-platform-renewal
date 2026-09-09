import type { RecentDocumentData } from "@/lib/mock/overview";
import { AVATAR_GRADIENTS } from "./tone";

const STATUS_STYLES: Record<RecentDocumentData["status"], string> = {
  Published: "bg-[#e1f5ec] text-[#1f9d6b]",
  Draft: "bg-[#fdf1de] text-[#c98a2c]",
};

export function DocumentRow({ data }: { data: RecentDocumentData }) {
  const avatar = AVATAR_GRADIENTS[data.tone];

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white ${avatar}`}>
        {data.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-dash-ink">{data.title}</p>
        <p className="truncate text-xs text-muted">
          {data.workspace} · {data.updatedAgo}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[data.status]}`}>
        {data.status}
      </span>
    </div>
  );
}
