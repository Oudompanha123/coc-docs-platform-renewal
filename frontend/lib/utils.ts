/**
 * `cn` — the class-name joiner every shadcn/ui primitive expects to import
 * from `@/lib/utils` (ADR-104 decision 1).
 *
 * Two jobs, and both matter:
 *
 *   clsx           resolves conditionals and arrays to a flat string.
 *   twMerge        resolves *conflicts* within that string, last one winning.
 *
 * The second is the reason this exists rather than a plain template literal.
 * A primitive ships a default (`px-4`) and a caller overrides it (`px-2`);
 * plain concatenation emits both and the winner is then decided by the order
 * Tailwind happened to generate the utilities in, which is not something a
 * caller can see or rely on. `twMerge` drops the earlier one, so the override
 * wins because it was written last.
 *
 * It only knows the radius names Tailwind ships, so the project's own
 * `--radius-control` (globals.css, ADR-104 r2.6) is registered here — without
 * it `rounded-control rounded-md` keeps both classes and the override silently
 * loses to stylesheet order.
 *
 * // req: ADR-104
 */
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ["control"] } },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
