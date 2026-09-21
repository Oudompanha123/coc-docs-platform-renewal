"use client";

import { useEffect, useState } from "react";
import { fetchNavStructureOrThrow, type NavProduct } from "./nav-api";
import { computeProductStats, computeRecentDocs, type ContentDocRow } from "./content-stats";
import type { StatCardData } from "@/lib/mock/overview";

export type ProductStatsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; products: NavProduct[]; stats: StatCardData[]; recentDocs: ContentDocRow[] };

/**
 * Products, their written/not-written stats, and a recent-docs slice, loaded
 * together for the Overview and Member Home pages — the exact same three
 * calls both pages used to duplicate. A real `"error"` state on a backend
 * failure (`fetchNavStructureOrThrow`/`computeProductStats`/
 * `computeRecentDocs` all throw rather than substituting `FALLBACK_NAV` or
 * seed content), instead of leaving those pages stuck on "loading" forever
 * or quietly rendering static/mock data as if it were live.
 */
export function useProductStats(): ProductStatsState & { refetch: () => void } {
  const [state, setState] = useState<ProductStatsState>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      const products = await fetchNavStructureOrThrow();
      const [stats, recentDocs] = await Promise.all([computeProductStats(products), computeRecentDocs(products)]);
      if (!cancelled) setState({ status: "ready", products, stats, recentDocs });
    })().catch((err: unknown) => {
      if (!cancelled) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { ...state, refetch: () => setReloadToken((t) => t + 1) };
}
