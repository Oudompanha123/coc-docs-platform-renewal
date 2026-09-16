"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardPreview } from "@/components/welcome/DashboardPreview";
import { GoogleIcon, ShieldIcon } from "@/components/auth/icons";
import {
  ArticleIcon,
  CoinsIcon,
  DocumentIcon,
  LayersIcon,
  MoonIcon,
  PlayIcon,
  PlugIcon,
  PulseIcon,
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
 */

const NAV_LINKS = [
  { label: "Features", href: "#features", icon: SparklesIcon },
  { label: "Integrations", href: "#", icon: PlugIcon },
  { label: "Pricing", href: "#", icon: CoinsIcon },
  { label: "Docs", href: "/docs", icon: DocumentIcon },
  { label: "Blog", href: "#", icon: ArticleIcon },
];

const FOOTER_LEGAL_LINKS = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Contact", href: "#" },
  { label: "Status", href: "#" },
];

/**
 * Real 3-column footer nav, built only from routes that actually exist in
 * this app (/login, /register, #features) — not jexmcp's Docs/Product/
 * Resources/Install pattern, which doesn't map onto a web app with no
 * install step and no separate public docs/release-notes pages. Most items
 * route through /login since those pages are part of the authenticated
 * admin app, not standalone public pages.
 */
const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Overview", href: "/login" },
      { label: "Jex3.0", href: "/login" },
      { label: "Jex2.0", href: "/login" },
      { label: "Coach", href: "/login" },
      { label: "IDEA", href: "/login" },
      { label: "Workflow", href: "/login" },
    ],
  },
  {
    heading: "Team",
    links: [
      { label: "Users & Roles", href: "/login" },
      { label: "Usage", href: "/login" },
    ],
  },
  {
    heading: "Get Started",
    links: [
      { label: "Create an account", href: "/register" },
      { label: "Log in", href: "/login" },
      { label: "Features", href: "#features" },
      { label: "Docs", href: "/docs" },
    ],
  },
];

const TRUSTED_BY = ["Nexora", "Vantix", "Brightloop", "Corevia", "Pathframe"];

type FeatureCard = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const FEATURES: FeatureCard[] = [
  {
    icon: SparklesIcon,
    title: "Collaborative Workspace",
    description:
      "Create, edit, and organize documents together in Doc Studio — one shared home for every workspace's content.",
  },
  {
    icon: LayersIcon,
    title: "Team Workspaces",
    description:
      "Give every team or project its own space to organize work — with access shared only with the people who need it.",
  },
  {
    icon: ShieldIcon,
    title: "Roles & Permissions",
    description:
      "Assign the right level of access to every teammate — Super Admin, Admin, or Viewer — so collaboration stays safe.",
  },
  {
    icon: PlugIcon,
    title: "Works With Your Tools",
    description: "Connect the tools your team already uses from the Integrations page, so nothing lives in a silo.",
  },
  {
    icon: PulseIcon,
    title: "Team Activity",
    description:
      "See who's working on what, track recent updates, and keep everyone aligned without needing a status meeting.",
  },
  {
    icon: GoogleIcon,
    title: "Google-Only Auth",
    description: "Your team signs in with the Google account they already use — no extra passwords for anyone to manage.",
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue text-white">
              <DocumentIcon className="h-4 w-4" />
            </div>
            <span className={`text-sm font-semibold ${isDark ? "text-[#f2effa]" : "text-ink"}`}>
              Coc Docs Platform
            </span>
          </div>

          <nav
            className={`hidden items-center gap-1 rounded-full p-1 text-sm font-medium md:flex ${
              isDark ? "bg-white/5 text-[#a79fc9]" : "bg-page text-muted"
            }`}
          >
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors ${
                    isDark ? "hover:bg-white/10 hover:text-[#f2effa]" : "hover:bg-white hover:text-ink hover:shadow-sm"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </a>
              );
            })}
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

          <div className="relative mx-auto max-w-3xl text-center">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isDark ? "bg-brand-purple/15 text-[#c4b5fd]" : "bg-brand-purple/10 text-brand-purple"
              }`}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Now with real-time collaboration
            </span>

            <h1 className={`mt-6 text-4xl font-extrabold leading-tight sm:text-5xl ${isDark ? "text-[#f2effa]" : "text-ink"}`}>
              Where your{" "}
              <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                whole team
              </span>{" "}
              actually gets work done.
            </h1>

            <p className={`mx-auto mt-5 max-w-xl text-base sm:text-lg ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
              Coc Docs Platform brings your team&apos;s projects, workspaces, and shared knowledge into one clean,
              fast place — built for teams who collaborate every single day.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
              >
                Get started free
              </Link>
              <a
                href="#"
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors ${
                  isDark
                    ? "border-[#332e4d] bg-[#1e1a30] text-[#f2effa] hover:bg-[#2a2545]"
                    : "border-border bg-white text-ink shadow-sm hover:bg-page"
                }`}
              >
                <PlayIcon className="h-4 w-4 text-brand-purple" />
                Watch demo
              </a>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-4xl">
            <DashboardPreview theme={theme} />
          </div>
        </section>

        <section className={`border-y px-6 py-10 ${isDark ? "border-[#332e4d] bg-[#0d0b1a]" : "border-border bg-white"}`}>
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
        </section>

        <section id="features" className="mx-auto max-w-5xl px-6 py-20">
          <h2 className={`text-center text-3xl font-bold ${isDark ? "text-[#f2effa]" : "text-ink"}`}>
            Built for how your team actually works together.
          </h2>
          <p className={`mx-auto mt-3 max-w-xl text-center text-base ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
            One shared space for projects, discussions, and knowledge — so no one&apos;s ever waiting on someone
            else&apos;s inbox.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`rounded-2xl border p-5 ${
                    isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white shadow-sm"
                  }`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/15 text-brand-purple">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className={`mt-3 text-base font-semibold ${isDark ? "text-[#f2effa]" : "text-ink"}`}>
                    {feature.title}
                  </h3>
                  <p className={`mt-1 text-sm ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-sidebar px-6 py-14 text-center sm:px-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-purple/25 blur-3xl"
            />
            <h2 className="relative text-2xl font-bold text-white sm:text-3xl">Ready to work better as a team?</h2>
            <p className="relative mt-3 text-sm text-sidebar-muted sm:text-base">
              Start free — no credit card required. Bring your team in minutes.
            </p>
            <Link
              href="/register"
              className="relative mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
            >
              Get started free →
            </Link>
          </div>
        </section>
      </main>

      <footer className={`border-t py-12 ${isDark ? "border-[#332e4d]" : "border-border"}`}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                  <DocumentIcon className="h-4 w-4" />
                </div>
                <span className={`text-sm font-semibold ${isDark ? "text-[#f2effa]" : "text-ink"}`}>
                  Coc Docs Platform
                </span>
              </div>
            </div>

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
        </div>
      </footer>
    </div>
  );
}
