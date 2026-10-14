import { FileText } from "lucide-react";
import type { ContentDocRow } from "@/lib/docs/content-stats";

/**
 * One Recent Documents row (ADR-104 r2.10): a quiet document glyph, the
 * page name over its product, and its state as a small dot and a word.
 *
 * It used to lead with a gradient initials tile and end with a tinted pill —
 * two loud marks per row, so a list of ten was mostly decoration. Status is
 * still colour-coded, but the colour is on the dot and the word stays in a
 * text colour, so it reads in dark mode and without colour.
 */
export function DocumentRow({ data }: { data: ContentDocRow }) {
  return (
    <div className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-accent">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted-surface text-muted-foreground">
        <FileText className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{data.label}</p>
        <p className="truncate text-xs text-muted-foreground">{data.productLabel}</p>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span
          aria-hidden="true"
          className={`size-1.5 rounded-full ${data.hasContent ? "bg-emerald-500" : "bg-amber-500"}`}
        />
        {data.hasContent ? "Has content" : "Not written"}
      </span>
    </div>
  );
}
