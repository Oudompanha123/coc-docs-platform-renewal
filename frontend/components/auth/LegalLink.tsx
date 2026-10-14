import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A link to `/terms` or `/privacy` from an auth page. Opens a new tab:
 * losing a half-filled registration or sign-in form to a full navigation
 * would be worse than the extra tab.
 */
export function LegalLink({ href, children }: { href: "/terms" | "/privacy"; children: ReactNode }) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium underline underline-offset-4">
      {children}
    </Link>
  );
}

