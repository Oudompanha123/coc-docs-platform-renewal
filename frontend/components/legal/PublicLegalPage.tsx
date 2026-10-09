"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LegalPageLayout, type LegalSlugName } from "./LegalPageLayout";
import { fetchPublicLegalPage } from "@/lib/legal/legal-api";
import { LEGAL_FALLBACK_CONTENT } from "@/lib/legal/fallback-content";
import type { LegalContent } from "@/lib/legal/content-types";

/**
 * `/terms` and `/privacy` share this: starts from the fallback copy (so the
 * page is never blank, even offline) and swaps in the live published
 * content once `fetchPublicLegalPage` resolves. A fixed-light page, same as
 * `/login`/`/register`/`/welcome` — no `data-shell`, so it sits outside the
 * dark-mode overrides those deliberately opt out of (globals.css).
 */
export function PublicLegalPage({ slug }: { slug: LegalSlugName }) {
  const [content, setContent] = useState<LegalContent>(LEGAL_FALLBACK_CONTENT[slug]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicLegalPage(slug).then((fetched) => {
      if (!cancelled && fetched) setContent(fetched);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="min-h-screen bg-card">
      <div className="border-b border-surface-border px-6 py-4">
        <Link href="/login" className="text-sm font-semibold text-foreground hover:underline">
          ← Coc Docs Platform
        </Link>
      </div>
      <LegalPageLayout content={content} />
    </div>
  );
}
