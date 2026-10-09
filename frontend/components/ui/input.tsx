/**
 * Input — the text-field primitive (ADR-104 r2.1).
 *
 * Styled to the references the product owner supplied: a filled pill with no
 * visible border at rest, rather than shadcn's default outlined rectangle,
 * and claude.ai's composer for how it behaves on focus. The border is present
 * but transparent, so focus can colour it without the field changing size —
 * a transparent-to-visible border costs no layout, where adding one would
 * shift every character by a pixel the moment you clicked in.
 *
 * One field style, not the four the codebase had grown. The brand-purple 4px
 * ring and the second "dashboard" variant are both gone — they were two
 * answers to a question nobody had asked twice.
 *
 * `aria-invalid` now styles the field, which it deliberately did not before:
 * an invalid field tints and takes a red border. The previous version
 * announced invalidity only to a screen reader, which was correct for a
 * migration that promised to change nothing and is simply a gap now.
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

/**
 * Exported so nothing has to restate it. `components/docs/editor` carried its
 * own `fieldInputClass` — a fifth field style, used in about thirty places —
 * and it now points here instead of describing a field of its own.
 */
export const inputBaseClass = cn(
  "bg-muted-surface flex h-10 w-full min-w-0 rounded-full border border-transparent pl-4 pr-4 py-2 text-base transition-[color,box-shadow,background-color,border-color] outline-none md:text-sm",
  "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
  "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
  // Focus, the way claude.ai's composer does it: the field lifts off the page
  // rather than being outlined on it. The fill goes white, the border steps up
  // from transparent to a visible neutral, and a soft shadow appears under it.
  //
  // No ring. The 3px halo shadcn ships is a loud, high-contrast band around a
  // pill, and at this radius it reads as a second border rather than a glow.
  // Everything that marks the field as focused here is a property the field
  // already had, just moved — which is why it feels calm.
  "focus-visible:bg-background focus-visible:border-surface-border focus-visible:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.12)]",
  // An invalid field keeps the same quiet treatment, in the error colour —
  // still no ring, so "wrong" and "focused" do not shout over each other.
  "aria-invalid:border-destructive/50 aria-invalid:bg-destructive/5",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
);

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(inputBaseClass, className)} {...props} />;
}
