import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import { fill, translations } from "@/lib/i18n/translations";
import { StoreApiError, type StoreApp } from "@/lib/store/store-api";
import StorePage from "./page";

// req: FR-I18N-001 — every piece of text on /store follows the page's language.

vi.mock("next/navigation", () => ({
  usePathname: () => "/store",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
}));

const { session } = vi.hoisted(() => ({
  session: { current: { status: "anonymous", user: null as null | { role: string } } },
}));
vi.mock("@/lib/auth/SessionProvider", () => ({
  useSession: () => ({ ...session.current, signOut: vi.fn(), isSigningOut: false }),
}));
vi.mock("@/lib/auth/useCurrentUser", () => ({
  useCurrentUser: () => ({ name: "Dana Lee", role: "admin", initials: "DL", avatarUrl: null }),
}));
vi.mock("@/lib/docs/useProductStats", () => ({
  useProductStats: () => ({ status: "ready", products: [], refetch: vi.fn() }),
}));
vi.mock("@/lib/notify/useNotifications", () => ({
  useNotifications: () => ({ items: [], unreadCount: 0, markRead: vi.fn(), markAllRead: vi.fn(), open: vi.fn(), refresh: vi.fn() }),
}));

const { api } = vi.hoisted(() => ({
  // fetchFeaturedAppId: the banner's pinned app (ADR-117) — none, so it shows the latest.
  api: { fetchStoreApps: vi.fn(), fetchAllStoreApps: vi.fn(), fetchFeaturedAppId: vi.fn(async () => null) },
}));
vi.mock("@/lib/store/store-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/store/store-api")>()),
  fetchStoreApps: api.fetchStoreApps,
  fetchAllStoreApps: api.fetchAllStoreApps,
  fetchFeaturedAppId: api.fetchFeaturedAppId,
}));

const APP: StoreApp = {
  id: "a1",
  number: 1,
  name: "Field Sales",
  description: "",
  category: "mobile",
  isPublic: true,
  logoUrl: null,
  bannerUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  builds: [],
};

function renderStore(locale: Locale) {
  const wrap = (children: ReactNode, l: Locale) => <LanguageProvider locale={l}>{children}</LanguageProvider>;
  const view = render(wrap(<StorePage />, locale));
  return { ...view, switchTo: (l: Locale) => view.rerender(wrap(<StorePage />, l)) };
}

/**
 * Every English Store string that should never show on a Khmer or Korean
 * page: the catalogue's English values, minus those a locale legitimately
 * keeps (a product name like "PC"). Placeholders are cut off so a filled
 * template still matches its fixed part.
 */
function englishOnlyStrings(locale: Locale): string[] {
  const sections = ["store", "storeForm", "authGate", "nav"] as const;
  const out: string[] = [];
  for (const section of sections) {
    const en = translations.en[section] as Record<string, string>;
    const other = translations[locale][section] as Record<string, string>;
    for (const [key, value] of Object.entries(en)) {
      if (other[key] === value) continue;
      const fixed = value.split(/\{[a-z]+\}/i).map((part) => part.trim()).sort((a, b) => b.length - a.length)[0];
      if (fixed && fixed.length > 3) out.push(fixed);
    }
  }
  return out;
}

/** Visible text plus what a screen reader or a field shows: aria-labels, placeholders, alt text. */
function everythingShown(): string {
  const attrs = Array.from(document.querySelectorAll("[aria-label],[placeholder],[alt],[title]")).flatMap((el) =>
    ["aria-label", "placeholder", "alt", "title"].map((a) => el.getAttribute(a) ?? ""),
  );
  // The product's name is a brand, written the same in every language.
  return [document.body.textContent ?? "", ...attrs].join("\n").replaceAll("Coc Docs Platform", "");
}

beforeEach(() => {
  session.current = { status: "anonymous", user: null };
  api.fetchStoreApps.mockResolvedValue([APP]);
  api.fetchAllStoreApps.mockResolvedValue([APP]);
  window.scrollTo = vi.fn();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("/store — translated in every locale", () => {
  it.each(LOCALES)("renders the header, hero, tabs, filters, search and cards in %s", async (locale) => {
    const t = translations[locale];
    renderStore(locale);

    expect(await screen.findByText("Field Sales")).toBeInTheDocument();
    // Navbar
    expect(screen.getAllByText(t.nav.home).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.nav.store).length).toBeGreaterThan(0);
    expect(screen.getByText(t.nav.logIn)).toBeInTheDocument();
    // The signed-out Store shares /welcome's navbar (PublicHeader), so its call to action is "Start free".
    expect(screen.getByText(t.welcome.startFree)).toBeInTheDocument();
    // Hero
    expect(screen.getByRole("heading", { level: 1, name: t.store.title })).toBeInTheDocument();
    expect(screen.getByText(t.store.badge)).toBeInTheDocument();
    expect(screen.getByText(t.store.subtitle)).toBeInTheDocument();
    // Tabs and filters
    expect(screen.getByRole("tablist", { name: t.store.deviceType })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: new RegExp(t.store.tabAll) })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: t.store.platformFilter })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t.store.anyPlatform })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(t.store.search)).toBeInTheDocument();
    // Card
    expect(screen.getByText(t.store.noBuilds)).toBeInTheDocument();
    expect(screen.getByText(t.store.noDescription)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: fill(t.store.actionsFor, { name: "Field Sales" }) })).toBeInTheDocument();
  });

  it.each(["km", "ko"] as const)("leaves no English Store text on the %s page", async (locale) => {
    renderStore(locale);
    await screen.findByText("Field Sales");
    const shown = everythingShown();
    for (const english of englishOnlyStrings(locale)) {
      expect(shown, `"${english}" is still in English`).not.toContain(english);
    }
  });

  it.each(LOCALES)("translates the empty and no-match states in %s", async (locale) => {
    const t = translations[locale];
    api.fetchStoreApps.mockResolvedValue([]);
    renderStore(locale);
    expect(await screen.findByText(t.store.emptyAll)).toBeInTheDocument();
    expect(screen.getByText(t.store.emptyUserHint)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: new RegExp(t.store.tabMobile) }));
    expect(screen.getByText(t.store.emptyMobile)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(t.store.search), "zzz");
    expect(screen.getByText(t.store.noMatch)).toBeInTheDocument();
    expect(screen.getByText(t.store.noMatchHint)).toBeInTheDocument();
  });

  it.each(LOCALES)("translates the loading and error states in %s", async (locale) => {
    const t = translations[locale];
    let fail: (err: unknown) => void = () => undefined;
    api.fetchStoreApps.mockReturnValue(new Promise((_, reject) => (fail = reject)));
    renderStore(locale);
    expect(screen.getByRole("status", { name: t.store.loading })).toBeInTheDocument();

    await act(async () => fail(new StoreApiError("Couldn't reach the server.", "network")));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(t.storeErrors.network);
    expect(within(alert).getByRole("button", { name: t.store.tryAgain })).toBeInTheDocument();
  });

  it("uses the page's own fallback when the backend sent no detail", async () => {
    api.fetchStoreApps.mockRejectedValue(new StoreApiError("Couldn't load the Store.", "fallback"));
    renderStore("km");
    expect(await screen.findByRole("alert")).toHaveTextContent(translations.km.store.loadError);
  });

  it.each(LOCALES)("translates the admin's Add app dialog in %s", async (locale) => {
    const t = translations[locale];
    session.current = { status: "authenticated", user: { role: "admin" } };
    renderStore(locale);
    await screen.findByText("Field Sales");
    // Signed-in header
    expect(screen.getByRole("button", { name: t.nav.toggleDarkMode })).toBeInTheDocument();
    expect(screen.getByText(t.store.public)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: t.store.addApp }));
    const dialog = screen.getByRole("dialog");
    for (const text of [t.storeForm.addTitle, t.storeForm.addSubtitle, t.storeForm.name, t.storeForm.platform, t.storeForm.mobileHint, t.storeForm.pcHint, t.storeForm.publicHint, t.storeForm.iconUpload, t.storeForm.iconHint]) {
      expect(within(dialog).getByText(text)).toBeInTheDocument();
    }
    expect(within(dialog).getByPlaceholderText(t.storeForm.namePlaceholder)).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText(t.storeForm.descriptionPlaceholder)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: t.storeForm.cancel })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: t.storeForm.close })).toBeInTheDocument();

    // A name that is taken: the duplicate notice is translated too.
    await userEvent.type(within(dialog).getByPlaceholderText(t.storeForm.namePlaceholder), "field sales");
    expect(within(dialog).getAllByText(fill(t.storeForm.alreadyOnStore, { name: "Field Sales" })).length).toBeGreaterThan(0);
    expect(within(dialog).getByText(t.storeForm.nextVersionHint)).toBeInTheDocument();
  });
});

describe("/store — switching language", () => {
  it("updates the whole page at once when the locale changes", async () => {
    const { switchTo } = renderStore("en");
    await screen.findByText("Field Sales");

    for (const locale of ["km", "ko", "en"] as const) {
      const t = translations[locale];
      switchTo(locale);
      expect(screen.getByRole("heading", { level: 1, name: t.store.title })).toBeInTheDocument();
      expect(screen.getByText(t.nav.logIn)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: t.store.anyPlatform })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(t.store.search)).toBeInTheDocument();
      expect(screen.getByText(t.store.noDescription)).toBeInTheDocument();
    }
  });

  it("re-renders an error already on screen in the new language", async () => {
    api.fetchStoreApps.mockRejectedValue(new StoreApiError("x", "network"));
    const { switchTo } = renderStore("en");
    expect(await screen.findByRole("alert")).toHaveTextContent(translations.en.storeErrors.network);
    switchTo("ko");
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(translations.ko.storeErrors.network));
  });

  it("the navbar's selector opens /store at the chosen language's address and remembers it", async () => {
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...original, pathname: "/store", search: "", hash: "", assign },
    });
    try {
      renderStore("en");
      await screen.findByText("Field Sales");
      await userEvent.click(screen.getByRole("button", { name: /Language: English/ }));
      await userEvent.click(await screen.findByText("ភាសាខ្មែរ"));
      expect(assign).toHaveBeenCalledWith("/km/store");
      expect(document.cookie).toContain("coc-docs-locale=km");
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });
});
