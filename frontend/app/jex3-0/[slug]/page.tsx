import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon, TagIcon } from "@/components/layout/icons";
import { JEX3_SUB_ITEMS_RAW } from "@/lib/docs/jex3-sub-items";

/** Placeholder for the Jex3.0 sub-items not yet cloned (Flow, Structure,
 *  Updating, Releases, FAQ, Prerequisites, Run configs, From scratch,
 *  Verify) — honest "not written yet", same as Phase 2. Overview/Get
 *  started/How to use have their own real pages and never reach this file. */
export default async function Jex30SubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = JEX3_SUB_ITEMS_RAW.find((i) => i.slug === slug);
  if (!item) notFound();

  return (
    <AppShell
      pageTitle={`Jex3.0 — ${item.label}`}
      pageSubtitle="Not written yet"
      titleIcon={<LayersIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-page p-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-muted shadow-sm">
          <TagIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-dash-ink">Jex3.0 — {item.label} isn&apos;t written yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Real content gets cloned from the jexmcp3.0 source in a future pass, one sub-item at a time.
        </p>
      </div>
    </AppShell>
  );
}
