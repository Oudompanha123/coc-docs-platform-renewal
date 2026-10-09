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
      <div className="inline-flex h-9 items-center gap-0.5 rounded-lg border border-surface-border bg-card p-0.5">
        {RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            aria-pressed={value === range.value}
            onClick={() => onChange(range.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              value === range.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {value !== "day" && (
        <span className="inline-flex h-9 items-center rounded-lg border border-surface-border bg-card px-3 text-sm font-medium text-foreground">
          {RANGE_LABEL[value]}
        </span>
      )}
    </div>
  );
}
