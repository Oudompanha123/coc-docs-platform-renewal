import { ANNOUNCEMENT_CATEGORIES, type AnnouncementCategory } from "@/lib/announcements/announcements-api";
import { CATEGORY_META } from "./categories";

/**
 * An announcement's avatar in the bell (ADR-098): its category's own icon and
 * colour — the same {@link CATEGORY_META} the admin picked from and the
 * reader's modal shows — so "Maintenance" and "Important" are told apart
 * before a word is read.
 *
 * <p>`category` comes from the bell row's payload, which is untyped. Anything
 * this build does not recognise — a row written before categories were in the
 * payload, or a category added later — falls back to Information rather than
 * rendering nothing.
 */
export function AnnouncementBellIcon({ category, className = "" }: { category: string | null; className?: string }) {
  const known = ANNOUNCEMENT_CATEGORIES.includes(category as AnnouncementCategory)
    ? (category as AnnouncementCategory)
    : "info";
  const meta = CATEGORY_META[known];
  const Icon = meta.icon;
  return (
    <span
      aria-hidden="true"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.tile} ${className}`}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}
