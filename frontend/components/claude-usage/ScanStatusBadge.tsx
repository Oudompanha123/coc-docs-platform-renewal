import type { ComponentType, SVGProps } from "react";
import { CheckCircleIcon, ClockIcon, WarningIcon, XIcon } from "@/components/layout/icons";
import { INDICATOR_LABELS, type ScanIndicator } from "@/lib/claudeUsage/scanLogs";

/** Same pill shape as users-roles StatusBadge. Each state keeps the palette
 *  globals.css already maps for dark mode — blue, green, orange, red, grey —
 *  and carries its own icon and label, so the state never rests on color alone. */
const PILLS: Record<ScanIndicator, string> = {
  "in-progress": "bg-brand-blue/10 text-brand-blue",
  success: "bg-[#e1f5ec] text-[#1f9d6b]",
  "no-usage": "bg-[#e1f5ec] text-[#1f9d6b]",
  partial: "bg-[#fffbeb] text-[#b45309]",
  failed: "bg-destructive/10 text-destructive",
  "no-recent": "bg-muted-surface text-muted-foreground",
};

function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
    </svg>
  );
}

const ICONS: Record<ScanIndicator, ComponentType<SVGProps<SVGSVGElement>>> = {
  "in-progress": SpinnerIcon,
  success: CheckCircleIcon,
  "no-usage": CheckCircleIcon,
  partial: WarningIcon,
  failed: XIcon,
  "no-recent": ClockIcon,
};

/**
 * A scan's status as a labelled pill with an icon (ADR-107). `in-progress`
 * spins, except for viewers who asked for reduced motion.
 */
export function ScanStatusBadge({ outcome, size = "sm" }: { outcome: ScanIndicator; size?: "sm" | "md" }) {
  const Icon = ICONS[outcome];
  const spin = outcome === "in-progress" ? "animate-spin motion-reduce:animate-none" : "";
  return (
    <span
      data-status={outcome}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ${PILLS[outcome]} ${
        size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Icon className={`${size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} shrink-0 ${spin}`} aria-hidden="true" />
      {INDICATOR_LABELS[outcome]}
    </span>
  );
}
