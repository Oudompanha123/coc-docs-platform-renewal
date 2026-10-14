"use client";

import { useId, useRef, useState } from "react";
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
  const hintId = useId();

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
  // Drawn for the light sidebar (ADR-104 r2.7): the row keeps a nav item's
  // shape — 40px, rounded ends, same icon and text size — and becomes a
  // field: page background, a visible border, the focus ring. It used to be
  // the old navy sidebar's `bg-sidebar-hover` with white text and a navy
  // error popup floating over the next item. The error, the URL preview and
  // the keyboard hint now sit under the row, in the flow, so nothing covers
  // a neighbour.
  return (
    <div className="py-0.5">
      <div
        className={`flex h-10 items-center gap-2.5 rounded-full border bg-background px-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-[3px] transition-colors ${
          error ? "border-destructive/50 ring-destructive/15" : "border-surface-border ring-ring/30"
        }`}
      >
        <Icon className="size-4 shrink-0 text-nav-muted" />
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
          aria-describedby={hintId}
          className="min-w-0 flex-1 bg-transparent text-sm text-nav-foreground outline-none selection:bg-sky-500/25 selection:text-foreground"
        />
        <span className={`shrink-0 text-[11px] tabular-nums ${value.length >= 30 ? "text-destructive" : "text-nav-muted"}`} aria-hidden="true">
          {value.length}/30
        </span>
      </div>
      <div id={hintId} className="px-3 pt-1 text-[11px] leading-snug">
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : (
          <>
            {showUrlPreview && <p className="truncate text-nav-muted">URL: /docs/{previewSlug(value) || "…"}</p>}
            <p className="text-nav-muted">Enter to save · Esc to cancel</p>
          </>
        )}
      </div>
    </div>
  );
}
