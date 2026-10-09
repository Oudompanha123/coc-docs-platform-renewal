"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LegalHistoryPanel } from "./LegalHistoryPanel";
import { LegalHighlightsForm } from "./LegalHighlightsForm";
import { LegalPageDetailsForm } from "./LegalPageDetailsForm";
import { LegalPageLayout } from "./LegalPageLayout";
import { LegalSectionsForm } from "./LegalSectionsForm";
import { LegalSummaryForm } from "./LegalSummaryForm";
import { validateLegalContent } from "@/lib/legal/validate";
import { BLANK_LEGAL_CONTENT, type LegalContent } from "@/lib/legal/content-types";
import {
  LegalApiError,
  fetchLegalDraft,
  fetchLegalVersions,
  publishLegalPage,
  restoreLegalVersion,
  saveLegalDraft,
  type LegalVersionMeta,
  type LegalVersionSummary,
} from "@/lib/legal/legal-api";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

/**
 * The Privacy Policy tab — exactly the editor this page has always been,
 * extracted unchanged (same fields, same behavior, same tests, just moved
 * out of `page.tsx` so the new Terms tab can live alongside it without the
 * two slugs sharing a component built around one content shape). Privacy
 * deliberately keeps the original highlights/CTA shape and this editor — see
 * ADR note in `V75__legal_pages_revert_privacy_shape.sql`.
 */
export function PrivacyLegalPageEditor({
  canEdit,
  onDirtyChange,
}: {
  canEdit: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [original, setOriginal] = useState<LegalVersionMeta | null>(null);
  const [draft, setDraft] = useState<LegalContent>(BLANK_LEGAL_CONTENT);
  const [published, setPublished] = useState<LegalVersionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<LegalVersionMeta | null>(null);

  const unsaved = JSON.stringify(draft) !== JSON.stringify(original?.content ?? BLANK_LEGAL_CONTENT);
  const issues = validateLegalContent(draft);
  const hasIssues = Object.keys(issues).length > 0;

  useEffect(() => {
    onDirtyChange?.(unsaved);
  }, [unsaved, onDirtyChange]);

  const load = useCallback(() => {
    setLoading(true);
    setNotice(null);
    setPreviewOverride(null);
    Promise.all([fetchLegalDraft("privacy"), fetchLegalVersions("privacy")])
      .then(([draftMeta, versions]) => {
        setOriginal(draftMeta);
        setDraft(draftMeta.content);
        setPublished(versions.find((v) => v.status === "published") ?? null);
      })
      .catch((err: unknown) => {
        setNotice({
          kind: "error",
          message: err instanceof Error ? err.message : "Couldn't load this page.",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Leaving the tab/window with unsaved changes — the native browser prompt
  // (no router-level "block navigation" hook exists in the Next 15 App
  // Router to catch an in-app Link click instead; see the capture-phase
  // click guard below for that case).
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!unsaved) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsaved]);

  // In-app navigation (clicking a sidebar link, a breadcrumb, ...) doesn't
  // fire beforeunload in the App Router — this catches any same-document
  // anchor click while there are unsaved changes and asks first.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!unsaved) return;
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || anchor.target === "_blank") return;
      if (!window.confirm("You have unsaved changes. Leave this page without saving?")) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [unsaved]);

  async function handleSaveDraft() {
    if (!original || hasIssues) return;
    setSaving(true);
    setNotice(null);
    try {
      const saved = await saveLegalDraft("privacy", draft, original.versionNo);
      setOriginal(saved);
      setNotice({ kind: "success", message: "Draft saved." });
    } catch (err) {
      setNotice({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't save. Please try again.",
      });
      if (err instanceof LegalApiError && err.conflict) load();
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!original || hasIssues) return;
    if (unsaved && !window.confirm("You have unsaved draft changes that haven't been saved. Publish the last saved draft anyway?")) {
      return;
    }
    if (!window.confirm(`Publish ${draft.title || "this page"}? It will replace the live page immediately.`)) return;
    setPublishing(true);
    setNotice(null);
    try {
      await publishLegalPage("privacy");
      load();
      setNotice({ kind: "success", message: "Published." });
    } catch (err) {
      setNotice({
        kind: "error",
        message: err instanceof Error ? err.message : "Couldn't publish. Please try again.",
      });
    } finally {
      setPublishing(false);
    }
  }

  function handleRestore(versionId: string) {
    // Restoring overwrites local edits with the restored version's content —
    // the admin still has to Save draft (and then Publish) for it to count.
    restoreLegalVersion("privacy", versionId)
      .then((restored) => {
        setOriginal(restored);
        setDraft(restored.content);
        setShowHistory(false);
        setNotice({ kind: "success", message: "Restored into your draft. Publish to make it live." });
      })
      .catch((err: unknown) => {
        setNotice({
          kind: "error",
          message: err instanceof Error ? err.message : "Couldn't restore that version.",
        });
      });
  }

  return (
    <div>
      {!canEdit && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          Only Super Admins can edit legal pages.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {unsaved && (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
              ● Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="rounded-full border border-surface-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            History
          </button>
          <Link
            href="/privacy"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            View live page
            <span aria-hidden="true" className="text-xs">↗</span>
          </Link>
          {canEdit && (
            <>
              <button
                type="button"
                disabled={saving || !unsaved || hasIssues}
                onClick={handleSaveDraft}
                className="rounded-full border border-surface-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                disabled={publishing || hasIssues}
                onClick={handlePublish}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Last published {formatWhen(published?.publishedAt ?? null)}
          {published?.publishedByName ? ` by ${published.publishedByName}` : ""}
        </span>
        <span aria-hidden="true">·</span>
        <span>/privacy</span>
      </p>

      {notice && (
        <p className={`mt-3 rounded-[10px] px-3 py-2 text-sm ${
          notice.kind === "error" ? "border border-danger/30 bg-danger/10 text-danger" : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        }`}>
          {notice.message}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-surface-border bg-card">
          <div className="h-1 bg-primary" aria-hidden="true" />
          <div className="space-y-6 p-6 sm:p-8">
            <LegalPageDetailsForm value={draft} onChange={setDraft} issues={issues} disabled={!canEdit} />
            <LegalHighlightsForm value={draft} onChange={setDraft} issues={issues} disabled={!canEdit} />
            <LegalSummaryForm value={draft} onChange={setDraft} issues={issues} disabled={!canEdit} />
            <LegalSectionsForm value={draft} onChange={setDraft} issues={issues} disabled={!canEdit} />
          </div>
        </div>
      )}

      {showHistory && (
        <LegalHistoryPanel
          slug="privacy"
          onClose={() => setShowHistory(false)}
          onPreview={(version) => setPreviewOverride(version)}
          onRestore={handleRestore}
          canRestore={canEdit}
        />
      )}

      {previewOverride && (
        <div role="dialog" aria-modal="true" aria-label="Version preview" className="fixed inset-0 z-50 overflow-y-auto bg-card">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-white/95 px-6 py-3 backdrop-blur">
            <span className="text-sm font-semibold text-foreground">Previewing a version from history — not your current draft.</span>
            <button
              type="button"
              onClick={() => setPreviewOverride(null)}
              className="rounded-full border border-surface-border px-4 py-1.5 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Back to form
            </button>
          </div>
          <LegalPageLayout content={previewOverride.content} />
        </div>
      )}
    </div>
  );
}
