"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MonitorIcon, PlusIcon } from "@/components/layout/icons";
import { PlatformIcon } from "@/components/store/PlatformIcon";
import { StoreAppCard } from "@/components/store/StoreAppCard";
import { StoreAppForm } from "@/components/store/StoreAppForm";
import { StoreShell } from "@/components/store/StoreShell";
import { useSession } from "@/lib/auth/SessionProvider";
import {
  PLATFORM_LABELS,
  TAB_PLATFORMS,
  fetchAllStoreApps,
  fetchStoreApps,
  storeAppHref,
  tabOf,
  type StoreApp,
  type StorePlatform,
  type StoreTab,
} from "@/lib/store/store-api";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

const TABS: { key: StoreTab; label: string; hint: string }[] = [
  { key: "mobile", label: "Mobile", hint: "Android & iOS" },
  { key: "pc", label: "PC", hint: "Windows & macOS" },
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

/**
 * The Store listing, `/store` (ADR-108): the team's Android, iOS, Windows
 * and macOS apps, under Mobile and PC tabs, each with separate Production and
 * Development downloads. A card opens the app's own page, `/store-<number>`
 * (`store/[number]/page.tsx`).
 *
 * Everyone signed in sees the public apps that have a build. An admin sees
 * every app — private ones and ones with no build yet included — and can add
 * apps here; builds are managed on each app's page. That split is the
 * backend's: an admin's list comes from the admin route, and a user's from
 * the public one, which never returns a private app.
 */
export default function StorePage() {
  const { user } = useSession();
  const canManage = user?.role === "admin" || user?.role === "super_admin";

  const [apps, setApps] = useState<StoreApp[]>([]);
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [tab, setTab] = useState<StoreTab>("mobile");
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

  // Open on the tab that has something in it, the first time the list arrives.
  const [tabChosen, setTabChosen] = useState(false);
  useEffect(() => {
    if (tabChosen || load.status !== "ready") return;
    if (!apps.some((a) => tabOf(a.platform) === "mobile") && apps.some((a) => tabOf(a.platform) === "pc")) {
      setTab("pc");
    }
    setTabChosen(true);
  }, [apps, load.status, tabChosen]);

  const counts = useMemo(
    () => ({
      mobile: apps.filter((a) => tabOf(a.platform) === "mobile").length,
      pc: apps.filter((a) => tabOf(a.platform) === "pc").length,
    }),
    [apps],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter(
      (a) =>
        tabOf(a.platform) === tab &&
        (platformFilter === "all" || a.platform === platformFilter) &&
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

  return (
    <StoreShell>
        {/* Hero */}
        <section className="animate-entrance flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-brand-purple">
              App Store
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight text-ink sm:text-4xl">Download our apps</h1>
            <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
              Install the team&apos;s apps on your phone or computer. Each app offers a stable Production build and,
              when there is one, a Development build for testing.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow transition-all duration-150 hover:opacity-90 active:scale-[0.97] sm:self-auto"
            >
              <PlusIcon className="h-4 w-4" />
              Add app
            </button>
          )}
        </section>

        {/* Tabs + filters */}
        <section className="mt-8 flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="tablist" aria-label="Device type" className="inline-flex self-start rounded-2xl bg-gray-100 p-1">
            {TABS.map((t) => {
              const active = tab === t.key;
              const Icon = t.key === "mobile" ? PhoneIcon : MonitorIcon;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  id={`store-tab-${t.key}`}
                  aria-selected={active}
                  aria-controls="store-tabpanel"
                  onClick={() => chooseTab(t.key)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple sm:px-5 ${
                    active ? "bg-white text-ink shadow-sm" : "text-muted hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                  <span
                    className={`rounded-full px-1.5 text-[11px] ${active ? "bg-brand-purple/10 text-brand-purple" : "bg-white/60 text-muted"}`}
                  >
                    {counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-1.5" aria-label="Platform filter">
              {(["all", ...TAB_PLATFORMS[tab]] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={platformFilter === p}
                  onClick={() => setPlatformFilter(p)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    platformFilter === p
                      ? "bg-brand-purple/10 text-brand-purple"
                      : "border border-border text-muted hover:bg-page"
                  }`}
                >
                  {p !== "all" && <PlatformIcon platform={p} className="h-3.5 w-3.5" />}
                  {p === "all" ? "All" : PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search apps"
              aria-label="Search apps"
              className="w-full rounded-full border border-border bg-white px-4 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none focus:ring-2 focus:ring-brand-purple/30 sm:w-56"
            />
          </div>
        </section>

        {/* Grid */}
        <section id="store-tabpanel" role="tabpanel" aria-labelledby={`store-tab-${tab}`} className="mt-6">
          {load.status === "loading" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-gray-100" />
              ))}
            </div>
          )}

          {load.status === "error" && (
            <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {load.message}{" "}
              <button type="button" onClick={refresh} className="underline">
                Try again
              </button>
            </p>
          )}

          {load.status === "ready" && visible.length === 0 && (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
                {tab === "mobile" ? <PhoneIcon className="h-7 w-7" /> : <MonitorIcon className="h-7 w-7" />}
              </span>
              <p className="mt-4 text-base font-bold text-ink">
                {query || platformFilter !== "all" ? "No apps match" : `No ${tab === "mobile" ? "mobile" : "PC"} apps yet`}
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                {query || platformFilter !== "all"
                  ? "Try a different search or platform."
                  : canManage
                    ? "Add an app to make it available here."
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
          onSaved={(saved) => {
            upsert(saved);
            chooseTab(tabOf(saved.platform));
          }}
          onClose={() => setAdding(false)}
        />
      )}
    </StoreShell>
  );
}
