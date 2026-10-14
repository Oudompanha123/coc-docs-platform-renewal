import { BellIcon, GearIcon, SparklesIcon, WarningIcon, type IconComponent } from "@/components/layout/icons";
import { CATEGORY_LABELS, type AnnouncementCategory } from "@/lib/announcements/announcements-api";

/**
 * How each announcement category looks and what it is for (ADR-098). One
 * table, read by the badge on the list and the reader's modal and by the
 * picker in the editor, so the colour an admin chooses is the colour members
 * see.
 *
 * <p>Tones reuse chip colours the app already has — brand purple, the danger
 * red, and the literal green/amber hexes of the existing status chips — each
 * of which globals.css already maps for dark mode. Tailwind's own
 * emerald/amber utilities have no dark mapping and stayed light there.
 */
export const CATEGORY_META: Record<
  AnnouncementCategory,
  { label: string; hint: string; icon: IconComponent; badge: string; tile: string }
> = {
  info: {
    label: CATEGORY_LABELS.info,
    hint: "General news for the team",
    icon: BellIcon,
    badge: "bg-secondary text-foreground",
    tile: "bg-secondary text-foreground",
  },
  update: {
    label: CATEGORY_LABELS.update,
    hint: "A new feature or a change",
    icon: SparklesIcon,
    badge: "bg-[#e1f5ec] text-[#1f9d6b]",
    tile: "bg-[#e1f5ec] text-[#1f9d6b]",
  },
  maintenance: {
    label: CATEGORY_LABELS.maintenance,
    hint: "Planned downtime or slowness",
    icon: GearIcon,
    badge: "bg-[#fffbeb] text-[#b45309]",
    tile: "bg-[#fffbeb] text-[#b45309]",
  },
  important: {
    label: CATEGORY_LABELS.important,
    hint: "Urgent — needs attention",
    icon: WarningIcon,
    badge: "bg-danger/10 text-danger",
    tile: "bg-danger/10 text-danger",
  },
};
