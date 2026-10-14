import type { ReactNode } from "react";

/** Left-border callout box, matching the reference docs site's info/warning
 *  pattern but on Coc Docs Platform's own tokens (brand-purple / danger). */
export function DocsCallout({ tone = "info", children }: { tone?: "info" | "warning"; children: ReactNode }) {
  const styles =
    tone === "warning"
      ? "border-destructive bg-destructive/5 text-foreground"
      : "border-primary bg-muted-surface text-foreground";

  return <div className={`rounded-r-lg border-l-2 px-4 py-3 text-sm leading-relaxed ${styles}`}>{children}</div>;
}
