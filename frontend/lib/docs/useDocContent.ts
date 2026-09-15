"use client";

import { useEffect, useState } from "react";
import { getContent, SEED_CONTENT } from "./content-store";
import type { DocContent } from "./content-types";

/**
 * Renders the seed content on both server and first client paint (so there's
 * no hydration mismatch — localStorage isn't available during SSR), then
 * swaps in a saved admin edit, if one exists, right after mount. This is the
 * one place a saved edit reaches a public page — same store the editor
 * writes to, read here instead of from a second hardcoded copy.
 */
export function useDocContent(id: string): DocContent | undefined {
  const [content, setContent] = useState<DocContent | undefined>(() => SEED_CONTENT[id]);

  useEffect(() => {
    setContent(getContent(id));
  }, [id]);

  return content;
}
