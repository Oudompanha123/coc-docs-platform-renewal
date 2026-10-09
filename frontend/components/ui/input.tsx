/**
 * Input — the text-field primitive (ADR-104 r2.1).
 *
 * Styled to the references the product owner supplied: a filled pill with no
 * visible border at rest, rather than shadcn's default outlined rectangle.
 * The coc-docs design system gives fields its 7.2px control radius; the
 * product owner kept the pill for fields (r2.6) while buttons took 7.2px,
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
 * What every text field shares, single-line or not: the fill, the invisible
 * border, the calm focus and the invalid state. No shape and no height — those
 * are what differ between {@link inputBaseClass} and `textareaBaseClass`
 * (`./textarea`), and keeping them out of here is what stops a multi-line
 * field inheriting a pill it then has to fight.
 */
export const fieldSurfaceClass = cn(
  "bg-muted-surface w-full min-w-0 border border-transparent text-base transition-[color,box-shadow,background-color,border-color] outline-none md:text-sm",
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

/**
 * The single-line field: the shared surface as a 40px pill. Exported so
 * nothing has to restate it — `components/docs/editor`'s fields point here.
 * Dropdowns use `SimpleSelect` (`./select`), on the same surface. Only for one line of text: a
 * `<textarea>` takes `textareaBaseClass`, because a pill's ends grow with its
 * height and a multi-line pill is two semicircles.
 */
export const inputBaseClass = cn(fieldSurfaceClass, "flex h-10 rounded-full pl-4 pr-4 py-2");

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return <input type={type} className={cn(inputBaseClass, className)} {...props} />;
}
