"use client";

import { Alert } from "@/components/ui/alert";
import { useConfirm } from "@/components/ui/confirm";
import { useEffect, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { SkeletonForm, SkeletonGroup } from "@/components/ui/skeleton";
import { LegalDocument } from "./LegalDocument";
import { LegalDocumentForm } from "./LegalDocumentForm";
import {
  LegalEditorToolbar,
  LegalModeSwitch,
  LegalNoticeBar,
  LegalPublishDialog,
  LegalVersionPreview,
} from "./LegalEditorChrome";
import { LegalHistoryPanel } from "./LegalHistoryPanel";
import { useLegalEditor } from "./useLegalEditor";
import { validateLegalDocument } from "@/lib/legal/legal-document-validate";
import {
  BLANK_LEGAL_DOCUMENT,
  normalizeLegalDocument,
  type LegalDocumentContent,
} from "@/lib/legal/legal-document";
import type { LegalSlug, LegalVersionMeta } from "@/lib/legal/legal-api";

const FIELD_IDS: Record<string, string> = {
  title: "legal-title",
  subtitle: "legal-subtitle",
  lastUpdated: "legal-last-updated",
  updatedBy: "legal-updated-by",
  body: "legal-body",
};

/**
 * One legal page's editor — Terms of Service and Privacy Policy both, since
 * they share one shape (V81, ADR-104 r2.13): one form card with a visual
 * editor that already looks like the page, and a Preview that renders exactly
 * what readers get
 * (`LegalDocument`). Loading, saving, autosave and publish are
 * `useLegalEditor`'s; the toolbar and dialogs are `LegalEditorChrome`'s.
 */
export function LegalPageEditor({
  slug,
  pageName,
  canEdit,
  active = true,
  onDirtyChange,
}: {
  slug: LegalSlug;
  pageName: string;
  canEdit: boolean;
  /** The visible tab — Ctrl+S and autosave only act on this one. */
  active?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const confirm = useConfirm();
  const livePath = `/${slug}`;
  const editor = useLegalEditor<LegalDocumentContent>({
    slug,
    blank: BLANK_LEGAL_DOCUMENT,
    validate: validateLegalDocument,
    normalize: normalizeLegalDocument,
    canEdit,
    active,
  });
  const { draft, setDraft, issues, unsaved } = editor;

  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [showPublish, setShowPublish] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewVersion, setPreviewVersion] =
    useState<LegalVersionMeta<LegalDocumentContent> | null>(null);

  useEffect(() => {
    onDirtyChange?.(unsaved);
  }, [unsaved, onDirtyChange]);

  function scrollToId(id: string) {
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (typeof el.scrollIntoView === "function")
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      const focusable = el.matches("input, textarea, button")
        ? el
        : el.querySelector<HTMLElement>(
            "[contenteditable=true], textarea, input",
          );
      focusable?.focus({ preventScroll: true });
    });
  }

  function goToField(path: string) {
    setShowPublish(false);
    setMode("edit");
    scrollToId(FIELD_IDS[path] ?? "legal-body");
  }

  async function confirmPublish(note: string) {
    if (await editor.publish(note)) setShowPublish(false);
  }

  // One question before restoring, worded for whether there are unsaved
  // edits to lose (the history panel no longer asks a second time).
  async function restore(versionId: string) {
    const ok = await confirm({
      title: unsaved ? "Replace your unsaved changes?" : "Restore this version?",
      description: unsaved
        ? "Restoring copies that version into your draft, and the edits you haven't saved will be lost. The live page doesn't change until you publish."
        : "It replaces your draft's content. The live page doesn't change until you publish.",
      confirmLabel: unsaved ? "Restore anyway" : "Restore",
      destructive: unsaved,
    });
    if (!ok) return;
    if (await editor.restore(versionId)) setShowHistory(false);
  }

  return (
    <div className="mx-auto max-w-[960px]">
      {!canEdit && (
        <Alert variant="warning" role="alert" className="mb-4">
          Only Super Admins can edit legal pages. You can read the draft and its
          history.
        </Alert>
      )}

      <LegalEditorToolbar
        livePath={livePath}
        modeSwitch={
          <LegalModeSwitch
            mode={mode}
            onChange={setMode}
            editIcon={<Pencil className="size-3.5" aria-hidden="true" />}
            previewIcon={<Eye className="size-3.5" aria-hidden="true" />}
          />
        }
        published={editor.published}
        livePending={editor.livePending}
        unsaved={unsaved}
        saveState={editor.saveState}
        lastSavedAt={editor.lastSavedAt}
        canEdit={canEdit}
        canSave={unsaved && !editor.hasIssues && editor.saveState !== "saving"}
        canPublish={!editor.loading && editor.canPublish}
        publishing={editor.publishing}
        onSave={() => void editor.save()}
        onPublish={() => setShowPublish(true)}
        onHistory={() => setShowHistory(true)}
      />

      <LegalNoticeBar
        notice={editor.notice}
        onDismiss={editor.dismissNotice}
        onReload={editor.reload}
      />

      {editor.loading ? (
        <SkeletonGroup
          label={`Loading ${pageName}`}
          className="mt-3 rounded-2xl border border-surface-border bg-card p-6"
        >
          <SkeletonForm fields={4} />
        </SkeletonGroup>
      ) : mode === "preview" ? (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              How readers will see it
              {unsaved ? ", including your unsaved changes" : ""}.
            </p>
            <div
              role="group"
              aria-label="Preview width"
              className="inline-flex rounded-full bg-muted-surface p-0.5"
            >
              {(["desktop", "mobile"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  aria-pressed={previewWidth === w}
                  onClick={() => setPreviewWidth(w)}
                  className={`flex h-8 items-center rounded-full px-3 text-xs font-medium capitalize transition-colors ${
                    previewWidth === w
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`mx-auto mt-3 overflow-hidden rounded-2xl border border-surface-border bg-background transition-[max-width] duration-200 ${
              previewWidth === "mobile" ? "max-w-[390px]" : "max-w-full"
            }`}
          >
            <LegalDocument content={draft} />
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-surface-border bg-card px-4 py-5 lg:px-8 lg:py-7">
          <LegalDocumentForm
            value={draft}
            onChange={setDraft}
            issues={issues}
            disabled={!canEdit}
          />
        </div>
      )}

      {showPublish && (
        <LegalPublishDialog
          pageName={pageName}
          livePath={livePath}
          issues={issues}
          willSaveFirst={unsaved}
          publishing={editor.publishing}
          onGoToField={goToField}
          onConfirm={(note) => void confirmPublish(note)}
          onCancel={() => setShowPublish(false)}
        />
      )}

      {showHistory && (
        <LegalHistoryPanel<LegalDocumentContent>
          slug={slug}
          onClose={() => setShowHistory(false)}
          onPreview={setPreviewVersion}
          onRestore={(id) => void restore(id)}
          canRestore={canEdit}
        />
      )}

      {previewVersion && (
        <LegalVersionPreview
          label={`Version ${previewVersion.versionNo}`}
          onClose={() => setPreviewVersion(null)}
        >
          <LegalDocument
            content={normalizeLegalDocument(previewVersion.content)}
          />
        </LegalVersionPreview>
      )}
    </div>
  );
}
