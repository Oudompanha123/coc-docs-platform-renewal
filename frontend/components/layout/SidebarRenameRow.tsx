"use client";

import { useRef, useState } from "react";
import type { NavItem } from "./nav-config";

/** The same base rule `NavService.slugify` applies server-side (lowercase,
 *  non-alphanumerics -> "-", collapse/trim) — a preview only. The backend is
 *  still authoritative: it alone knows about reserved-word/conflict
 *  suffixing (task: "product rename ... slug rules"), so a product whose
 *  preview reads `/docs/jex` can still be saved as `/docs/jex-2` if that
 *  exact slug was already taken. */
function previewSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The inline-rename row (task spec §C): the label turns into an input with
 * its text selected. Enter saves, Esc cancels, blur saves — trimmed, 1–30
 * chars, unique within the group (a client-side check only: uniqueness
 * spans code-defined defaults and database overrides together, which only
 * the frontend ever holds the full picture of — length/blank are what the
 * backend actually enforces).
 */
export function SidebarRenameRow({
  item,
  existingLabels,
  showUrlPreview = false,
  onSave,
  onCancel,
}: {
  item: NavItem;
  /** Every OTHER item's current label in the same group/section — what this
   *  row's new name must not collide with. */
  existingLabels: string[];
  /** Only a product's rename can change its URL (task: "product rename:
   *  live header update + URL slug follows the new name") — a static item's
   *  rename is label-only, so it never shows this. */
  showUrlPreview?: boolean;
  onSave: (label: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(item.label);
  const [error, setError] = useState<string | null>(null);
  // Enter/Escape each resolve the row and typically blur the input as a
  // side effect — this guards the blur handler from re-running a save (or
  // running one at all after a cancel) once that's already happened.
  const resolvedRef = useRef(false);

  function trySave() {
    if (resolvedRef.current) return;
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError("Can't be blank.");
      return;
    }
    if (trimmed.length > 30) {
      setError("Must be 30 characters or fewer.");
      return;
    }
    if (existingLabels.some((label) => label.toLowerCase() === trimmed.toLowerCase())) {
      setError("That name is already used in this group.");
      return;
    }
    resolvedRef.current = true;
    onSave(trimmed);
  }

  function cancel() {
    resolvedRef.current = true;
    onCancel();
  }

  const Icon = item.icon;
  return (
    <div className="relative flex h-[42px] items-center gap-3 rounded-xl bg-sidebar-hover px-3 py-2.5">
      <Icon className="h-[18px] w-[18px] shrink-0 text-white" />
      <input
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            trySave();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        onBlur={trySave}
        maxLength={30}
        aria-label={`Rename ${item.label}`}
        aria-invalid={error != null}
        className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white outline-none"
      />
      {error ? (
        <p role="alert" className="absolute left-3 top-full z-10 mt-1 rounded-lg bg-[#1f2037] px-2.5 py-1.5 text-xs text-[#f87171] shadow-lg">
          {error}
        </p>
      ) : (
        showUrlPreview && (
          <p className="absolute left-3 top-full mt-1 truncate text-xs text-sidebar-muted">
            URL: /docs/{previewSlug(value) || "…"}
          </p>
        )
      )}
    </div>
  );
}
