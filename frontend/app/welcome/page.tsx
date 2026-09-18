"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardPreview } from "@/components/welcome/DashboardPreview";
import { NavDropdown } from "@/components/welcome/NavDropdown";
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
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
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
  description: string;
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
    description:
      "See what's written and what's missing across Jex3.0, Jex2.0, Coach, Team, and Usage from one screen.",
    tone: "green",
  },
  {
    icon: ShieldIcon,
    title: "Roles & permissions",
    description: "Super Admin, Admin, or Viewer — control who can edit and who can only read.",
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
    description: "Sign in with the Google account your team already has — no extra passwords to manage.",
    tone: "green",
  },
];

export default function WelcomePage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const isDark = theme === "dark";

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
    <div className={isDark ? "min-h-screen bg-[#0d0b1a]" : "min-h-screen bg-white"}>
      <header
        className={`sticky top-0 z-30 border-b shadow-sm transition-colors duration-200 ${
          isDark ? "bg-[#0d0b1a]" : "bg-white"
        } ${scrolled ? (isDark ? "border-[#332e4d]" : "border-border") : "border-transparent"}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
            <img
              src={isDark ? "/logo-coc-docs-platform-dark-mode.png" : "/logo-coc-docs-platform.png"}
              alt="Coc Docs Platform"
              className="h-[55px] w-auto rounded-lg"
            />
          </div>

          <nav className={`hidden items-center gap-7 text-[18px] font-medium md:flex ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
            <a
              href={HOME_LINK.href}
              className={`flex h-[72px] items-center border-b-2 border-transparent transition-all hover:border-brand-purple hover:font-bold ${
                isDark ? "hover:text-[#f2effa]" : "hover:text-ink"
              }`}
            >
              {HOME_LINK.label}
            </a>
            {FALLBACK_NAV.map((product) => (
              <NavDropdown key={product.key} product={product} isDark={isDark} />
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle dark mode"
              aria-pressed={isDark}
              className={`rounded-xl p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${
                isDark ? "bg-white/10 text-[#f2effa] hover:bg-white/20" : "bg-gray-100 text-ink/70 hover:bg-brand-purple/20"
              }`}
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <Link
              href="/login"
              className={`hidden text-sm font-semibold hover:text-brand-purple sm:inline ${isDark ? "text-[#f2effa]" : "text-ink"}`}
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
            >
              Start free →
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-24">
          {isDark && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-purple/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-blue/10 blur-3xl"
              />
            </>
          )}

          <div className="animate-entrance relative mx-auto max-w-3xl text-center">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isDark ? "bg-brand-purple/15 text-[#c4b5fd]" : "bg-brand-purple/10 text-brand-purple"
              }`}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Now tracking documentation coverage
            </span>

            <h1 className={`mt-6 text-4xl font-extrabold leading-tight sm:text-5xl ${isDark ? "text-[#f2effa]" : "text-ink"}`}>
              One workspace for every product&apos;s{" "}
              <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                documentation
              </span>
              .
            </h1>

            <p className={`mx-auto mt-5 max-w-xl text-base sm:text-lg ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
              Coc Docs Platform tracks what&apos;s written, what&apos;s missing, and who&apos;s behind it — across
              every product your team ships.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
              >
                Get started free
              </Link>
              <Link
                href="/login"
                className={`inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold transition-all duration-150 active:scale-[0.97] ${
                  isDark
                    ? "border-[#332e4d] bg-[#1e1a30] text-[#f2effa] hover:bg-[#2a2545]"
                    : "border-border bg-white text-ink shadow-sm hover:bg-page"
                }`}
              >
                View live workspace
              </Link>
            </div>
          </div>

          <div className="animate-entrance relative mx-auto mt-16 max-w-4xl [animation-delay:120ms]">
            <DashboardPreview theme={theme} />
          </div>
        </section>

        <section className={`border-y px-6 py-10 ${isDark ? "border-[#332e4d] bg-[#0d0b1a]" : "border-border bg-white"}`}>
          <ScrollReveal>
            <p className={`text-center text-xs font-semibold uppercase tracking-wider ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
              Trusted by teams at
            </p>
            <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {TRUSTED_BY.map((name) => (
                <span key={name} className={`text-lg font-bold ${isDark ? "text-[#a79fc9]/40" : "text-muted/50"}`}>
                  {name}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section id="features" className="mx-auto max-w-5xl px-6 py-20">
          <ScrollReveal>
            <h2 className={`text-center text-3xl font-bold ${isDark ? "text-[#f2effa]" : "text-ink"}`}>
              Every product, one coverage view.
            </h2>
            <p className={`mx-auto mt-3 max-w-xl text-center text-base ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
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
                    className={`rounded-[10px] border p-5 transition-all duration-200 hover:-translate-y-1 ${
                      isDark
                        ? "border-[#332e4d] bg-[#1e1a30] hover:border-brand-purple/40"
                        : "border-border bg-white shadow-sm hover:shadow-md"
                    }`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone.bg} ${tone.fg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className={`mt-3 text-base font-semibold ${isDark ? "text-[#f2effa]" : "text-ink"}`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-1 text-sm ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{feature.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        <section className="px-6 pb-20">
          <ScrollReveal className="relative mx-auto max-w-4xl overflow-hidden rounded-[10px] bg-[url('/background-banner.jpg')] bg-cover bg-center px-6 py-14 text-center sm:px-16">
            {/* Scrim: same "photo background needs a dark layer under white
                text" treatment as the Member home page's own CTA band. */}
            <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
            <h2 className="relative text-2xl font-bold text-white sm:text-3xl">Bring your docs into one workspace.</h2>
            <p className="relative mt-3 text-sm text-white sm:text-base">Start free — no credit card required.</p>
            <Link
              href="/register"
              className="relative mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
            >
              Get started free
            </Link>
          </ScrollReveal>
        </section>
      </main>

      <footer className={`border-t py-12 ${isDark ? "border-[#332e4d]" : "border-border"}`}>
        <ScrollReveal className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
              <img
                src={isDark ? "/logo-coc-docs-platform-dark-mode.png" : "/logo-coc-docs-platform.png"}
                alt="Coc Docs Platform"
                className="h-[55px] w-auto rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-4">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.heading}>
                  <p
                    className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-[#f2effa]" : "text-ink"}`}
                  >
                    {column.heading}
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className={`text-sm ${
                            isDark ? "text-[#a79fc9] hover:text-[#f2effa]" : "text-muted hover:text-ink"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row ${
              isDark ? "border-[#332e4d]" : "border-border"
            }`}
          >
            <span className={`text-xs ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>© 2026 Coc Docs Platform</span>
            <div className={`flex items-center gap-5 text-xs font-medium ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
              {FOOTER_LEGAL_LINKS.map((link) => (
                <a key={link.label} href={link.href} className={isDark ? "hover:text-[#f2effa]" : "hover:text-ink"}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </footer>
    </div>
  );
}
