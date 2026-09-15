"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentIcon } from "@/components/layout/icons";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { HeroForm } from "@/components/docs/editor/HeroForm";
import { StepsForm } from "@/components/docs/editor/StepsForm";
import { SectionsForm } from "@/components/docs/editor/SectionsForm";
import { getContent, registryEntryFor, saveContent } from "@/lib/docs/content-store";
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
  const entry = registryEntryFor(id);

  const [draft, setDraft] = useState<DocContent | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // A callback ref, not useRef+useEffect: the previous version read
  // previewRef.current inside an effect keyed on Boolean(draft), which
  // depends on the ref already being attached by the time that effect runs.
  // A callback ref removes that ordering assumption entirely — React calls
  // it exactly when the node attaches/detaches, so the ResizeObserver setup
  // effect below can depend on the node itself, not a derived boolean.
  const [previewEl, setPreviewEl] = useState<HTMLDivElement | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number | null>(null);

  useEffect(() => {
    setDraft(getContent(id) ?? BLANK.sections);
  }, [id]);

  // The editor panel's height follows the live preview panel's actual
  // rendered height (not a fixed vh value) — measured here since CSS grid
  // stretch can only equalize both columns to whichever is naturally
  // taller, not designate one column as the authority the other follows.
  useEffect(() => {
    if (!previewEl) return;
    // Measure synchronously on attach rather than waiting solely on
    // ResizeObserver's own first callback, which fires asynchronously and,
    // under React Strict Mode's mount→cleanup→remount dev cycle, has shown
    // timing quirks that left it never actually reporting a first size —
    // so previewHeight stayed null and the height style silently no-opped.
    setPreviewHeight(previewEl.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setPreviewHeight(entry.contentRect.height);
    });
    observer.observe(previewEl);
    return () => observer.disconnect();
  }, [previewEl]);

  if (!entry) {
    return (
      <AppShell
        pageTitle="Content"
        pageSubtitle="Unknown content id"
        titleIcon={<DocumentIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
      >
        <p className="text-sm text-muted">Unknown content id.</p>
        <Link href="/overview" className="mt-3 inline-block text-sm font-semibold text-brand-purple hover:underline">
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

  function handleSave() {
    if (!draft) return;
    saveContent(id, draft);
    setSavedAt(Date.now());
  }

  return (
    <AppShell
      pageTitle={`${entry.productLabel} — ${entry.label}`}
      pageSubtitle={entry.publicHref}
      titleIcon={<DocumentIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="flex items-center justify-between">
        <Link href={`/${entry.productKey}`} className="text-sm font-semibold text-brand-purple hover:underline">
          ← Back to {entry.productLabel}
        </Link>
        <div className="flex items-center gap-3">
          {savedAt && <span className="text-xs font-semibold text-[#1f9d6b]">Saved</span>}
          <Link
            href={entry.publicHref}
            target="_blank"
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink hover:bg-page"
          >
            View live page
          </Link>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-5 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>

      {draft && (
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div
            className="flex flex-col rounded-2xl border border-border bg-white py-5 px-0 shadow-sm"
            style={{ height: previewHeight ? `${previewHeight}px` : undefined }}
          >
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
                        ? "bg-brand-purple/10 text-brand-purple"
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

          <div ref={setPreviewEl}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Live preview</p>
            <div className="rounded-2xl bg-page">
              <ContentRenderer content={draft} variant={entry.productKey === "jex3-0" ? "admin" : "docs"} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
