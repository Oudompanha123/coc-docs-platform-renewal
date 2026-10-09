import Link from "next/link";
import { ClockIcon, MailIcon, SparklesIcon } from "@/components/layout/icons";
import { legalIconFor } from "@/lib/legal/icon-options";
import { estimateReadMinutes, type LegalContent } from "@/lib/legal/content-types";
import { MarkdownView } from "./MarkdownView";

export type LegalSlugName = "privacy";

function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** Decorative stacked-pages graphic for the hero — no illustration asset
 *  pipeline exists in this project (CONST-RES-01), so this is a small inline
 *  SVG built from the same primitives `DashboardPreview`'s own decorative
 *  mock uses, not an imported image. */
function HeroIllustration() {
  return (
    <div aria-hidden="true" className="relative hidden h-[150px] w-[180px] shrink-0 sm:block">
      <div className="absolute left-0 top-4 h-[130px] w-[130px] -rotate-6 rounded-2xl bg-white/70 shadow-lg" />
      <div className="absolute right-0 top-0 flex h-[140px] w-[130px] rotate-3 flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-xl">
        <div className="h-2 w-12 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />
        <div className="h-1.5 w-full rounded-full bg-page" />
        <div className="h-1.5 w-full rounded-full bg-page" />
        <div className="h-1.5 w-3/4 rounded-full bg-page" />
        <div className="mt-1 h-1.5 w-full rounded-full bg-page" />
        <div className="h-1.5 w-2/3 rounded-full bg-page" />
      </div>
      <span className="absolute bottom-0 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow-lg">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
          <path
            d="M10 2.5 16 5v4.5c0 4-2.5 7-6 8-3.5-1-6-4-6-8V5l6-2.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}

/**
 * The one shared layout for Terms of Service / Privacy Policy — rendered by
 * the public `/terms`/`/privacy` pages. The admin editor doesn't render a
 * whole-page live preview of this layout; each section's own Markdown
 * editor has its own Preview/side-by-side modes instead, and "View live
 * page" opens this layout for real.
 *
 * Hero / highlights / plain-language box / sections / CTA, matching the
 * approved mockup — no Terms<->Privacy switch on this page itself; that
 * navigation lives on the register/welcome pages' own links and the admin
 * editor's own tabs.
 */
export function LegalPageLayout({ content }: { content: LegalContent }) {
  const minutes = estimateReadMinutes(content);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#ede9fe] via-[#e0e7ff] to-[#fae8ff] p-8 sm:flex-row sm:justify-between sm:p-10">
        <div>
          {content.eyebrow && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-purple">
              <SparklesIcon className="h-3.5 w-3.5" />
              {content.eyebrow}
            </span>
          )}
          <h1 className="mt-4 bg-gradient-to-r from-brand-purple to-brand-blue bg-clip-text text-[34px] font-extrabold leading-tight text-transparent sm:text-[46px]">
            {content.title || "Untitled"}
          </h1>
          {content.lead && <p className="mt-2 max-w-md text-[15px] text-muted">{content.lead}</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              Last updated {formatDisplayDate(content.lastUpdated)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              {minutes} min read
            </span>
          </div>
          {content.status === "draft" && (
            <p className="mt-3 inline-block rounded-full bg-[#fde68a]/50 px-2.5 py-0.5 text-xs font-semibold text-[#92610b]">
              Sample text — replace with approved legal content
            </p>
          )}
        </div>
        <HeroIllustration />
      </div>

      {/* Highlight cards */}
      <div className="mt-8 grid grid-cols-1 gap-[18px] sm:grid-cols-3">
        {content.highlights.map((highlight, i) => {
          const Icon = legalIconFor(highlight.icon);
          return (
            <div key={i} className="rounded-[10px] border border-border bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-ink">{highlight.title || "Untitled"}</p>
              <p className="mt-1 text-sm leading-snug text-muted">{highlight.text}</p>
            </div>
          );
        })}
      </div>

      {/* In plain language */}
      <div className="mt-6 rounded-2xl bg-brand-purple/5 p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-purple">In plain language</p>
        <MarkdownView source={content.plainLanguage} bulletStyle={content.bulletStyle} className="mt-2 space-y-2" />
      </div>

      {/* Sections */}
      <div className="mt-8 space-y-4">
        {content.sections.map((section, i) => {
          const Icon = legalIconFor(section.icon);
          return (
            <div key={section.id} id={section.id} className="rounded-[10px] border border-border bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    Section {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-0.5 text-[19px] font-bold text-ink">{section.title || "Untitled"}</h2>
                  <MarkdownView source={section.body} bulletStyle={content.bulletStyle} className="mt-2 space-y-2" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-blue p-6 text-white sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <MailIcon className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="font-bold">{content.cta.title || "Have a question?"}</p>
            <p className="text-sm text-white/85">{content.cta.text}</p>
          </div>
        </div>
        <Link
          href="/register"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-purple shadow hover:opacity-90"
        >
          <span aria-hidden="true">←</span>
          Back to Register
        </Link>
      </div>
    </div>
  );
}
