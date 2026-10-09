"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentIcon } from "@/components/layout/icons";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { HeroForm } from "@/components/docs/editor/HeroForm";
import { StepsForm } from "@/components/docs/editor/StepsForm";
import { SectionsForm } from "@/components/docs/editor/SectionsForm";
import { parseContentId } from "@/lib/docs/content-store";
import { fetchDocContent, saveDocContent } from "@/lib/docs/docs-content-api";
import { hrefFor } from "@/lib/docs/nav-routing";
import { useNavStructure } from "@/lib/docs/useNavStructure";
import type { DocContent } from "@/lib/docs/content-types";

const BLANK: Record<DocContent["kind"], DocContent> = {
  hero: {
    kind: "hero",
    heading: "",
    tagline: "",
    subline: "",
    ctaLabel: "Get started",
    ctaHref: "",
    eyebrow: "Overview",
    sectionHeading: "",
    sectionIntro: "",
    features: [],
  },
  steps: { kind: "steps", eyebrow: "", heading: "", intro: "", steps: [] },
  sections: { kind: "sections", eyebrow: "", heading: "", intro: "", sections: [] },
};

export default function ContentEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { productKey, slug } = parseContentId(id);
  const products = useNavStructure();
  const product = products?.find((p) => p.key === productKey);
  const item = product?.items.find((i) => i.slug === slug);
  const entry = product && item ? { productKey, productLabel: product.label, label: item.label, publicHref: hrefFor(productKey, slug) } : undefined;

  const [draft, setDraft] = useState<DocContent | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDocContent(id)
      .then((content) => {
        if (!cancelled) setDraft(content ?? BLANK.sections);
      })
      .catch(() => {
        if (!cancelled) setDraft(BLANK.sections);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);


  if (!products) {
    return (
      <AppShell
        pageTitle="Content"
        pageSubtitle="Loading…"
        titleIcon={<DocumentIcon className="hidden h-8 w-8 shrink-0 text-foreground sm:block" />}
      >
        <p className="text-sm text-muted">Loading…</p>
      </AppShell>
    );
  }

  if (!entry) {
    return (
      <AppShell
        pageTitle="Content"
        pageSubtitle="Unknown content id"
        titleIcon={<DocumentIcon className="hidden h-8 w-8 shrink-0 text-foreground sm:block" />}
      >
        <p className="text-sm text-muted">Unknown content id.</p>
        <Link href="/overview" className="mt-3 inline-block text-sm font-semibold text-foreground hover:underline">
          ← Back to Overview
        </Link>
      </AppShell>
    );
  }

  function changeKind(kind: DocContent["kind"]) {
    if (draft && kind !== draft.kind) {
      const hasData = JSON.stringify(draft) !== JSON.stringify(BLANK[draft.kind]);
      if (hasData && !window.confirm("Switching the content type starts a blank form for that type. Continue?")) {
        return;
      }
    }
    setDraft(BLANK[kind]);
  }

  async function handleSave() {
    if (!draft || !entry) return;
    setSaving(true);
    setSaveError(null);
    try {
      await saveDocContent(id, draft);
      setSavedAt(Date.now());
      // Closes this editor and returns to the product page it belongs to —
      // the same destination as the "Back to {productLabel}" link above.
      router.push(`/${entry.productKey}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Couldn't save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <AppShell
      pageTitle={`${entry.productLabel} — ${entry.label}`}
      pageSubtitle={entry.publicHref}
      titleIcon={<DocumentIcon className="hidden h-8 w-8 shrink-0 text-foreground sm:block" />}
    >
      <div className="flex items-center justify-between">
        <Link href={`/${entry.productKey}`} className="text-sm font-semibold text-foreground hover:underline">
          ← Back to {entry.productLabel}
        </Link>
        <div className="flex items-center gap-3">
          {saveError && <span className="text-xs font-semibold text-[#c94040]">{saveError}</span>}
          {!saveError && savedAt && <span className="text-xs font-semibold text-[#1f9d6b]">Saved</span>}
          <Link
            href={entry.publicHref}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-dash-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:text-foreground hover:shadow"
          >
            View live page
            <span aria-hidden="true" className="text-xs">
              ↗
            </span>
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

        {/* No items-start, so the columns stretch and the row is as tall as
            the preview needs. From lg up the editor is absolutely positioned
            inside a wrapper, which is the whole trick: an absolutely
            positioned child takes no part in sizing its parent, so the editor
            contributes nothing to the row height and the preview is the only
            authority on it. Stretch alone would size the row to whichever
            column is naturally taller, and a long form would then stretch the
            preview to match.

            This replaced a ResizeObserver that measured the preview and wrote
            the result onto the editor as an inline pixel height. That worked,
            and it left dead space below the page whenever the measured value
            outlived the layout it came from — visible only to whoever had a
            viewport short enough to scroll that far.

            Below lg the columns stack and both flow normally: there is no
            second column to match, and absolute positioning would collapse
            the editor to nothing. */}
      {draft && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="relative min-h-0">
            <div className="flex flex-col rounded-[10px] border border-border bg-white py-5 px-0 shadow-sm lg:absolute lg:inset-0">
            <div className="mb-4 shrink-0 px-5">
              <span className="text-xs font-semibold text-muted">Content type</span>
              <div className="mt-1.5 flex gap-2">
                {(["hero", "steps", "sections"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => changeKind(kind)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      draft.kind === kind
                        ? "bg-secondary text-foreground"
                        : "border border-border text-muted hover:bg-page"
                    }`}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </div>

            {draft.kind === "hero" && <HeroForm value={draft} onChange={setDraft} />}
            {draft.kind === "steps" && <StepsForm value={draft} onChange={setDraft} />}
            {draft.kind === "sections" && <SectionsForm value={draft} onChange={setDraft} />}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Live preview</p>
            <div className="min-h-[calc(100vh-225px)] overflow-y-auto rounded-[10px] bg-page">
              <ContentRenderer content={draft} variant={entry.productKey === "jex3-0" ? "admin" : "docs"} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
