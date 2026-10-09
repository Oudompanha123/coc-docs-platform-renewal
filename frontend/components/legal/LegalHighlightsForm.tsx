import { LegalIconPicker } from "./LegalIconPicker";
import { legalFieldInputClass, LegalFieldCounter, LegalFieldGroup } from "./LegalFieldGroup";
import { LEGAL_LIMITS, type LegalContent } from "@/lib/legal/content-types";
import type { LegalValidationIssues } from "@/lib/legal/validate";

/** Always exactly 3 cards (task spec C) — no add/remove, unlike Sections. */
export function LegalHighlightsForm({
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
  function updateHighlight(index: number, patch: Partial<LegalContent["highlights"][number]>) {
    const highlights = value.highlights.map((h, i) => (i === index ? { ...h, ...patch } : h));
    onChange({ ...value, highlights });
  }

  return (
    <LegalFieldGroup label="Highlight cards">
      <p className="-mt-1 mb-2 text-xs text-muted-foreground">3 short points at the top of the page.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {value.highlights.map((highlight, i) => (
          <div key={i} className="rounded-xl border border-surface-border p-3">
            <div className="flex items-center justify-between gap-2">
              <LegalIconPicker
                value={highlight.icon}
                disabled={disabled}
                onChange={(icon) => updateHighlight(i, { icon })}
              />
              <span className="text-xs font-semibold text-muted-foreground">Card {i + 1}</span>
            </div>

            <span className="mt-2 block text-xs font-semibold text-muted-foreground">
              Title<span className="text-danger"> *</span>
            </span>
            <input
              className={`${legalFieldInputClass} mt-1`}
              value={highlight.title}
              maxLength={LEGAL_LIMITS.maxHighlightTitleLength}
              disabled={disabled}
              onChange={(e) => updateHighlight(i, { title: e.target.value })}
            />
            <LegalFieldCounter charsLeft={LEGAL_LIMITS.maxHighlightTitleLength - highlight.title.length} />
            {issues[`highlights[${i}].title`] && (
              <p className="mt-1 text-xs text-danger">{issues[`highlights[${i}].title`]}</p>
            )}

            <span className="mt-2 block text-xs font-semibold text-muted-foreground">
              Text<span className="text-danger"> *</span>
            </span>
            <textarea
              rows={2}
              className={`${legalFieldInputClass} mt-1 h-[64px]`}
              value={highlight.text}
              maxLength={LEGAL_LIMITS.maxHighlightTextLength}
              disabled={disabled}
              onChange={(e) => updateHighlight(i, { text: e.target.value })}
            />
            <LegalFieldCounter charsLeft={LEGAL_LIMITS.maxHighlightTextLength - highlight.text.length} />
            {issues[`highlights[${i}].text`] && (
              <p className="mt-1 text-xs text-danger">{issues[`highlights[${i}].text`]}</p>
            )}
          </div>
        ))}
      </div>
      {issues.highlights && <p className="mt-2 text-xs text-danger">{issues.highlights}</p>}
    </LegalFieldGroup>
  );
}
