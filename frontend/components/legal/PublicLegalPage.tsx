"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LegalDocument } from "./LegalDocument";
import { fetchPublicLegalPage, type LegalSlug } from "@/lib/legal/legal-api";
import { LEGAL_FALLBACK_CONTENT } from "@/lib/legal/fallback-content";
import { normalizeLegalDocument, type LegalDocumentContent } from "@/lib/legal/legal-document";

/**
 * `/terms` and `/privacy`: start from the fallback copy (so the page is
 * never blank, even offline) and swap in the published content once
 * `fetchPublicLegalPage` resolves. A fixed-light page, same as `/login` —
 * no `data-shell`, so the dark-mode overrides never reach it.
 */
export function PublicLegalPage({ slug }: { slug: LegalSlug }) {
  const [content, setContent] = useState<LegalDocumentContent>(LEGAL_FALLBACK_CONTENT[slug]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicLegalPage<unknown>(slug).then((fetched) => {
      if (cancelled || !fetched) return;
      // A pre-V81 row is converted on the way in; one with no text at all keeps the fallback.
      const live = normalizeLegalDocument(fetched);
      if (live.title && live.body.trim()) setContent(live);
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
      <LegalDocument content={content} />
    </div>
  );
}
