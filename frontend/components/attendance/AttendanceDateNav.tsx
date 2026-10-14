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
      <div className="inline-flex h-9 items-center overflow-hidden rounded-lg border border-surface-border bg-card">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => onChange(addDays(date, -1))}
          className="flex h-full w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onChange(todayIso())}
          aria-pressed={date === todayIso()}
          title="Go to today"
          className={`h-full min-w-[108px] border-x border-surface-border px-3 text-sm font-medium transition-colors ${
            date === todayIso()
              ? "bg-secondary text-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {date === todayIso() ? "Today" : formatShortDate(date)}
        </button>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => onChange(addDays(date, 1))}
          className="flex h-full w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>

      <AttendanceDatePicker date={date} onChange={onChange} range={range} />
    </div>
  );
}
