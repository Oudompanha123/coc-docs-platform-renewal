"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircleIcon, DownloadIcon } from "@/components/layout/icons";
import { AppLogo } from "@/components/store/AppLogo";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { StoreDialog } from "@/components/store/StoreDialog";
import { downloadBuild } from "@/lib/store/download";
import {
  ENVIRONMENT_LABELS,
  PLATFORM_LABELS,
  formatBytes,
  getOptions,
  type StoreApp,
  type StoreBuild,
  type StoreEnvironment,
} from "@/lib/store/store-api";

/** Development first, as the card's Get asks for it. */
const TABS: readonly StoreEnvironment[] = ["development", "production"];

const TITLE_ID = "store-get-title";

type Progress = { buildId: string; status: "downloading" | "done" | "error" };

/**
 * What "Get" on an app card opens: a Development tab and a Production tab,
 * each listing the platforms the app has (Android, iOS, … ) with the latest
 * version of each. Choosing one downloads that latest live build; a platform
 * with nothing in this environment is shown, disabled, as "Not available".
 *
 * The first tab opened is the first with anything to download. One download
 * runs at a time; the result is a toast, and a failed one offers Retry.
 */
export function GetAppDialog({ app, onClose }: { app: StoreApp; onClose: () => void }) {
  const firstWithBuilds = TABS.find((env) => getOptions(app, env).some((o) => o.build)) ?? TABS[0]!;
  const [tab, setTab] = useState<StoreEnvironment>(firstWithBuilds);
  const [progress, setProgress] = useState<Progress | null>(null);
  const busy = progress?.status === "downloading";

  async function get(build: StoreBuild) {
    if (busy) return;
    setProgress({ buildId: build.id, status: "downloading" });
    try {
      await downloadBuild(build, () => {});
      setProgress({ buildId: build.id, status: "done" });
      toast.success(`Downloaded ${build.fileName}.`);
    } catch (err) {
      setProgress({ buildId: build.id, status: "error" });
      toast.error(err instanceof Error ? err.message : "The download failed. Try again.", {
        description: "Choose it again to retry.",
      });
    }
  }

  const options = getOptions(app, tab);

  return (
    <StoreDialog titleId={TITLE_ID} onClose={onClose} busy={busy} maxWidth="max-w-[440px]">
      <div className="p-6">
        <div className="flex items-start gap-3 pr-8">
          <div className="flex min-w-0 items-center gap-3">
            <AppLogo app={app} className="h-12 w-12" />
            <div className="min-w-0">
              <h2 id={TITLE_ID} className="truncate text-lg font-semibold text-foreground">
                Get {app.name}
              </h2>
              <p className="text-sm text-muted-foreground">Downloads the latest version.</p>
            </div>
          </div>
        </div>

        <div role="tablist" aria-label="Server type" className="mt-5 flex border-b border-surface-border">
          {TABS.map((env) => {
            const active = env === tab;
            return (
              <button
                key={env}
                type="button"
                role="tab"
                id={`store-get-tab-${env}`}
                aria-selected={active}
                aria-controls="store-get-panel"
                onClick={() => setTab(env)}
                className={`-mb-px flex-1 border-b-2 px-3 py-2.5 text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                  active ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {ENVIRONMENT_LABELS[env]}
              </button>
            );
          })}
        </div>

        <div id="store-get-panel" role="tabpanel" aria-labelledby={`store-get-tab-${tab}`} className="mt-4">
          <p className="text-sm text-muted-foreground">Choose your platform.</p>
          <ul className="mt-3 space-y-2">
            {options.map(({ platform, build }) => {
              const mine = build && progress?.buildId === build.id ? progress.status : null;
              return (
                <li key={platform}>
                  <button
                    type="button"
                    disabled={!build || busy}
                    onClick={() => build && get(build)}
                    aria-label={
                      build
                        ? `Get ${PLATFORM_LABELS[platform]} ${ENVIRONMENT_LABELS[tab]} version ${build.version}`
                        : `${PLATFORM_LABELS[platform]} is not available in ${ENVIRONMENT_LABELS[tab]}`
                    }
                    className="flex w-full items-center gap-3 rounded-2xl bg-muted-surface px-4 py-3 text-left outline-none transition-colors hover:bg-[color-mix(in_oklab,var(--muted-surface),var(--foreground)_5%)] focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-muted-surface"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-foreground">
                      <PlatformIcon platform={platform} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{PLATFORM_LABELS[platform]}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {build ? `Version ${build.version} · ${formatBytes(build.sizeBytes)}` : "Not available"}
                      </span>
                    </span>
                    {build && (
                      <span className="flex h-8 shrink-0 items-center gap-1.5 rounded-control bg-primary px-3 text-xs font-medium text-primary-foreground">
                        {mine === "downloading" ? (
                          <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : mine === "done" ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <DownloadIcon className="h-4 w-4" />
                        )}
                        {mine === "error" ? "Retry" : mine === "done" ? "Downloaded" : "Get"}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </StoreDialog>
  );
}
