import { statusKind } from "@/lib/attendance/stats";

/** A dot + label pill for one HRMS status string — colors match the reference mockup exactly. */
export function StatusPill({ status }: { status: string }) {
  const style = {
    normal: { bg: "#ecfdf5", text: "#047857", dot: "#10b981" },
    late: { bg: "#fffbeb", text: "#b45309", dot: "#f59e0b" },
    missed: { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
    other: { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
  }[statusKind(status)];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: style.dot }} aria-hidden="true" />
      {status || "Unknown"}
    </span>
  );
}
