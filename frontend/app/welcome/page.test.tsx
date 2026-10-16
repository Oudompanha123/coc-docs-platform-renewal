import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FALLBACK_NAV } from "@/lib/docs/nav-api";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { fill, translations } from "@/lib/i18n/translations";
import WelcomePage from "./page";

// req: FR-I18N-001 — every piece of text on /welcome follows the page's language.

vi.mock("next/navigation", () => ({
  usePathname: () => "/welcome",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

/** The preview's sidebar: Home, the six products, then the five Administration items. */
const PREVIEW_STEPS = 12;
const DWELL_MS = 2600;

function renderWelcome(locale: Locale) {
  const wrap = (children: ReactNode, l: Locale) => <LanguageProvider locale={l}>{children}</LanguageProvider>;
  const view = render(wrap(<WelcomePage />, locale));
  return { ...view, switchTo: (l: Locale) => view.rerender(wrap(<WelcomePage />, l)) };
}

/** Visible text plus aria-labels, placeholders, alt text and titles. */
function everythingShown(): string {
  const attrs = Array.from(document.querySelectorAll("[aria-label],[placeholder],[alt],[title]")).flatMap((el) =>
    ["aria-label", "placeholder", "alt", "title"].map((a) => el.getAttribute(a) ?? ""),
  );
  return [document.body.textContent ?? "", ...attrs].join("\n");
}

/**
 * Names that read the same in every language — the brand, products, the
 * sample people, emails and companies, and the products' page titles (which
 * come from the docs themselves). Cut out of the page before looking for
 * English, longest first so "Admin User" goes before anything inside it.
 */
const NAMES = [
  "Coc Docs Platform",
  "Neo Chanthy",
  "Admin User",
  "Sam Reader",
  "neo.chanthy@cocdocs.example",
  "admin@cocdocs.example",
  "teammate@cocdocs.example",
  "sam@cocdocs.example",
  ...["Nexora", "Vantix", "Brightloop", "Corevia", "Pathframe"],
  ...FALLBACK_NAV.flatMap((product) => [product.label, ...product.items.map((item) => item.label)]),
].sort((a, b) => b.length - a.length);

function withoutNames(text: string): string {
  return NAMES.reduce((s, name) => s.replaceAll(name, ""), text);
}

/** Every English catalogue string the page could show, that the locale says differently. */
function englishOnlyStrings(locale: Locale): string[] {
  const sections = ["welcome", "welcomePreview", "nav", "authGate", "products", "footer"] as const;
  const out: string[] = [];
  for (const section of sections) {
    const en = translations.en[section] as Record<string, string>;
    const other = translations[locale][section] as Record<string, string>;
    for (const [key, value] of Object.entries(en)) {
      if (other[key] === value || NAMES.includes(value)) continue;
      const parts = value.split(/\{[a-z]+\}|\*\*/i).map((part) => part.trim());
      const fixed = parts.sort((a, b) => b.length - a.length)[0];
      if (fixed && fixed.length > 3) out.push(fixed);
    }
  }
  return out;
}

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("/welcome — translated in every locale", () => {
  it.each(LOCALES)("renders the navbar, hero, features, call to action and footer in %s", (locale) => {
    const t = translations[locale];
    renderWelcome(locale);

    // Navbar
    expect(screen.getAllByText(t.nav.home).length).toBeGreaterThan(0);
    expect(screen.getByText(t.nav.store)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.nav.products })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.nav.toggleDarkMode })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.welcome.startFree })).toBeInTheDocument();
    // Hero
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(t.welcome.heroBefore.trim());
    expect(within(h1).getByText(t.welcome.heroHighlight)).toBeInTheDocument();
    expect(screen.getByText(t.welcome.badge)).toBeInTheDocument();
    expect(screen.getByText(t.welcome.heroBody)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: t.welcome.viewWorkspace })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: t.welcome.getStartedFree })).toHaveLength(2);
    // Features
    expect(screen.getByText(t.welcome.trustedBy)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: t.welcome.featuresTitle })).toBeInTheDocument();
    for (const key of ["perProductTitle", "coverageTitle", "rolesTitle", "reportsTitle", "integrationsTitle", "googleTitle"] as const) {
      expect(screen.getByRole("heading", { level: 3, name: t.welcome[key] })).toBeInTheDocument();
    }
    // Call to action
    expect(screen.getByRole("heading", { name: t.welcome.ctaTitle })).toBeInTheDocument();
    expect(screen.getByText(t.welcome.ctaBody)).toBeInTheDocument();
    // Footer
    const footer = screen.getByRole("contentinfo");
    for (const key of ["footerProduct", "footerAdministration", "footerGetStarted", "usersRoles", "systemAdmin", "createAccount", "docs", "privacy", "contact", "status"] as const) {
      expect(within(footer).getByText(t.welcome[key])).toBeInTheDocument();
    }
    expect(within(footer).getByText(t.nav.settings)).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: t.nav.logIn })).toBeInTheDocument();
    expect(within(footer).getByText(t.footer.copyright)).toBeInTheDocument();
  });

  it.each(LOCALES)("keeps the bold names inside the translated feature text in %s", (locale) => {
    renderWelcome(locale);
    const card = screen.getByRole("heading", { level: 3, name: translations[locale].welcome.coverageTitle }).closest("[data-slot=card]")!;
    const bold = Array.from(card.querySelectorAll("strong")).map((el) => el.textContent);
    expect(bold).toEqual(["Jex3.0", "Jex2.0", "Coach", "Team", "Usage"]);
    expect(card.textContent).not.toContain("**");
  });

  it.each(LOCALES)("translates every step of the dashboard preview in %s", (locale) => {
    vi.useFakeTimers();
    const p = translations[locale].welcomePreview;
    renderWelcome(locale);
    const seen = new Set<string>();
    for (let step = 0; step < PREVIEW_STEPS; step++) {
      seen.add(everythingShown());
      act(() => vi.advanceTimersByTime(DWELL_MS));
    }
    const all = [...seen].join("\n");
    for (const text of [
      p.subtitleOverview,
      fill(p.notWrittenCount, { n: 3 }),
      p.allWritten,
      p.newDocument,
      p.recentDocuments,
      p.recentActivity,
      p.signedIn,
      fill(p.minutesAgo, { n: 4 }),
      fill(p.subtitleProduct, { product: "Jex3.0" }),
      fill(p.productItems, { product: "Coach" }),
      p.notWritten,
      fill(p.noContentBody, { product: "ssss" }),
      p.administration,
      p.usersRoles,
      p.subtitleUsers,
      p.searchUsers,
      p.statusPending,
      p.claudeCodeUsage,
      p.dailyTokens,
      p.thu,
      fill(p.teammate, { id: "B" }),
      fill(p.countOf, { n: 5, total: 5 }),
      fill(p.tokensRole, { tokens: "480K", role: p.roleMember }),
      fill(p.budgetNote, { tokens: "1.2M" }),
    ]) {
      expect(all, text).toContain(text);
    }
    // Sample names and numbers are left as they are.
    for (const sample of ["Neo Chanthy", "admin@cocdocs.example", "8 / 11", "$29.47", "360.6K"]) {
      expect(all).toContain(sample);
    }
  });

  it.each(["km", "ko"] as const)("leaves no English UI text anywhere on the %s page, preview steps included", (locale) => {
    vi.useFakeTimers();
    renderWelcome(locale);
    let shown = "";
    for (let step = 0; step < PREVIEW_STEPS; step++) {
      shown += withoutNames(everythingShown());
      act(() => vi.advanceTimersByTime(DWELL_MS));
    }
    for (const english of englishOnlyStrings(locale)) {
      expect(shown, `"${english}" is still in English`).not.toContain(english);
    }
  });

  it.each(LOCALES)("opens the sign-in prompt from a footer link with its translated name in %s", async (locale) => {
    const t = translations[locale];
    renderWelcome(locale);
    await userEvent.click(within(screen.getByRole("contentinfo")).getByRole("button", { name: t.welcome.systemAdmin }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(fill(t.authGate.title, { product: t.welcome.systemAdmin }));
    expect(within(dialog).getByRole("button", { name: t.authGate.maybeLater })).toBeInTheDocument();
  });
});

describe("/welcome — switching language", () => {
  it("updates the visible text, not just the address", () => {
    const { switchTo } = renderWelcome("en");
    for (const locale of ["km", "ko", "en"] as const) {
      const t = translations[locale];
      switchTo(locale);
      expect(screen.getByText(t.welcome.badge)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: t.welcome.featuresTitle })).toBeInTheDocument();
      expect(screen.getByText(t.welcome.ctaBody)).toBeInTheDocument();
      expect(screen.getByText(t.welcomePreview.subtitleOverview)).toBeInTheDocument();
      expect(within(screen.getByRole("contentinfo")).getByText(t.welcome.footerProduct)).toBeInTheDocument();
    }
  });

  it("the navbar's selector opens /welcome at the chosen language's address", async () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, pathname: "/welcome", search: "", hash: "", assign },
    });
    try {
      renderWelcome("en");
      await userEvent.click(screen.getByRole("button", { name: /Language: English/ }));
      await userEvent.click(await screen.findByText("한국어"));
      expect(assign).toHaveBeenCalledWith("/kr/welcome");
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });
});
