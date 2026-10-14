import { markdownWordCount } from "./markdown";

// req: ADR-010 (fit check), ADR-012 §3

/**
 * A legal page — Terms of Service and Privacy Policy share this one shape
 * since V81 (product owner, 2026-10-14: "just one text editor"): a title, a
 * subtitle, a last-updated byline and one Markdown `body`. A `##` heading in
 * the body is where a section starts; the page's contents list is built from
 * those (`markdownOutline`), so there is no separate list of sections to
 * keep in step with the text. Stored as the `content` jsonb object on
 * `legal_page_version` — `LegalDocumentValidator` (Java) is authoritative,
 * `legal-document-validate.ts` its advisory mirror.
 */
export type LegalDocumentContent = {
  title: string;
  subtitle: string;
  /** `YYYY-MM-DD`. */
  lastUpdated: string;
  updatedBy: string;
  /** Markdown, max `maxBodyLength`. */
  body: string;
};

export const LEGAL_DOC_LIMITS = {
  maxTitleLength: 80,
  maxSubtitleLength: 160,
  maxUpdatedByLength: 60,
  maxBodyLength: 120_000,
} as const;

export const DEFAULT_UPDATED_BY = "the Platform Team";

export const BLANK_LEGAL_DOCUMENT: LegalDocumentContent = {
  title: "",
  subtitle: "",
  lastUpdated: "",
  updatedBy: DEFAULT_UPDATED_BY,
  body: "",
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function list(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null) : [];
}

/**
 * Whatever the API returns, as a `LegalDocumentContent` — never `undefined`
 * fields. A row still in a pre-V81 shape (the backend not yet restarted
 * onto the migration, or an old History version) is converted the same way
 * V81 converts it in the database, so the editor and the public page work
 * either way instead of crashing on a missing `subtitle` or `body`.
 */
export function normalizeLegalDocument(raw: unknown): LegalDocumentContent {
  const c = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  let body = str(c.body);
  if (typeof c.body !== "string") {
    const parts: string[] = [];
    const plain = str(c.plainLanguage).trim();
    if (plain) parts.push("> " + plain.replace(/\n/g, "\n> "));
    const highlights = list(c.highlights)
      .filter((h) => str(h.title).trim() || str(h.text).trim())
      .map((h) => `- **${str(h.title).trim()}** — ${str(h.text).trim()}`);
    if (highlights.length) parts.push(highlights.join("\n"));
    for (const s of list(c.sections)) {
      parts.push([`## ${str(s.title).trim()}`, str(s.body).trim()].filter(Boolean).join("\n\n"));
    }
    const cta = (typeof c.cta === "object" && c.cta !== null ? c.cta : {}) as Record<string, unknown>;
    if (str(cta.title).trim()) parts.push([`## ${str(cta.title).trim()}`, str(cta.text).trim()].filter(Boolean).join("\n\n"));
    const endNote = str(c.endNote).trim();
    if (endNote) parts.push(`---\n\n${endNote}`);
    body = parts.join("\n\n");
  }
  return {
    title: str(c.title),
    subtitle: str(c.subtitle) || str(c.lead),
    lastUpdated: str(c.lastUpdated),
    updatedBy: str(c.updatedBy) || DEFAULT_UPDATED_BY,
    body,
  };
}

const WORDS_PER_MINUTE = 200;

export function legalDocWordCount(content: Pick<LegalDocumentContent, "body">): number {
  return markdownWordCount(content.body);
}

/** The "N min read" readout. */
export function legalDocReadMinutes(content: Pick<LegalDocumentContent, "body">): number {
  return Math.max(1, Math.ceil(legalDocWordCount(content) / WORDS_PER_MINUTE));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `"2026-10-01"` → `"1 Oct 2026"`. Parses the ISO fields directly rather
 *  than through `Date`, so the result never shifts a day for a reader in a
 *  different timezone. Returns the input unchanged if it isn't `yyyy-mm-dd`. */
export function formatLegalDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return iso;
  return `${Number(day)} ${monthName} ${year}`;
}
