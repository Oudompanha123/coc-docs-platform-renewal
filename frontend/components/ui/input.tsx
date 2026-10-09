/**
 * Input — the text-field primitive (ADR-104 r2.1).
 *
 * Styled to the reference the product owner supplied: a filled pill with no
 * visible border, rather than shadcn's default outlined rectangle. The border
 * is present but transparent, so focus can colour it without the field
 * changing size.
 *
 * One field style, not the four the codebase had grown. The brand-purple 4px
 * ring and the second "dashboard" variant are both gone — they were two
 * answers to a question nobody had asked twice.
 *
 * `aria-invalid` now styles the field, which it deliberately did not before:
 * an invalid field gets a red ring. The previous version announced
 * invalidity only to a screen reader, which was correct for a migration that
 * promised to change nothing and is simply a gap now.
 *
 * Padding is written `pl-4 pr-4` rather than `px-4` so a caller's one-sided
 * override actually displaces it. tailwind-merge drops an earlier class only
 * when the later one covers the same ground: `px-4` removes a preceding
 * `pl-4`, but `pl-10` does not remove a preceding `px-4`, because `px` is the
 * wider of the two. Written `px-4`, the base would survive alongside a
 * caller's `pl-10`, both rules would land at equal specificity, and the
 * winner would be whichever Tailwind emitted last. A test covers it.
 *
 * // req: ADR-104
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "bg-muted-surface flex h-10 w-full min-w-0 rounded-full border border-transparent pl-4 pr-4 py-2 text-base transition-[color,box-shadow,background-color] outline-none md:text-sm",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
