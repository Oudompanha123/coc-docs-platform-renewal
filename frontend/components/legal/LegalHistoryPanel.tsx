"use client";

import { Alert } from "@/components/ui/alert";
import { SkeletonGroup, SkeletonList } from "@/components/ui/skeleton";
import { FileText, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { XIcon } from "@/components/layout/icons";
import { avatarSrc } from "@/lib/account/avatarSrc";
import { fetchLegalVersion, fetchLegalVersions, type LegalSlug, type LegalVersionMeta, type LegalVersionSummary } from "@/lib/legal/legal-api";
import type { LegalDocumentContent } from "@/lib/legal/legal-document";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/** Who published a version, in words: their name, or why there is none. */
export function publisherLabel(version: LegalVersionSummary): string {
  if (version.publishedByName) return version.publishedByName;
  // Created with the page itself (V68) — nobody published it.
  if (version.initialVersion) return "Initial version";
  // A person published it, but their account no longer exists.
  return "Deleted account";
}

/**
 * The publisher's photo: an uploaded one through `avatarSrc` (so it loads
 * from the backend's avatar route on a private bucket), a Google picture
 * as-is, else their initial — or, with no person at all, a neutral icon.
 */
function PublisherAvatar({ version }: { version: LegalVersionSummary }) {
  const [failed, setFailed] = useState(false);
  const src = avatarSrc(version.publishedByAvatarUrl);

  if (version.publishedByName && src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
        className="size-6 shrink-0 rounded-full object-cover"
      />
    );
  }

  const NoPersonIcon = version.initialVersion ? FileText : UserX;
  return (
    <span
      aria-hidden="true"
      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-surface text-[11px] font-semibold text-muted-foreground"
    >
      {version.publishedByName ? (
        version.publishedByName.trim().charAt(0).toUpperCase()
      ) : (
        <NoPersonIcon className="size-3.5" />
      )}
    </span>
  );
}

/**
 * The published-versions side panel (task spec E) — no "pick an old version,
 * Preview it, Restore it" pattern exists elsewhere in the app to copy
 * (closest visual precedent, AX Renewal's `RunHistory`, is read-only by
 * design), so this is new. Escape/backdrop-click to close, same house style
 * `HrmsReportModal` uses for its own dialog.
 */
export function LegalHistoryPanel<T = LegalDocumentContent>({
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

  // The editor asks before restoring (it knows whether there are unsaved
  // edits to warn about), so the panel doesn't ask a second time.
  function handleRestore(id: string) {
    onRestore(id);
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Version history" className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-full max-w-[380px] overflow-y-auto bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">History</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-accent">
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {error && <Alert variant="destructive" className="mb-3">{error}</Alert>}
          {!versions && !error && <SkeletonGroup label="Loading history"><SkeletonList rows={3} avatar={false} /></SkeletonGroup>}
          {versions && versions.length === 0 && <p className="text-sm text-muted-foreground">Nothing published yet.</p>}

          <ul className="space-y-2.5">
            {versions?.map((version) => (
              <li key={version.id} className="rounded-xl border border-surface-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                      version.status === "published" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted-surface text-muted-foreground"
                    }`}
                  >
                    {version.status}
                  </span>
                  <span className="text-xs text-muted-foreground">v{version.versionNo}</span>
                </div>
                <p className="mt-1.5 text-sm text-foreground">{formatWhen(version.publishedAt)}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <PublisherAvatar version={version} />
                  <span className="truncate">{publisherLabel(version)}</span>
                </p>
                {version.publishNote && (
                  <p className="mt-1 text-xs italic text-muted-foreground">
                    &ldquo;{version.publishNote}&rdquo;
                  </p>
                )}
                <div className="mt-2.5 flex gap-2">
                  <button
                    type="button"
                    disabled={previewingId === version.id}
                    onClick={() => handlePreview(version.id)}
                    className="flex-1 rounded-full border border-surface-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {previewingId === version.id ? "Loading…" : "Preview"}
                  </button>
                  {canRestore && (
                    <button
                      type="button"
                      onClick={() => handleRestore(version.id)}
                      className="flex-1 rounded-full bg-muted-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted-surface"
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
