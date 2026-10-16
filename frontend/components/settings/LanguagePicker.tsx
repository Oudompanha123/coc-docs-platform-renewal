"use client";

import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/config";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * The language choice on both Settings pages — the dashboard's (`/settings`)
 * and a signed-in member's (`/account/settings`) — beside the theme
 * (ADR-116). Signed-out pages use the navbar's `LanguageSwitcher` instead.
 *
 * Choosing one reopens the current page at that language's address
 * (`/settings` → `/km/settings`), so the choice is the URL, and the URL is
 * what every later page is served in.
 *
 * Chips in the same shape as the theme chips above it, so the two settings
 * read as one block. Each language is written in its own script.
 */
export function LanguagePicker() {
  const { language, setLanguage } = useLanguage();
  return (
    <div>
      <p id="language-picker-label" className="text-xs font-medium text-muted-foreground">
        Language
      </p>
      <div role="group" aria-labelledby="language-picker-label" className="mt-2 flex gap-2">
        {LOCALES.map((locale) => (
          // A single-choice chip group, styled from the selection rather than
          // a variant — the same element as the theme chips beside it.
          // eslint-disable-next-line react/forbid-elements
          <button
            key={locale}
            type="button"
            lang={locale}
            onClick={() => setLanguage(locale)}
            aria-pressed={language === locale}
            className={`flex h-10 flex-1 items-center justify-center rounded-control border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              language === locale
                ? "border-foreground/40 bg-muted-surface/60 text-foreground"
                : "border-surface-border text-muted-foreground hover:border-foreground/20 hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            {LOCALE_LABELS[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
