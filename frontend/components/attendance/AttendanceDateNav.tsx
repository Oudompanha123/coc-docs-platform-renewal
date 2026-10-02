"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/layout/icons";
import { addDays, formatShortDate, todayIso } from "@/lib/attendance/dates";
import { AttendanceDatePicker } from "./AttendanceDatePicker";
import type { AttendanceRange } from "./AttendanceRangeToggle";

/**
 * Prev / Today / Next + the date picker popup, all driving one ISO date —
 * both own only `date`/`onChange`, which is what keeps them always showing
 * the same date. `range` is passed straight through to the popup purely so
 * it can decorate Week mode with a row highlight (see
 * `AttendanceDatePicker`'s own doc comment) — it never changes what date or
 * data this nav itself shows.
 */
export function AttendanceDateNav({
  date,
  onChange,
  range = "day",
}: {
  date: string;
  onChange: (iso: string) => void;
  range?: AttendanceRange;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center rounded-[10px] border border-border bg-white shadow-sm">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => onChange(addDays(date, -1))}
          className="flex h-9 w-9 items-center justify-center rounded-l-[10px] text-muted transition-colors hover:bg-page hover:text-dash-ink"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange(todayIso())}
          aria-pressed={date === todayIso()}
          title="Go to today"
          className={`min-w-[108px] border-x border-border px-3 py-1.5 text-sm font-semibold transition-colors ${
            date === todayIso()
              ? "rounded-md bg-brand-purple/10 text-brand-purple"
              : "text-muted hover:bg-page hover:text-dash-ink"
          }`}
        >
          {date === todayIso() ? "Today" : formatShortDate(date)}
        </button>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => onChange(addDays(date, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-r-[10px] text-muted transition-colors hover:bg-page hover:text-dash-ink"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <AttendanceDatePicker date={date} onChange={onChange} range={range} />
    </div>
  );
}
