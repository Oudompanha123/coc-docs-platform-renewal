/**
 * SearchInput — the one search field (ADR-104 r2.9).
 *
 * The pill `Input` with Lucide's search glyph inside it on the left. Every
 * search box in the app had drawn its own: different glyphs, at different
 * sizes and offsets, some on the right, some in a separate box beside the
 * field. This is the only one now — `size-4` muted icon at `left-3`, text
 * starting at `pl-9` — so they line up and read as the same control.
 *
 * `type="search"` gives the right keyboard on phones and the native clear
 * affordance; `aria-label` stays the caller's job, since only the caller
 * knows what is being searched.
 *
 * // req: ADR-104
 */
import { Search } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export function SearchInput({
  className,
  containerClassName,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  /** Width/margins for the wrapper, e.g. `w-full sm:w-72`. `className` styles the field itself. */
  containerClassName?: string;
}) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input type="search" className={cn("pl-9", className)} {...props} />
    </div>
  );
}
