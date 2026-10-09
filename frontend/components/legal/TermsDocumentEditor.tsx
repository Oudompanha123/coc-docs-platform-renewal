"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LegalDocument } from "./LegalDocument";
import { LegalFieldGroup } from "./LegalFieldGroup";
import { LegalHistoryPanel } from "./LegalHistoryPanel";
import { TermsDocumentForm } from "./TermsDocumentForm";
import { TermsOutlineNav } from "./TermsOutlineNav";
import { TermsPrePublishDialog } from "./TermsPrePublishDialog";
import { TermsSectionsAccordion } from "./TermsSectionsAccordion";
import { validateLegalDocument } from "@/lib/legal/legal-document-validate";
import { BLANK_LEGAL_DOCUMENT, type LegalDocumentContent } from "@/lib/legal/legal-document";
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

type Meta = LegalVersionMeta<LegalDocumentContent>;

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

/**
 * The Terms of Service document editor (task spec, Step 3) — top bar, a
 * sticky outline nav, the document form + sections accordion, and a
 * full-document Preview mode. Unlike the Privacy tab (`PrivacyLegalPageEditor`,
 * untouched), this manages the new plain-document content shape and reads/
 * writes `legal_page_version` under slug `"terms"` only.
 *
 * Publish opens a pre-publish checklist (task spec §G) rather than
 * publishing directly: any validation issue blocks it, with a "Go to field"
 * link back into the form; a still-Draft status warns without blocking; an
 * optional publish note is sent through to the backend and shown later in
 * History. Autosaves the draft every 30s while there are unsaved, valid
 * changes.
 */
export function TermsDocumentEditor({
  canEdit,
  onDirtyChange,
}: {
  canEdit: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const [original, setOriginal] = useState<Meta | null>(null);
  const [draft, setDraft] = useState<LegalDocumentContent>(BLANK_LEGAL_DOCUMENT);
  const [published, setPublished] = useState<LegalVersionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; message: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<Meta | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));
  const [showPrePublish, setShowPrePublish] = useState(false);

  const unsaved = JSON.stringify(draft) !== JSON.stringify(original?.content ?? BLANK_LEGAL_DOCUMENT);
  const issues = validateLegalDocument(draft);
  const hasIssues = Object.keys(issues).length > 0;

  useEffect(() => {
    onDirtyChange?.(unsaved);
  }, [unsaved, onDirtyChange]);

  const load = useCallback(() => {
    setLoading(true);
    setNotice(null);
    setPreviewOverride(null);
    Promise.all([fetchLegalDraft<LegalDocumentContent>("terms"), fetchLegalVersions("terms")])
      .then(([draftMeta, versions]) => {
        setOriginal(draftMeta);
        setDraft(draftMeta.content);
        setExpanded(new Set(draftMeta.content.sections.length > 0 ? [0] : []));
        setPublished(versions.find((v) => v.status === "published") ?? null);
      })
      .catch((err: unknown) => {
        setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't load this page." });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!unsaved) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsaved]);

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

  const handleSaveDraft = useCallback(async () => {
    if (!original || hasIssues) return;
    setSaving(true);
    setNotice(null);
    try {
      const saved = await saveLegalDraft<LegalDocumentContent>("terms", draft, original.versionNo);
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
  }, [original, hasIssues, draft, load]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (canEdit && unsaved && !hasIssues && !saving) void handleSaveDraft();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [canEdit, unsaved, hasIssues, saving, handleSaveDraft]);

  // Autosave every 30s while there's an unsaved, currently-valid change —
  // reads the latest values through refs so the interval itself never needs
  // to be torn down and restarted on every keystroke.
  const autosaveState = useRef({ canEdit, unsaved, hasIssues, saving, handleSaveDraft });
  autosaveState.current = { canEdit, unsaved, hasIssues, saving, handleSaveDraft };
  useEffect(() => {
    const id = setInterval(() => {
      const s = autosaveState.current;
      if (s.canEdit && s.unsaved && !s.hasIssues && !s.saving) void s.handleSaveDraft();
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  function openPrePublish() {
    if (!original) return;
    if (unsaved && !window.confirm("You have unsaved draft changes that haven't been saved. Publish the last saved draft anyway?")) {
      return;
    }
    setShowPrePublish(true);
  }

  async function confirmPublish(note: string) {
    setShowPrePublish(false);
    setPublishing(true);
    setNotice(null);
    try {
      await publishLegalPage<LegalDocumentContent>("terms", note || undefined);
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

  function goToFieldFromPrePublish(sectionIndex: number | null) {
    setShowPrePublish(false);
    if (sectionIndex === null) {
      setMode("edit");
    } else {
      selectSection(sectionIndex);
    }
  }

  function handleRestore(versionId: string) {
    restoreLegalVersion<LegalDocumentContent>("terms", versionId)
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

  function selectSection(index: number) {
    setMode("edit");
    setExpanded((prev) => new Set(prev).add(index));
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-section-index="${index}"]`);
      if (el instanceof HTMLElement && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
              original?.status === "published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted-surface text-muted-foreground"
            }`}
          >
            {original?.status ?? "draft"}
          </span>
          {unsaved ? (
            <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">● Unsaved changes</span>
          ) : (
            original && <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Saved</span>
          )}

          <div role="tablist" aria-label="Mode" className="ml-2 inline-flex rounded-full border border-surface-border bg-card p-1">
            {(["edit", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors ${
                  mode === m ? "bg-muted-surface text-foreground" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="rounded-full border border-surface-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            History
          </button>
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
                disabled={publishing}
                onClick={openPrePublish}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {publishing ? "Publishing…" : "Publish"}
              </button>
            </>
          )}
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {published ? (
          <>
            Last published {formatWhen(published.publishedAt)}
            {published.publishedByName ? ` by ${published.publishedByName}` : ""}
          </>
        ) : (
          "Never published"
        )}
      </p>

      {notice && (
        <p
          className={`mt-3 rounded-[10px] px-3 py-2 text-sm ${
            notice.kind === "error" ? "border border-danger/30 bg-danger/10 text-danger" : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {notice.message}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
      ) : mode === "preview" ? (
        <div className="mt-6">
          <div className="flex justify-end">
            <div className="inline-flex rounded-full border border-surface-border bg-card p-1">
              {(["desktop", "mobile"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPreviewWidth(w)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    previewWidth === w ? "bg-muted-surface text-foreground" : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
          <div className={`mx-auto mt-3 overflow-hidden rounded-2xl border border-surface-border bg-card shadow-sm ${previewWidth === "mobile" ? "max-w-[390px]" : ""}`}>
            <LegalDocument content={draft} />
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-start gap-6">
          <TermsOutlineNav sections={draft.sections} onChange={(sections) => setDraft({ ...draft, sections })} onSelect={selectSection} issues={issues} disabled={!canEdit} />
          {/* The whole form in one card (task: "/legal-pages: one card") —
              16px radius / #e8eaf1 border / 900px max-width match the mockup;
              32px×36px padding (desktop, >= 1024px) narrows to 20px×16px
              below that. Every field group inside is a label+helper/field
              row (no accent line, no per-group box), separated by this
              list's `divide-y`+`space-y-7`. */}
          <div className="min-w-0 max-w-[900px] flex-1 rounded-2xl border border-legal-card-border bg-card px-4 py-5 lg:px-9 lg:py-8">
            <TermsDocumentForm
              value={draft}
              onChange={setDraft}
              issues={issues}
              disabled={!canEdit}
              sectionsSlot={
                <LegalFieldGroup label="Sections" helper="Headings + body of the document." required fullWidth>
                  <TermsSectionsAccordion
                    sections={draft.sections}
                    onChange={(sections) => setDraft({ ...draft, sections })}
                    issues={issues}
                    disabled={!canEdit}
                    expanded={expanded}
                    onExpandedChange={setExpanded}
                  />
                </LegalFieldGroup>
              }
            />
          </div>
        </div>
      )}

      {showPrePublish && (
        <TermsPrePublishDialog
          content={draft}
          issues={issues}
          onGoToField={goToFieldFromPrePublish}
          onConfirm={confirmPublish}
          onCancel={() => setShowPrePublish(false)}
        />
      )}

      {showHistory && (
        <LegalHistoryPanel<LegalDocumentContent>
          slug="terms"
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
          <LegalDocument content={previewOverride.content} />
        </div>
      )}
    </div>
  );
}
