"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon, ChevronLeftIcon, DownloadIcon, TrashIcon, UploadIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/store/AppLogo";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { ERROR_CLASS } from "@/components/store/form-styles";
import {
  ENVIRONMENTS,
  ENVIRONMENT_LABELS,
  PLATFORM_LABELS,
  STORE_HREF,
  absoluteUrl,
  deleteStoreApp,
  formatBytes,
  formatDate,
  appPlatforms,
  isLive,
  relativeTime,
  removeStoreBuild,
  versionRows,
  type StoreApp,
  type StoreBuild,
  type StoreEnvironment,
  type StorePlatform,
  type VersionRow,
} from "@/lib/store/store-api";

/**
 * Status colours from the design system (ADR-104): green for Production
 * (success), blue for Development (info). Red is kept for errors and
 * destructive actions, so a Development build never reads as a failure.
 */
const ENVIRONMENT_BUTTON: Record<StoreEnvironment, string> = {
  production: "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
  development: "bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600",
};

const ENVIRONMENT_BADGE: Record<StoreEnvironment, string> = {
  production: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  development: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
};

/** When an app has no builds yet, the tabs it shows — the reference layout's iOS / Android. */

/** One environment cell of a version row: Download, "Removed" or "N/A", with its age underneath. */
function EnvironmentCell({ build, environment }: { build: StoreBuild | null; environment: StoreEnvironment }) {
  const label = ENVIRONMENT_LABELS[environment];
  const base = "flex h-9 w-full items-center justify-center gap-2 rounded-control px-3 text-xs font-medium";
  let control: React.ReactNode;
  let when: { text: string; title?: string };
  if (build && isLive(build) && build.downloadUrl) {
    control = (
      <a
        href={absoluteUrl(build.downloadUrl)}
        download={build.fileName}
        aria-label={`Download ${label} build, version ${build.version}, ${formatBytes(build.sizeBytes)}`}
        className={`${base} outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${ENVIRONMENT_BUTTON[environment]}`}
      >
        <DownloadIcon className="h-4 w-4" />
        {label}
      </a>
    );
    when = { text: relativeTime(build.createdAt), title: `Uploaded ${formatDate(build.createdAt)}` };
  } else if (build) {
    control = (
      <span aria-label={`${label} build of version ${build.version} was removed`} className={`${base} bg-muted-surface text-muted-foreground`}>
        <DownloadIcon className="h-4 w-4" />
        Removed
      </span>
    );
    when = { text: relativeTime(build.removedAt ?? build.createdAt), title: `Removed ${formatDate(build.removedAt ?? build.createdAt)}` };
  } else {
    control = (
      <span aria-label={`No ${label} build of this version`} className={`${base} border border-dashed border-surface-border text-muted-foreground`}>
        N/A
      </span>
    );
    when = { text: "N/A" };
  }
  return (
    <div className="min-w-0 text-center">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:hidden">{label}</span>
      {control}
      <span className="mt-1 block text-xs text-muted-foreground" title={when.title}>
        {when.text}
      </span>
    </div>
  );
}

/** The details behind one environment of an expanded version row, with Remove for an admin. */
function BuildDetails({
  build,
  environment,
  canManage,
  busy,
  onRemove,
}: {
  build: StoreBuild | null;
  environment: StoreEnvironment;
  canManage: boolean;
  busy: boolean;
  onRemove: (build: StoreBuild) => void;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${ENVIRONMENT_BADGE[environment]}`}>
          {ENVIRONMENT_LABELS[environment]}
        </span>
        {canManage && build && isLive(build) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onRemove(build)}
            className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <TrashIcon className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
      {build ? (
        <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">File</dt>
          <dd className="truncate text-foreground" title={build.fileName}>
            {build.fileName}
          </dd>
          <dt className="text-muted-foreground">Size</dt>
          <dd className="text-foreground">{formatBytes(build.sizeBytes)}</dd>
          <dt className="text-muted-foreground">Uploaded by</dt>
          <dd className="truncate text-foreground" title={build.uploadedBy ?? undefined}>
            {build.uploadedBy || "—"}
          </dd>
          <dt className="text-muted-foreground">Uploaded</dt>
          <dd className="text-foreground">{formatDate(build.createdAt)}</dd>
          {build.removedAt && (
            <>
              <dt className="text-muted-foreground">Removed</dt>
              <dd className="text-foreground">{formatDate(build.removedAt)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">SHA-256</dt>
          <dd className="truncate font-mono text-foreground" title={build.sha256}>
            {build.sha256}
          </dd>
          <dt className="text-muted-foreground">What&apos;s new</dt>
          <dd className="whitespace-pre-line text-foreground">{build.notes || "—"}</dd>
        </dl>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Never uploaded for this version.</p>
      )}
    </div>
  );
}

function VersionRowItem({
  row,
  expanded,
  onToggle,
  canManage,
  busy,
  onRemove,
}: {
  row: VersionRow;
  expanded: boolean;
  onToggle: () => void;
  canManage: boolean;
  busy: boolean;
  onRemove: (build: StoreBuild) => void;
}) {
  const shown = [row.production, row.development].filter((b): b is StoreBuild => !!b);
  const size = (shown.find(isLive) ?? shown[0])?.sizeBytes;
  const panelId = `store-version-${row.version.replace(/[^0-9A-Za-z]/g, "-")}`;
  return (
    <li className="py-3">
      <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-[minmax(0,1fr)_160px_160px] sm:gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="col-span-2 flex items-start gap-2 rounded-control text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:col-span-1"
        >
          <ChevronDownIcon className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${expanded ? "" : "-rotate-90"}`} />
          <span className="min-w-0">
            <span className="block text-base font-semibold text-foreground">{row.version}</span>
            {size !== undefined && <span className="block text-xs text-muted-foreground">size: {formatBytes(size)}</span>}
          </span>
        </button>
        <EnvironmentCell build={row.production} environment="production" />
        <EnvironmentCell build={row.development} environment="development" />
      </div>
      {expanded && (
        <div id={panelId} className="mt-3 grid grid-cols-1 gap-3 sm:ml-6 sm:grid-cols-2">
          {ENVIRONMENTS.map((env) => (
            <BuildDetails key={env} build={row[env]} environment={env} canManage={canManage} busy={busy} onRemove={onRemove} />
          ))}
        </div>
      )}
    </li>
  );
}

/** The sad face of an empty Version Control — the reference layout's "No Data". */
function NoData({ canManage }: { canManage: boolean }) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-10 w-10 text-muted-foreground">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.5 16.5c1.8-1.6 5.2-1.6 7 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="9" cy="10" r="1" fill="currentColor" />
        <circle cx="15" cy="10" r="1" fill="currentColor" />
      </svg>
      <p className="mt-3 text-lg font-medium text-foreground">No Data</p>
      {canManage && <p className="mt-1 text-sm text-muted-foreground">Upload a build with Next version.</p>}
    </div>
  );
}

/**
 * The body of an app's page (`/store-<number>`), laid out as the reference
 * design: the app's information on the left — icon, name, "Edit App info"
 * and "Next version" for an admin — and its Version Control on the right: a
 * tab per platform the app has builds for, each listing every version
 * highest first with its Production and Development build side by side
 * (download, "Removed" or "N/A"). Expanding a version shows its file, size,
 * SHA-256 and what's new, and, for an admin, Remove.
 */
export function StoreAppDetail({
  app,
  canManage,
  notice,
  onChanged,
  onDeleted,
  onEdit,
  onNextVersion,
}: {
  app: StoreApp;
  canManage: boolean;
  /** A line to show after an upload or edit, e.g. "Android v1.2.2 (Production) is uploaded." */
  notice: string | null;
  onChanged: (app: StoreApp, notice?: string) => void;
  onDeleted: () => void;
  onEdit: () => void;
  onNextVersion: () => void;
}) {
  const tabs = appPlatforms(app);
  const [tab, setTab] = useState<StorePlatform>(tabs[0]!);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  // A first upload for a new platform adds its tab; show it.
  useEffect(() => {
    if (!tabs.includes(tab)) setTab(tabs[0]!);
  }, [tabs, tab]);

  const rows = versionRows(app, tab);

  async function removeBuild(build: StoreBuild) {
    const label = `${PLATFORM_LABELS[build.platform]} ${ENVIRONMENT_LABELS[build.environment]} build of version ${build.version}`;
    if (!window.confirm(`Remove the ${label}? Its file is deleted and it can no longer be downloaded. It stays in the history as "Removed".`)) return;
    setBusy(true);
    setError(null);
    try {
      onChanged(await removeStoreBuild(app.id, build.id), `The ${label} was removed.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove the build.");
    } finally {
      setBusy(false);
    }
  }

  async function removeApp() {
    if (!window.confirm(`Delete ${app.name} and all ${app.builds.length} of its builds? This can't be undone.`)) return;
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

  function toggle(version: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  }

  return (
    <div className="animate-entrance">
      <Link
        href={STORE_HREF}
        className="inline-flex items-center gap-1 rounded-control py-1 pr-3 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        All apps
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-6 rounded-xl border border-surface-border bg-card p-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        {/* App's information */}
        <section aria-labelledby="store-app-info">
          <h2 id="store-app-info" className="text-sm text-muted-foreground">
            App&apos;s Information
          </h2>
          {canManage && (
            <span className="mt-3 inline-flex rounded-full bg-muted-surface px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {app.isPublic ? "Public" : "Private"}
            </span>
          )}
          <div className="mt-4 flex items-start gap-4">
            <AppLogo app={app} className="h-20 w-20" />
            <div className="min-w-0">
              <h1 className="break-words font-heading text-xl font-semibold leading-tight text-foreground">{app.name}</h1>
              {canManage && (
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={busy}
                  className="mt-2 rounded-control text-sm font-medium text-sky-700 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-sky-400"
                >
                  Edit App info
                </button>
              )}
            </div>
          </div>
          {app.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{app.description}</p>}

          {canManage && (
            <div className="mt-6 flex flex-col gap-2">
              <Button type="button" onClick={onNextVersion} disabled={busy} className="w-full">
                <UploadIcon className="h-4 w-4" />
                Next version
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={removeApp}
                disabled={busy}
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <TrashIcon className="h-4 w-4" />
                Delete app
              </Button>
            </div>
          )}

          <dl className="mt-6 space-y-1 border-t border-surface-border pt-4 text-xs text-muted-foreground">
            <div className="flex justify-between gap-3">
              <dt>Added</dt>
              <dd title={formatDate(app.createdAt)}>{relativeTime(app.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Last updated</dt>
              <dd title={formatDate(app.updatedAt)}>{relativeTime(app.updatedAt)}</dd>
            </div>
          </dl>
        </section>

        {/* Version Control */}
        <section aria-labelledby="store-version-control" className="min-w-0">
          <h2 id="store-version-control" className="text-sm text-muted-foreground">
            Version Control
          </h2>

          <div role="tablist" aria-label="Platform" className="mt-3 flex border-b border-surface-border">
            {tabs.map((p) => {
              const active = p === tab;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  id={`store-platform-${p}`}
                  aria-selected={active}
                  aria-controls="store-platform-panel"
                  onClick={() => setTab(p)}
                  className={`-mb-px flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                    active ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <PlatformIcon platform={p} className="h-4 w-4" />
                  {PLATFORM_LABELS[p]}
                </button>
              );
            })}
          </div>

          {notice && (
            <p role="status" className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
              {notice}
            </p>
          )}
          {error && (
            <p role="alert" className={`mt-4 ${ERROR_CLASS}`}>
              {error}
            </p>
          )}

          <div id="store-platform-panel" role="tabpanel" aria-labelledby={`store-platform-${tab}`}>
            {rows.length === 0 ? (
              <NoData canManage={canManage} />
            ) : (
              <>
                <div aria-hidden="true" className="mt-3 hidden grid-cols-[minmax(0,1fr)_160px_160px] gap-4 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                  <span className="pl-6">Version</span>
                  <span className="text-center">{ENVIRONMENT_LABELS.production}</span>
                  <span className="text-center">{ENVIRONMENT_LABELS.development}</span>
                </div>
                <ul className="divide-y divide-surface-border">
                  {rows.map((row) => (
                    <VersionRowItem
                      key={row.version}
                      row={row}
                      expanded={expanded.has(row.version)}
                      onToggle={() => toggle(row.version)}
                      canManage={canManage}
                      busy={busy}
                      onRemove={removeBuild}
                    />
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
