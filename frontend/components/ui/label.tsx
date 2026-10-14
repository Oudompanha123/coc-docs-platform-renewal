/**
 * Label — shadcn/ui's, minus the Radix dependency (ADR-104 r2.0).
 *
 * shadcn's own Label wraps `@radix-ui/react-label`, which adds exactly one
 * behaviour over a plain element: suppressing text selection when you
 * double-click the caption. Every label in this codebase already carries an
 * explicit `htmlFor`, which is the part that matters, so the package would
 * buy nothing the browser is not already doing.
 *
 * `font-medium` and `text-sm`, not the `font-semibold` this file used to
 * carry — shadcn's captions sit quieter above their field than the old
 * design's did.
 *
 * // req: ADR-104
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
