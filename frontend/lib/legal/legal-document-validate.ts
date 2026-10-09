import { validateMarkdown } from "./markdown";
import { LEGAL_DOC_LIMITS, type LegalDocumentContent } from "./legal-document";

/** Field path -> message, same convention as `validate.ts`'s `LegalValidationIssues`
 *  (`"sections[2].body"`, not a nested object) so error-dot/outline code can
 *  look a section up by index without walking a tree. */
export type LegalDocValidationIssues = Record<string, string>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Advisory mirror of the backend's authoritative check (ADR-012 §3) —
 *  immediate feedback for the outline's error dots and (Step 4) the
 *  pre-publish checklist. Every rule here has a backend-side twin before any
 *  write path trusts it. */
export function validateLegalDocument(content: LegalDocumentContent): LegalDocValidationIssues {
  const issues: LegalDocValidationIssues = {};

  if (!content.title.trim()) {
    issues.title = "Title is required";
  } else if (content.title.length > LEGAL_DOC_LIMITS.maxTitleLength) {
    issues.title = `Title exceeds ${LEGAL_DOC_LIMITS.maxTitleLength} characters`;
  }

  if (content.subtitle.length > LEGAL_DOC_LIMITS.maxSubtitleLength) {
    issues.subtitle = `Subtitle exceeds ${LEGAL_DOC_LIMITS.maxSubtitleLength} characters`;
  }

  if (!DATE_RE.test(content.lastUpdated)) {
    issues.lastUpdated = "Last updated is required";
  }

  if (!content.updatedBy.trim()) {
    issues.updatedBy = "Updated by is required";
  } else if (content.updatedBy.length > LEGAL_DOC_LIMITS.maxUpdatedByLength) {
    issues.updatedBy = `Updated by exceeds ${LEGAL_DOC_LIMITS.maxUpdatedByLength} characters`;
  }

  if (content.endNote) {
    const violation = validateMarkdown(content.endNote, LEGAL_DOC_LIMITS.maxEndNoteLength, "End note");
    // An empty end note is allowed (it's optional) — only check it once there's something to check.
    if (violation && violation !== "End note is required") issues.endNote = violation;
  }

  if (content.sections.length === 0) {
    issues.sections = "There must be at least one section";
  } else if (content.sections.length > LEGAL_DOC_LIMITS.maxSections) {
    issues.sections = `There are ${content.sections.length} sections; the maximum is ${LEGAL_DOC_LIMITS.maxSections}`;
  }

  const seenAnchors = new Set<string>();
  content.sections.forEach((section, i) => {
    const path = `sections[${i}]`;
    if (!section.title.trim()) {
      issues[`${path}.title`] = "Heading is required";
    } else if (section.title.length > LEGAL_DOC_LIMITS.maxSectionTitleLength) {
      issues[`${path}.title`] = `Heading exceeds ${LEGAL_DOC_LIMITS.maxSectionTitleLength} characters`;
    }

    if (!section.id || seenAnchors.has(section.id)) {
      issues[`${path}.id`] = section.id ? `Anchor "${section.id}" is used by more than one section` : "Every section needs an anchor";
    }
    seenAnchors.add(section.id);

    const bodyViolation = validateMarkdown(section.body, LEGAL_DOC_LIMITS.maxSectionBodyLength, "Body text");
    if (bodyViolation) issues[`${path}.body`] = bodyViolation;
  });

  return issues;
}

/** Whether any issue key belongs to the section at `index` — what the
 *  outline/accordion's red error dot keys off. */
export function sectionHasIssue(issues: LegalDocValidationIssues, index: number): boolean {
  const prefix = `sections[${index}].`;
  return Object.keys(issues).some((key) => key.startsWith(prefix));
}
