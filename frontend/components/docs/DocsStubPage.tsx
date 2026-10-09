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
      <p className="text-sm font-semibold text-foreground">{header.label}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{item.label}</h1>

      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-muted-surface/50 px-6 py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg border border-surface-border bg-card text-muted-foreground">
          <TagIcon className="size-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-foreground">
          {header.label} — {item.label} isn&apos;t written yet
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This is a <strong>Phase 2</strong> structural stub. Real content gets cloned from the <strong>jexmcp3.0</strong> source in{" "}
          <strong>Phase 3</strong>.
        </p>
      </div>
    </div>
  );
}
