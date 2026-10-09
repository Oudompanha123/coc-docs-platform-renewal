/**
 * Input — the text-field primitive (ADR-104 phase 1).
 *
 * The base is `components/auth/FormField.tsx`'s `fieldClasses` verbatim, with
 * its `pl-10` generalised back to a plain horizontal inset. FormField
 * re-applies `pl-10` for the leading-icon layout and `pr-10` for the
 * password-visibility toggle, and `cn` resolves those against the base.
 *
 * That inset is written `pl-4 pr-4` and NOT `px-4`, which looks redundant and
 * is not. tailwind-merge drops an earlier class only when a later one covers
 * the same ground: `px-4` removes a preceding `pl-4`, but `pl-10` does not
 * remove a preceding `px-4`, because `px` is the wider of the two. Written as
 * `px-4` the base survives alongside the caller's `pl-10`, both rules land in
 * the stylesheet at equal specificity, and which one wins is decided by the
 * order Tailwind happened to emit them in — invisible in review and a
 * coin-flip at runtime. Spelling the sides out makes the override a direct
 * conflict, which tailwind-merge resolves properly. A test covers it.
 *
 * Deliberately absent: a background colour, and any `aria-invalid:` styling.
 * The fields this replaces set neither, and phase 1 changes no pixels. An
 * invalid field announces itself through `aria-invalid` and the error text
 * below it, exactly as it did before; giving it a red border is a real design
 * change and belongs in its own PR.
 *
 * // req: ADR-104
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-border pl-4 pr-4 py-3 text-sm text-ink transition-colors placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15",
        className,
      )}
      {...props}
    />
  );
}
