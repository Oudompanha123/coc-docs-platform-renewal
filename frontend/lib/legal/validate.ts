/**
 * Advisory mirror of `backend`'s `LegalContentValidator` (ADR-012 §3) — for
 * immediate inline feedback as an admin types. The backend re-validates on
 * every save and publish regardless; nothing here is a security boundary.
 *
 * Returns a map of dotted field path -> message, keyed the same way the
 * backend's own `ValidationIssue.path` is, so a server-side 422's issues can
 * be merged into the same map a caller already renders from.
 */

import { LEGAL_LIMITS, type LegalContent, type LegalHighlight, type LegalSection } from "./content-types";
import { validateMarkdown } from "./markdown";

export type LegalValidationIssues = Record<string, string>;

function requireNonBlank(
  issues: LegalValidationIssues,
  path: string,
  value: string | undefined,
  maxLength: number,
  label: string,
) {
  if (!value || value.trim().length === 0) {
    issues[path] = `${label} is required`;
  } else if (value.length > maxLength) {
    issues[path] = `${label} exceeds ${maxLength} characters`;
  }
}

function validateHighlight(issues: LegalValidationIssues, index: number, highlight: LegalHighlight) {
  const path = `highlights[${index}]`;
  requireNonBlank(issues, `${path}.icon`, highlight.icon, 40, "Icon");
  requireNonBlank(issues, `${path}.title`, highlight.title, LEGAL_LIMITS.maxHighlightTitleLength, "Title");
  requireNonBlank(issues, `${path}.text`, highlight.text, LEGAL_LIMITS.maxHighlightTextLength, "Text");
}

function validateSection(issues: LegalValidationIssues, index: number, section: LegalSection, seenIds: Set<string>) {
  const path = `sections[${index}]`;

  if (!section.id || section.id.trim().length === 0) {
    issues[`${path}.id`] = "Every section needs an anchor id";
  } else if (seenIds.has(section.id)) {
    issues[`${path}.id`] = `Anchor "${section.id}" is used by more than one section`;
  } else {
    seenIds.add(section.id);
  }

  requireNonBlank(issues, `${path}.title`, section.title, LEGAL_LIMITS.maxSectionTitleLength, "Title");
  requireNonBlank(issues, `${path}.icon`, section.icon, 40, "Icon");

  const bodyViolation = validateMarkdown(section.body, LEGAL_LIMITS.maxSectionBodyLength, "Body text");
  if (bodyViolation) issues[`${path}.body`] = bodyViolation;
}

export function validateLegalContent(content: LegalContent): LegalValidationIssues {
  const issues: LegalValidationIssues = {};

  requireNonBlank(issues, "title", content.title, LEGAL_LIMITS.maxTitleLength, "Title");
  requireNonBlank(issues, "lastUpdated", content.lastUpdated, 32, "Last updated");
  if (content.lead && content.lead.length > LEGAL_LIMITS.maxLeadLength) {
    issues.lead = `Lead line exceeds ${LEGAL_LIMITS.maxLeadLength} characters`;
  }
  if (content.eyebrow && content.eyebrow.length > LEGAL_LIMITS.maxEyebrowLength) {
    issues.eyebrow = `Eyebrow exceeds ${LEGAL_LIMITS.maxEyebrowLength} characters`;
  }

  if (content.highlights.length !== LEGAL_LIMITS.highlightCount) {
    issues.highlights = `There must be exactly ${LEGAL_LIMITS.highlightCount} highlight cards`;
  }
  content.highlights.forEach((h, i) => validateHighlight(issues, i, h));

  const plainLanguageViolation = validateMarkdown(content.plainLanguage, LEGAL_LIMITS.maxPlainLanguageLength, "Plain language");
  if (plainLanguageViolation) issues.plainLanguage = plainLanguageViolation;

  if (content.bulletStyle !== "circle" && content.bulletStyle !== "check") {
    issues.bulletStyle = 'Bullet style must be "circle" or "check"';
  }

  requireNonBlank(issues, "cta.title", content.cta?.title, LEGAL_LIMITS.maxCtaTitleLength, "CTA title");
  requireNonBlank(issues, "cta.text", content.cta?.text, LEGAL_LIMITS.maxCtaTextLength, "CTA text");

  if (content.sections.length === 0) {
    issues.sections = "There must be at least one section";
  } else if (content.sections.length > LEGAL_LIMITS.maxSections) {
    issues.sections = `There are ${content.sections.length} sections; the maximum is ${LEGAL_LIMITS.maxSections}`;
  }
  const seenIds = new Set<string>();
  content.sections.forEach((s, i) => validateSection(issues, i, s, seenIds));

  return issues;
}

export function isLegalContentValid(content: LegalContent): boolean {
  return Object.keys(validateLegalContent(content)).length === 0;
}

/** `"Using the platform"` -> `"using-the-platform"` — the same slugify a
 *  section's anchor is derived from as its title changes, until an admin
 *  edits the anchor directly (tracked by the caller, not here). */
export function slugifyAnchor(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
