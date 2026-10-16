"use client";

// req: UI-LANG-01, FR-I18N-001
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import { type Translations, translations } from "./translations";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HTML_LANG, localizePath, stripLocale, type Locale } from "./config";

interface LanguageContextValue {
  /** The page's locale — from its URL prefix, never from storage (ADR-116). */
  language: Locale;
  t: Translations;
  /** Moves to the same page in `lang`, e.g. `/home` → `/km/home`. */
  setLanguage: (lang: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LOCALE,
  t: translations[DEFAULT_LOCALE],
  setLanguage: () => undefined,
});

/**
 * The URL is the source of truth for the language (ADR-116): the root layout
 * reads it from the request and passes it in here. The old localStorage key
 * (`coc-docs-lang`) is no longer read — it could only ever disagree with the
 * address bar.
 *
 * Switching is a full page load, not a client navigation. The root layout is
 * what reads the locale, and Next keeps it mounted across client navigations,
 * so a soft switch would leave `language` and `<html lang>` on the old one.
 * Changing language is rare enough that the reload costs nothing noticeable.
 */
export function LanguageProvider({ children, locale = DEFAULT_LOCALE }: { children: ReactNode; locale?: Locale }) {
  // Kept in step for the rare case the layout's value and the document's
  // disagree (a cached document); the server already rendered the right one.
  useEffect(() => {
    document.documentElement.lang = LOCALE_HTML_LANG[locale];
  }, [locale]);

  const setLanguage = useCallback(
    (lang: Locale) => {
      if (lang === locale) return;
      document.cookie = `${LOCALE_COOKIE}=${lang}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      const { pathname, search, hash } = window.location;
      window.location.assign(localizePath(stripLocale(pathname), lang) + search + hash);
    },
    [locale],
  );

  const value = useMemo(() => ({ language: locale, t: translations[locale], setLanguage }), [locale, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
