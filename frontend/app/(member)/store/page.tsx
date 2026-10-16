"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { MonitorIcon, PlusIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { StoreAppCard } from "@/components/store/StoreAppCard";
import { StoreAppForm } from "@/components/store/StoreAppForm";
import { StoreShell } from "@/components/store/StoreShell";
import { useSession } from "@/lib/auth/SessionProvider";
import {
  PLATFORMS,
  PLATFORM_LABELS,
  TAB_PLATFORMS,
  fetchAllStoreApps,
  fetchStoreApps,
  inTab,
  livePlatforms,
  storeAppHref,
  type StoreApp,
  type StorePlatform,
  type StoreTab,
} from "@/lib/store/store-api";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

const TABS: { key: StoreTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "mobile", label: "Mobile" },
  { key: "pc", label: "PC" },
];

/** A small phone glyph for the Mobile tab, in the same stroke style as the layout icons. */
function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M11 17.5h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

const TAB_ICONS: Record<StoreTab, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  all: LayoutGrid,
  mobile: PhoneIcon,
  pc: MonitorIcon,
};

/**
 * The Store listing, `/store` (ADR-108, ADR-111): the team's apps. "All"
 * lists every app; Mobile and PC list the apps with a build for Android /
 * iOS, or Windows / macOS — an app is not tied to a platform, its builds
 * are. A card opens the app's page, `/store-<number>`.
 *
 * Everyone signed in sees every public app. An admin sees every app, private
 * ones included, and adds apps here ("Add App": a name and an icon). That
 * split is the backend's: an admin's list comes from the admin route, and a
 * user's from the public one, which never returns a private app.
 */
export default function StorePage() {
  const { user } = useSession();
  const canManage = user?.role === "admin" || user?.role === "super_admin";

  const [apps, setApps] = useState<StoreApp[]>([]);
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [tab, setTab] = useState<StoreTab>("all");
  const [platformFilter, setPlatformFilter] = useState<StorePlatform | "all">("all");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(() => {
    setLoad({ status: "loading" });
    (canManage ? fetchAllStoreApps() : fetchStoreApps())
      .then((list) => {
        setApps(list);
        setLoad({ status: "ready" });
      })
      .catch((err: unknown) =>
        setLoad({ status: "error", message: err instanceof Error ? err.message : "Couldn't load the Store." }),
      );
  }, [canManage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts = useMemo(
    () => ({
      all: apps.length,
      mobile: apps.filter((a) => inTab(a, "mobile")).length,
      pc: apps.filter((a) => inTab(a, "pc")).length,
    }),
    [apps],
  );

  const chips: readonly StorePlatform[] = tab === "all" ? PLATFORMS : TAB_PLATFORMS[tab];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter(
      (a) =>
        inTab(a, tab) &&
        (platformFilter === "all" || livePlatforms(a).includes(platformFilter)) &&
        (!q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)),
    );
  }, [apps, tab, platformFilter, query]);

  function upsert(saved: StoreApp) {
    setApps((current) => {
      const exists = current.some((a) => a.id === saved.id);
      const next = exists ? current.map((a) => (a.id === saved.id ? saved : a)) : [...current, saved];
      return next.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    });
  }

  function chooseTab(next: StoreTab) {
    setTab(next);
    setPlatformFilter("all");
  }

  const filtered = query.trim() !== "" || platformFilter !== "all";
  const EmptyIcon = TAB_ICONS[tab];

  return (
    <StoreShell>
      {/* Hero */}
      <section className="animate-entrance flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
            <LayoutGrid className="size-3.5" aria-hidden="true" />
            App Store
          </span>
          <h1 className="mt-3 font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl">Our apps</h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground sm:text-base">
            Discover and install your team&apos;s apps across mobile and desktop.
          </p>
        </div>
        {canManage && (
          <Button type="button" size="lg" onClick={() => setAdding(true)} className="shrink-0 self-start">
            <PlusIcon className="h-4 w-4" />
            Add app
          </Button>
        )}
      </section>

      {/* Tabs + filters */}
      <section className="mt-8 flex flex-col gap-4 border-b border-surface-border pb-5 xl:flex-row xl:items-center">
        <div
          role="tablist"
          aria-label="Device type"
          className="inline-flex w-full items-center gap-1 rounded-full border border-surface-border bg-card p-1 sm:w-auto sm:shrink-0 sm:self-start"
        >
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = TAB_ICONS[t.key];
            return (
              <Button
                key={t.key}
                type="button"
                role="tab"
                id={`store-tab-${t.key}`}
                aria-selected={active}
                aria-controls="store-tabpanel"
                variant={active ? "default" : "ghost"}
                size="sm"
                onClick={() => chooseTab(t.key)}
                className={`flex-1 sm:flex-none sm:px-4 ${active ? "" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="size-4" />
                {t.label}
                <span className="tabular-nums">({counts[t.key]})</span>
              </Button>
            );
          })}
        </div>

        <div className="hidden h-6 w-px bg-surface-border xl:block" aria-hidden="true" />

        <div role="group" aria-label="Platform filter" className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
          {(["all", ...chips] as const).map((p) => (
            <Button
              key={p}
              type="button"
              aria-pressed={platformFilter === p}
              variant={platformFilter === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPlatformFilter(p)}
            >
              {p !== "all" && <PlatformIcon platform={p} className="size-3.5" />}
              {p === "all" ? "Any platform" : PLATFORM_LABELS[p]}
            </Button>
          ))}
        </div>

        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search apps"
          aria-label="Search apps"
          containerClassName="xl:ml-auto xl:w-56 xl:shrink-0"
          className="bg-card"
        />
      </section>

      {/* Grid */}
      <section id="store-tabpanel" role="tabpanel" aria-labelledby={`store-tab-${tab}`} className="mt-6">
        {load.status === "loading" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted-surface" />
            ))}
          </div>
        )}

        {load.status === "error" && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {load.message}{" "}
            <button type="button" onClick={refresh} className="underline">
              Try again
            </button>
          </p>
        )}

        {load.status === "ready" && visible.length === 0 && (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-surface-border px-6 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted-surface text-foreground">
              <EmptyIcon className="h-7 w-7" />
            </span>
            <p className="mt-4 text-base font-semibold text-foreground">
              {filtered ? "No apps match" : tab === "all" ? "No apps yet" : `No ${tab === "mobile" ? "mobile" : "PC"} apps yet`}
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {filtered
                ? "Try a different search or platform."
                : canManage
                  ? "Add an app, then upload its builds with Next version."
                  : "Apps will appear here once an admin publishes them."}
            </p>
          </div>
        )}

        {load.status === "ready" && visible.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((app) => (
              <StoreAppCard key={app.id} app={app} showVisibility={canManage} href={storeAppHref(app.number)} />
            ))}
          </div>
        )}
      </section>

      {adding && (
        <StoreAppForm
          existingApps={apps}
          onSaved={(saved) => {
            upsert(saved);
            chooseTab("all");
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </StoreShell>
  );
}
