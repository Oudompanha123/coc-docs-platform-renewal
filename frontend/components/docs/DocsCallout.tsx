import type { ReactNode } from "react";

/** Left-border callout box, matching the reference docs site's info/warning
 *  pattern but on Coc Docs Platform's own tokens (brand-purple / danger). */
export function DocsCallout({ tone = "info", children }: { tone?: "info" | "warning"; children: ReactNode }) {
  const styles =
    tone === "warning"
      ? "border-danger bg-danger/5 text-ink"
      : "border-brand-purple bg-brand-purple/5 text-ink";

  return <div className={`rounded-r-lg border-l-4 px-4 py-3 text-sm ${styles}`}>{children}</div>;
}
