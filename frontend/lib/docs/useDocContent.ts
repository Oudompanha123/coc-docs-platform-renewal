"use client";

import { useEffect, useState } from "react";
import { SEED_CONTENT } from "./content-store";
import { fetchDocContent } from "./docs-content-api";
import type { DocContent } from "./content-types";

/**
 * Renders the seed content on both server and first client paint (so there's
 * no hydration mismatch — the network fetch can't complete during SSR),
 * then swaps in the real saved content — an admin edit from the backend if
 * one exists, else the seed content again, resolved by fetchDocContent —
 * once the request completes. This is the one place a saved edit reaches a
 * public page: same backend the editor writes to, read here instead of
 * from a second hardcoded copy.
 */
export function useDocContent(id: string): DocContent | undefined {
  const [content, setContent] = useState<DocContent | undefined>(() => SEED_CONTENT[id]);

  useEffect(() => {
    let cancelled = false;
    fetchDocContent(id)
      .then((result) => {
        if (!cancelled) setContent(result ?? SEED_CONTENT[id]);
      })
      .catch(() => {
        if (!cancelled) setContent(SEED_CONTENT[id]);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return content;
}
