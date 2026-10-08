import Link from "next/link";
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
    <div className="min-h-screen bg-white text-[14px] leading-[1.7] text-[#46444f]">
      {/* 100px side padding from the design, held back until there is room for
          it — on a phone it would leave 75px of readable column. */}
      <main className="mx-auto max-w-[1000px] px-5 pt-10 pb-16 sm:pt-14 md:px-[100px]">
        {/* Not in the design mockup, and kept anyway: both links are same-tab
            navigations out of a half-filled registration form, so this is the
            only signposted way back to it. Bare text with a leading arrow —
            the arrow carries the colour so the label can stay the same ink as
            the document it sits above. */}
        <Link
          href="/register"
          className="group mb-8 inline-flex items-center gap-2.5 text-[15px] font-medium text-[#1c1b22]"
        >
          <span
            aria-hidden="true"
            className="text-[17px] leading-none text-[#c4832f] transition-transform group-hover:-translate-x-0.5"
          >
            ←
          </span>
          <span className="group-hover:underline">Back to Register</span>
        </Link>

        <header className="text-center">
          <h1 className="m-0 text-[clamp(1.75rem,5vw,2.15rem)] leading-[1.15] font-extrabold tracking-[-0.02em] text-[#1c1b22]">
            {doc.name}
          </h1>
          <p className="mt-2.5 mb-0 text-[14.5px] text-[#6b6975]">{doc.subtitle}</p>
          <p className="mt-3.5 mb-0">
            <span className="inline-block rounded-full border border-[#efc978] bg-[#fdf7ea] px-3 py-[3px] text-[11px] font-medium text-[#8a6416]">
              {LEGAL_SAMPLE_NOTICE}
            </span>
          </p>
        </header>

        <hr className="mt-8 mb-9 border-0 border-t border-[#e7e6ec]" />

        {doc.sections.map((section) => (
          <section key={section.id} id={section.id} className="mt-9 scroll-mt-6 first:mt-0">
            <h2 className="mt-0 mb-3 text-[17.5px] leading-snug font-bold tracking-[-0.01em] text-[#1c1b22]">
              {section.title}
            </h2>
            {section.body}
          </section>
        ))}

        <footer className="mt-12">
          <p className="m-0 text-[12.5px] leading-relaxed text-[#8a8893] italic">
            The information on this page may change without notice.
            <br />© {LEGAL_COPYRIGHT_YEAR} Coc Docs Platform. All rights reserved.
          </p>
          <p className="mt-4 mb-0 text-[13px] text-[#6b6975]">
            Last updated by the Platform Team on {LEGAL_LAST_UPDATED}
          </p>
        </footer>
      </main>
    </div>
  );
}
