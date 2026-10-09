import { markdownWordCount } from "./markdown";

// req: ADR-010 (fit check), ADR-012 §3

/**
 * The Legal pages content shape (task spec "Admin 'Legal pages' editor
 * ONLY", replacing the earlier highlights/eyebrow/CTA field set): a plain
 * document — title, subtitle, an ordered list of anchored sections, an end
 * note, and a last-updated byline. Stored as the `content` jsonb object on
 * `legal_page_version` (ADR-010 doesn't fit: that's an array-of-blocks
 * model for general docs pages, and this content is object-shaped — see
 * `V68__legal_pages.sql`).
 */

export type LegalDocStatus = "draft" | "approved";

export type LegalDocSection = {
  /** Doubles as the anchor id (`#acceptable-use`) — unique within the
   *  document, slugified from the title when a section is added or renamed. */
  id: string;
  title: string;
  /** Markdown, max `maxSectionBodyLength`. */
  body: string;
};

export type LegalDocumentContent = {
  title: string;
  subtitle: string;
  status: LegalDocStatus;
  sections: LegalDocSection[];
  /** Markdown, max `maxEndNoteLength`. */
  endNote: string;
  lastUpdated: string;
  updatedBy: string;
};

export const LEGAL_DOC_LIMITS = {
  maxTitleLength: 80,
  maxSubtitleLength: 120,
  maxSectionTitleLength: 80,
  maxSectionBodyLength: 4_000,
  maxEndNoteLength: 400,
  maxUpdatedByLength: 60,
  maxSections: 30,
} as const;

export const DEFAULT_UPDATED_BY = "the Platform Team";

export const BLANK_LEGAL_DOCUMENT: LegalDocumentContent = {
  title: "",
  subtitle: "",
  status: "draft",
  sections: [],
  endNote: "",
  lastUpdated: "",
  updatedBy: DEFAULT_UPDATED_BY,
};

/** Lowercases, strips punctuation, and dashes the rest — `"Acceptable Use"`
 *  → `"acceptable-use"`. Falls back to `"section"` for a title with no
 *  letters or digits (e.g. one that is empty or all punctuation), since an
 *  anchor can't be blank. */
export function slugifyAnchor(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "section";
}

/** Appends `-2`, `-3`, ... until the anchor doesn't collide with `existing`. */
export function uniqueAnchor(anchor: string, existing: ReadonlySet<string>): string {
  if (!existing.has(anchor)) return anchor;
  let n = 2;
  while (existing.has(`${anchor}-${n}`)) n++;
  return `${anchor}-${n}`;
}

export function legalDocWordCount(content: Pick<LegalDocumentContent, "sections" | "endNote">): number {
  return content.sections.reduce((n, s) => n + markdownWordCount(s.body), 0) + markdownWordCount(content.endNote);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `"2026-10-01"` → `"1 Oct 2026"`, the mockup's byline date format. Parses
 *  the ISO date fields directly rather than through `Date`, so the result
 *  never shifts a day for a reader in a different timezone. Returns the
 *  input unchanged if it isn't a plain `yyyy-mm-dd` string. */
export function formatLegalDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return iso;
  return `${Number(day)} ${monthName} ${year}`;
}
