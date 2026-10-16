/**
 * Locales and how they appear in the URL (ADR-116).
 *
 * English is the default and lives at the unprefixed URL (`/home`); `/en/home`
 * is accepted and redirects there. Khmer is `/km/...` and Korean `/kr/...`.
 *
 * Korean's URL prefix (`kr`, what the product owner asked for) differs from
 * its locale code (`ko`, ISO 639-1). The code is what the rest of the system
 * already speaks — the `locale` enum on `page_version` (V1), `translations.ts`,
 * `<html lang>` — so only the URL says `kr`, and this file is the one place
 * that translates between them.
 *
 * Pure functions, no React and no Next imports: `middleware.ts` runs on the
 * edge runtime and imports this directly.
 *
 * // req: FR-I18N-001
 */

export const LOCALES = ["en", "km", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** The first path segment for each locale; the default has none. */
export const LOCALE_URL_PREFIX: Record<Locale, string> = {
  en: "",
  km: "km",
  ko: "kr",
};

/** Every first segment that names a locale, including the default's `/en`. */
const PREFIX_TO_LOCALE: Record<string, Locale> = { en: "en", km: "km", kr: "ko" };

/** Reserved: no product key or top-level route may use one of these. */
export const LOCALE_PREFIXES: readonly string[] = Object.keys(PREFIX_TO_LOCALE);

/** Remembers the reader's last choice so an unprefixed link keeps it. */
export const LOCALE_COOKIE = "coc-docs-locale";

/** Set by `middleware.ts` on the request so the root layout can read it. */
export const LOCALE_HEADER = "x-coc-locale";

/** `<html lang>` value per locale. */
export const LOCALE_HTML_LANG: Record<Locale, string> = { en: "en", km: "km", ko: "ko" };

/** How each locale names itself in the switcher. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  km: "ភាសាខ្មែរ",
  ko: "한국어",
};

/** Short code shown on the switcher's trigger. */
export const LOCALE_SHORT_LABELS: Record<Locale, string> = { en: "EN", km: "KM", ko: "KR" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Splits a leading locale segment off a pathname. `prefix` is the segment as
 * written (`"en"`, `"km"`, `"kr"`) or `null` when there is none; `pathname`
 * is what is left, always starting with `/`.
 */
export function splitLocale(pathname: string): { locale: Locale | null; prefix: string | null; pathname: string } {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname);
  const first = match?.[1];
  if (first && first in PREFIX_TO_LOCALE) {
    return { locale: PREFIX_TO_LOCALE[first]!, prefix: first, pathname: match?.[2] || "/" };
  }
  return { locale: null, prefix: null, pathname: pathname || "/" };
}

/** `pathname` without any locale segment. */
export function stripLocale(pathname: string): string {
  return splitLocale(pathname).pathname;
}

/**
 * The address of `pathname` in `locale`. Anything already carrying a locale
 * segment is re-pointed, not double-prefixed; anything that is not an
 * in-app absolute path (`https://…`, `mailto:`, `#top`, `?q=`) is returned
 * unchanged.
 */
export function localizePath(pathname: string, locale: Locale): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return pathname;
  const [path, rest = ""] = splitOnce(pathname);
  const bare = stripLocale(path);
  const prefix = LOCALE_URL_PREFIX[locale];
  if (!prefix) return bare + rest;
  return (bare === "/" ? `/${prefix}` : `/${prefix}${bare}`) + rest;
}

/** Splits `/a/b?x=1#y` into `/a/b` and `?x=1#y`. */
function splitOnce(href: string): [string, string?] {
  const index = href.search(/[?#]/);
  return index === -1 ? [href] : [href.slice(0, index), href.slice(index)];
}
