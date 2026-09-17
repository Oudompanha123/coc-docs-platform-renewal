"use client";

import { createContext, useContext } from "react";
import type { NavItem, NavProduct } from "@/lib/docs/nav-api";

/**
 * The product/active-sub-item pair, resolved once in
 * `app/docs/[productKey]/layout.tsx` (which owns the breadcrumb and tab bar)
 * and read here by the page body — so both agree on "which item is active"
 * without the page re-deriving it from `useParams`/`useNavStructure` a
 * second time.
 */
export type ProductDocsContextValue = {
  product: NavProduct;
  activeItem: NavItem;
};

const ProductDocsContext = createContext<ProductDocsContextValue | null>(null);

export const ProductDocsProvider = ProductDocsContext.Provider;

export function useProductDocsContext(): ProductDocsContextValue {
  const value = useContext(ProductDocsContext);
  if (value === null) {
    throw new Error("useProductDocsContext must be used inside <ProductDocsProvider>");
  }
  return value;
}
