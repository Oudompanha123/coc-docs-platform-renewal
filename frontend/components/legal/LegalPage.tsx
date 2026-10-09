import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  LEGAL_COPYRIGHT_YEAR,
  LEGAL_DOCUMENTS,
  LEGAL_LAST_UPDATED,
  LEGAL_SAMPLE_NOTICE,
  type LegalDoc,
  type LegalDocKey,
} from "@/components/legal/content";

/**
 * `/terms` and `/privacy` — the two pages the registration form's "I agree to
 * the Terms of Service and Privacy Policy" links open (FR-AUTH-002).
 *
 * <p>One component renders both — the route picks the document — so each keeps
 * its own URL, title and back-button entry.
 *
 * <p><b>A document, not a landing page.</b> This replaced a gradient hero with
 * decorative artwork, "at a glance" cards, a sticky contents rail and a
 * scroll-progress bar. Legal text is read for what it says, and every one of
 * those was something to look past on the way to it — so this is a centred
 * title, a rule, and the sections, which is also what makes the page
 * trivially printable. It is deliberately static: no client component, no
 * hooks, no scroll listener, nothing to hydrate.
 *
 * <p>Deliberately light-only, like `/login` and `/register` (AuthShell) which
 * it sits beside in the registration flow — it is outside the
 * `[data-shell]` scopes the app's dark theme targets.
 *
 * // req: FR-AUTH-002
 */
export function LegalPage({ docKey }: { docKey: LegalDocKey }) {
  const doc: LegalDoc = LEGAL_DOCUMENTS[docKey];

  return (
    <div className="bg-background text-foreground/80 min-h-screen text-sm leading-relaxed sm:text-base sm:leading-relaxed">
      {/* A readable measure (max-w-3xl, ~70 characters at this size) rather
          than the mockup's 1000px column with 100px gutters. */}
      <main className="mx-auto max-w-3xl px-4 pt-10 pb-16 sm:px-6 sm:pt-12">
        {/* Not in the design mockup, and kept anyway: both links are same-tab
            navigations out of a half-filled registration form, so this is the
            only signposted way back to it. Bare text with a leading arrow, in
            the document's own ink. */}
        <Link
          href="/register"
          className="group text-foreground focus-visible:ring-ring/50 mb-8 inline-flex items-center gap-2 rounded-sm text-sm font-medium focus-visible:ring-[3px] focus-visible:outline-none"
        >
          <ArrowLeft aria-hidden="true" className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <span className="group-hover:underline">Back to Register</span>
        </Link>

        <header className="text-center">
          <h1 className="text-foreground m-0 text-2xl font-semibold tracking-tight sm:text-3xl">
            {doc.name}
          </h1>
          <p className="text-muted-foreground mt-2 mb-0 text-sm">{doc.subtitle}</p>
          <p className="mt-3 mb-0">
            <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900">
              {LEGAL_SAMPLE_NOTICE}
            </span>
          </p>
        </header>

        <hr className="border-surface-border mt-8 mb-8 border-0 border-t" />

        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="mt-8 scroll-mt-6 first:mt-0">
            <h2 className="text-foreground mt-0 mb-2 text-base leading-snug font-semibold tracking-tight sm:text-lg">
              {section.title}
            </h2>
            {section.body}
          </section>
        ))}

        <footer className="mt-12">
          <p className="text-muted-foreground m-0 text-xs leading-relaxed italic">
            The information on this page may change without notice.
            <br />© {LEGAL_COPYRIGHT_YEAR} Coc Docs Platform. All rights reserved.
          </p>
          <p className="text-muted-foreground mt-4 mb-0 text-xs">
            Last updated by the Platform Team on {LEGAL_LAST_UPDATED}
          </p>
        </footer>
      </main>
    </div>
  );
}
