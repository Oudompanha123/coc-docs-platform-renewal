"use client";

/**
 * DatePicker — a pill trigger that opens `Calendar` in a `Popover`
 * (ADR-104 r2.11). Replaces `<input type="date">`, whose look and calendar
 * the browser and OS draw — a different control on every machine, and the
 * one native field left after `SimpleSelect` retired `<select>`.
 *
 * The value is the same `YYYY-MM-DD` string `<input type="date">` produced,
 * so call sites swap one element for the other without touching their state
 * or the API they send it to. Dates are read and written in local time: a
 * `new Date("2026-10-14")` would be UTC midnight, the previous day west of
 * Greenwich.
 *
 * // req: ADR-104
 */
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";
import { inputBaseClass } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/** `YYYY-MM-DD` → a local-midnight Date, or undefined for "" / malformed. */
export function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** A Date → `YYYY-MM-DD` in local time. */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DISPLAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export interface DatePickerProps {
  /** `YYYY-MM-DD`, or "" for no date. */
  value: string;
  onChange: (value: string) => void;
  /** Earliest selectable day, `YYYY-MM-DD`. */
  min?: string;
  /** Latest selectable day, `YYYY-MM-DD`. */
  max?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Pick a date",
  disabled,
  id,
  className,
  ...aria
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const minDate = parseIsoDate(min);
  const maxDate = parseIsoDate(max);
  const disabledDays = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          data-empty={!selected || undefined}
          className={cn(
            inputBaseClass,
            "w-auto cursor-pointer items-center justify-start gap-2 text-left whitespace-nowrap data-[empty]:text-muted-foreground",
            className,
          )}
          {...aria}
        >
          <CalendarDays aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{selected ? DISPLAY.format(selected) : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? maxDate}
          startMonth={minDate}
          endMonth={maxDate}
          disabled={disabledDays}
          onSelect={(date) => {
            if (!date) return;
            onChange(toIsoDate(date));
            setOpen(false);
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
