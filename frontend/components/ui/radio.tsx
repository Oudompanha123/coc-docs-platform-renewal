/**
 * Radio — the checkbox's round sibling (ADR-104 r2.3).
 *
 * Native, for the same reasons as {@link Checkbox}: a radio's whole value is
 * that the browser groups it by `name`, moves between the group with the
 * arrow keys and submits one value. Reimplementing that on a `<div>` to gain
 * a nicer selector is a bad trade, so only the painting changes — the dot is
 * an overlaid span that `peer-checked:` scales into view.
 *
 * // req: ADR-104
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Radio({ className, ...props }: ComponentProps<"input">) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <input
        type="radio"
        className={cn(
          "peer size-4 shrink-0 appearance-none rounded-full border border-surface-border bg-muted-surface transition-[background-color,border-color,box-shadow] outline-none",
          "checked:border-primary checked:bg-background",
          "focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_rgb(0_0_0_/_6%)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
      <span
        aria-hidden="true"
        className="bg-primary pointer-events-none absolute size-2 scale-0 rounded-full transition-transform peer-checked:scale-100"
      />
    </span>
  );
}
