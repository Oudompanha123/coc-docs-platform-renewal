"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, WarningIcon } from "@/components/layout/icons";
import { SimpleSelect } from "@/components/ui/select";
import {
  addMonths,
  buildMonthGrid,
  formatDisplayDate,
  monthLabel,
  toIsoDate,
  todayIso,
  yearMonthOf,
  type YearMonth,
} from "@/lib/attendance/dates";
import {
  EXPIRY_CHOICES,
  formatDateTime,
  isExpiryPast,
  joinExpiry,
  presetExpiry,
  relativeExpiry,
  splitExpiry,
  timeOptions,
  type ExpiryChoice,
} from "@/lib/announcements/expiry";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Used when "Pick a date" is chosen with nothing set yet: tomorrow, end of the working day. */
const DEFAULT_TIME = "18:00";

/**
 * When an announcement stops being shown (ADR-098).
 *
 * <p>Quick choices first, because "a week" is what most announcements want
 * and nobody should have to work out next Wednesday's date for it. Any choice
 * other than "No expiry" shows the actual date and time it resolved to, and
 * both stay editable — a preset is a starting point, not a mode.
 *
 * <p>The date button and calendar copy the Attendance page's date picker, and
 * the time select copies its department select, so this reads as the same
 * app. The calendar opens inline, under the button, rather than floating: the
 * editor is a scrolling modal, and a floating popup inside one is clipped.
 *
 * <p>The sentence underneath is the point of the whole field: it says, in
 * words, exactly when members stop seeing the announcement — or that the time
 * chosen has already passed, which the server would refuse anyway.
 */
export function AnnouncementExpiryField({
  value,
  onChange,
  disabled = false,
}: {
  /** ISO instant, or null for "until unpublished". */
  value: string | null;
  onChange: (iso: string | null) => void;
  disabled?: boolean;
}) {
  const [choice, setChoice] = useState<ExpiryChoice>(value ? "custom" : "none");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const parts = value ? splitExpiry(value) : null;

  function choose(next: ExpiryChoice) {
    setChoice(next);
    if (next === "none") {
      setCalendarOpen(false);
      onChange(null);
    } else if (next === "custom") {
      // Keep whatever a preset already filled in; otherwise start from tomorrow.
      if (!value) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        onChange(joinExpiry(toIsoDate(tomorrow), DEFAULT_TIME));
      }
      setCalendarOpen(true);
    } else {
      setCalendarOpen(false);
      onChange(presetExpiry(next));
    }
  }

  function setDate(date: string) {
    setChoice("custom");
    setCalendarOpen(false);
    onChange(joinExpiry(date, parts?.time ?? DEFAULT_TIME));
  }

  function setTime(time: string) {
    setChoice("custom");
    if (parts) onChange(joinExpiry(parts.date, time));
  }

  const past = isExpiryPast(value);

  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-semibold text-foreground">
        Expires <span className="font-normal text-muted-foreground">(optional)</span>
      </legend>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Expires">
        {EXPIRY_CHOICES.map((c) => (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={choice === c.key}
            onClick={() => choose(c.key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              choice === c.key
                ? "bg-secondary text-foreground"
                : "border border-surface-border text-muted-foreground hover:bg-accent"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {choice !== "none" && parts && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={calendarOpen}
            aria-label={`Expiry date, ${formatDisplayDate(parts.date)}`}
            onClick={() => setCalendarOpen((open) => !open)}
            className="flex items-center gap-2 rounded-control border border-surface-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/20"
          >
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {formatDisplayDate(parts.date)}
          </button>

          <div className="relative">
            <ClockIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <SimpleSelect
              aria-label="Expiry time"
              value={parts.time}
              onValueChange={setTime}
              options={timeOptions(parts.time).map((t) => ({ value: t, label: t }))}
              className="w-32 pl-9 font-semibold"
              contentClassName="max-h-64"
            />
          </div>
        </div>
      )}

      {choice !== "none" && parts && calendarOpen && (
        <ExpiryCalendar selected={parts.date} onPick={setDate} />
      )}

      {value && past ? (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger">
          <WarningIcon className="h-3.5 w-3.5 shrink-0" />
          That time has already passed — choose a later one, or No expiry.
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          {value ? (
            <>
              Members stop seeing it on <b className="font-semibold text-foreground">{formatDateTime(value)}</b> (
              {relativeExpiry(value)}).
            </>
          ) : (
            "Members see it until you unpublish it."
          )}
        </p>
      )}
    </fieldset>
  );
}

/**
 * A one-day calendar in the Attendance picker's style, turned around: there,
 * future days are disabled because nothing has happened yet; here, past days
 * are, because an announcement cannot expire before it is read.
 */
function ExpiryCalendar({ selected, onPick }: { selected: string; onPick: (iso: string) => void }) {
  const [viewMonth, setViewMonth] = useState<YearMonth>(() => yearMonthOf(selected));
  const today = todayIso();
  const thisMonth = yearMonthOf(today);
  const prevDisabled =
    viewMonth.year < thisMonth.year || (viewMonth.year === thisMonth.year && viewMonth.month <= thisMonth.month);
  const grid = buildMonthGrid(viewMonth);

  return (
    <div role="dialog" aria-label="Pick an expiry date" className="mt-2 w-72 rounded-xl border border-surface-border bg-card p-3 shadow-lg">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          type="button"
          aria-label="Previous month"
          disabled={prevDisabled}
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-foreground">{monthLabel(viewMonth)}</p>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 px-1 text-center text-xs font-semibold text-muted-foreground">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-y-1 px-1">
        {grid.map((iso, i) => {
          if (!iso) return <span key={`blank-${i}`} className="h-8 w-8" />;
          const isPast = iso < today;
          const isSelected = iso === selected;
          const isToday = iso === today;
          return (
            <div key={iso} className="flex h-8 items-center justify-center">
              <button
                type="button"
                disabled={isPast}
                onClick={() => onPick(iso)}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                aria-label={formatDisplayDate(iso)}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors ${
                  isSelected
                    ? "bg-primary font-semibold text-primary-foreground"
                    : isPast
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : isToday
                        ? "text-foreground ring-2 ring-inset ring-ring"
                        : "text-foreground hover:bg-accent"
                }`}
              >
                {Number(iso.slice(-2))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
