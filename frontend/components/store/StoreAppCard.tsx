"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Box, Clock, Copy } from "lucide-react";
import { toast } from "sonner";
import { GlobeIcon } from "@/components/layout/icons";
import { AppLogo } from "@/components/store/AppLogo";
import { GetAppDialog } from "@/components/store/GetAppDialog";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { DropdownMenuItem, RowActions } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Link } from "@/lib/i18n/navigation";
import { fill } from "@/lib/i18n/translations";
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
  const { t, language } = useLanguage();
  const platforms = livePlatforms(app);
  const [getting, setGetting] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).toString());
      toast.success(t.store.linkCopied);
    } catch {
      toast.error(t.store.copyFailed);
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
              {app.isPublic ? t.store.public : t.store.private}
            </span>
          )}
        </div>
        <div className="relative z-10 -mr-2 -mt-1">
          <RowActions label={fill(t.store.actionsFor, { name: app.name })}>
            <DropdownMenuItem onSelect={copyUrl}>
              <Copy className="size-4" aria-hidden="true" />
              <span>{t.store.copyUrl}</span>
            </DropdownMenuItem>
          </RowActions>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Box className="size-4 shrink-0" aria-hidden="true" />
        {platforms.length === 0 ? (
          <span>{t.store.noBuilds}</span>
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

      <p className="line-clamp-3 text-sm text-muted-foreground">{app.description || t.store.noDescription}</p>

      <div className="mt-auto flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground" title={formatDate(app.updatedAt, language)}>
          <Clock className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {fill(t.store.updated, { time: relativeTime(app.updatedAt, undefined, { locale: language, justNow: t.store.justNow }) })}
          </span>
        </p>
        {hasGettableBuild(app) && (
          // Above the stretched link, so it opens the dialog instead of the app page.
          <Button
            type="button"
            size="sm"
            onClick={() => setGetting(true)}
            aria-label={`Get ${app.name}`}
            className="relative z-10 shrink-0 px-5 font-semibold"
          >
            Get
          </Button>
        )}
      </div>
      {/* Portalled: the card scales on hover, and a transformed ancestor would pin a fixed dialog to the card. */}
      {getting && createPortal(<GetAppDialog app={app} onClose={() => setGetting(false)} />, document.body)}
    </div>
  );
}
