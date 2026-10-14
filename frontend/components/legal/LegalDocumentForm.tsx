import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "./RichTextEditor";
import { LEGAL_DOC_LIMITS, legalDocReadMinutes, type LegalDocumentContent } from "@/lib/legal/legal-document";
import type { LegalDocValidationIssues } from "@/lib/legal/legal-document-validate";

/**
 * A legal page's whole form (ADR-104 r2.13): the page's name and byline in
 * a compact grid, then one visual editor for everything readers read — it
 * looks like the published page as you type, and its section headings are
 * the page's sections, so there is no separate list of them to keep in step.
 *
 * Each field carries an id the publish dialog's "Go to field" can focus.
 */
export function LegalDocumentForm({
  value,
  onChange,
  issues,
  disabled,
}: {
  value: LegalDocumentContent;
  onChange: (next: LegalDocumentContent) => void;
  issues: LegalDocValidationIssues;
  disabled?: boolean;
}) {
  function set<K extends keyof LegalDocumentContent>(key: K, next: LegalDocumentContent[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="legal-title" label="Title" required error={issues.title} className="sm:col-span-2">
          <Input
            id="legal-title"
            value={value.title}
            maxLength={LEGAL_DOC_LIMITS.maxTitleLength}
            disabled={disabled}
            aria-invalid={Boolean(issues.title) || undefined}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Terms of Service"
          />
        </Field>
        <Field id="legal-subtitle" label="Subtitle" error={issues.subtitle} hint="Shown under the title." className="sm:col-span-2">
          <Input
            id="legal-subtitle"
            value={value.subtitle}
            maxLength={LEGAL_DOC_LIMITS.maxSubtitleLength}
            disabled={disabled}
            aria-invalid={Boolean(issues.subtitle) || undefined}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Coc Docs Platform · Legal Information"
          />
        </Field>
        <Field id="legal-last-updated" label="Last updated" required error={issues.lastUpdated}>
          <DatePicker
            id="legal-last-updated"
            aria-label="Last updated"
            className="w-full"
            value={value.lastUpdated}
            disabled={disabled}
            aria-invalid={Boolean(issues.lastUpdated) || undefined}
            onChange={(v) => set("lastUpdated", v)}
          />
        </Field>
        <Field id="legal-updated-by" label="Updated by" required error={issues.updatedBy}>
          <Input
            id="legal-updated-by"
            value={value.updatedBy}
            maxLength={LEGAL_DOC_LIMITS.maxUpdatedByLength}
            disabled={disabled}
            aria-invalid={Boolean(issues.updatedBy) || undefined}
            onChange={(e) => set("updatedBy", e.target.value)}
            placeholder="the Platform Team"
          />
        </Field>
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            Content<span className="text-danger"> *</span>
          </p>
          <span className="shrink-0 text-xs text-muted-foreground">{legalDocReadMinutes(value)} min read</span>
        </div>
        <div className="mt-2" id="legal-body">
          <RichTextEditor
            value={value.body}
            onChange={(body) => set("body", body)}
            maxLength={LEGAL_DOC_LIMITS.maxBodyLength}
            disabled={disabled}
            invalid={Boolean(issues.body)}
            placeholder="Start with a section heading, then write the text under it…"
          />
        </div>
        {issues.body && <p className="mt-1.5 text-xs text-danger">{issues.body}</p>}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
