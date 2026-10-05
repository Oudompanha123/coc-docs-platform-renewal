import { describe, expect, it } from "vitest";
import { AX_RENEWAL_DOCS_PRODUCT, canViewProductDocs } from "./product-access";

/** Who may read a product's docs — AX Renewal's are for those who can use it (ADR-090). */
describe("canViewProductDocs", () => {
  it.each(["developer", "reviewer", "lead", "admin", "super_admin"] as const)("lets a %s read AX Renewal's docs", (role) => {
    expect(canViewProductDocs(AX_RENEWAL_DOCS_PRODUCT, role)).toBe(true);
  });

  it.each(["user", "guest"] as const)("keeps a %s out of AX Renewal's docs", (role) => {
    expect(canViewProductDocs(AX_RENEWAL_DOCS_PRODUCT, role)).toBe(false);
  });

  it("keeps a signed-out visitor out of AX Renewal's docs too", () => {
    expect(canViewProductDocs(AX_RENEWAL_DOCS_PRODUCT, null)).toBe(false);
    expect(canViewProductDocs(AX_RENEWAL_DOCS_PRODUCT, undefined)).toBe(false);
  });

  it.each(["jex3-0", "jex2-0", "coach", "team", "usage"])("leaves %s open to everyone, as before", (key) => {
    expect(canViewProductDocs(key, "user")).toBe(true);
    expect(canViewProductDocs(key, null)).toBe(true);
  });
});
