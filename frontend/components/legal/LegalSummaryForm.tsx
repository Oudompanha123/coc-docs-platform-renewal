import { legalFieldInputClass, LegalFieldCounter, LegalFieldGroup } from "./LegalFieldGroup";
import { MarkdownEditor } from "./MarkdownEditor";
import { LEGAL_LIMITS, type LegalContent } from "@/lib/legal/content-types";
import type { LegalValidationIssues } from "@/lib/legal/validate";

/**
 * The "In plain language" box and the bottom CTA box — both page-level, not
 * per-section. CTA is plain text throughout (button destination/label are
 * fixed, not editable).
 */
export function LegalSummaryForm({
  value,
  onChange,
  issues,
  disabled,
}: {
  value: LegalContent;
  onChange: (next: LegalContent) => void;
  issues: LegalValidationIssues;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-5">
      <LegalFieldGroup label="In plain language" required>
        <MarkdownEditor
          value={value.plainLanguage}
          onChange={(plainLanguage) => onChange({ ...value, plainLanguage })}
          maxLength={LEGAL_LIMITS.maxPlainLanguageLength}
          bulletStyle={value.bulletStyle}
          disabled={disabled}
          placeholder="Summarize this page in a sentence or two…"
        />
        {issues.plainLanguage && <p className="mt-1 text-xs text-danger">{issues.plainLanguage}</p>}
      </LegalFieldGroup>

      <LegalFieldGroup label="Call to action">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className="block text-xs font-semibold text-muted">
              Title<span className="text-danger"> *</span>
            </span>
            <input
              className={`${legalFieldInputClass} mt-1.5`}
              value={value.cta.title}
              maxLength={LEGAL_LIMITS.maxCtaTitleLength}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, cta: { ...value.cta, title: e.target.value } })}
            />
            <LegalFieldCounter charsLeft={LEGAL_LIMITS.maxCtaTitleLength - value.cta.title.length} />
            {issues["cta.title"] && <p className="mt-1 text-xs text-danger">{issues["cta.title"]}</p>}
          </div>

          <div>
            <span className="block text-xs font-semibold text-muted">
              Text<span className="text-danger"> *</span>
            </span>
            <input
              className={`${legalFieldInputClass} mt-1.5`}
              value={value.cta.text}
              maxLength={LEGAL_LIMITS.maxCtaTextLength}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, cta: { ...value.cta, text: e.target.value } })}
            />
            <LegalFieldCounter charsLeft={LEGAL_LIMITS.maxCtaTextLength - value.cta.text.length} />
            {issues["cta.text"] && <p className="mt-1 text-xs text-danger">{issues["cta.text"]}</p>}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">The button stays automatic — &ldquo;Back to Register&rdquo;.</p>
      </LegalFieldGroup>
    </div>
  );
}
