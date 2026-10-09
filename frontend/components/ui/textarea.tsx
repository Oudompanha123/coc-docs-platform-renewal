/**
 * Textarea — the multi-line text field (ADR-104 r2.8).
 *
 * The same surface as `Input` — fill, invisible border, calm focus, invalid
 * state, all from `fieldSurfaceClass` — with a corner instead of a pill. A
 * pill's radius is half its height, so on a field that grows to 120px the ends
 * became two large semicircles and the first and last characters of each line
 * sat in the curve. `rounded-xl` keeps the softness of the pill fields beside
 * it without that.
 *
 * Padding matches `Input`'s `pl-4`, so text in a textarea lines up with text
 * in the single-line field above it.
 *
 * // req: ADR-104
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { fieldSurfaceClass } from "./input";

export const textareaBaseClass = cn(fieldSurfaceClass, "flex min-h-20 rounded-xl pl-4 pr-4 py-2.5");

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(textareaBaseClass, className)} {...props} />;
}
