import { statusKind } from "@/lib/attendance/stats";

/**
 * A dot + label pill for one HRMS status string. The hues are the mockup's
 * (emerald / amber / red / grey) but drawn as low-alpha tints with a `dark:`
 * text shade, so the pill still reads inside the dark shell (ADR-104).
 */
export function StatusPill({ status }: { status: string }) {
  const style = {
    normal: { pill: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
    late: { pill: "bg-amber-500/10 text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
    missed: { pill: "bg-red-500/10 text-red-600 dark:text-red-400", dot: "bg-red-500" },
    other: { pill: "bg-muted-surface text-muted-foreground", dot: "bg-gray-400" },
  }[statusKind(status)];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${style.pill}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${style.dot}`} aria-hidden="true" />
      {status || "Unknown"}
    </span>
  );
}
