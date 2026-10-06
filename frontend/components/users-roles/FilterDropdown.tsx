"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/layout/icons";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  /** A small colour dot before the label — e.g. the matching status badge's colour. */
  dotClassName?: string;
  /** A second, quieter line under the label in the list — e.g. what a role may do. */
  hint?: string;
};

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * A single-select filter: a trigger button and a listbox panel, in the same
 * trigger-plus-panel pattern as `DocsHeaderSwitcher` (click outside closes),
 * styled like the rest of the admin UI rather than the operating system's own
 * `<select>` menu, which ignored the app's look and its dark theme.
 *
 * <p>Keyboard: Enter, Space or ↓ opens it on the selected option; ↑/↓, Home
 * and End move between options; Enter or Space picks one; Escape or Tab
 * closes it, Escape returning focus to the trigger.
 *
 * <p>While anything other than the first ("All …") option is chosen, the
 * trigger is tinted, so an applied filter is visible at a glance. As a plain
 * picker (`variant="select"`, e.g. the role to approve someone at) there is no
 * "All" option, so nothing is tinted and the panel has no heading.
 */
export function FilterDropdown<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
  className = "",
  variant = "filter",
  disabled = false,
  align = "left",
}: {
  /** What is filtered — the panel's heading and the trigger's accessible name ("Role: Admin"). */
  label: string;
  icon: ReactNode;
  value: T;
  /** The first option is the "no filter" one (e.g. "All Roles"). */
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  /** "filter": tints while not on the first option. "select": a plain picker. */
  variant?: "filter" | "select";
  disabled?: boolean;
  /** Which edge of the trigger the panel lines up with. */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listId = useId();

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];
  const filtering = variant === "filter" && selectedIndex > 0;

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  // Opening puts focus on the chosen option, so the keyboard starts there.
  useEffect(() => {
    if (open) optionRefs.current[selectedIndex]?.focus();
  }, [open, selectedIndex]);

  function close(returnFocus: boolean) {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }

  function pick(next: T) {
    if (next !== value) onChange(next);
    close(true);
  }

  function onTriggerKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onListKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const current = optionRefs.current.findIndex((el) => el === document.activeElement);
    const focusAt = (i: number) => optionRefs.current[(i + options.length) % options.length]?.focus();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(current + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusAt(current - 1);
        break;
      case "Home":
        e.preventDefault();
        focusAt(0);
        break;
      case "End":
        e.preventDefault();
        focusAt(options.length - 1);
        break;
      case "Escape":
        e.preventDefault();
        close(true);
        break;
      case "Tab":
        close(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${selected?.label ?? ""}`}
        className={`flex w-full items-center gap-2 rounded-xl border py-2.5 pl-3 pr-2.5 text-sm shadow-sm transition-colors focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15 disabled:cursor-not-allowed disabled:opacity-60 ${
          filtering
            ? "border-brand-purple/40 bg-brand-purple/5 font-semibold text-brand-purple"
            : "border-border bg-white text-dash-ink hover:bg-[#f8fafc]"
        } ${open ? "border-brand-purple ring-4 ring-brand-purple/15" : ""}`}
      >
        <span className={`shrink-0 ${filtering ? "text-brand-purple" : "text-muted"}`}>{icon}</span>
        {selected?.dotClassName && filtering && (
          <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${selected.dotClassName}`} />
        )}
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label}</span>
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 transition-transform ${filtering ? "text-brand-purple" : "text-muted"} ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className={`absolute top-full z-20 mt-2 w-full rounded-xl border border-border bg-white p-1.5 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          } ${options.some((o) => o.hint) ? "min-w-[18rem]" : "min-w-[13rem]"}`}
        >
          {variant === "filter" && (
            <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
          )}
          {options.map((option, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={option.value}
                ref={(el) => {
                  optionRefs.current[index] = el;
                }}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => pick(option.value)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/40 ${
                  isSelected
                    ? "bg-brand-purple/10 font-semibold text-brand-purple"
                    : "text-dash-ink hover:bg-[#f8fafc] focus-visible:bg-[#f8fafc]"
                }`}
              >
                {option.dotClassName ? (
                  <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${option.dotClassName}`} />
                ) : null}
                {option.hint ? (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    <span className={`block text-xs font-normal ${isSelected ? "text-brand-purple/80" : "text-muted"}`}>
                      {option.hint}
                    </span>
                  </span>
                ) : (
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                )}
                {isSelected && <CheckGlyph className="h-4 w-4 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
