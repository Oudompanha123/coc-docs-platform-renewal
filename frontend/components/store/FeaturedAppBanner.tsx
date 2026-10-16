"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useThemedPortalContainer } from "@/lib/portal-container";
import Link from "next/link";
import { Check, ImageIcon, Pencil, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { GetAppDialog } from "@/components/store/GetAppDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MAX_BANNER_BYTES,
  STORE_CATEGORIES,
  absoluteUrl,
  formatDate,
  hasGettableBuild,
  lastActivity,
  relativeTime,
  removeStoreBanner,
  setFeaturedApp,
  storeAppHref,
  uploadStoreBanner,
  type StoreApp,
} from "@/lib/store/store-api";

const BANNER_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * The banner at the top of `/store` (ADR-117): one app, App Store "featured"
 * style — a wide rounded card with the app's category, name and description
 * over a dark wash, and a blue Download that opens the same Get dialog as the
 * cards.
 *
 * Which app: the one an admin pinned, otherwise the most recently uploaded or
 * updated (`featuredApp`). The background: the app's banner picture when it
 * has one, otherwise its icon enlarged and blurred into a wash of its colours.
 *
 * An admin edits it from the "Edit banner" menu — add, change or remove the
 * picture, and choose which app is featured (or go back to the latest).
 *
 * The text is white on a dark gradient in both themes, as on any photo
 * banner: the wash, not the page theme, is what it has to read against.
 */
export function FeaturedAppBanner({
  app,
  pinned,
  canManage,
  apps,
  onAppChanged,
  onPinnedChanged,
}: {
  app: StoreApp;
  /** An admin chose this app, rather than it being the latest. */
  pinned: boolean;
  canManage: boolean;
  /** Every app the reader sees — the choices for "Feature app". */
  apps: readonly StoreApp[];
  onAppChanged: (app: StoreApp) => void;
  onPinnedChanged: (appId: string | null) => void;
}) {
  const [getting, setGetting] = useState(false);
  // Inside the themed shell, not on <body>: out there the dark-mode tokens
  // never reach the dialog, and it opened light on a dark page.
  const portalTarget = useThemedPortalContainer();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // A picture that fails to load (a missing file, a stale URL) is dropped as
  // if it were not there: the banner falls back to the icon, then to the
  // plain gradient, rather than showing a broken image. Keyed to the URL so a
  // newly uploaded picture gets a fresh try.
  const [bannerFailed, setBannerFailed] = useState<string | null>(null);
  const [logoFailedFor, setLogoFailedFor] = useState<string | null>(null);
  const bannerUrl = app.bannerUrl ? absoluteUrl(app.bannerUrl) : null;
  const logoUrl = app.logoUrl ? absoluteUrl(app.logoUrl) : null;
  const banner = bannerUrl && bannerFailed !== bannerUrl ? bannerUrl : null;
  const logo = logoUrl && logoFailedFor !== logoUrl ? logoUrl : null;
  const setLogoFailed = (failed: boolean) => failed && setLogoFailedFor(logoUrl);
  const category = STORE_CATEGORIES.find((c) => c.value === app.category)?.label ?? "App";
  const when = lastActivity(app);
  const downloadable = hasGettableBuild(app);

  async function run<T>(work: () => Promise<T>, done: (result: T) => void, success: string) {
    setBusy(true);
    try {
      done(await work());
      toast.success(success);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change the banner.");
    } finally {
      setBusy(false);
    }
  }

  function choosePicture(file: File | undefined) {
    if (!file) return;
    if (!BANNER_TYPES.includes(file.type)) {
      toast.error("A banner picture must be a PNG, JPEG or WebP image.");
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      toast.error("A banner picture must be 5 MB or smaller.");
      return;
    }
    void run(() => uploadStoreBanner(app.id, file), onAppChanged, "Banner picture updated.");
  }

  return (
    <section
      aria-labelledby="store-featured-name"
      aria-busy={busy}
      className="group/banner relative isolate mt-8 overflow-hidden rounded-3xl bg-neutral-900"
    >
      {/* Background: the banner picture, or the icon blown up and blurred. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by the backend, not by Next's image pipeline
          <img
            src={banner}
            onError={() => setBannerFailed(bannerUrl)}
            alt=""
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover/banner:scale-[1.03] motion-reduce:transition-none"
          />
        ) : logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by the backend, not by Next's image pipeline
          <img
            src={logo}
            onError={() => setLogoFailed(true)}
            alt=""
            className="size-full scale-150 object-cover opacity-70 blur-3xl saturate-150 transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover/banner:scale-[1.6] motion-reduce:transition-none"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-950" />
        )}
        {/* Progressive blur along the bottom, strong at the edge and fading
            upward, so the text sits on frosted picture rather than a hard
            band. Three layers, each blurring a little more over a shorter
            stretch; their masks overlap so no edge shows where one ends. */}
        <div className="absolute inset-x-0 bottom-0 h-3/4 backdrop-blur-sm [mask-image:linear-gradient(to_top,black_30%,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 backdrop-blur-md [mask-image:linear-gradient(to_top,black_30%,transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/4 backdrop-blur-xl [mask-image:linear-gradient(to_top,black_40%,transparent)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/0" />
      </div>

      {canManage && (
        <div className="absolute right-4 top-4 z-10">
          <input
            ref={fileRef}
            type="file"
            accept={BANNER_TYPES.join(",")}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              choosePicture(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                className="h-8 bg-black/40 px-3 text-xs font-medium text-white backdrop-blur hover:bg-black/60 focus-visible:ring-white/60"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                {busy ? "Saving…" : "Edit banner"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
                <ImageIcon className="size-4" aria-hidden="true" />
                {banner ? "Change picture" : "Add picture"}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Feature app
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
                  <DropdownMenuItem
                    onSelect={() => void run(() => setFeaturedApp(null), onPinnedChanged, "The banner shows the latest upload.")}
                  >
                    <Check className={`size-4 ${pinned ? "invisible" : ""}`} aria-hidden="true" />
                    Latest upload (automatic)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {apps.map((choice) => {
                    const current = pinned && choice.id === app.id;
                    return (
                      <DropdownMenuItem
                        key={choice.id}
                        onSelect={() =>
                          void run(() => setFeaturedApp(choice.id), onPinnedChanged, `The banner now features ${choice.name}.`)
                        }
                      >
                        <Check className={`size-4 ${current ? "" : "invisible"}`} aria-hidden="true" />
                        <span className="truncate">{choice.name}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {banner && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => void run(() => removeStoreBanner(app.id), onAppChanged, "Banner picture removed.")}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove picture
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex min-h-64 flex-col justify-end gap-6 p-6 sm:min-h-72 sm:flex-row sm:items-end sm:p-8">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {pinned ? "Featured" : "Latest release"} · {category}
          </p>
          <h2 id="store-featured-name" className="mt-1.5 truncate font-heading text-2xl font-semibold text-white sm:text-3xl">
            <Link
              href={storeAppHref(app.number)}
              className="rounded-md outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-white/60"
            >
              {app.name}
            </Link>
          </h2>
          <p className="mt-1.5 line-clamp-2 max-w-xl text-sm text-white/80">
            {app.description || "The newest app in the Store."}
          </p>
          <p className="mt-2 text-xs text-white/60" title={formatDate(when)}>
            Updated {relativeTime(when)}
          </p>
        </div>

        <div className="flex shrink-0 items-end gap-5">
          {/* The icon, crisp, when the background is not already a picture of
              the app — and only when there is an icon that loads: no
              placeholder grid, and never the browser's broken-image box. */}
          {!banner && logo && (
            <span className="hidden size-24 overflow-hidden rounded-[22%] shadow-2xl ring-1 ring-white/15 sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element -- served by the backend, not by Next's image pipeline */}
              <img src={logo} alt="" onError={() => setLogoFailed(true)} className="size-full object-cover" />
            </span>
          )}
          {downloadable && (
            <Button
              type="button"
              onClick={() => setGetting(true)}
              aria-label={`Download ${app.name}`}
              className="h-9 bg-sky-600 px-6 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:ring-white/60 dark:bg-sky-500 dark:hover:bg-sky-600"
            >
              Download
            </Button>
          )}
        </div>
      </div>

      {getting && createPortal(<GetAppDialog app={app} onClose={() => setGetting(false)} />, portalTarget ?? document.body)}
    </section>
  );
}
