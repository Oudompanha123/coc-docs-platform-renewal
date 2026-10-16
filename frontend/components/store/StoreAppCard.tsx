"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useThemedPortalContainer } from "@/lib/portal-container";
import Link from "next/link";
import { Box, Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { GlobeIcon } from "@/components/layout/icons";
import { AppLogo } from "@/components/store/AppLogo";
import { GetAppDialog } from "@/components/store/GetAppDialog";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { DropdownMenuItem, RowActions } from "@/components/ui/dropdown-menu";
import { PLATFORM_LABELS, formatDate, hasGettableBuild, livePlatforms, relativeTime, type StoreApp } from "@/lib/store/store-api";

/**
 * One app on the Store listing: icon, name, visibility, the platforms it has
 * builds for, description and when it last changed. App Store style: a filled
 * surface with no border or shadow, so the chips inside sit on `bg-card` to
 * stay visible. The whole card opens the
 * app's page (`/store-<number>`) through a stretched link; the "⋯" menu sits
 * above it so it stays clickable. Its "Copy URL" puts the full page address
 * on the clipboard.
 */
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
  const platforms = livePlatforms(app);
  const [getting, setGetting] = useState(false);
  // Inside the themed shell, not on <body>: out there the dark-mode tokens
  // never reach the dialog, and it opened light on a dark page.
  const portalTarget = useThemedPortalContainer();

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).toString());
      toast.success("Link copied to the clipboard.");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl bg-muted-surface p-5 transition-[background-color,scale] duration-300 ease-[cubic-bezier(.16,1,.3,1)] will-change-[scale] has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50 hover:scale-[1.02] hover:bg-[color-mix(in_oklab,var(--muted-surface),var(--foreground)_5%)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100">
      <div className="flex items-start gap-4">
        <AppLogo app={app} />
        <div className="min-w-0 flex-1">
          <Link
            href={href}
            title={app.name}
            className="block truncate text-base font-semibold text-foreground outline-none after:absolute after:inset-0 after:content-['']"
          >
            {app.name}
          </Link>
          {showVisibility && (
            <span
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                app.isPublic ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-card text-muted-foreground"
              }`}
            >
              <GlobeIcon className="size-3.5" />
              {app.isPublic ? "Public" : "Private"}
            </span>
          )}
        </div>
        <div className="relative z-10 -mr-2 -mt-1">
          <RowActions label={`Actions for ${app.name}`}>
            <DropdownMenuItem onSelect={copyUrl}>
              <Copy className="size-4" aria-hidden="true" />
              <span>Copy URL</span>
            </DropdownMenuItem>
          </RowActions>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Box className="size-4 shrink-0" aria-hidden="true" />
        {platforms.length === 0 ? (
          <span>No builds yet</span>
        ) : (
          <span className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[11px] font-medium text-foreground"
              >
                <PlatformIcon platform={p} className="h-3 w-3" />
                {PLATFORM_LABELS[p]}
              </span>
            ))}
          </span>
        )}
      </div>

      <p className="line-clamp-3 text-sm text-muted-foreground">{app.description || "No description yet."}</p>

      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground" title={formatDate(app.updatedAt)}>
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">Updated {relativeTime(app.updatedAt)}</span>
        </p>
        {hasGettableBuild(app) && (
          // Above the stretched link, so it opens the dialog instead of the app page.
          // App Store's "Get": a small blue pill with white text. The blue is
          // the design system's info blue (sky-600), the same one the
          // Development download button on the app page uses.
          <Button
            type="button"
            size="sm"
            onClick={() => setGetting(true)}
            aria-label={`Get ${app.name}`}
            className="relative z-10 h-7 shrink-0 bg-sky-600 px-4 text-[13px] font-semibold text-white hover:bg-sky-700 focus-visible:ring-sky-500/40 dark:bg-sky-500 dark:hover:bg-sky-600"
          >
            Get
          </Button>
        )}
      </div>
      {/* Portalled: the card scales on hover, and a transformed ancestor would pin a fixed dialog to the card. */}
      {getting && createPortal(<GetAppDialog app={app} onClose={() => setGetting(false)} />, portalTarget ?? document.body)}
    </div>
  );
}
