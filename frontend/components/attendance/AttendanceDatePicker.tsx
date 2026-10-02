"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/layout/icons";
import {
  addMonths,
  buildMonthGrid,
  formatDisplayDate,
  isFutureDate,
  isoRangeBetween,
  monthLabel,
  todayIso,
  weekRangeOf,
  yearMonthOf,
  type YearMonth,
} from "@/lib/attendance/dates";
import type { AttendanceRange } from "./AttendanceRangeToggle";

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
 *
 * <p>Highlighting supports picking more than one day (arbitrary multi-select,
 * not a start/end range) — visual only, for now: the page still has exactly
 * one `date` driving what the table fetches, so `onChange` keeps firing with
 * whichever day was just added, the same as before this existed. The other
 * highlighted days are a decorative preview of the eventual multi-date view,
 * same reasoning as the Day/Week/Month/Year toggle beside it. The selection
 * persists across closing and reopening the popup — only Clear resets it —
 * and whichever day is currently active always stays part of it, even if it
 * changed from outside this popup (the ‹/Today/› arrows).
 *
 * <p>Once two or more days are picked, every day from the earliest to the
 * latest gets a light-purple "snake": a continuous pill hugging each day
 * cell edge-to-edge, rounded off only at its two true ends, so a span
 * crossing a row wrap reads as one body turning the corner rather than two
 * separate bars — see {@link spanCapClass}. Decorative only, same as the
 * rest of this highlighting: the selection stays an arbitrary set, it just
 * reads as connected the way a range picker's in-between days would.
 *
 * <p>The same multi-select is also reachable by mouse drag: press on a day
 * and drag across others to sweep them all into the selection in one
 * gesture, instead of clicking each one. `onChange` only fires once, on
 * release, with wherever the drag ended — not per cell swept over — so a
 * fast drag across a whole month does not fire a real fetch once per day it
 * passed through. A plain click (press and release on the same cell, with no
 * drag in between) is untouched: the browser only raises a `click` event
 * when both happen on the same element, so it still goes through {@link
 * toggleDay} exactly as before, including toggling an already-selected day
 * back off.
 *
 * <p>In Week mode, the calendar row containing `date` also gets a light
 * purple band under the selected day's own solid circle — decorative only,
 * same as the multi-select above: it does not change what the table fetches,
 * only how the popup looks. Month/Year get no equivalent treatment yet —
 * with only one month ever on screen, "highlight the whole grid" doesn't
 * read as a meaningful selection the way one row does, so that's left for a
 * separate task rather than shipped as a shrug.
 */
export function AttendanceDatePicker({
  date,
  onChange,
  range = "day",
}: {
  date: string;
  onChange: (iso: string) => void;
  range?: AttendanceRange;
}) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<YearMonth>(() => yearMonthOf(date));
  const [selectedDates, setSelectedDates] = useState<Set<string>>(() => new Set([date]));
  // Where the current mouse drag started/currently is, or null between drags.
  // Kept apart from `selectedDates` because the drag's own end is what
  // `onChange` should fire with on release — recomputing that from the set
  // (which has no order) would not tell us which day was swept over last.
  const [dragAnchor, setDragAnchor] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Re-center the visible month every time the popup opens — but the
  // multi-select itself survives a close/reopen; only Clear resets it.
  useEffect(() => {
    if (open) setViewMonth(yearMonthOf(date));
  }, [open, date]);

  // Keeps whichever day is currently active always represented in the
  // persisted selection — e.g. after Prev/Next moves `date` without ever
  // opening this popup — rather than replacing the selection outright, which
  // is what would silently drop everything picked before it.
  useEffect(() => {
    setSelectedDates((prev) => (prev.has(date) ? prev : new Set(prev).add(date)));
  }, [date]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Toggles `iso` in the multi-select; the popup no longer closes on a pick,
  // since picking more than one day is the point. Only a newly-added day
  // drives `onChange` — removing one from the highlight has nothing sensible
  // to fall back to, so it only changes the decorative selection.
  //
  // `onChange` fires here, in the handler itself, rather than from inside
  // the `setSelectedDates` updater below — React is free to invoke a
  // functional updater during another component's render (to recompute
  // state consistently), and a parent's `setState` called from inside one
  // trips "Cannot update a component while rendering a different
  // component". Reading `selectedDates` from this render's own closure is
  // still exactly the membership `next.has(iso)` would have checked, since
  // nothing else can change it between this click and the state update it
  // queues.
  function toggleDay(iso: string) {
    if (isFutureDate(iso)) return;
    const isNewlyAdded = !selectedDates.has(iso);
    setSelectedDates((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) {
        next.delete(iso);
      } else {
        next.add(iso);
      }
      return next;
    });
    if (isNewlyAdded) onChange(iso);
  }

  function startDrag(iso: string) {
    if (isFutureDate(iso)) return;
    setDragAnchor(iso);
    setDragEnd(iso);
  }

  // Sweeps every day between the drag's start and wherever the pointer is
  // now into the selection — additive, same as a run of individual clicks,
  // so a day picked before the drag started stays picked.
  function dragOver(iso: string) {
    if (dragAnchor === null || isFutureDate(iso)) return;
    setDragEnd(iso);
    setSelectedDates((prev) => {
      const next = new Set(prev);
      for (const d of isoRangeBetween(dragAnchor, iso)) next.add(d);
      return next;
    });
  }

  // Ends the drag on mouseup wherever it happens, not only over a day cell —
  // mirrors the outside-click listener's own reasoning: a release outside
  // this popup should not leave a drag armed forever. `onChange` fires once
  // here, for the drag's final day, only when an actual drag happened (the
  // pointer left the starting cell) — a plain click with no movement leaves
  // this a no-op and goes through `toggleDay` instead, which is what lets an
  // already-selected day still toggle back off on a plain click.
  useEffect(() => {
    if (dragAnchor === null) return;
    function onMouseUp() {
      if (dragEnd !== null && dragEnd !== dragAnchor) onChange(dragEnd);
      setDragAnchor(null);
      setDragEnd(null);
    }
    document.addEventListener("mouseup", onMouseUp);
    return () => document.removeEventListener("mouseup", onMouseUp);
  }, [dragAnchor, dragEnd, onChange]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  const grid = buildMonthGrid(viewMonth);
  const nextMonthDisabled = isSameOrLaterMonth(viewMonth, yearMonthOf(todayIso()));

  // Chunked into Monday-first weeks so the highlight below can shade one row
  // at a time — `grid` itself is a flat list relying on CSS to wrap it.
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));

  const weekHighlight = range === "week" ? weekRangeOf(date) : null;
  function weekContainsHighlight(week: (string | null)[]): boolean {
    if (!weekHighlight) return false;
    return week.some((iso) => iso !== null && iso >= weekHighlight.start && iso <= weekHighlight.end);
  }

  // Once more than one day is picked, every day from the earliest pick to
  // the latest gets a light-purple "snake": a continuous pill that hugs each
  // day cell edge-to-edge (no gap between adjacent cells to break it up),
  // rounded off only at its two true ends, so a span crossing a row wrap
  // reads as one body turning the corner rather than two separate bars.
  // Compared by ISO string, not row/column index, so it holds up across a
  // month change too — a day between two picks in different months is still
  // "between the earliest and the latest" even off screen.
  const sortedSelection = [...selectedDates].sort();
  const spanHighlight =
    sortedSelection.length > 1
      ? { start: sortedSelection[0]!, end: sortedSelection[sortedSelection.length - 1]! }
      : null;

  function isInSpan(iso: string): boolean {
    return spanHighlight !== null && iso >= spanHighlight.start && iso <= spanHighlight.end;
  }

  // Only the overall first/last day of the span caps off with a rounded
  // end; every day in between (including a row's first/last cell where the
  // span merely wraps) stays square so its background merges seamlessly
  // into its neighbor's.
  function spanCapClass(iso: string): string {
    if (!spanHighlight) return "";
    if (iso === spanHighlight.start) return "rounded-l-full";
    if (iso === spanHighlight.end) return "rounded-r-full";
    return "";
  }

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
          aria-label="Pick dates"
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-white p-3 shadow-lg"
        >
          <div className="flex items-center justify-between px-1 pb-2 text-xs">
            <span className="font-semibold text-muted">
              {selectedDates.size} date{selectedDates.size === 1 ? "" : "s"} selected
            </span>
            {selectedDates.size > 1 && (
              <button
                type="button"
                onClick={() => setSelectedDates(new Set([date]))}
                className="font-semibold text-brand-purple hover:underline"
              >
                Clear
              </button>
            )}
          </div>

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

          <div className="mt-1 select-none space-y-1 px-1">
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className={`grid grid-cols-7 rounded-lg py-0.5 ${weekContainsHighlight(week) ? "bg-brand-purple/10" : ""}`}
              >
                {week.map((iso, i) => {
                  if (!iso) return <span key={`blank-${weekIndex}-${i}`} className="h-8 w-8" />;

                  const future = isFutureDate(iso);
                  const selected = selectedDates.has(iso);
                  const isToday = iso === todayIso();
                  const day = Number(iso.slice(-2));
                  const inSpan = isInSpan(iso);

                  return (
                    <div
                      key={iso}
                      className={`flex h-8 items-center justify-center ${inSpan ? `bg-brand-purple/10 ${spanCapClass(iso)}` : ""}`}
                    >
                      <button
                        type="button"
                        disabled={future}
                        onClick={() => toggleDay(iso)}
                        onMouseDown={() => startDrag(iso)}
                        onMouseEnter={() => dragOver(iso)}
                        aria-current={isToday ? "date" : undefined}
                        aria-pressed={selected}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
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
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={close}
            className="mt-3 w-full rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue py-1.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
