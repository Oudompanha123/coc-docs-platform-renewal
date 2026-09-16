/** Jex3.0's real sub-item labels, verified against content/en/jex3.0.tsx
 *  during the Phase 1 audit. Slugs match the routes under app/jex3-0/.
 *  Exported (with `slug`) so app/jex3-0/[slug]/page.tsx can look up a
 *  label without duplicating this list.
 *
 *  Lives here rather than in nav-config.ts so the sidebar's own nav data can
 *  be reverted independently of the Jex3.0 content-editor registry that
 *  depends on this list. */
export const JEX3_SUB_ITEMS_RAW = [
  { label: "Overview", slug: "overview" },
  { label: "Get started", slug: "get-started" },
  { label: "How to use", slug: "how-to-use" },
  { label: "Flow", slug: "flow" },
  { label: "Structure", slug: "structure" },
  { label: "Updating", slug: "updating" },
  { label: "Releases", slug: "releases" },
  { label: "FAQ", slug: "faq" },
  { label: "Prerequisites", slug: "prerequisites" },
  { label: "Run configs", slug: "run-configs" },
  { label: "From scratch", slug: "from-scratch" },
  { label: "Verify", slug: "verify" },
];
