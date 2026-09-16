"use client";

import { useEffect, useState } from "react";
import { fetchNavStructure, type NavProduct } from "./nav-api";

/** The live product/sub-item tree. `null` while the first fetch is in
 *  flight — callers render a loading state or nothing for that instant,
 *  same pattern as `useDocContent`/`ProductContentTable`. */
export function useNavStructure(): NavProduct[] | null {
  const [products, setProducts] = useState<NavProduct[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNavStructure().then((result) => {
      if (!cancelled) setProducts(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return products;
}
