import { MarkdownView } from "./MarkdownView";
import { formatLegalDate, type LegalDocumentContent } from "@/lib/legal/legal-document";

/**
 * The full-document Apple-style preview (task spec §F / "legal-document-
 * content-mockup.png"): content area only — the mockup's own annotation is
 * "site header & footer stay as they are", so this renders nothing outside
 * the 680px column (no back-link, no page `<html>` chrome). The admin page
 * (Preview mode, pre-publish check, History "Preview") wraps this in
 * whatever chrome that context needs.
 */
export function LegalDocument({ content }: { content: LegalDocumentContent }) {
  return (
    <div className="mx-auto max-w-[680px] px-6 py-10">
      <h1 className="text-center text-[44px] font-semibold leading-tight text-foreground">{content.title}</h1>
      {content.subtitle && <p className="mt-2 text-center text-[15px] text-muted-foreground">{content.subtitle}</p>}
      {content.status === "draft" && (
        <div className="mt-4 flex justify-center">
          <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
            Sample text — replace with approved legal content
          </span>
        </div>
      )}

      <hr className="mt-8 border-surface-border" />

      <div className="mt-8 space-y-8">
        {content.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="text-[21px] font-semibold text-foreground">{section.title}</h2>
            <div className="mt-2.5 space-y-3">
              <MarkdownView source={section.body} variant="document" />
            </div>
          </section>
        ))}
      </div>

      {content.endNote && <MarkdownView source={content.endNote} variant="document-note" className="mt-10 space-y-1" />}

      <p className="mt-4 text-[13px] text-muted-foreground">
        Last updated by {content.updatedBy} on {formatLegalDate(content.lastUpdated)}
      </p>
    </div>
  );
}
