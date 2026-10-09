"use client";

import type { StatusKind } from "@/lib/attendance/stats";
import { inputBaseClass } from "@/components/ui/input";

/**
 * One status column's filter.
 *
 * <p>Deliberately the same visual language as {@link AttendanceDepartmentSelect}
 * — the same `appearance-none` select, border, focus ring and trailing chevron
 * — because these sit a few centimetres apart on the same screen and a second
 * dropdown style would read as a second kind of control.
 *
 * <p>No leading icon, unlike the department select: a coloured dot carries the
 * meaning here, and it changes with the selection, which an icon could not do.
 *
 * <p>The options are passed in rather than fixed, so the list describes the
 * rows actually on screen (see {@code statusKindsPresent}). A filter that
 * cannot match anything is worse than a shorter list.
 */
export function AttendanceStatusSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: StatusKind[];
  value: StatusKind | null;
  onChange: (value: StatusKind | null) => void;
}) {
  const disabled = options.length === 0;

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: value ? DOT[value] : "#cbd5e1" }}
      />
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange((e.target.value || null) as StatusKind | null)}
        aria-label={label}
        className={`${inputBaseClass} appearance-none`}
      >
        <option value="">{label}: all</option>
        {options.map((kind) => (
          <option key={kind} value={kind}>
            {LABEL[kind]}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/** The same three colours the status pills and the table legend already use. */
const DOT: Record<StatusKind, string> = {
  normal: "#10b981",
  late: "#f59e0b",
  missed: "#ef4444",
  other: "#94a3b8",
};

/**
 * "Other" is named plainly rather than hidden behind something friendlier:
 * it means HRMS sent wording this build does not recognise, and a person
 * filtering by it should expect exactly that.
 */
const LABEL: Record<StatusKind, string> = {
  normal: "Normal",
  late: "Late",
  missed: "Missed",
  other: "Other",
};
