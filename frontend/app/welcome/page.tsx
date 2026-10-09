"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/welcome/DashboardPreview";
import { ProductsNavDropdown } from "@/components/welcome/ProductsNavDropdown";
import { ReportsNavDropdown } from "@/components/welcome/ReportsNavDropdown";
import { ScrollReveal } from "@/components/welcome/ScrollReveal";
import { GoogleIcon, ShieldIcon } from "@/components/auth/icons";
import { TONE_STYLES } from "@/components/dashboard/tone";
import { FALLBACK_NAV } from "@/lib/docs/nav-api";
import type { Tone } from "@/lib/mock/overview";
import {
  BarChartIcon,
  FolderIcon,
  LayersIcon,
  MoonIcon,
  PlugIcon,
  SparklesIcon,
  SunIcon,
} from "@/components/layout/icons";

/**
 * Public landing page. Has its own light/dark toggle, independent of the
 * admin app's data-theme + localStorage mechanism (lib/theme.ts) — a
 * visitor flipping this page's look shouldn't silently also flip the
 * authenticated admin app's dark mode. Colors are literal hex, not
 * @theme tokens: this page sits outside [data-shell="admin"], the only
 * scope the app's existing dark-mode CSS overrides target, and the dark
 * values here reuse those same admin dark-mode hex values rather than
 * inventing a new palette.
 *
 * Nav links, sidebar/stat/document data, and CTA destinations are pulled
 * from this app's real structure (nav-config.ts, lib/mock/overview.ts,
 * /login, /register) — not the borrowed jexmcp-style nav/footer a couple of
 * source mockups for this page carried over.
 *
 * Nav and footer product/section labels name the real PRODUCTS the
 * authenticated sidebar lists (Jex3.0/Jex2.0/Coach/Team/Usage, per
 * nav-api.ts's FALLBACK_NAV) rather than generic marketing sections
 * (Features/Integrations/Pricing/Blog) this page previously carried.
 */

/** "Home" is the only nav link with no dropdown — the 5 products each get
 *  one via NavDropdown, reading FALLBACK_NAV directly rather than a second
 *  copy of the product list. */
const HOME_LINK = { label: "Home", href: "/login" };

const FOOTER_LEGAL_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "#" },
  { label: "Status", href: "#" },
];

/**
 * Real 4-column footer nav, built only from routes that actually exist in
 * this app (/login, /register, /docs) — not jexmcp's Docs/Product/Resources/
 * Install pattern, which doesn't map onto a web app with no install step and
 * no separate public docs/release-notes pages. Most items route through
 * /login since those pages are part of the authenticated admin app, not
 * standalone public pages.
 */
const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Home", href: "/login" },
      { label: "Jex3.0", href: "/login" },
      { label: "Jex2.0", href: "/login" },
      { label: "Coach", href: "/login" },
    ],
  },
  {
    heading: "Team",
    links: [
      { label: "Team", href: "/login" },
      { label: "Usage", href: "/login" },
      { label: "Users & Roles", href: "/login" },
    ],
  },
  {
    heading: "Administration",
    links: [
      { label: "Settings", href: "/login" },
      { label: "System Admin", href: "/login" },
    ],
  },
  {
    heading: "Get Started",
    links: [
      { label: "Create an account", href: "/register" },
      { label: "Log in", href: "/login" },
      { label: "Docs", href: "/docs" },
    ],
  },
];

const TRUSTED_BY = ["Nexora", "Vantix", "Brightloop", "Corevia", "Pathframe"];

type FeatureCard = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: React.ReactNode;
  tone: Tone;
};

const FEATURES: FeatureCard[] = [
  {
    icon: LayersIcon,
    title: "Per-product tracking",
    description: "Each product gets its own space, its own written/unwritten count, and its own contributors.",
    tone: "purple",
  },
  {
    icon: FolderIcon,
    title: "Coverage at a glance",
    description: (
      <>See what&apos;s written and what&apos;s missing across <strong>Jex3.0</strong>, <strong>Jex2.0</strong>, <strong>Coach</strong>, <strong>Team</strong>, and <strong>Usage</strong> from one screen.</>
    ),
    tone: "green",
  },
  {
    icon: ShieldIcon,
    title: "Roles & permissions",
    description: <><strong>Super Admin</strong>, <strong>Admin</strong>, or <strong>Viewer</strong> — control who can edit and who can only read.</>,
    tone: "orange",
  },
  {
    icon: BarChartIcon,
    title: "Usage reports",
    description: "Track documents added, storage used, and team activity without asking for a status update.",
    tone: "pink",
  },
  {
    icon: PlugIcon,
    title: "Integrations",
    description: "Connect the tools your team already uses so nothing lives in a silo.",
    tone: "purple",
  },
  {
    icon: GoogleIcon,
    title: "Google-only auth",
    description: <>Sign in with the <strong>Google</strong> account your team already has — no extra passwords to manage.</>,
    tone: "green",
  },
];

export default function WelcomePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isDark = theme === "dark";
  const [authGate, setAuthGate] = useState<string | null>(null);

  // This page's own dark toggle is local component state, not the shared
  // data-theme mechanism (see this component's own top comment) — so the
  // document-level scrollbar (styled in globals.css off that same shared
  // attribute) needs its own, separate marker. A class on <html>, not
  // data-theme itself, so it can never collide with the real one if a
  // visitor signs in later in the same tab.
  useEffect(() => {
    document.documentElement.classList.toggle("welcome-dark-scroll", isDark);
    return () => document.documentElement.classList.remove("welcome-dark-scroll");
  }, [isDark]);

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={isDark ? "min-h-screen bg-[#0a0a0a]" : "min-h-screen bg-white"}>
      <header
        className={`sticky top-0 z-30 border-b shadow-sm transition-colors duration-200 ${
          isDark ? "bg-[#0a0a0a]" : "bg-white"
        } ${scrolled ? (isDark ? "border-[#2a2a2a]" : "border-border") : "border-transparent"}`}
      >
        {/* The bar was 72px tall with a 55px logo and 18px nav links. Scaled
            to the kit: a 56px bar, a 32px logo and 14px links — the header is
            furniture, and at the old size it competed with the hero. */}
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
            <img
              src={isDark ? "/logo-coc-docs-platform-dark-mode.png" : "/logo-coc-docs-platform.png"}
              alt="Coc Docs Platform"
              className="h-8 w-auto rounded-md"
            />
          </div>

          <nav className={`hidden items-center gap-6 text-sm font-medium md:flex ${isDark ? "text-[#a1a1a1]" : "text-muted"}`}>
            <a
              href={HOME_LINK.href}
              className={`flex h-14 items-center border-b-2 border-transparent transition-colors hover:border-primary ${
                isDark ? "hover:text-[#fafafa]" : "hover:text-ink"
              }`}
            >
              {HOME_LINK.label}
            </a>
            <ProductsNavDropdown products={FALLBACK_NAV} isDark={isDark} onRequireAuth={setAuthGate} />
            <ReportsNavDropdown isDark={isDark} onRequireAuth={setAuthGate} />
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle dark mode"
              aria-pressed={isDark}
              className={`rounded-full p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isDark ? "text-[#fafafa] hover:bg-white/10" : "text-muted hover:bg-secondary"
              }`}
            >
              {isDark ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            </button>
            <Button asChild variant="ghost" size="sm" className={isDark ? "hidden text-[#fafafa] hover:bg-white/10 sm:inline-flex" : "hidden sm:inline-flex"}>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className={isDark ? "bg-[#fafafa] text-[#171717] hover:bg-[#fafafa]/90" : undefined}>
              <Link href="/register">Start free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
          {isDark && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-secondary blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
              />
            </>
          )}

          <div className="animate-entrance relative mx-auto max-w-3xl text-center">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                isDark ? "border-[#2a2a2a] bg-[#171717] text-[#a1a1a1]" : "border-surface-border bg-muted-surface text-muted-foreground"
              }`}
            >
              <SparklesIcon className="h-3 w-3" />
              Now tracking documentation coverage
            </span>

            {/* Was `text-4xl sm:text-5xl font-extrabold`. The kit's headings
                are a weight lighter and a step smaller, with the tracking
                pulled in — extrabold at 48px reads as a poster, not a product.
                The gradient on "documentation" went with the brand; what is
                left of that span would be the same colour as the rest of the
                line, so it is underlined instead of recoloured. */}
            <h1 className={`mt-5 text-3xl font-semibold tracking-tight sm:text-4xl ${isDark ? "text-[#fafafa]" : "text-ink"}`}>
              One workspace for every product&apos;s{" "}
              <span className="decoration-muted-foreground/40 underline decoration-2 underline-offset-4">
                documentation
              </span>
              .
            </h1>

            <p className={`mx-auto mt-4 max-w-xl text-sm sm:text-base ${isDark ? "text-[#a1a1a1]" : "text-muted"}`}>
              Coc Docs Platform tracks what&apos;s written, what&apos;s missing, and who&apos;s behind it — across
              every product your team ships.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <Button asChild size="lg" className={isDark ? "bg-[#fafafa] text-[#171717] hover:bg-[#fafafa]/90" : undefined}>
                <Link href="/register">Get started free</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className={isDark ? "border-[#2a2a2a] bg-[#171717] text-[#fafafa] hover:bg-[#262626]" : undefined}
              >
                <Link href="/login">View live workspace</Link>
              </Button>
            </div>
          </div>

          <div className="animate-entrance relative mx-auto mt-14 max-w-4xl [animation-delay:120ms]">
            <DashboardPreview theme={theme} />
          </div>
        </section>

        <section className={`border-y px-6 py-10 ${isDark ? "border-[#2a2a2a] bg-[#0a0a0a]" : "border-border bg-white"}`}>
          <ScrollReveal>
            <p className={`text-center text-xs font-semibold uppercase tracking-wider ${isDark ? "text-[#a1a1a1]" : "text-muted"}`}>
              Trusted by teams at
            </p>
            <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {TRUSTED_BY.map((name) => (
                <span key={name} className={`text-base font-semibold ${isDark ? "text-[#a1a1a1]/40" : "text-muted/50"}`}>
                  {name}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section id="features" className="mx-auto max-w-5xl px-6 py-16">
          <ScrollReveal>
            <h2 className={`text-center text-2xl font-semibold tracking-tight ${isDark ? "text-[#fafafa]" : "text-ink"}`}>
              Every product, one coverage view.
            </h2>
            <p className={`mx-auto mt-3 max-w-xl text-center text-sm ${isDark ? "text-[#a1a1a1]" : "text-muted"}`}>
              Coc Docs Platform keeps every product&apos;s documentation in one place, so gaps get noticed before
              someone hits them.
            </p>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const tone = TONE_STYLES[feature.tone];
              return (
                <ScrollReveal key={feature.title} delayMs={i * 60}>
                  <div
                    className={`rounded-xl border p-5 transition-colors ${
                      isDark
                        ? "border-[#2a2a2a] bg-[#171717] hover:border-[#3a3a3a]"
                        : "border-surface-border bg-card hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone.bg} ${tone.fg}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className={`mt-3 text-sm font-semibold ${isDark ? "text-[#fafafa]" : "text-ink"}`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-1 text-sm ${isDark ? "text-[#a1a1a1]" : "text-muted"}`}>{feature.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        <section className="px-6 pb-20">
          <ScrollReveal className="relative mx-auto max-w-4xl overflow-hidden rounded-xl bg-[url('/background-banner.jpg')] bg-cover bg-center px-6 py-12 text-center sm:px-16">
            {/* Scrim: same "photo background needs a dark layer under white
                text" treatment as the Member home page's own CTA band. */}
            <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
            <h2 className="relative text-xl font-semibold tracking-tight text-white sm:text-2xl">
              Bring your docs into one workspace.
            </h2>
            <p className="relative mt-2.5 text-sm text-white/80">Start free — no credit card required.</p>
            <Button asChild size="lg" className="relative mt-6 bg-white text-[#171717] hover:bg-white/90">
              <Link href="/register">Get started free</Link>
            </Button>
          </ScrollReveal>
        </section>
      </main>

      <footer className={`border-t py-12 ${isDark ? "border-[#2a2a2a]" : "border-border"}`}>
        <ScrollReveal className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
              <img
                src={isDark ? "/logo-coc-docs-platform-dark-mode.png" : "/logo-coc-docs-platform.png"}
                alt="Coc Docs Platform"
                className="h-7 w-auto rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-4">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.heading}>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-[#fafafa]" : "text-ink"}`}
                  >
                    {column.heading}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {column.links.map((link) => {
                      const isAuthLink = link.label === "Create an account" || link.label === "Log in";
                      const linkClass = `text-sm ${isDark ? "text-[#a1a1a1] hover:text-[#fafafa]" : "text-muted hover:text-ink"}`;
                      return (
                        <li key={link.label}>
                          {isAuthLink ? (
                            <Link href={link.href} className={linkClass}>
                              {link.label}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAuthGate(link.label)}
                              className={linkClass}
                            >
                              {link.label}
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row ${
              isDark ? "border-[#2a2a2a]" : "border-border"
            }`}
          >
            <span className={`text-xs ${isDark ? "text-[#a1a1a1]" : "text-muted"}`}>© 2026 Coc Docs Platform</span>
            <div className={`flex items-center gap-5 text-xs font-medium ${isDark ? "text-[#a1a1a1]" : "text-muted"}`}>
              {FOOTER_LEGAL_LINKS.map((link) => (
                <a key={link.label} href={link.href} className={isDark ? "hover:text-[#fafafa]" : "hover:text-ink"}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </footer>

      {/* Auth-gate modal — shown when a visitor clicks a product nav item */}
      {authGate !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          onClick={() => setAuthGate(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
              <ShieldIcon className="h-7 w-7 text-foreground" />
            </div>
            <h2 className="text-xl font-bold text-ink">Sign in to access {authGate}</h2>
            <p className="mt-2 text-sm text-muted">
              {authGate} documentation is only available to signed-in members. Create a free account or log in to continue.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/register"
                className="flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
                onClick={() => setAuthGate(null)}
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center rounded-full border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-page"
                onClick={() => setAuthGate(null)}
              >
                Log in
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setAuthGate(null)}
              className="mt-4 w-full text-center text-xs text-muted hover:text-ink"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
