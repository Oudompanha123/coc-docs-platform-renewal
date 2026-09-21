import { TagIcon } from "@/components/layout/icons";

/** Shown for a sub-item that has no saved content yet. Not fabricated
 *  feature copy: this page says plainly that it isn't written yet.
 *
 *  Prop shapes are narrowed to just the fields actually used (not the full
 *  NavProduct/NavItem from nav-api.ts) so this also still satisfies the
 *  older, unmigrated DocsHeaderNav/DocsSubItem shape (app/docs/idea/*, a
 *  pre-existing orphan left untouched by the nav-structure task). */
export function DocsStubPage({ header, item }: { header: { label: string }; item: { label: string } }) {
  return (
    <div>
      <p className="text-sm font-semibold text-brand-purple">{header.label}</p>
      <h1 className="mt-1 text-3xl font-bold text-ink">{item.label}</h1>

      <div className="mt-8 flex flex-col items-center justify-center rounded-[10px] border border-border bg-page p-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-muted shadow-sm">
          <TagIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-ink">
          {header.label} — {item.label} isn&apos;t written yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          This is a <strong>Phase 2</strong> structural stub. Real content gets cloned from the <strong>jexmcp3.0</strong> source in{" "}
          <strong>Phase 3</strong>.
        </p>
      </div>
    </div>
  );
}
