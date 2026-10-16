import type { Metadata } from "next";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, LOCALE_HEADER, isLocale } from "@/lib/i18n/config";
import { translations } from "@/lib/i18n/translations";

/**
 * Exists only to carry the tab title — `page.tsx` is a client component and
 * Next.js refuses a `metadata` export from one (same split as `/meeting`).
 * The title is in the page's language: `middleware.ts` puts the locale in the
 * request header, as the root layout reads it (ADR-116).
 */
export async function generateMetadata(): Promise<Metadata> {
  const requested = (await headers()).get(LOCALE_HEADER);
  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;
  return { title: translations[locale].store.pageTitle };
}

export default function StoreLayout({ children }: { children: ReactNode }) {
  return children;
}
