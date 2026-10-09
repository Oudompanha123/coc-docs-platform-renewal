"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/layout/icons";
import { LEGAL_ICON_OPTIONS, legalIconFor } from "@/lib/legal/icon-options";

/**
 * The section row's icon control (task spec, Step 3 §D: "Icon dropdown
 * (icon + name)") — a listbox button showing the selected icon and its
 * label, distinct from `LegalIconPicker`'s icon-only grid popover (still
 * used for highlight cards, which the mockup doesn't show this way).
 */
export function LegalIconDropdown({
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
  const SelectedIcon = legalIconFor(value);
  const selectedLabel = LEGAL_ICON_OPTIONS.find((o) => o.key === value)?.label ?? LEGAL_ICON_OPTIONS[0]!.label;

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
        className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-dash-ink outline-none focus:border-[#a5b4fc] focus:ring-[3px] focus:ring-[#eef0ff] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SelectedIcon className="h-4 w-4 text-brand-purple" />
        <span>{selectedLabel}</span>
        <ChevronDownIcon className={`ml-1 h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Icon"
          className="absolute left-0 top-full z-10 mt-1.5 max-h-64 w-56 overflow-y-auto rounded-xl border border-border bg-white p-1 shadow-lg"
        >
          {LEGAL_ICON_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              role="option"
              aria-selected={option.key === value}
              onClick={() => {
                onChange(option.key);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                option.key === value ? "bg-brand-purple/10 text-brand-purple" : "text-dash-ink hover:bg-page"
              }`}
            >
              <option.Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
