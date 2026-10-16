"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardPreview } from "@/components/welcome/DashboardPreview";
import { AuthGateDialog } from "@/components/welcome/AuthGateDialog";
import { PublicHeader } from "@/components/welcome/PublicHeader";
import { ThemedLogo } from "@/components/welcome/ThemedLogo";
import { ScrollReveal } from "@/components/welcome/ScrollReveal";
import { GoogleIcon, ShieldIcon } from "@/components/auth/icons";
import { TONE_STYLES } from "@/components/dashboard/tone";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Link } from "@/lib/i18n/navigation";
import { renderBold } from "@/lib/i18n/rich";
import type { Translations } from "@/lib/i18n/translations";
import type { Tone } from "@/lib/mock/overview";
import { applyTheme, getResolvedTheme } from "@/lib/theme";
import {
  BarChartIcon,
  FolderIcon,
  LayersIcon,
  PlugIcon,
  SparklesIcon,
} from "@/components/layout/icons";

/**
 * Public landing page. Its light/dark toggle saves the same preference as
 * the rest of the app (lib/theme.ts), so the choice survives a refresh and
 * matches the Store and, after sign-in, the app (product owner, 2026-10-16;
 * it was page-local before, and a refresh undid it). Colours are the shadcn token
 * utilities (bg-background, bg-card, text-muted-foreground,
 * border-surface-border, ...), never literal hex: when the toggle is on, the
 * page root carries `.landing-dark` (globals.css), which redefines those
 * tokens to shadcn's neutral dark values for this subtree only. One class per
 * element therefore serves both themes — no per-element `isDark ? hex : class`
 * pair that can drift out of step with its other half (ADR-104).
 *
 * `isDark` itself survives only where the theme genuinely changes *what* is
 * rendered rather than its colour: the logo asset, the toggle's icon and
 * pressed state, and the <html> scrollbar marker.
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
 *  copy of the product list. Its label is `t.nav.home`. */
const HOME_HREF = "/login";

type WelcomeKey = keyof Translations["welcome"];

const FOOTER_LEGAL_LINKS: { key: WelcomeKey; href: string }[] = [
  { key: "privacy", href: "/privacy" },
  { key: "contact", href: "#" },
  { key: "status", href: "#" },
];

/**
 * A footer link's text: a catalogue key, or — for a product — its name,
 * which reads the same in every language. `auth` marks the two links that
 * go straight to sign-up / sign-in; every other one opens the sign-in prompt.
 */
type FooterLink = { href: string; auth?: boolean } & ({ key: WelcomeKey | "home" | "settings" | "logIn" } | { name: string });

/**
 * Real 4-column footer nav, built only from routes that actually exist in
 * this app (/login, /register, /docs) — not jexmcp's Docs/Product/Resources/
 * Install pattern, which doesn't map onto a web app with no install step and
 * no separate public docs/release-notes pages. Most items route through
 * /login since those pages are part of the authenticated admin app, not
 * standalone public pages.
 */
const FOOTER_COLUMNS: { heading: WelcomeKey; links: FooterLink[] }[] = [
  {
    heading: "footerProduct",
    links: [
      { key: "home", href: "/login" },
      { name: "Jex3.0", href: "/login" },
      { name: "Jex2.0", href: "/login" },
      { name: "Coach", href: "/login" },
    ],
  },
  {
    heading: "footerTeam",
    links: [
      { name: "Team", href: "/login" },
      { name: "Usage", href: "/login" },
      { key: "usersRoles", href: "/login" },
    ],
  },
  {
    heading: "footerAdministration",
    links: [
      { key: "settings", href: "/login" },
      { key: "systemAdmin", href: "/login" },
    ],
  },
  {
    heading: "footerGetStarted",
    links: [
      { key: "createAccount", href: "/register", auth: true },
      { key: "logIn", href: "/login", auth: true },
      { key: "docs", href: "/docs" },
    ],
  },
];

function footerLinkText(link: FooterLink, t: Translations): string {
  if ("name" in link) return link.name;
  if (link.key === "home" || link.key === "settings" || link.key === "logIn") return t.nav[link.key];
  return t.welcome[link.key];
}

const TRUSTED_BY = ["Nexora", "Vantix", "Brightloop", "Corevia", "Pathframe"];

/** Title and description are catalogue keys; a description's `**bold**` runs render as <strong>. */
type FeatureCard = {
  icon: React.ComponentType<{ className?: string }>;
  title: WelcomeKey;
  description: WelcomeKey;
  tone: Tone;
};

const FEATURES: FeatureCard[] = [
  { icon: LayersIcon, title: "perProductTitle", description: "perProductBody", tone: "purple" },
  { icon: FolderIcon, title: "coverageTitle", description: "coverageBody", tone: "green" },
  { icon: ShieldIcon, title: "rolesTitle", description: "rolesBody", tone: "orange" },
  { icon: BarChartIcon, title: "reportsTitle", description: "reportsBody", tone: "pink" },
  { icon: PlugIcon, title: "integrationsTitle", description: "integrationsBody", tone: "purple" },
  { icon: GoogleIcon, title: "googleTitle", description: "googleBody", tone: "green" },
];

export default function WelcomePage() {
  const { t } = useLanguage();
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

  // Start in the theme the visitor actually has — their stored choice, or the
  // OS on "auto". Starting light regardless left a dark-OS visitor with a
  // page half in each.
  useEffect(() => {
    setTheme(getResolvedTheme());
  }, []);

  // Saved, not just shown: a refresh used to put a dark-OS visitor straight
  // back in dark after they chose light.
  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    // `landing-dark` re-points every shadcn token under this root at its dark
    // value (globals.css), so each element below carries one token class that
    // is right in both themes. `landing-auto` takes the dark or light values
    // from <html data-theme>, which the root layout's boot script writes
    // before first paint — so the page is never drawn a frame in the wrong
    // theme (it was, coming from the Store in dark mode, while React state
    // caught up).
    <div className="landing-auto min-h-screen bg-background text-foreground">
      <PublicHeader
        active="home"
        homeHref={HOME_HREF}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onRequireAuth={setAuthGate}
      />

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pt-20">
          {/* Decorative glow. A few percent of the foreground colour, so it is
              a faint grey haze on white and a faint lift on near-black — never
              a bright blob. (It was `bg-secondary` / `bg-primary/10`, which
              under the dark tokens rendered as a large white smear.) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-foreground/[0.04] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-foreground/[0.03] blur-3xl"
          />

          <div className="animate-hero-entrance relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-surface-border bg-muted-surface px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              <SparklesIcon className="h-3 w-3" />
              {t.welcome.badge}
            </span>

            {/* Was `text-4xl sm:text-5xl font-extrabold`. The kit's headings
                are a weight lighter and a step smaller, with the tracking
                pulled in — extrabold at 48px reads as a poster, not a product.
                The gradient on "documentation" went with the brand; what is
                left of that span would be the same colour as the rest of the
                line, so it is underlined instead of recoloured. */}
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t.welcome.heroBefore}
              <span className="decoration-muted-foreground/40 underline decoration-2 underline-offset-4">
                {t.welcome.heroHighlight}
              </span>
              {t.welcome.heroAfter}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">{t.welcome.heroBody}</p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">{t.welcome.getStartedFree}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">{t.welcome.viewWorkspace}</Link>
              </Button>
            </div>
          </div>

          <div className="animate-hero-entrance relative mx-auto mt-12 max-w-4xl [animation-delay:40ms]">
            <DashboardPreview />
          </div>
        </section>

        <section className="border-y border-surface-border bg-background px-6 py-10">
          <ScrollReveal>
            <p className="text-center text-xs font-medium text-muted-foreground">
              {t.welcome.trustedBy}
            </p>
            <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {TRUSTED_BY.map((name) => (
                <span key={name} className="text-base font-semibold text-muted-foreground/50">
                  {name}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </section>

        <section id="features" className="mx-auto max-w-5xl px-6 py-16">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
              {t.welcome.featuresTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">{t.welcome.featuresBody}</p>
          </ScrollReveal>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const tone = TONE_STYLES[feature.tone];
              return (
                <ScrollReveal key={feature.title} delayMs={i * 60} className="h-full">
                  <Card className="h-full gap-0 py-5 shadow-none transition-colors hover:border-muted-foreground/30">
                    <CardHeader className="gap-0 px-5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone.bg} ${tone.fg}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="mt-3 text-sm">
                        <h3>{t.welcome[feature.title]}</h3>
                      </CardTitle>
                      <CardDescription className="mt-1">{renderBold(t.welcome[feature.description])}</CardDescription>
                    </CardHeader>
                  </Card>
                </ScrollReveal>
              );
            })}
          </div>
        </section>

        <section className="px-6 pb-20">
          <ScrollReveal className="relative mx-auto max-w-4xl overflow-hidden rounded-xl bg-[url('/background-banner.jpg')] bg-cover bg-center px-6 py-12 text-center sm:px-16">
            {/* Scrim: same "photo background needs a dark layer under white
                text" treatment as the Member home page's own CTA band. The
                band is a dark photo in both themes, so its colours are fixed
                rather than tokens. */}
            <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
            <h2 className="relative text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {t.welcome.ctaTitle}
            </h2>
            <p className="relative mt-2 text-sm text-white/80">{t.welcome.ctaBody}</p>
            <Button asChild size="lg" className="relative mt-6 bg-white text-neutral-900 hover:bg-white/90">
              <Link href="/register">{t.welcome.getStartedFree}</Link>
            </Button>
          </ScrollReveal>
        </section>
      </main>

      <footer className="border-t border-surface-border py-12">
        <ScrollReveal className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <ThemedLogo className="h-7 w-auto rounded-md" />
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-4">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.heading}>
                  <p className="text-xs font-medium text-foreground">{t.welcome[column.heading]}</p>
                  <ul className="mt-3 space-y-2">
                    {column.links.map((link) => {
                      const label = footerLinkText(link, t);
                      const linkClass = "text-sm text-muted-foreground transition-colors hover:text-foreground";
                      return (
                        <li key={"name" in link ? link.name : link.key}>
                          {link.auth ? (
                            <Link href={link.href} className={linkClass}>
                              {label}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAuthGate(label)}
                              className={linkClass}
                            >
                              {label}
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

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-surface-border pt-6 sm:flex-row">
            <span className="text-xs text-muted-foreground">{t.footer.copyright}</span>
            <div className="flex items-center gap-5 text-xs font-medium text-muted-foreground">
              {FOOTER_LEGAL_LINKS.map((link) => (
                <a key={link.key} href={link.href} className="transition-colors hover:text-foreground">
                  {t.welcome[link.key]}
                </a>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </footer>

      {/* Auth gate — shown when a visitor clicks a product nav item. */}
      <AuthGateDialog product={authGate} onClose={() => setAuthGate(null)} />
    </div>
  );
}
