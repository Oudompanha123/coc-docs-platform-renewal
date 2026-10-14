"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LegalApiError,
  fetchLegalDraft,
  fetchLegalVersion,
  fetchLegalVersions,
  publishLegalPage,
  restoreLegalVersion,
  saveLegalDraft,
  type LegalSlug,
  type LegalVersionMeta,
  type LegalVersionSummary,
} from "@/lib/legal/legal-api";

export type LegalNotice = { kind: "error" | "success"; message: string; conflict?: boolean };
export type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_MS = 30_000;
const SUCCESS_NOTICE_MS = 4_000;

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Everything a legal-page editor does besides drawing its form — shared by
 * the Terms and Privacy editors so the two behave the same (ADR-104 r2.13).
 *
 * The rules it holds, each one a fix of how the editors used to behave:
 * - **Publish saves first.** The backend publishes the server's draft row.
 *   Publishing with unsaved edits used to publish the *last saved* draft and
 *   then reload, silently discarding what was on screen. Now unsaved edits
 *   are saved, then published; a failed save stops the publish.
 * - **"Live" is a comparison, not the draft's status.** The editor always
 *   holds a draft row, so its `status` is always "draft" — the badge that
 *   showed it said "draft" right after a successful publish. `livePending`
 *   compares the saved draft with the published content instead.
 * - **A conflict does not wipe your edits.** A 409 used to reload at once,
 *   replacing the form with the other person's version. Now it says so and
 *   offers Reload; your text stays until you choose.
 * - **Autosave is quiet** — the toolbar's "Saved" changes, no banner every
 *   30 seconds — and only runs while this editor is the visible tab.
 * - Reloading after publish/restore does not drop the form for a skeleton.
 */
export function useLegalEditor<T>({
  slug,
  blank,
  validate,
  normalize = (raw) => raw as T,
  canEdit,
  active,
}: {
  slug: LegalSlug;
  blank: T;
  validate: (content: T) => Record<string, string>;
  /** Turns whatever the API sent into a complete `T` — content saved in an
   *  older shape must not crash the form. */
  normalize?: (raw: unknown) => T;
  canEdit: boolean;
  /** The visible tab — the only one Ctrl+S and autosave act on. */
  active: boolean;
}) {
  // A ref, so the loaders below don't change identity with the caller's function.
  const normalizeRef = useRef(normalize);
  normalizeRef.current = normalize;
  const [original, setOriginal] = useState<LegalVersionMeta<T> | null>(null);
  const [draft, setDraft] = useState<T>(blank);
  const [published, setPublished] = useState<LegalVersionSummary | null>(null);
  const [publishedContent, setPublishedContent] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<LegalNotice | null>(null);

  const savedContent = original?.content ?? blank;
  const unsaved = !same(draft, savedContent);
  const issues = validate(draft);
  const hasIssues = Object.keys(issues).length > 0;
  /** The saved draft differs from what readers see (or nothing is live yet). */
  const livePending = published === null || publishedContent === null || !same(savedContent, publishedContent);
  /** Publish has something to do: edits on screen, or a saved draft not yet live. */
  const canPublish = canEdit && !publishing && (unsaved || livePending);

  // Success notices go away by themselves; errors stay until dismissed.
  useEffect(() => {
    if (notice?.kind !== "success") return;
    const id = setTimeout(() => setNotice(null), SUCCESS_NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice]);

  const load = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}) => {
      if (!quiet) setLoading(true);
      try {
        const [draftMeta, versions] = await Promise.all([fetchLegalDraft<T>(slug), fetchLegalVersions(slug)]);
        const live = versions.find((v) => v.status === "published") ?? null;
        // The live content is only needed to say whether the draft matches
        // it; a failure here just leaves "has unpublished changes" showing.
        const liveContent = live
          ? await fetchLegalVersion<T>(slug, live.id).then((v) => normalizeRef.current(v.content)).catch(() => null)
          : null;
        const draftContent = normalizeRef.current(draftMeta.content);
        setOriginal({ ...draftMeta, content: draftContent });
        setDraft(draftContent);
        setPublished(live);
        setPublishedContent(liveContent);
      } catch (err) {
        setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't load this page." });
      } finally {
        setLoading(false);
      }
    },
    [slug],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(() => {
    setNotice(null);
    void load();
  }, [load]);

  /** Saves the draft on screen. Resolves to whether it is now saved. */
  const save = useCallback(
    async ({ quiet = false }: { quiet?: boolean } = {}): Promise<boolean> => {
      if (!original || !canEdit) return false;
      if (!unsaved) return true;
      if (hasIssues) return false;
      setSaveState("saving");
      if (!quiet) setNotice(null);
      try {
        const saved = await saveLegalDraft<T>(slug, draft, original.versionNo);
        setOriginal({ ...saved, content: normalizeRef.current(saved.content) });
        setSaveState("saved");
        setLastSavedAt(new Date());
        if (!quiet) setNotice({ kind: "success", message: "Draft saved." });
        return true;
      } catch (err) {
        setSaveState("error");
        const conflict = err instanceof LegalApiError && err.conflict;
        setNotice({
          kind: "error",
          conflict,
          message: err instanceof Error ? err.message : "Couldn't save. Please try again.",
        });
        return false;
      }
    },
    [original, canEdit, unsaved, hasIssues, slug, draft],
  );

  const publish = useCallback(
    async (note?: string): Promise<boolean> => {
      if (!canEdit || hasIssues) return false;
      setPublishing(true);
      setNotice(null);
      try {
        if (unsaved && !(await save({ quiet: true }))) return false;
        await publishLegalPage<T>(slug, note || undefined);
        await load({ quiet: true });
        setNotice({ kind: "success", message: "Published. The live page now shows this version." });
        return true;
      } catch (err) {
        setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't publish. Please try again." });
        return false;
      } finally {
        setPublishing(false);
      }
    },
    [canEdit, hasIssues, unsaved, save, slug, load],
  );

  const restore = useCallback(
    async (versionId: string): Promise<boolean> => {
      try {
        const restored = await restoreLegalVersion<T>(slug, versionId);
        const restoredContent = normalizeRef.current(restored.content);
        setOriginal({ ...restored, content: restoredContent });
        setDraft(restoredContent);
        setNotice({ kind: "success", message: "Restored into your draft. Publish to make it live." });
        return true;
      } catch (err) {
        setNotice({ kind: "error", message: err instanceof Error ? err.message : "Couldn't restore that version." });
        return false;
      }
    },
    [slug],
  );

  // Ctrl/⌘+S — only for the visible editor, so two mounted tabs never both save.
  useEffect(() => {
    if (!active) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, save]);

  // Autosave reads the latest state through a ref, so the interval is not
  // torn down and restarted on every keystroke.
  const autosave = useRef({ active, canEdit, unsaved, hasIssues, saveState, publishing, save });
  autosave.current = { active, canEdit, unsaved, hasIssues, saveState, publishing, save };
  useEffect(() => {
    const id = setInterval(() => {
      const s = autosave.current;
      if (s.active && s.canEdit && s.unsaved && !s.hasIssues && s.saveState !== "saving" && !s.publishing) {
        void s.save({ quiet: true });
      }
    }, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, []);

  return {
    loading,
    draft,
    setDraft,
    unsaved,
    issues,
    hasIssues,
    published,
    livePending,
    canPublish,
    saveState,
    lastSavedAt,
    publishing,
    notice,
    dismissNotice: () => setNotice(null),
    reload,
    save,
    publish,
    restore,
  };
}

export type LegalEditorState<T> = ReturnType<typeof useLegalEditor<T>>;
