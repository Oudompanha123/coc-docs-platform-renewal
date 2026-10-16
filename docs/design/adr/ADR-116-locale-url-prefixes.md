# ADR-116: Locale in the URL — Unprefixed English, `/km`, `/kr`

> **Status**: PROPOSED — structure implemented, awaiting PM approval
> **Date**: 2026-10-16
> **Author**: AI (Claude), on direct in-session instruction
> **Approver**: pending. The product owner asked in-session for "localization en, km, kr — `domain/en` or blank because it's default, and `/km`, `/kr`; do the structure first", and then for where the language is chosen: on the sign-in, sign-up and password pages; in the navbar of the signed-out landing page; and in Settings once signed in (the member's and the dashboard's). Not recorded as approved here (CONST-PROC-01).
> **Related ADR**: Builds on FR-I18N-001 (every page has en, km, ko versions) and the `locale` enum on `page_version` (ADR-003, V1). ADR-012 (two services, no hosting target yet) constrains where locale state may live.

---

## 1. Context

The product's content model already speaks three locales — `en`, `km`, `ko` — on `page_version`, and the frontend had a small message catalogue (`lib/i18n/translations.ts`) with all three. But the language a page was shown in came from `localStorage`, and nothing ever changed it: `setLanguage` had no caller, so every reader saw English.

The product owner wants the language in the address: English at the plain URL (`/home`, with `/en/home` also accepted), Khmer at `/km/home`, Korean at `/kr/home`.

The frontend has about 40 routes across route groups (`(shell)`, `(member)`), roughly 140 hard-coded links and `router.push` calls, and a `middleware.ts` that already rewrites product slugs and legacy Store addresses.

## 2. Decision

**The URL prefix is the locale, resolved in `middleware.ts`; the page files do not move.**

- `/km/...` and `/kr/...` are **rewritten** to the unprefixed route. The same page file serves all three languages. The locale reaches the root layout in an `x-coc-locale` request header, and the root layout sets `<html lang>` and hands the locale to `LanguageProvider`.
- `/en/...` **308-redirects** to the unprefixed address, so English has one canonical URL.
- Visiting a prefixed address **remembers** the locale in a `coc-docs-locale` cookie. An unprefixed request from a reader whose cookie says Khmer or Korean **307-redirects** to that locale's address. This is what keeps a reader in their language across the app's existing links, which carry no prefix. `/auth/*` and `/cli/*` are exempt, because their addresses are fixed by Google and the CLI.
- The product-slug and Store redirects run on the path **without** the locale, and their targets are put back in the same locale.
- **Korean's URL prefix is `kr`, its locale code stays `ko`.** `ko` is the ISO 639-1 code and what `page_version.locale`, `<html lang>` and the catalogue use. `lib/i18n/config.ts` is the only place that maps one to the other.
- `en`, `km` and `kr` are reserved product keys (backend `NavService` and `reserved-product-keys.ts`).

### Key Choices

| | |
|---|---|
| Source of truth | The URL. `localStorage` (`coc-docs-lang`) is no longer read. |
| Switching language | A full page load to the new address. The root layout reads the locale and stays mounted across client navigations, so a soft switch would leave it stale. |
| Where readers switch | Sign-in, sign-up and password pages (`AuthShell`), and the signed-out navbars (`/welcome`, the public Store): a `LanguageSwitcher` dropdown. Signed in: the Appearance card on `/account/settings` and on `/settings`: a `LanguagePicker`. |
| Links in new code | `Link`, `useRouter` and `usePathname` from `lib/i18n/navigation.tsx`. They prefix hrefs and strip the prefix for "active" checks. |
| Fonts | Korean pages fall back to Pretendard (already shipped). Khmer pages fall back to platform Khmer faces. Keyed on `html:lang(...)`. |

## 3. Considered Alternatives

| Option | Why not |
|---|---|
| **Move every route under `app/[locale]/`** (the conventional App Router layout) | Moves ~40 route folders and their tests in one change. Route groups and the existing product-key middleware would need reworking at the same time. The rewrite gets the same URLs without touching page files, and a later move is still possible. |
| **`next-intl`** | A new runtime dependency for what this needs: one middleware branch and a context. It also assumes the `[locale]` folder layout above. Revisit if plural rules and ICU formatting become necessary. |
| **Cookie or `localStorage` only, no URL prefix** | Not what was asked. A language must be shareable and bookmarkable, and a search engine cannot index it. |
| **`/ko` for Korean** | The standard code, but the product owner asked for `/kr`. Keeping `ko` internally makes `/ko` a one-line change if that is ever preferred. |

## 4. Consequences

### 4.1 Positive Impacts

- Every existing page works at `/km/...` and `/kr/...` today, with no page file changed.
- Old unprefixed links keep a reader in their language: one redirect, then the right page.
- The locale on the URL matches `page_version.locale` (via `kr` → `ko`), so content can be fetched in the reader's language with no extra state.

### 4.2 Negative Impacts / Costs to Accept

- Reading a request header in the root layout makes every page render per request. Almost all pages are client components that fetch after mount, so little was static before.
- An unprefixed link costs one redirect for a Khmer or Korean reader until it is moved to `lib/i18n/navigation.tsx`.
- Most UI text is still English-only. This decision builds the structure, not the translations.

### 4.3 Follow-up Work

1. Move user-visible strings into `translations.ts`, page by page. A compile-time check already fails the build if Khmer or Korean is missing a key that English has.
2. Fetch docs content in the reader's locale. The backend already stores one `page_version` per locale.
3. Move links and `router.push` calls to `lib/i18n/navigation.tsx` as their files are touched.
4. Add `hreflang` alternates (`<link rel="alternate">`) for the public pages.
5. Check that no existing product uses the key `en`, `km` or `kr` before deploying. Such a product would become unreachable.

## 5. Verification / Monitoring

- `middleware.test.ts` covers: the rewrite and request header for `/km` and `/kr`, the `/en` redirect, the remembered-locale redirect, the auth-callback exemption, and locale-preserving product and Store redirects.
- `lib/i18n/config.test.ts` covers prefix parsing, the `kr`/`ko` mapping, and that `localizePath` never stacks prefixes or touches external links.

## 6. References

- `frontend/lib/i18n/config.ts`, `navigation.tsx`, `LanguageContext.tsx`
- `frontend/middleware.ts`, `frontend/app/layout.tsx`
- `frontend/components/layout/LanguageSwitcher.tsx`, `frontend/components/settings/LanguagePicker.tsx`
- REQUIREMENTS-SPEC §2.3 (FR-I18N-001..006)

## Change History

| Date | Change |
|---|---|
| 2026-10-16 | Created; structure implemented. |
