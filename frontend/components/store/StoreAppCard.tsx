"use client";

import Link from "next/link";
import { DownloadIcon } from "@/components/layout/icons";
import { AppLogo } from "@/components/store/AppLogo";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import {
  ENVIRONMENT_LABELS,
  PLATFORM_LABELS,
  absoluteUrl,
  formatBytes,
  latestByEnvironment,
  type StoreApp,
  type StoreEnvironment,
  type StoreRelease,
} from "@/lib/store/store-api";

/** Green for Production, amber for Development — both already themed for dark mode in globals.css. */
export const ENVIRONMENT_TONES: Record<StoreEnvironment, { badge: string; button: string }> = {
  production: {
    badge: "bg-[#e1f5ec] text-[#1f9d6b]",
    button: "bg-[#1f9d6b] text-white hover:opacity-90",
  },
  development: {
    badge: "bg-[#fffbeb] text-[#b45309] border border-[#f5d896]",
    button: "border border-[#f5d896] bg-[#fffbeb] text-[#b45309] hover:bg-[#f5d896]/60",
  },
};

export function EnvironmentBadge({ environment }: { environment: StoreEnvironment }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${ENVIRONMENT_TONES[environment].badge}`}>
      {ENVIRONMENT_LABELS[environment]}
    </span>
  );
}

/**
 * A plain link: the backend answers with `Content-Disposition: attachment`,
 * so the browser saves the file and the page stays put. The session cookie
 * rides along on a top-level navigation, which is why this is not a fetch.
 */
export function DownloadButton({
  release,
  environment,
  className = "",
}: {
  release: StoreRelease | null;
  environment: StoreEnvironment;
  className?: string;
}) {
  const label = ENVIRONMENT_LABELS[environment];
  if (!release) {
    return (
      <span
        aria-disabled="true"
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted ${className}`}
      >
        No {label.toLowerCase()} build
      </span>
    );
  }
  return (
    <a
      href={absoluteUrl(release.downloadUrl)}
      download={release.fileName}
      aria-label={`Download ${label} build, version ${release.version}, ${formatBytes(release.sizeBytes)}`}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${ENVIRONMENT_TONES[environment].button} ${className}`}
    >
      <DownloadIcon className="h-4 w-4" />
      <span className="truncate">
        {label} <span className="font-normal opacity-80">v{release.version}</span>
      </span>
    </a>
  );
}

export function StoreAppCard({
  app,
  showVisibility,
  href,
}: {
  app: StoreApp;
  /** Admins see a Public/Private badge; users only ever see public apps. */
  showVisibility: boolean;
  /** The app's page — `/store-<number>`. */
  href: string;
}) {
  const latest = latestByEnvironment(app);
  const newest = app.releases[0] ?? null;

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={href}
        className="flex items-start gap-4 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
      >
        <AppLogo app={app} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-base font-bold text-ink group-hover:text-brand-purple" title={app.name}>
              {app.name}
            </span>
            {showVisibility && (
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  app.isPublic ? "bg-brand-purple/10 text-brand-purple" : "bg-gray-100 text-muted"
                }`}
              >
                {app.isPublic ? "Public" : "Private"}
              </span>
            )}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <PlatformIcon platform={app.platform} className="h-3.5 w-3.5" />
            {PLATFORM_LABELS[app.platform]}
            {newest && (
              <>
                <span aria-hidden="true">·</span>
                Updated {new Date(newest.createdAt).toLocaleDateString()}
              </>
            )}
          </span>
          <span className="mt-2 line-clamp-2 block text-sm text-muted">
            {app.description || "No description yet."}
          </span>
        </span>
      </Link>

      <div className="mt-auto pt-4">
        {app.releases.length === 0 ? (
          <p className="rounded-xl bg-page px-3 py-2 text-center text-xs text-muted">No builds uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <DownloadButton release={latest.production} environment="production" />
            <DownloadButton release={latest.development} environment="development" />
          </div>
        )}
        <Link
          href={href}
          className="mt-2 block w-full rounded-xl text-center px-3 py-1.5 text-xs font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10"
        >
          Details &amp; version history
        </Link>
      </div>
    </article>
  );
}
