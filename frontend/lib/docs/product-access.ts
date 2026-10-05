import type { Role } from "@/lib/auth/api";
import { AX_RENEWAL_ROLES } from "@/lib/auth/landing";

/** AX Renewal's documentation product — `/docs/ax-renewal-docs/*` (V54/V55). */
export const AX_RENEWAL_DOCS_PRODUCT = "ax-renewal-docs";

/**
 * Whether a caller may read one product's documentation pages.
 *
 * Every product is open to everyone, except AX Renewal's: its docs are for
 * the people who can use AX Renewal — Developer, Reviewer, Lead, Admin and
 * Super Admin (`AX_RENEWAL_ROLES`, ADR-090). A plain `user`, a `guest`, and
 * a signed-out visitor (`role` null) see a permission message instead. The
 * product stays listed under Products, so the message explains why it does
 * not open.
 *
 * Presentation only: the docs content API is public reading, the same as
 * every other product's.
 */
export function canViewProductDocs(productKey: string, role: Role | null | undefined): boolean {
  if (productKey !== AX_RENEWAL_DOCS_PRODUCT) return true;
  return role != null && AX_RENEWAL_ROLES.includes(role);
}
