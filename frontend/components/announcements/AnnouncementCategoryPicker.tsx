"use client";

import { ANNOUNCEMENT_CATEGORIES, type AnnouncementCategory } from "@/lib/announcements/announcements-api";
import { CATEGORY_META } from "./categories";

/**
 * The editor's category choice, as four labelled cards rather than a bare
 * select (ADR-098): each says what the category is for and shows the colour
 * members will see, so an admin is not guessing what "Update" versus
 * "Information" means.
 *
 * <p>Real radio inputs underneath (visually hidden), so it is one tab stop
 * with arrow-key movement and is announced as a radio group — the cards are
 * only their labels.
 */
export function AnnouncementCategoryPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: AnnouncementCategory;
  onChange: (category: AnnouncementCategory) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-semibold text-dash-ink">Category</legend>
      <div role="radiogroup" aria-label="Category" className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ANNOUNCEMENT_CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category];
          const Icon = meta.icon;
          const selected = value === category;
          return (
            <label
              key={category}
              className={`relative flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-purple ${
                selected ? "border-brand-purple bg-brand-purple/10" : "border-border bg-white hover:bg-page"
              }`}
            >
              <input
                type="radio"
                name="announcement-category"
                value={category}
                checked={selected}
                onChange={() => onChange(category)}
                className="sr-only"
              />
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.tile}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${selected ? "text-brand-purple" : "text-dash-ink"}`}>
                  {meta.label}
                </span>
                <span className="block truncate text-xs text-muted">{meta.hint}</span>
              </span>
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  selected ? "border-brand-purple bg-brand-purple" : "border-border bg-white"
                }`}
              >
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
