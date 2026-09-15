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

  useEffect(() => {
    setDraft(getContent(id) ?? BLANK.sections);
  }, [id]);

  if (!entry) {
    return (
      <AppShell
        pageTitle="Content"
        pageSubtitle="Unknown content id"
        titleIcon={<DocumentIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
      >
        <p className="text-sm text-muted">Unknown content id.</p>
        <Link href="/content" className="mt-3 inline-block text-sm font-semibold text-brand-purple hover:underline">
          ← Back to Content
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
        <Link href="/content" className="text-sm font-semibold text-brand-purple hover:underline">
          ← Back to Content
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
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-4">
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

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Live preview</p>
            <div className="rounded-2xl bg-page p-4">
              <ContentRenderer content={draft} variant={entry.productKey === "jex3-0" ? "admin" : "docs"} />
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
