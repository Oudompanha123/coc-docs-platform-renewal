import { TagIcon } from "@/components/layout/icons";
import type { DocsHeaderNav, DocsSubItem } from "@/lib/docs/jexmcp-nav";

/** Phase 2 placeholder — real content lands in Phase 3, one header at a
 *  time, starting with Jex3.0. Not fabricated feature copy: this page says
 *  plainly that it isn't written yet. */
export function DocsStubPage({ header, item }: { header: DocsHeaderNav; item: DocsSubItem }) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-purple">{header.label}</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">{item.label}</h1>

      <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-border bg-page p-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-muted shadow-sm">
          <TagIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-ink">
          {header.label} — {item.label} isn&apos;t written yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          This is a Phase 2 structural stub. Real content gets cloned from the jexmcp3.0 source in
          Phase 3.
        </p>
      </div>
    </div>
  );
}
