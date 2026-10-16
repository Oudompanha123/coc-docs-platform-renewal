"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircleIcon, DownloadIcon } from "@/components/layout/icons";
import { AppLogo } from "@/components/store/AppLogo";
import { PlatformLogo } from "@/components/store/PlatformIcon";
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
          <p className="text-center text-sm text-muted-foreground">Tap your platform to download.</p>
          {/* Platform tiles, App Store style: just the platform's coloured mark
              on a rounded tile, and the tile is the download. The version and
              size are in the tooltip and the accessible name; a download's
              progress shows as a badge on the tile's corner (and a toast). */}
          <ul className="mt-6 flex flex-wrap justify-center gap-10">
            {options.map(({ platform, build }) => {
              const mine = build && progress?.buildId === build.id ? progress.status : null;
              const detail = build
                ? `${PLATFORM_LABELS[platform]} ${build.version} · ${formatBytes(build.sizeBytes)}`
                : `${PLATFORM_LABELS[platform]} — not available in ${ENVIRONMENT_LABELS[tab]}`;
              return (
                <li key={platform}>
                  <button
                    type="button"
                    disabled={!build || busy}
                    onClick={() => build && get(build)}
                    title={detail}
                    aria-label={
                      build
                        ? `Get ${PLATFORM_LABELS[platform]} ${ENVIRONMENT_LABELS[tab]} version ${build.version}, ${formatBytes(build.sizeBytes)}`
                        : `${PLATFORM_LABELS[platform]} is not available in ${ENVIRONMENT_LABELS[tab]}`
                    }
                    className="group relative flex size-24 items-center justify-center rounded-[26%] [--platform-tile:color-mix(in_oklab,var(--muted-surface),var(--foreground)_3%)] bg-(--platform-tile) shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_20px_-6px_rgba(0,0,0,0.18)] ring-1 ring-black/5 outline-none transition-[scale,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:scale-105 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_14px_28px_-8px_rgba(0,0,0,0.24)] focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.97] disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none disabled:hover:shadow-none motion-reduce:transition-none motion-reduce:hover:scale-100 dark:ring-white/10"
                  >
                    <PlatformLogo
                      platform={platform}
                      className={`size-14 ${build ? "" : "opacity-30 grayscale"}`}
                    />
                    {mine && (
                      <span
                        aria-hidden="true"
                        className={`absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full text-white ring-2 ring-card ${
                          mine === "done" ? "bg-emerald-600" : mine === "error" ? "bg-destructive" : "bg-sky-600 dark:bg-sky-500"
                        }`}
                      >
                        {mine === "downloading" ? (
                          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : mine === "done" ? (
                          <CheckCircleIcon className="size-4" />
                        ) : (
                          <DownloadIcon className="size-4" />
                        )}
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
