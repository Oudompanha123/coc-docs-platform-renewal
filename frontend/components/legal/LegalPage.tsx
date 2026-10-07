"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ClockIcon, MailIcon, SparklesIcon } from "@/components/layout/icons";
import { HistoryIcon } from "@/components/legal/icons";
import { LEGAL_DOCUMENTS, LEGAL_LAST_UPDATED, type LegalDoc, type LegalDocKey } from "@/components/legal/content";

/** Two-digit section number, so "01" and "10" line up in the contents rail. */
function ordinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * Highlights the section currently under the top of the viewport and tracks
 * how far down the page the reader is.
 *
 * <p>No IntersectionObserver (older Safari, jsdom) just means nothing is ever
 * highlighted — the contents list still navigates. Same "polish, not a gate"
 * stance `ScrollReveal` takes.
 */
function useReadingPosition(sectionIds: string[]): { active: string; progress: number } {
  const [active, setActive] = useState(sectionIds[0] ?? "");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setActive(sectionIds[0] ?? "");
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        setActive(topMost.target.id);
      },
      // A section counts as "current" once its top passes just below the
      // viewport top, and stops counting once it has scrolled 72% of the way
      // up — by then the next section is the one being read.
      { rootMargin: "-12% 0px -72% 0px", threshold: 0 },
    );
    for (const id of sectionIds) {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sectionIds]);

  useEffect(() => {
    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return { active, progress };
}

/**
 * `/terms` and `/privacy` — the two pages the registration form's "I agree to
 * the Terms of Service and Privacy Policy" links open (FR-AUTH-002).
 *
 * <p>One component renders both — the route picks the document — so each keeps
 * its own URL, title and back-button entry. Both are entered from the
 * registration form's agreement checkbox, and the closing band is the way
 * back to it.
 *
 * <p>Deliberately light-only, like `/login` and `/register` (AuthShell) which
 * it sits beside in the registration flow — it is outside the
 * `[data-shell]` scopes the app's dark theme targets.
 *
 * // req: FR-AUTH-002
 */
export function LegalPage({ docKey }: { docKey: LegalDocKey }) {
  const doc: LegalDoc = LEGAL_DOCUMENTS[docKey];
  // Memoised: it is the scroll-spy effect's dependency, and a fresh array
  // every render would re-observe (and reset the active section) on each
  // scroll-driven state update.
  const sectionIds = useMemo(() => doc.sections.map((section) => section.id), [doc]);
  const { active, progress } = useReadingPosition(sectionIds);

  const goToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  return (
    <div className="min-h-screen bg-page text-[15px] leading-[1.68] text-[#3c3853]">
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-40 h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-brand-purple to-brand-blue transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto max-w-[1080px] px-4 pt-6 pb-14 sm:px-5">
        <header className="animate-entrance relative grid items-center gap-5 overflow-hidden rounded-[20px] border border-border bg-gradient-to-br from-[#ded9f8] to-[#d3e2fb] px-6 pt-8 pb-9 shadow-xl md:grid-cols-[1.15fr_0.85fr] md:px-9">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-[#c8b8f2] opacity-60 blur-3xl" />
            <div className="absolute -top-10 left-[38%] h-28 w-28 rounded-full bg-[#a9e0d2] opacity-60 blur-2xl" />
            <div className="absolute -bottom-16 left-[8%] h-36 w-36 rounded-full bg-[#e8cfa3] opacity-60 blur-2xl" />
            <div className="absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-[#a9bdf5] opacity-60 blur-3xl" />
          </div>

          <div className="relative z-10 order-2 md:order-1">
            <p className="mb-2.5 inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-[#5c5880] uppercase">
              <SparklesIcon className="h-3.5 w-3.5 text-brand-purple" />
              Coc Docs Platform · Legal
            </p>
            <h1 className="text-pretty m-0 text-[clamp(1.85rem,4.4vw,2.6rem)] leading-[1.08] font-extrabold tracking-[-0.03em]">
              <span className="bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-transparent">
                {doc.name}
              </span>
            </h1>
            <p className="mt-3 max-w-[44ch] text-[15.5px] text-[#5c5880]">{doc.summary}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-1 text-[12.5px] font-semibold text-ink backdrop-blur-sm">
                <HistoryIcon className="h-3.5 w-3.5 text-brand-purple" />
                Last updated {LEGAL_LAST_UPDATED}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/90 bg-white/70 px-3 py-1 text-[12.5px] font-semibold text-ink backdrop-blur-sm">
                <ClockIcon className="h-3.5 w-3.5 text-brand-purple" />
                {doc.readingTime}
              </span>
            </div>
          </div>

          <div className="relative z-10 order-1 grid place-items-center md:order-2">
            <LegalArtwork />
          </div>
        </header>

        <section aria-label="At a glance" className="mt-7 mb-8 grid gap-3.5 md:grid-cols-3">
          {doc.highlights.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-white px-4.5 py-4.5 transition-[transform,box-shadow] hover:-translate-y-[3px] hover:shadow-lg"
            >
              <span className="grid h-9.5 w-9.5 place-items-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white shadow-md">
                <Icon className="h-[19px] w-[19px]" />
              </span>
              <h2 className="mt-3 mb-1 text-[14.5px] font-bold tracking-[-0.01em] text-ink">{title}</h2>
              <p className="m-0 text-[13.5px] leading-relaxed text-muted">{body}</p>
            </article>
          ))}
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[238px_minmax(0,1fr)] lg:gap-8">
          <nav
            aria-label="On this page"
            className="rounded-2xl border border-border bg-white p-4 lg:sticky lg:top-6"
          >
            <p className="mb-3 ml-1.5 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">On this page</p>
            <ol className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-px p-0 lg:flex lg:max-h-[min(60vh,520px)] lg:flex-col lg:overflow-y-auto">
              {doc.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      goToSection(section.id);
                    }}
                    aria-current={active === section.id ? "true" : undefined}
                    className={`grid grid-cols-[1.25rem_minmax(0,1fr)] items-start gap-1.5 rounded-lg px-2 py-1.5 text-[13px] leading-snug transition-colors ${
                      active === section.id
                        ? "bg-brand-purple/10 font-semibold text-brand-purple"
                        : "text-muted hover:bg-page hover:text-ink"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pt-0.5 text-[10.5px] font-extrabold tabular-nums ${
                        active === section.id ? "text-brand-purple" : "text-border"
                      }`}
                    >
                      {ordinal(index)}
                    </span>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
            <p className="mt-3.5 mb-0 flex items-center gap-2 px-1.5 text-[11.5px] text-muted">
              <span aria-hidden="true" className="h-1 flex-1 overflow-hidden rounded-full bg-page">
                <span
                  className="block h-full bg-gradient-to-r from-brand-purple to-brand-blue transition-[width] duration-100"
                  style={{ width: `${progress}%` }}
                />
              </span>
              <span className="font-bold text-ink tabular-nums">{progress}%</span>
            </p>
          </nav>

          <article className="flex flex-col gap-3.5">
            <div className="relative overflow-hidden rounded-2xl border border-brand-purple/15 bg-brand-purple/5 px-6 py-5.5">
              <p className="mb-2 text-[11px] font-bold tracking-[0.14em] text-brand-purple uppercase">
                In plain language
              </p>
              <p className="m-0 max-w-[58ch] text-[15.5px]">{doc.lede}</p>
            </div>

            {doc.sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-6 rounded-2xl border border-border bg-white px-6 py-5.5 transition-colors hover:border-[#ddd9ea]"
              >
                <header className="mb-3 grid grid-cols-[2.375rem_minmax(0,1fr)] items-center gap-3.5">
                  <span className="grid h-9.5 w-9.5 place-items-center rounded-xl border border-brand-purple/20 bg-brand-purple/10 text-brand-purple">
                    <section.icon className="h-[19px] w-[19px]" />
                  </span>
                  <h2 className="text-pretty m-0 text-[17px] font-bold tracking-[-0.015em] text-ink">
                    <span className="mb-0.5 block text-[10.5px] font-bold tracking-[0.14em] text-muted uppercase">
                      Section {ordinal(index)}
                    </span>
                    {section.title}
                  </h2>
                </header>
                {section.body}
              </section>
            ))}

            <div className="relative mt-3 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-6 text-white shadow-lg">
              <div className="relative z-10 grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/30 bg-white/20">
                  <MailIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="m-0 mb-0.5 text-[17px] font-bold tracking-[-0.015em]">Have a question?</h2>
                  <p className="m-0 text-[13.5px] text-white/85">
                    Our team is happy to explain anything on this page.
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex flex-wrap gap-2.5">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-[10px] bg-white px-4.5 py-2.5 text-sm font-semibold text-brand-purple transition-transform hover:-translate-y-0.5"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                  Back to Register
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

/** Decorative stack of document sheets with a shield badge, matching the auth pages' soft palette. */
function LegalArtwork() {
  return (
    <svg
      viewBox="0 0 320 250"
      role="presentation"
      aria-hidden="true"
      className="w-full max-w-[300px] drop-shadow-xl"
    >
      <defs>
        <linearGradient id="legal-brand" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d3ce0" />
          <stop offset="1" stopColor="#4c6ff0" />
        </linearGradient>
        <linearGradient id="legal-paper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#f3f2fb" />
        </linearGradient>
      </defs>

      <g opacity="0.92">
        <rect
          x="22"
          y="48"
          width="150"
          height="178"
          rx="16"
          fill="url(#legal-paper)"
          stroke="#e3dff3"
          transform="rotate(-7 97 137)"
        />
        <g transform="rotate(-7 97 137)" fill="#ded9f8">
          <rect x="42" y="74" width="80" height="9" rx="4.5" />
          <rect x="42" y="94" width="108" height="7" rx="3.5" />
          <rect x="42" y="109" width="98" height="7" rx="3.5" />
          <rect x="42" y="124" width="104" height="7" rx="3.5" />
          <rect x="42" y="139" width="72" height="7" rx="3.5" />
          <rect x="42" y="162" width="108" height="7" rx="3.5" />
          <rect x="42" y="177" width="86" height="7" rx="3.5" />
        </g>
      </g>

      <g>
        <rect x="112" y="26" width="166" height="196" rx="18" fill="url(#legal-paper)" stroke="#ded9f8" strokeWidth="1.5" />
        <rect x="136" y="52" width="68" height="10" rx="5" fill="url(#legal-brand)" />
        <g fill="#e6e3f6">
          <rect x="136" y="76" width="118" height="8" rx="4" />
          <rect x="136" y="92" width="104" height="8" rx="4" />
          <rect x="136" y="108" width="114" height="8" rx="4" />
        </g>
        <rect x="136" y="130" width="118" height="42" rx="10" fill="#f4f1fe" stroke="#e3daf9" />
        <g fill="#cfc6f3">
          <rect x="148" y="142" width="74" height="7" rx="3.5" />
          <rect x="148" y="155" width="58" height="7" rx="3.5" />
        </g>
        <rect x="136" y="186" width="92" height="8" rx="4" fill="#e6e3f6" />
      </g>

      <g transform="translate(228 144)">
        <circle cx="30" cy="30" r="32" fill="url(#legal-brand)" opacity="0.16" />
        <circle cx="30" cy="30" r="25" fill="url(#legal-brand)" />
        <g
          transform="translate(16 16) scale(0.58)"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3 5 6v5.5c0 4.3 2.9 8.3 7 9.5 4.1-1.2 7-5.2 7-9.5V6z" />
          <path d="m9.2 12 2 2 3.6-3.9" />
        </g>
      </g>
    </svg>
  );
}
