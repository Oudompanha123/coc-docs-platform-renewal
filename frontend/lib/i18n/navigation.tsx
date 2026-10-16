"use client";

/**
 * Locale-aware stand-ins for Next's navigation helpers (ADR-116). New code
 * imports these instead of `next/link` and `next/navigation` directly.
 *
 * Existing unprefixed links still work without them — middleware.ts sends a
 * reader with a remembered Khmer or Korean choice on to the prefixed address
 * — but each such link costs a redirect, so links are moved over to these as
 * their files are touched.
 */
import NextLink from "next/link";
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";
import { useMemo, type ComponentProps } from "react";
import { localizePath, stripLocale } from "./config";
import { useLanguage } from "./LanguageContext";

/**
 * The current path without its locale prefix — `/km/docs/a` and `/docs/a`
 * both read `/docs/a`. Use it for "is this nav item active" checks, which
 * would otherwise never match on a Khmer or Korean page.
 *
 * It also keeps server and client agreeing: under a middleware rewrite the
 * server renders with the rewritten path (no prefix) while the browser may
 * report the address bar's, and stripping both gives the same string.
 */
export function usePathname(): string {
  return stripLocale(useNextPathname() ?? "/");
}

/** Turns an app path into the current locale's address. */
export function useLocalizedHref(): (href: string) => string {
  const { language } = useLanguage();
  return useMemo(() => (href: string) => localizePath(href, language), [language]);
}

/** `router.push`/`replace`/`prefetch`, with app paths put in the current locale. */
export function useRouter(): ReturnType<typeof useNextRouter> {
  const router = useNextRouter();
  const localize = useLocalizedHref();
  return useMemo(
    () => ({
      ...router,
      push: (href, options) => router.push(localize(href), options),
      replace: (href, options) => router.replace(localize(href), options),
      prefetch: (href, options) => router.prefetch(localize(href), options),
    }),
    [router, localize],
  );
}

/** `next/link` with string hrefs put in the current locale. */
export function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const localize = useLocalizedHref();
  return <NextLink href={typeof href === "string" ? localize(href) : href} {...props} />;
}
