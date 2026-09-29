"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/layout/icons";
import {
  addMonths,
  buildMonthGrid,
  formatDisplayDate,
  isFutureDate,
  monthLabel,
  todayIso,
  yearMonthOf,
  type YearMonth,
} from "@/lib/attendance/dates";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isSameOrLaterMonth(a: YearMonth, b: YearMonth): boolean {
  return a.year > b.year || (a.year === b.year && a.month >= b.month);
}

/**
 * The date button's popup calendar — its own component (not folded into
 * AttendanceDateNav) since the task scope asks for a new, separate
 * page-scoped date picker; AttendanceDateNav still owns `date`/`onChange`
 * and passes them straight through, which is what keeps ‹/Today/› and this
 * popup always showing the same date.
 */
export function AttendanceDatePicker({ date, onChange }: { date: string; onChange: (iso: string) => void }) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<YearMonth>(() => yearMonthOf(date));
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Re-center the visible month on the selected date every time the popup
  // opens, rather than remembering wherever a previous session left it.
  useEffect(() => {
    if (open) setViewMonth(yearMonthOf(date));
  }, [open, date]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectDay(iso: string) {
    if (isFutureDate(iso)) return;
    onChange(iso);
    setOpen(false);
    buttonRef.current?.focus();
  }

  const grid = buildMonthGrid(viewMonth);
  const nextMonthDisabled = isSameOrLaterMonth(viewMonth, yearMonthOf(todayIso()));

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-[10px] border border-border bg-white px-3.5 py-2 text-sm font-semibold text-dash-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-purple/20 hover:shadow"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M8 3v4M16 3v4M3.5 9.5h17" strokeLinecap="round" />
        </svg>
        {formatDisplayDate(date)}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pick a date"
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-dash-ink">{monthLabel(viewMonth)}</p>
            <button
              type="button"
              aria-label="Next month"
              disabled={nextMonthDisabled}
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 px-1 text-center text-xs font-semibold text-muted">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-y-1 px-1">
            {grid.map((iso, i) => {
              if (!iso) return <span key={`blank-${i}`} className="h-8 w-8" />;

              const future = isFutureDate(iso);
              const selected = iso === date;
              const isToday = iso === todayIso();
              const day = Number(iso.slice(-2));

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={future}
                  onClick={() => selectDay(iso)}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={selected}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                    selected
                      ? "bg-brand-purple font-semibold text-white"
                      : future
                        ? "cursor-not-allowed text-muted/40"
                        : isToday
                          ? "text-dash-ink ring-2 ring-inset ring-brand-purple"
                          : "text-dash-ink hover:bg-page"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
