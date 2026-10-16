/**
 * Every first-path-segment this app already serves statically — a product
 * can never legitimately have one of these as its key, so `middleware.ts`
 * skips the redirect-lookup round trip for them outright rather than asking
 * the backend about a slug that could never be a renamed product anyway.
 *
 * <p>Mirrors (and is a superset of) the backend's own authoritative list,
 * `NavService.RESERVED_PRODUCT_KEYS` — that one is what actually refuses a
 * product key at creation time; this one only decides when this file's own
 * caller can skip a network call. Kept in step by hand, the same manual-sync
 * relationship `NavService`'s own javadoc already documents for `nav-config.
 * ts`'s `STATIC_ITEM_KEYS`. A mismatch here is a missed optimization at
 * worst (one redundant lookup for a route this already knows is static),
 * never a correctness problem — a reserved key `middleware.ts` doesn't know
 * about yet just falls through to the normal live-key/old-slug check, which
 * answers "not a product" either way.
 */
export const RESERVED_TOP_LEVEL_SEGMENTS = new Set([
  "login",
  "register",
  "overview",
  "settings",
  "users-roles",
  "content",
  "welcome",
  "claude-usage",
  "my-claude-usage",
  "forgot-password",
  "reset-password",
  "create-password",
  "docs",
  "auth",
  "api",
  "idea",
  "workflow",
  "ax-renewal",
  "attendance",
  "home",
  "meeting",
  // Real routes the backend's own reserved list doesn't (yet) name —
  // included here regardless, since this file's only job is recognising an
  // existing static route, not enforcing what a new product key may be.
  "legal-pages",
  "announcements",
  "privacy",
  "terms",
  "account",
  "cli",
  "store",
  // Locale prefixes (ADR-116): `/km/...` is Khmer, never a product called "km".
  "en",
  "km",
  "kr",
]);

/** `/docs/<this>` is one of the app's own static docs-about-the-app pages,
 *  never a product key — listed so `middleware.ts` doesn't spend a redirect
 *  lookup on them (see `frontend/app/docs/` for the route files). */
export const RESERVED_DOCS_SUBROUTES = new Set(["faq", "get-started", "how-to-use", "idea", "releases"]);
