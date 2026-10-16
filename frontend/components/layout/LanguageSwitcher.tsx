"use client";

import { Languages } from "lucide-react";
import { NavMenu, NavMenuItem } from "@/components/ui/nav-menu";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT_LABELS } from "@/lib/i18n/config";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * The language menu for pages without a settings screen — the sign-in and
 * password pages and the signed-out landing page's navbar (ADR-116).
 * Signed-in readers change language in Settings instead
 * (`LanguagePicker`). English, ខ្មែរ, 한국어; choosing one
 * opens the same page at that language's address — `/home`, `/km/home`,
 * `/kr/home` — so the choice can be bookmarked and shared.
 *
 * Each language is listed in its own script, the convention for a language
 * picker: a reader looking for Khmer recognises "ភាសាខ្មែរ", not "Khmer".
 */
export function LanguageSwitcher({ align = "end" }: { align?: "start" | "center" | "end" }) {
  const { language, setLanguage } = useLanguage();
  return (
    <NavMenu
      align={align}
      panelClassName="w-44 grid-cols-1"
      label={
        <span className="flex items-center gap-1.5" aria-label={`Language: ${LOCALE_LABELS[language]}`}>
          <Languages className="size-4" aria-hidden="true" />
          <span aria-hidden="true">{LOCALE_SHORT_LABELS[language]}</span>
        </span>
      }
    >
      {LOCALES.map((locale) => (
        <NavMenuItem
          key={locale}
          title={<span lang={locale}>{LOCALE_LABELS[locale]}</span>}
          active={locale === language}
          onSelect={() => setLanguage(locale)}
        />
      ))}
    </NavMenu>
  );
}
