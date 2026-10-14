/**
 * Checkbox — shadcn/ui's look on a native `<input type="checkbox">`
 * (ADR-104 r2.3).
 *
 * shadcn's own is Radix's, which renders a `<button role="checkbox">` with a
 * hidden input beside it. That is a better component in the abstract and the
 * wrong one here: several tests in this codebase resolve these controls
 * through `getByLabelText`, which lands on the real input, and a few forms
 * read them out of `FormData`. Both would have had to change for a visual
 * upgrade, which is a poor trade.
 *
 * So the element stays native and only its painting changes:
 * `appearance-none` removes the platform checkbox, the box is drawn with the
 * same tokens as every other control, and the tick is an overlaid SVG that
 * `peer-checked:` reveals. Keyboard behaviour, form participation, the label
 * association and indeterminate state all stay the browser's.
 *
 * // req: ADR-104
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center">
      <input
        type="checkbox"
        className={cn(
          "peer size-4 shrink-0 appearance-none rounded-[4px] border border-surface-border bg-muted-surface transition-[background-color,border-color,box-shadow] outline-none",
          "checked:border-primary checked:bg-primary indeterminate:border-primary indeterminate:bg-primary",
          "focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_rgb(0_0_0_/_6%)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive/50",
          className,
        )}
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="text-primary-foreground pointer-events-none absolute size-3 opacity-0 transition-opacity peer-checked:opacity-100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8.5 6.5 12 13 4.5" />
      </svg>
    </span>
  );
}
