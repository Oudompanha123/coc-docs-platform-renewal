import type { ScanStepStatus } from "@/lib/admin/claudeUsage";

/** Same dot+pill shape as users-roles StatusBadge. Color
 *  is the only place this page uses color, so each state keeps the palette
 *  globals.css already maps for dark mode. `skipped` is a step that never ran. */
const STYLES: Record<ScanStepStatus, { pill: string; label: string }> = {
  success: { pill: "bg-[#e1f5ec] text-[#1f9d6b]", label: "Success" },
  warning: { pill: "bg-[#fffbeb] text-[#b45309]", label: "Warning" },
  failed: { pill: "bg-danger/10 text-danger", label: "Failed" },
  skipped: { pill: "bg-page text-muted", label: "Not run" },
};

export function ScanStatusBadge({ status }: { status: ScanStepStatus }) {
  const style = STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.pill}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {style.label}
    </span>
  );
}
