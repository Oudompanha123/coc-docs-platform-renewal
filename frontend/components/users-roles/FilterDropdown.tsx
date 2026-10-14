"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Check } from "lucide-react";
import { ChevronDownIcon } from "@/components/layout/icons";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  /** A small colour dot before the label — e.g. the matching status badge's colour. */
  dotClassName?: string;
  /** A second, quieter line under the label in the list — e.g. what a role may do. */
  hint?: string;
};

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
        className={`flex h-9 w-full items-center gap-2 rounded-full border pl-3 pr-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
          filtering
            ? "border-surface-border bg-secondary font-medium text-foreground"
            : "border-transparent bg-muted-surface hover:bg-accent"
        } ${open ? "border-surface-border" : ""}`}
      >
        <span className={`shrink-0 [&_svg]:size-4 ${filtering ? "text-foreground" : "text-muted-foreground"}`}>{icon}</span>
        {selected?.dotClassName && filtering && (
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${selected.dotClassName}`} />
        )}
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label}</span>
        <ChevronDownIcon
          className={`size-4 shrink-0 transition-transform ${filtering ? "text-foreground" : "text-muted-foreground"} ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          onKeyDown={onListKeyDown}
          className={`absolute top-full z-20 mt-1.5 w-full rounded-xl border border-surface-border bg-popover p-1 text-popover-foreground shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          } ${options.some((o) => o.hint) ? "min-w-[18rem]" : "min-w-[13rem]"}`}
        >
          {variant === "filter" && (
            <p className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
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
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 ${
                  isSelected
                    ? "bg-accent font-medium text-foreground"
                    : "text-foreground hover:bg-accent focus-visible:bg-accent"
                }`}
              >
                {option.dotClassName ? (
                  <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${option.dotClassName}`} />
                ) : null}
                {option.hint ? (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{option.label}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {option.hint}
                    </span>
                  </span>
                ) : (
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                )}
                {isSelected && <Check className="size-4 shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
