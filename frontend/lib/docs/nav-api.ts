/**
 * Real backend client for the nav structure (product list + each product's
 * sub-item list) — replaces the earlier hardcoded `jexmcp-nav.ts`/
 * `nav-config.ts` PRODUCTS section as the source of truth. Reads are public
 * (`GET /api/v1/nav`); writes require the admin role (`/api/v1/admin/nav/**`),
 * enforced server-side, not here.
 */

import { BACKEND_URL } from "@/lib/auth/api";

export type NavItem = { slug: string; label: string };
export type NavProduct = { key: string; label: string; icon: string; minRole: string; items: NavItem[] };

export class NavApiError extends Error {}

const NAV_URL = `${BACKEND_URL}/api/v1/nav`;
const ADMIN_NAV_URL = `${BACKEND_URL}/api/v1/admin/nav`;

/** An empty path segment isn't legal in a URL, so a sub-item's own index
 *  slug ("") is addressed as the literal segment "index" — the backend
 *  translates that back to "" before it ever reaches storage. */
function slugSegment(slug: string): string {
  return slug || "index";
}

/**
 * The current product/sub-item tree, seeded from the same structure this
 * data used to be hardcoded as — used only when the backend is unreachable,
 * so the sidebar and docs pages never go blank just because the API is
 * down. Not imported from jexmcp-nav.ts: that file is no longer part of the
 * live path at all, this is a standalone last-resort snapshot.
 *
 * Exported so the landing page's hero preview (DashboardPreview.tsx) can
 * show a real product's real sub-item titles instead of inventing its own
 * copy of them — the same reasoning as this constant's own fallback role.
 */
export const FALLBACK_NAV: NavProduct[] = [
  {
    key: "jex3-0",
    label: "Jex3.0",
    icon: "layers",
    minRole: "user",
    items: [
      { slug: "overview", label: "Overview" },
      { slug: "get-started", label: "Get started" },
      { slug: "how-to-use", label: "How to use" },
      { slug: "flow", label: "Flow" },
      { slug: "structure", label: "Structure" },
      { slug: "updating", label: "Updating" },
      { slug: "releases", label: "Releases" },
      { slug: "faq", label: "FAQ" },
      { slug: "prerequisites", label: "Prerequisites" },
      { slug: "run-configs", label: "Run configs" },
      { slug: "from-scratch", label: "From scratch" },
      { slug: "verify", label: "Verify" },
    ],
  },
  {
    key: "jex2-0",
    label: "Jex2.0",
    icon: "folder",
    minRole: "user",
    items: [
      { slug: "", label: "Overview" },
      { slug: "get-started", label: "Get started" },
      { slug: "how-to-use", label: "How to use" },
      { slug: "structure", label: "Structure" },
      { slug: "faq", label: "FAQ" },
    ],
  },
  {
    key: "coach",
    label: "Coach",
    icon: "person",
    minRole: "user",
    items: [
      { slug: "", label: "Overview" },
      { slug: "quick-start", label: "Quick start" },
      { slug: "how-to-use", label: "How to use" },
      { slug: "workflow", label: "Workflow" },
      { slug: "structure", label: "Structure" },
      { slug: "skills", label: "Skills" },
      { slug: "agents", label: "Agents" },
      { slug: "templates", label: "Templates" },
      { slug: "security-gates", label: "Security & gates" },
      { slug: "releases", label: "Releases" },
    ],
  },
  {
    key: "team",
    label: "Team",
    icon: "pulse",
    minRole: "admin",
    items: [
      { slug: "", label: "Overview" },
      { slug: "roadmap", label: "Roadmap" },
      { slug: "tools", label: "Tools" },
      { slug: "workspace", label: "Workspace" },
      { slug: "agents", label: "Agents" },
      { slug: "demo", label: "Demo" },
      { slug: "metrics", label: "Metrics" },
    ],
  },
  {
    key: "usage",
    label: "Usage",
    icon: "barChart",
    minRole: "admin",
    items: [
      { slug: "", label: "Overview" },
      { slug: "setup-guide", label: "Setup guide" },
      { slug: "configuration", label: "Configuration" },
    ],
  },
];

/** Never throws — falls back to the last-known-good static snapshot above
 *  when the backend can't be reached, same resilience `fetchDocContent`
 *  has for content bodies. */
export async function fetchNavStructure(): Promise<NavProduct[]> {
  try {
    const response = await fetch(NAV_URL, { credentials: "include" });
    if (response.ok) return (await response.json()) as NavProduct[];
  } catch {
    // Backend unreachable — fall through to the snapshot below.
  }
  return FALLBACK_NAV;
}

/** Same request as {@link fetchNavStructure}, but throws (`NavApiError`)
 *  instead of substituting {@link FALLBACK_NAV} on failure — for a page
 *  like Overview or Member Home that needs to tell "the backend is down"
 *  apart from "here is the real, current product list", rather than quietly
 *  rendering the static snapshot as if it were live data. */
export async function fetchNavStructureOrThrow(): Promise<NavProduct[]> {
  let response: Response;
  try {
    response = await fetch(NAV_URL, { credentials: "include" });
  } catch {
    throw new NavApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new NavApiError("Couldn't load your products. Please try again.");
  }
  return (await response.json()) as NavProduct[];
}

async function adminRequest(path: string, method: string, body?: unknown): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${ADMIN_NAV_URL}${path}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new NavApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new NavApiError("You don't have permission to edit the navigation. Sign in as an admin and try again.");
  }
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new NavApiError(
      (detail && typeof detail === "object" && "detail" in detail && typeof detail.detail === "string"
        ? detail.detail
        : undefined) ?? "That didn't work. Please try again.",
    );
  }
  return response;
}

export async function createProduct(key: string, label: string, icon: string): Promise<NavProduct> {
  const response = await adminRequest("/products", "POST", { key, label, icon });
  const created = (await response.json()) as { key: string; label: string; icon: string; minRole: string };
  return { ...created, items: [] };
}

/** The key the caller sent (`previousKey`) alongside the product as it
 *  stands now — `product.key` only differs from it when the new label
 *  slugified to a different URL slug (task: "product rename: ... slug
 *  follows the new name"). */
export type UpdateProductResult = { previousKey: string; product: NavProduct };

export async function updateProduct(key: string, label: string, icon: string): Promise<UpdateProductResult> {
  const response = await adminRequest(`/products/${key}`, "PUT", { label, icon });
  const body = (await response.json()) as { previousKey: string; product: Omit<NavProduct, "items"> };
  return { previousKey: body.previousKey, product: { ...body.product, items: [] } };
}

/** The product a now-retired slug belongs to, for the frontend's own
 *  `middleware.ts` 308 redirect — `null` when `slug` was never a product's
 *  key at all (never redirect to a guess). Public (`GET /api/v1/nav/**`),
 *  same as {@link fetchNavStructure}. */
export async function fetchCurrentKeyForOldSlug(slug: string): Promise<string | null> {
  let response: Response;
  try {
    response = await fetch(`${NAV_URL}/products/by-old-slug/${slug}`);
  } catch {
    return null;
  }
  if (!response.ok) return null;
  const body = (await response.json()) as { currentKey: string };
  return body.currentKey;
}

export async function deleteProduct(key: string): Promise<void> {
  await adminRequest(`/products/${key}`, "DELETE");
}

export async function reorderProducts(keys: string[]): Promise<void> {
  await adminRequest("/products/reorder", "PUT", { keys });
}

export async function createItem(productKey: string, slug: string, label: string): Promise<NavItem> {
  const response = await adminRequest(`/products/${productKey}/items`, "POST", { slug, label });
  return (await response.json()) as NavItem;
}

export async function updateItem(productKey: string, slug: string, label: string): Promise<void> {
  await adminRequest(`/products/${productKey}/items/${slugSegment(slug)}`, "PUT", { label });
}

export async function deleteItem(productKey: string, slug: string): Promise<void> {
  await adminRequest(`/products/${productKey}/items/${slugSegment(slug)}`, "DELETE");
}

export async function reorderItems(productKey: string, slugs: string[]): Promise<void> {
  await adminRequest(`/products/${productKey}/items/reorder`, "PUT", { slugs });
}

// ---------------------------------------------------------------------------
// Sidebar kebab menu: ADMINISTRATION-block item rename/move + custom groups
// ---------------------------------------------------------------------------

export type NavGroupConfig = { id: string; name: string; builtin: boolean; sortOrder: number };
export type NavItemOverrideConfig = {
  itemKey: string;
  customLabel: string | null;
  groupId: string | null;
  /** Set only once a move has happened — the position "moved item goes to
   *  the end of the target group" assigned it. Null for a rename-only
   *  override, or one that's never been moved. */
  sortOrder: number | null;
};

export type AdminNavConfig = {
  products: NavProduct[];
  groups: NavGroupConfig[];
  itemOverrides: NavItemOverrideConfig[];
};

/** Everything the sidebar's kebab menu needs: live products, every group,
 *  and every ADMINISTRATION-block item override, in one call. */
export async function fetchAdminNavConfig(): Promise<AdminNavConfig> {
  const response = await adminRequest("", "GET");
  return (await response.json()) as AdminNavConfig;
}

/** A static item's key is its href (e.g. "/legal-pages") — sent without its
 *  leading slash, which the backend restores (a literal "/" would otherwise
 *  split into an extra path segment). Rename sends only `label`, move sends
 *  only `groupId`; the other is left as it already is. */
export async function updateNavItemOverride(
  itemKey: string,
  update: { label?: string; groupId?: string },
): Promise<NavItemOverrideConfig> {
  const segment = itemKey.startsWith("/") ? itemKey.slice(1) : itemKey;
  const response = await adminRequest(`/items/${segment}`, "PATCH", update);
  return (await response.json()) as NavItemOverrideConfig;
}

export async function createNavGroup(name: string): Promise<NavGroupConfig> {
  const response = await adminRequest("/groups", "POST", { name });
  return (await response.json()) as NavGroupConfig;
}

export async function renameNavGroup(id: string, name: string): Promise<void> {
  await adminRequest(`/groups/${id}`, "PUT", { name });
}

export async function deleteNavGroup(id: string): Promise<void> {
  await adminRequest(`/groups/${id}`, "DELETE");
}
