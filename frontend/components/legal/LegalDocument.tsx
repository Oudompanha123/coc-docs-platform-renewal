import { MarkdownView } from "./MarkdownView";
import { formatLegalDate, legalDocReadMinutes, type LegalDocumentContent } from "@/lib/legal/legal-document";

/**
 * A legal page as readers see it — the public `/terms` and `/privacy`, the
 * editor's Preview and History's preview all render this, so what an editor
 * previews is exactly what goes live. Title and subtitle, the body (its `##`
 * headings carry anchor ids, so `/terms#contact` still links to a section),
 * and the last-updated byline. Content area only; the caller adds any chrome.
 */
export function LegalDocument({ content }: { content: LegalDocumentContent }) {
  return (
    <article className="mx-auto max-w-[720px] px-6 py-10 sm:py-14">
      <header className="text-center">
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-foreground sm:text-[44px]">{content.title}</h1>
        {content.subtitle && <p className="mt-2 text-[15px] text-muted-foreground">{content.subtitle}</p>}
        <p className="mt-3 text-xs text-muted-foreground">
          Updated {formatLegalDate(content.lastUpdated)} · {legalDocReadMinutes(content)} min read
        </p>
      </header>

      <MarkdownView source={content.body} variant="document" className="mt-10 space-y-3.5" />

      <p className="mt-10 border-t border-surface-border pt-4 text-[13px] text-muted-foreground">
        Last updated by {content.updatedBy} on {formatLegalDate(content.lastUpdated)}
      </p>
    </article>
  );
}
