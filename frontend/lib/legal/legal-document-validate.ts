import { validateMarkdown } from "./markdown";
import { LEGAL_DOC_LIMITS, type LegalDocumentContent } from "./legal-document";

/** Field path -> message. */
export type LegalDocValidationIssues = Record<string, string>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Advisory mirror of the backend's `LegalDocumentValidator` (ADR-012 §3) —
 *  immediate feedback in the form and the publish dialog. Every rule here has
 *  a backend twin before any write path trusts it. */
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

  const bodyViolation = validateMarkdown(content.body, LEGAL_DOC_LIMITS.maxBodyLength, "Content");
  if (bodyViolation) issues.body = bodyViolation;

  return issues;
}
