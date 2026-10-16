import { describe, expect, it } from "vitest";
import { LOCALES } from "./config";
import { translations } from "./translations";

// req: FR-I18N-001 — the Store's and /welcome's catalogue sections are complete and actually translated.

const SECTIONS = ["store", "storeForm", "storeErrors", "authGate", "welcome", "welcomePreview"] as const;

/** Values a locale may keep as written in English: product and platform names. */
const SAME_AS_ENGLISH = new Set(["PC"]);

const placeholders = (s: string) => (s.match(/\{[a-z]+\}/gi) ?? []).sort();

/** How many `**bold**` runs a string has (lib/i18n/rich.tsx) — an odd marker count would print a stray "**". */
const boldMarkers = (s: string) => (s.match(/\*\*/g) ?? []).length;

describe("Store and /welcome translations", () => {
  for (const section of SECTIONS) {
    const en = translations.en[section] as Record<string, string>;

    it.each(LOCALES)(`${section}: %s has every key, non-empty, with the same placeholders`, (locale) => {
      const other = translations[locale][section] as Record<string, string>;
      expect(Object.keys(other).sort()).toEqual(Object.keys(en).sort());
      for (const [key, value] of Object.entries(en)) {
        expect(other[key]?.trim(), `${locale}.${section}.${key}`).toBeTruthy();
        expect(placeholders(other[key]!), `${locale}.${section}.${key}`).toEqual(placeholders(value));
        expect(boldMarkers(other[key]!) % 2, `${locale}.${section}.${key} has an unclosed **`).toBe(0);
      }
    });

    it.each(["km", "ko"] as const)(`${section}: %s is not left in English`, (locale) => {
      const other = translations[locale][section] as Record<string, string>;
      const untranslated = Object.entries(en)
        .filter(([key, value]) => other[key] === value && !SAME_AS_ENGLISH.has(value))
        .map(([key]) => key);
      expect(untranslated).toEqual([]);
    });
  }
});
