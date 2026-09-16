/**
 * Real backend client for the nav structure (product list + each product's
 * sub-item list) — replaces the earlier hardcoded `jexmcp-nav.ts`/
 * `nav-config.ts` PRODUCTS section as the source of truth. Reads are public
 * (`GET /api/v1/nav`); writes require the admin role (`/api/v1/admin/nav/**`),
 * enforced server-side, not here.
 */

import { BACKEND_URL } from "@/lib/auth/api";

export type NavItem = { slug: string; label: string };
export type NavProduct = { key: string; label: string; icon: string; items: NavItem[] };

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
 */
const FALLBACK_NAV: NavProduct[] = [
  {
    key: "jex3-0",
    label: "Jex3.0",
    icon: "layers",
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
    items: [
      { slug: "", label: "Dashboard" },
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
  const created = (await response.json()) as { key: string; label: string; icon: string };
  return { ...created, items: [] };
}

export async function updateProduct(key: string, label: string, icon: string): Promise<void> {
  await adminRequest(`/products/${key}`, "PUT", { label, icon });
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
