"use client";

import { useEffect, useState } from "react";
import { XIcon } from "@/components/layout/icons";
import { fetchLegalVersion, fetchLegalVersions, type LegalSlug, type LegalVersionMeta, type LegalVersionSummary } from "@/lib/legal/legal-api";
import type { LegalContent } from "@/lib/legal/content-types";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/**
 * The published-versions side panel (task spec E) — no "pick an old version,
 * Preview it, Restore it" pattern exists elsewhere in the app to copy
 * (closest visual precedent, AX Renewal's `RunHistory`, is read-only by
 * design), so this is new. Escape/backdrop-click to close, same house style
 * `HrmsReportModal` uses for its own dialog.
 */
export function LegalHistoryPanel<T = LegalContent>({
  slug,
  onClose,
  onPreview,
  onRestore,
  canRestore,
}: {
  slug: LegalSlug;
  onClose: () => void;
  /** Shows this version's content in the live preview — read-only, no draft change. */
  onPreview: (version: LegalVersionMeta<T>) => void;
  /** Copies this version's content into the current draft (never publishes). */
  onRestore: (versionId: string) => void;
  canRestore: boolean;
}) {
  const [versions, setVersions] = useState<LegalVersionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLegalVersions(slug)
      .then((v) => {
        if (!cancelled) setVersions(v);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load version history.");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handlePreview(id: string) {
    setPreviewingId(id);
    try {
      const version = await fetchLegalVersion<T>(slug, id);
      onPreview(version);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load that version.");
    } finally {
      setPreviewingId(null);
    }
  }

  function handleRestore(id: string) {
    if (!window.confirm("Restore this version into your current draft? This replaces your draft's content — you'll still need to Publish to make it live.")) {
      return;
    }
    onRestore(id);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Version history" className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-[380px] overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-dash-ink">History</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-page">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {error && <p className="mb-3 rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>}
          {!versions && !error && <p className="text-sm text-muted">Loading…</p>}
          {versions && versions.length === 0 && <p className="text-sm text-muted">Nothing published yet.</p>}

          <ul className="space-y-2.5">
            {versions?.map((version) => (
              <li key={version.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      version.status === "published" ? "bg-[#e1f5ec] text-[#1f9d6b]" : "bg-page text-muted"
                    }`}
                  >
                    {version.status}
                  </span>
                  <span className="text-xs text-muted">v{version.versionNo}</span>
                </div>
                <p className="mt-1.5 text-sm text-dash-ink">{formatWhen(version.publishedAt)}</p>
                <p className="text-xs text-muted">{version.publishedByName ?? "System"}</p>
                {version.publishNote && (
                  <p className="mt-1 text-xs italic text-muted">
                    &ldquo;{version.publishNote}&rdquo;
                  </p>
                )}
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    disabled={previewingId === version.id}
                    onClick={() => handlePreview(version.id)}
                    className="flex-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink hover:bg-page disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {previewingId === version.id ? "Loading…" : "Preview"}
                  </button>
                  {canRestore && (
                    <button
                      type="button"
                      onClick={() => handleRestore(version.id)}
                      className="flex-1 rounded-full bg-brand-purple/10 px-3 py-1.5 text-xs font-semibold text-brand-purple hover:bg-brand-purple/20"
                    >
                      Restore as draft
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
