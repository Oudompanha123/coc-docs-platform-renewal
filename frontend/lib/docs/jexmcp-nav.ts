import { JEX3_SUB_ITEMS_RAW } from "@/lib/docs/jex3-sub-items";

/**
 * Structure only (Phase 2) — sub-item labels/order verified against the real
 * content files in the jexmcp3.0 repo's `site` branch (content/en/*.tsx),
 * read during the Phase 1 audit. No page content is cloned yet; that's
 * Phase 3, one header at a time, starting with Jex3.0.
 */

/** Jex3.0's real content lives under the authenticated admin shell
 *  (app/jex3-0/*), not the standalone /docs layout — hrefFor and
 *  headerForPathname special-case this key so its links point there
 *  instead of the usual /docs/<key>/... pattern. */
export type DocsHeaderKey = "jex3-0" | "jex2-0" | "coach" | "team" | "usage";

export type DocsSubItem = {
  label: string;
  /** Empty string = the header's own index route (e.g. /docs/jex3-0). */
  slug: string;
};

export type DocsHeaderNav = {
  key: DocsHeaderKey;
  label: string;
  items: DocsSubItem[];
};

export const DOCS_HEADERS: DocsHeaderNav[] = [
  {
    key: "jex3-0",
    label: "Jex3.0",
    items: JEX3_SUB_ITEMS_RAW,
  },
  {
    key: "jex2-0",
    label: "Jex2.0",
    items: [
      { label: "Overview", slug: "" },
      { label: "Get started", slug: "get-started" },
      { label: "How to use", slug: "how-to-use" },
      { label: "Structure", slug: "structure" },
      { label: "FAQ", slug: "faq" },
    ],
  },
  {
    key: "coach",
    label: "Coach",
    items: [
      { label: "Overview", slug: "" },
      { label: "Quick start", slug: "quick-start" },
      { label: "How to use", slug: "how-to-use" },
      { label: "Workflow", slug: "workflow" },
      { label: "Structure", slug: "structure" },
      { label: "Skills", slug: "skills" },
      { label: "Agents", slug: "agents" },
      { label: "Templates", slug: "templates" },
      { label: "Security & gates", slug: "security-gates" },
      { label: "Releases", slug: "releases" },
    ],
  },
  {
    key: "team",
    label: "Team",
    items: [
      { label: "Overview", slug: "" },
      { label: "Roadmap", slug: "roadmap" },
      { label: "Tools", slug: "tools" },
      { label: "Workspace", slug: "workspace" },
      { label: "Agents", slug: "agents" },
      { label: "Demo", slug: "demo" },
      { label: "Metrics", slug: "metrics" },
    ],
  },
  {
    key: "usage",
    label: "Usage",
    items: [
      { label: "Dashboard", slug: "" },
      { label: "Setup guide", slug: "setup-guide" },
      { label: "Configuration", slug: "configuration" },
    ],
  },
];

export function hrefFor(headerKey: DocsHeaderKey, slug: string): string {
  if (headerKey === "jex3-0") {
    return slug ? `/jex3-0/${slug}` : "/jex3-0";
  }
  return slug ? `/docs/${headerKey}/${slug}` : `/docs/${headerKey}`;
}

/** Which header a pathname belongs to, if any — /jex3-0/* for Jex3.0
 *  (its content lives in the admin shell, not under /docs), /docs/<key>/*
 *  for everything else. */
export function headerForPathname(pathname: string): DocsHeaderNav | undefined {
  return DOCS_HEADERS.find((h) => {
    if (h.key === "jex3-0") {
      return pathname === "/jex3-0" || pathname.startsWith("/jex3-0/");
    }
    return pathname === `/docs/${h.key}` || pathname.startsWith(`/docs/${h.key}/`);
  });
}
