"use client";

import { useConfirm } from "@/components/ui/confirm";
import { SkeletonForm, SkeletonGroup } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
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
  const confirm = useConfirm();
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
        titleIcon={<DocumentIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
      >
        <SkeletonGroup label="Loading content" className="rounded-xl border border-surface-border bg-card p-6">
          <SkeletonForm fields={5} />
        </SkeletonGroup>
      </AppShell>
    );
  }

  if (!entry) {
    return (
      <AppShell
        pageTitle="Content"
        pageSubtitle="Unknown content id"
        titleIcon={<DocumentIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
      >
        <p className="text-sm text-muted-foreground">Unknown content id.</p>
        <Link href="/overview" className="mt-3 inline-block text-sm font-semibold text-foreground hover:underline">
          ← Back to Overview
        </Link>
      </AppShell>
    );
  }

  async function changeKind(kind: DocContent["kind"]) {
    if (draft && kind !== draft.kind) {
      const hasData = JSON.stringify(draft) !== JSON.stringify(BLANK[draft.kind]);
      if (
        hasData &&
        !(await confirm({
          title: "Switch the content type?",
          description: "This starts a blank form for that type. What you've entered for this type will be lost.",
          confirmLabel: "Switch",
          destructive: true,
        }))
      ) {
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
      titleIcon={<DocumentIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
    >
      <div className="flex items-center justify-between">
        <Link href={`/${entry.productKey}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to {entry.productLabel}
        </Link>
        <div className="flex items-center gap-3">
          {saveError && <span className="text-xs font-medium text-destructive">{saveError}</span>}
          {!saveError && savedAt && <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Saved</span>}
          <Button asChild variant="outline">
            <Link href={entry.publicHref} target="_blank">
              View live page
              <span aria-hidden="true" className="text-xs">
                ↗
              </span>
            </Link>
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
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
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="relative min-h-0">
            <div className="flex flex-col rounded-xl border border-surface-border bg-card py-4 px-0 lg:absolute lg:inset-0">
            <div className="mb-4 shrink-0 px-5">
              <span className="text-xs font-medium text-muted-foreground">Content type</span>
              <div className="mt-1.5 flex gap-2">
                {(["hero", "steps", "sections"] as const).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => changeKind(kind)}
                    className={`h-7 rounded-full border px-3 text-xs font-medium capitalize transition-colors ${
                      draft.kind === kind
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-surface-border text-muted-foreground hover:bg-accent hover:text-foreground"
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
            <p className="mb-2 text-xs font-medium text-muted-foreground">Live preview</p>
            <div className="min-h-[calc(100vh-225px)] overflow-y-auto rounded-xl bg-muted-surface">
              <ContentRenderer content={draft} variant={entry.productKey === "jex3-0" ? "admin" : "docs"} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
