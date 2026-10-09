"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/layout/icons";
import { LEGAL_ICON_OPTIONS, legalIconFor } from "@/lib/legal/icon-options";

/** The highlight-card icon picker — a grid of the ~12 options (task spec C),
 *  not a plain `<select>` like the docs editor's `HeroForm` uses for its own
 *  (smaller, 8-option) icon field: this one needs to show each option's
 *  glyph, which a native `<option>` cannot render. No popover/listbox
 *  component exists elsewhere to reuse, so this is a plain button + absolute
 *  panel, closed on an outside click (same pattern `MemberHeader`'s own
 *  dropdowns use). */
export function LegalIconPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const Icon = legalIconFor(value);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-xl border border-border px-2.5 py-2 text-sm text-dash-ink disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon className="h-4 w-4 text-brand-purple" />
        <ChevronDownIcon className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Icon"
          className="absolute left-0 top-full z-10 mt-1.5 grid w-[216px] grid-cols-4 gap-1 rounded-xl border border-border bg-white p-2 shadow-lg"
        >
          {LEGAL_ICON_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="option"
              aria-selected={option.key === value}
              title={option.label}
              onClick={() => {
                onChange(option.key);
                setOpen(false);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                option.key === value ? "bg-brand-purple/10 text-brand-purple" : "text-muted hover:bg-page"
              }`}
            >
              <option.Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
