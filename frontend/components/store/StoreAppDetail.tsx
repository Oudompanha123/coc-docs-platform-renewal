"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, PlusIcon, TrashIcon } from "@/components/layout/icons";
import { AppLogo } from "@/components/store/AppLogo";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { DownloadButton, EnvironmentBadge } from "@/components/store/StoreAppCard";
import { EMPTY_RELEASE, ReleaseFields, UploadProgress, releaseProblem, type ReleaseDraft } from "@/components/store/ReleaseFields";
import {
  ENVIRONMENT_LABELS,
  PLATFORM_LABELS,
  STORE_HREF,
  absoluteUrl,
  deleteStoreApp,
  deleteStoreRelease,
  formatBytes,
  latestByEnvironment,
  uploadStoreRelease,
  type StoreApp,
  type StoreEnvironment,
} from "@/lib/store/store-api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/**
 * The body of an app's page (`/store-<number>`): what it is, the newest
 * Production and Development builds side by side, and every build ever
 * uploaded. Admins also get the management controls here — upload a build,
 * delete one, edit or delete the app — so there is one place to look at an
 * app, not a reader view and an admin view that drift apart.
 */
export function StoreAppDetail({
  app,
  canManage,
  onChanged,
  onDeleted,
  onEdit,
}: {
  app: StoreApp;
  canManage: boolean;
  onChanged: (app: StoreApp) => void;
  onDeleted: () => void;
  onEdit: () => void;
}) {
  const latest = latestByEnvironment(app);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<ReleaseDraft>(EMPTY_RELEASE);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const problem = releaseProblem(draft, app.platform);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    setProgress(0);
    try {
      const saved = await uploadStoreRelease(
        app.id,
        { version: draft.version.trim(), environment: draft.environment, notes: draft.notes.trim(), file: draft.file! },
        setProgress,
      );
      onChanged(saved);
      setDraft(EMPTY_RELEASE);
      setUploading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload the build.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function removeRelease(releaseId: string, label: string) {
    if (!window.confirm(`Delete the ${label} build? Its file is removed from the server and can't be downloaded again.`)) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(await deleteStoreRelease(app.id, releaseId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the build.");
    } finally {
      setBusy(false);
    }
  }

  async function removeApp() {
    if (!window.confirm(`Delete ${app.name} and all ${app.releases.length} of its builds? This can't be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteStoreApp(app.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete the app.");
      setBusy(false);
    }
  }

  return (
    <div className="animate-entrance">
      <Link
        href={STORE_HREF}
        className="inline-flex items-center gap-1 rounded-full py-1 pr-3 text-sm font-semibold text-muted transition-colors hover:text-brand-purple"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        All apps
      </Link>

      {/* Header */}
      <section className="mt-4 rounded-3xl bg-gradient-to-br from-brand-purple/10 to-brand-blue/10 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <AppLogo app={app} className="h-20 w-20 text-3xl sm:h-24 sm:w-24 sm:text-4xl" />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-2xl font-extrabold text-ink sm:text-3xl">{app.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <PlatformIcon platform={app.platform} className="h-4 w-4" />
                {PLATFORM_LABELS[app.platform]}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {app.releases.length} build{app.releases.length === 1 ? "" : "s"}
              </span>
              {app.releases[0] && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Updated {formatDate(app.releases[0].createdAt)}</span>
                </>
              )}
              {canManage && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    app.isPublic ? "bg-brand-purple/10 text-brand-purple" : "bg-gray-100 text-muted"
                  }`}
                >
                  {app.isPublic ? "Public" : "Private"}
                </span>
              )}
            </p>
          </div>
        </div>
        {app.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-ink/70 sm:text-base">{app.description}</p>}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Downloads */}
        <section aria-labelledby="store-downloads-title" className="space-y-3">
          <h2 id="store-downloads-title" className="text-lg font-bold text-ink">
            Downloads
          </h2>
          {(["production", "development"] as StoreEnvironment[]).map((env) => {
            const release = latest[env];
            return (
              <div key={env} className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <EnvironmentBadge environment={env} />
                  {release && <span className="text-xs text-muted">{formatDate(release.createdAt)}</span>}
                </div>
                {release ? (
                  <>
                    <p className="mt-3 text-2xl font-bold text-ink">v{release.version}</p>
                    <p className="mt-0.5 truncate text-xs text-muted" title={release.fileName}>
                      {release.fileName} · {formatBytes(release.sizeBytes)}
                    </p>
                    {release.notes && (
                      <p className="mt-2 line-clamp-4 whitespace-pre-line text-sm text-ink/70">{release.notes}</p>
                    )}
                    <DownloadButton release={release} environment={env} className="mt-4 w-full py-3 text-sm" />
                  </>
                ) : (
                  <p className="mt-3 text-sm text-muted">
                    No {ENVIRONMENT_LABELS[env].toLowerCase()} build has been published yet.
                  </p>
                )}
              </div>
            );
          })}
        </section>

        <div className="space-y-6">
          {/* Admin: manage */}
          {canManage &&
            (uploading ? (
              <form onSubmit={upload} noValidate className="rounded-2xl border border-border bg-page/60 p-5">
                <p className="mb-3 text-sm font-bold text-ink">Upload a build</p>
                <ReleaseFields idPrefix="store-upload" draft={draft} platform={app.platform} disabled={busy} onChange={setDraft} />
                {progress !== null && (
                  <div className="mt-4">
                    <UploadProgress fraction={progress} />
                  </div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploading(false);
                      setError(null);
                    }}
                    disabled={busy}
                    className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-page disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
                  >
                    {busy ? "Uploading…" : "Upload"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setUploading(true)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
                >
                  <PlusIcon className="h-4 w-4" />
                  Upload build
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={busy}
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-page disabled:opacity-60"
                >
                  Edit app
                </button>
                <button
                  type="button"
                  onClick={removeApp}
                  disabled={busy}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete app
                </button>
              </div>
            ))}

          {error && (
            <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          {/* Version history */}
          <section aria-labelledby="store-history-title">
            <h2 id="store-history-title" className="text-lg font-bold text-ink">
              Version history
            </h2>
            {app.releases.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                No builds yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-white">
                {app.releases.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-ink">v{r.version}</span>
                        <EnvironmentBadge environment={r.environment} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted" title={`SHA-256 ${r.sha256}`}>
                        {formatDate(r.createdAt)} · {r.fileName} · {formatBytes(r.sizeBytes)}
                      </p>
                      {r.notes && <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-ink/70">{r.notes}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <a
                        href={absoluteUrl(r.downloadUrl)}
                        download={r.fileName}
                        aria-label={`Download ${ENVIRONMENT_LABELS[r.environment]} build v${r.version}`}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10"
                      >
                        Download
                      </a>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => removeRelease(r.id, `${ENVIRONMENT_LABELS[r.environment]} v${r.version}`)}
                          disabled={busy}
                          aria-label={`Delete ${ENVIRONMENT_LABELS[r.environment]} build v${r.version}`}
                          className="rounded-full p-1.5 text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-60"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
