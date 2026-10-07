import type { AnnouncementCategory } from "@/lib/announcements/announcements-api";
import { CATEGORY_META } from "./categories";

/** The category of an announcement as a small pill (ADR-098). Shared by the admin list and the reader's modal. */
export function AnnouncementCategoryBadge({ category }: { category: AnnouncementCategory }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.info;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.badge}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
