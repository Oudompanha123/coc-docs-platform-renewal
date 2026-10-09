"use client";

/**
 * Day / Week / Month / Year — purely a client-side view toggle, styled after
 * the Claude Usage page's own Day/Week/Month segmented control
 * (`AdminClaudeUsageView.tsx`). Decorative only, for now: it does not change
 * what date, department, or rows the page fetches or shows — that follow-up
 * is separate, deliberately out of scope here.
 */
export type AttendanceRange = "day" | "week" | "month" | "year";

const RANGES: { value: AttendanceRange; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const RANGE_LABEL: Record<Exclude<AttendanceRange, "day">, string> = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
};

export function AttendanceRangeToggle({
  value,
  onChange,
}: {
  value: AttendanceRange;
  onChange: (range: AttendanceRange) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-1 rounded-[10px] border border-border bg-white p-1 shadow-sm">
        {RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            aria-pressed={value === range.value}
            onClick={() => onChange(range.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              value === range.value
                ? "bg-primary text-white shadow"
                : "text-muted hover:text-dash-ink"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {value !== "day" && (
        <span className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm font-semibold text-dash-ink shadow-sm">
          {RANGE_LABEL[value]}
        </span>
      )}
    </div>
  );
}
