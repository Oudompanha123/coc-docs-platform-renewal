/**
 * The Legal page content shape — Terms of Service / Privacy Policy, stored
 * as the `content` jsonb column on `legal_page_version` (`backend`'s
 * `LegalContentValidator`/`MarkdownValidator` are the authoritative mirror
 * of every limit and whitelist here; this file is advisory only, ADR-012
 * §3).
 *
 * `plainLanguage` and every section's `body` are plain Markdown strings in
 * the small whitelisted dialect `markdown.ts` parses — never raw HTML
 * (ADR-010 §3's structural no-raw-HTML rule still applies: the renderer
 * never uses `dangerouslySetInnerHTML`, so unsupported/unsafe syntax is
 * inert text, not markup).
 */

import { markdownWordCount } from "./markdown";

export type LegalHighlight = {
  icon: string;
  title: string;
  text: string;
};

export type LegalSection = {
  id: string;
  title: string;
  icon: string;
  body: string;
};

export type LegalCta = {
  title: string;
  text: string;
};

export type LegalContent = {
  title: string;
  lead: string;
  /** The small pill above the title ("Coc Docs Platform · Legal") — optional,
   *  plain text only. */
  eyebrow: string;
  lastUpdated: string;
  status: "draft" | "approved";
  highlights: LegalHighlight[];
  plainLanguage: string;
  sections: LegalSection[];
  /** Applied to every bullet list in the document when rendering — not
   *  stored per-list. Terms uses "circle", Privacy uses "check" (screenshots). */
  bulletStyle: "circle" | "check";
  cta: LegalCta;
};

export const LEGAL_LIMITS = {
  maxTitleLength: 80,
  maxLeadLength: 160,
  maxEyebrowLength: 40,
  highlightCount: 3,
  maxHighlightTitleLength: 40,
  maxHighlightTextLength: 120,
  maxSectionTitleLength: 80,
  maxSections: 15,
  maxPlainLanguageLength: 600,
  maxSectionBodyLength: 2_000,
  maxCtaTitleLength: 40,
  maxCtaTextLength: 120,
} as const;

export const BLANK_HIGHLIGHT: LegalHighlight = { icon: "document", title: "", text: "" };

export const BLANK_CTA: LegalCta = { title: "", text: "" };

export function blankSection(id: string): LegalSection {
  return { id, title: "", icon: "document", body: "" };
}

const WORDS_PER_MINUTE = 200;

/** The hero's "N min read" chip — shared by the public page and the admin
 *  form's read-only readout next to "Last updated", so the two never say
 *  different numbers. */
export function estimateReadMinutes(content: Pick<LegalContent, "plainLanguage" | "sections">): number {
  const words =
    markdownWordCount(content.plainLanguage) + content.sections.reduce((n, s) => n + markdownWordCount(s.body), 0);
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export const BLANK_LEGAL_CONTENT: LegalContent = {
  title: "",
  lead: "",
  eyebrow: "",
  lastUpdated: "",
  status: "draft",
  highlights: [BLANK_HIGHLIGHT, { ...BLANK_HIGHLIGHT }, { ...BLANK_HIGHLIGHT }],
  plainLanguage: "",
  sections: [],
  bulletStyle: "circle",
  cta: { ...BLANK_CTA },
};
