import type { ReactNode } from "react";
import { legalFieldInputClass, LegalFieldCounter, LegalFieldGroup } from "./LegalFieldGroup";
import { MarkdownEditor } from "./MarkdownEditor";
import { LEGAL_DOC_LIMITS, type LegalDocumentContent } from "@/lib/legal/legal-document";
import type { LegalDocValidationIssues } from "@/lib/legal/legal-document-validate";

const STATUS_OPTIONS: { value: LegalDocumentContent["status"]; label: string; description: string }[] = [
  { value: "draft", label: "Draft", description: 'Shows a "Sample text" badge on the live page.' },
  { value: "approved", label: "Approved", description: "Legal-approved. Badge hidden." },
];

/**
 * The Terms document's top-level fields, ALL of them — Title, Subtitle,
 * Document status, Sections, End note, Last updated + Updated by — in that
 * order, as one flush list of groups inside the shared card (task: "/legal-
 * pages: one card"). `sectionsSlot` is how `TermsSectionsAccordion` (owned
 * by the caller, since it's the only field with its own accordion/outline
 * UI) lands in its real spot, between Document status and End note, rather
 * than appended after every field here the way it used to be rendered as a
 * sibling outside this component entirely.
 */
export function TermsDocumentForm({
  value,
  onChange,
  issues,
  disabled,
  sectionsSlot,
}: {
  value: LegalDocumentContent;
  onChange: (next: LegalDocumentContent) => void;
  issues: LegalDocValidationIssues;
  disabled?: boolean;
  sectionsSlot?: ReactNode;
}) {
  function set<K extends keyof LegalDocumentContent>(key: K, val: LegalDocumentContent[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    // `divide-y` (a 1px border) + `space-y-7` (28px margin) stack on the same
    // non-first-child selector, giving exactly "28px spacing + 1px divider"
    // between groups (task spec §B) without a doubled gap from per-child
    // padding on both sides of each divider.
    <div className="divide-y divide-legal-divider space-y-7">
      <LegalFieldGroup label="Title" helper="Shown as the page heading." required>
        <input
          className={`${legalFieldInputClass} text-base font-semibold`}
          value={value.title}
          maxLength={LEGAL_DOC_LIMITS.maxTitleLength}
          disabled={disabled}
          onChange={(e) => set("title", e.target.value)}
        />
        <LegalFieldCounter charsLeft={LEGAL_DOC_LIMITS.maxTitleLength - value.title.length} />
        {issues.title && <p className="mt-1 text-xs text-danger">{issues.title}</p>}
      </LegalFieldGroup>

      <LegalFieldGroup label="Subtitle" helper="Small line under the title.">
        <input
          className={legalFieldInputClass}
          placeholder="Coc Docs Platform · Legal Information"
          value={value.subtitle}
          maxLength={LEGAL_DOC_LIMITS.maxSubtitleLength}
          disabled={disabled}
          onChange={(e) => set("subtitle", e.target.value)}
        />
        <LegalFieldCounter charsLeft={LEGAL_DOC_LIMITS.maxSubtitleLength - value.subtitle.length} />
        {issues.subtitle && <p className="mt-1 text-xs text-danger">{issues.subtitle}</p>}
      </LegalFieldGroup>

      <LegalFieldGroup label="Document status" helper='Draft shows a "Sample text" badge.'>
        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
          {STATUS_OPTIONS.map((option) => {
            const selected = value.status === option.value;
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                  selected ? "border-foreground/30 bg-legal-status-bg-selected" : "border-legal-status-border bg-card hover:border-foreground/30"
                } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name="legal-doc-status"
                  className="sr-only"
                  checked={selected}
                  disabled={disabled}
                  onChange={() => set("status", option.value)}
                />
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    selected ? "border-foreground/30" : "border-legal-status-border"
                  }`}
                >
                  {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="block text-xs text-muted-foreground">{option.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </LegalFieldGroup>

      {sectionsSlot}

      <LegalFieldGroup label="End note" helper="Small italic note at the bottom.">
        <MarkdownEditor
          value={value.endNote}
          onChange={(endNote) => onChange({ ...value, endNote })}
          maxLength={LEGAL_DOC_LIMITS.maxEndNoteLength}
          bulletStyle="circle"
          disabled={disabled}
          placeholder="An italic closing note shown at the bottom of the document…"
        />
        {issues.endNote && <p className="mt-1 text-xs text-danger">{issues.endNote}</p>}
      </LegalFieldGroup>

      <LegalFieldGroup label="Last updated" helper="Date and who updated it." required>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <input
              type="date"
              className={legalFieldInputClass}
              value={value.lastUpdated}
              disabled={disabled}
              onChange={(e) => set("lastUpdated", e.target.value)}
            />
            {issues.lastUpdated && <p className="mt-1 text-xs text-danger">{issues.lastUpdated}</p>}
          </div>
          <div>
            <input
              className={legalFieldInputClass}
              placeholder="Updated by"
              value={value.updatedBy}
              maxLength={LEGAL_DOC_LIMITS.maxUpdatedByLength}
              disabled={disabled}
              onChange={(e) => set("updatedBy", e.target.value)}
            />
            {issues.updatedBy && <p className="mt-1 text-xs text-danger">{issues.updatedBy}</p>}
          </div>
        </div>
      </LegalFieldGroup>
    </div>
  );
}
