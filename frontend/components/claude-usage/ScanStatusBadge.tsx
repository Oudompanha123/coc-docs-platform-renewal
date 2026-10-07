import { OUTCOME_LABELS, type ScanOutcome } from "@/lib/claudeUsage/scanLogs";

/** Same dot+pill shape as users-roles StatusBadge. Color is the only place
 *  this page uses color, so each state keeps the palette globals.css already
 *  maps for dark mode: green, orange, red, and grey for "nothing to report". */
const PILLS: Record<ScanOutcome, string> = {
  success: "bg-[#e1f5ec] text-[#1f9d6b]",
  partial: "bg-[#fffbeb] text-[#b45309]",
  failed: "bg-danger/10 text-danger",
  "no-usage": "bg-page text-muted",
};

export function ScanStatusBadge({ outcome }: { outcome: ScanOutcome }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${PILLS[outcome]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {OUTCOME_LABELS[outcome]}
    </span>
  );
}
