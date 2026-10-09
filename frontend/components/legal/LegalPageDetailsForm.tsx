import { legalFieldInputClass, legalFieldTextareaClass, LegalFieldCounter, LegalFieldGroup } from "./LegalFieldGroup";
import { CheckCircleIcon, ClockIcon } from "@/components/layout/icons";
import { estimateReadMinutes, LEGAL_LIMITS, type LegalContent } from "@/lib/legal/content-types";
import type { LegalValidationIssues } from "@/lib/legal/validate";

const STATUS_OPTIONS: {
  value: LegalContent["status"];
  label: string;
  description: string;
  icon: typeof ClockIcon;
  tint: string;
}[] = [
  {
    value: "draft",
    label: "Draft",
    description: 'Shows a "Sample text" badge on the live page.',
    icon: ClockIcon,
    tint: "bg-[#fffbeb] text-[#b45309]",
  },
  {
    value: "approved",
    label: "Approved",
    description: "Legal-approved. Badge hidden.",
    icon: CheckCircleIcon,
    tint: "bg-[#e1f5ec] text-[#1f9d6b]",
  },
];

export function LegalPageDetailsForm({
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
  function set<K extends keyof LegalContent>(key: K, val: LegalContent[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-5">
      <LegalFieldGroup label="Title" required>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <input
              className={`${legalFieldInputClass} text-base font-semibold`}
              value={value.title}
              maxLength={LEGAL_LIMITS.maxTitleLength}
              disabled={disabled}
              onChange={(e) => set("title", e.target.value)}
            />
            <LegalFieldCounter charsLeft={LEGAL_LIMITS.maxTitleLength - value.title.length} />
            {issues.title && <p className="mt-1 text-xs text-danger">{issues.title}</p>}
          </div>
          <div>
            <span className="block text-xs font-semibold text-muted">
              Last updated<span className="text-danger"> *</span>
            </span>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                type="date"
                className={legalFieldInputClass}
                value={value.lastUpdated}
                disabled={disabled}
                onChange={(e) => set("lastUpdated", e.target.value)}
              />
              <span className="shrink-0 whitespace-nowrap text-xs text-muted">{estimateReadMinutes(value)} min read</span>
            </div>
            {issues.lastUpdated && <p className="mt-1 text-xs text-danger">{issues.lastUpdated}</p>}
          </div>
        </div>
      </LegalFieldGroup>

      <LegalFieldGroup label="Summary" required>
        <span className="-mt-1 mb-1.5 block text-xs text-muted">Lead line under the title</span>
        <textarea
          rows={2}
          className={legalFieldTextareaClass}
          value={value.lead}
          maxLength={LEGAL_LIMITS.maxLeadLength}
          disabled={disabled}
          onChange={(e) => set("lead", e.target.value)}
        />
        <LegalFieldCounter charsLeft={LEGAL_LIMITS.maxLeadLength - value.lead.length} />
        {issues.lead && <p className="mt-1 text-xs text-danger">{issues.lead}</p>}
      </LegalFieldGroup>

      <LegalFieldGroup label="Hero eyebrow">
        <input
          className={legalFieldInputClass}
          value={value.eyebrow}
          maxLength={LEGAL_LIMITS.maxEyebrowLength}
          disabled={disabled}
          onChange={(e) => set("eyebrow", e.target.value)}
        />
        <LegalFieldCounter charsLeft={LEGAL_LIMITS.maxEyebrowLength - value.eyebrow.length} />
        {issues.eyebrow && <p className="mt-1 text-xs text-danger">{issues.eyebrow}</p>}
      </LegalFieldGroup>

      <div className="rounded-2xl border border-border/70 bg-page/60 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Status</span>
        <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {STATUS_OPTIONS.map((option) => {
            const selected = value.status === option.value;
            const Icon = option.icon;
            return (
              <label
                key={option.value}
                className={`relative flex cursor-pointer items-start gap-2.5 rounded-xl border bg-white p-3 transition-all ${
                  selected ? "border-brand-purple shadow-[0_2px_12px_rgba(109,94,246,0.12)]" : "border-border hover:border-[#c7cbe8]"
                } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name="legal-status"
                  className="sr-only"
                  checked={selected}
                  disabled={disabled}
                  onChange={() => set("status", option.value)}
                />
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${option.tint}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-dash-ink">{option.label}</span>
                  <span className="block text-xs text-muted">{option.description}</span>
                </span>
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue"
                  />
                )}
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-page/60 p-4">
        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">Bullet style</span>
        <p className="mt-0.5 text-xs text-muted">Applied to every bullet list on this page.</p>
        <div className="mt-2.5 inline-flex rounded-full border border-border bg-white p-1">
          {(["circle", "check"] as const).map((style) => {
            const selected = value.bulletStyle === style;
            return (
              <button
                key={style}
                type="button"
                disabled={disabled}
                onClick={() => set("bulletStyle", style)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  selected ? "bg-brand-purple/10 text-brand-purple" : "text-muted hover:bg-page"
                }`}
              >
                <BulletPreview style={style} />
                {style}
              </button>
            );
          })}
        </div>
        {issues.bulletStyle && <p className="mt-1 text-xs text-danger">{issues.bulletStyle}</p>}
      </div>
    </div>
  );
}

function BulletPreview({ style }: { style: "circle" | "check" }) {
  if (style === "check") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3 w-3 shrink-0" fill="none">
        <path d="m4 10.5 3.5 3.5 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />;
}
