import type { ReactNode } from "react";

/**
 * A field group in the admin /legal-pages form's one shared card (task:
 * "remove accent lines, cleaner spacing"). Desktop (>= 1024px): a 220px
 * label+helper column beside the field, 32px gap; below that width, the two
 * stack. `fullWidth` is for Sections — the one group whose field (the
 * accordion) needs the whole row rather than sharing it with a label column.
 *
 * <p>No left accent line and no focus-reactive color any more — an earlier
 * pass gave each group one (grey, purple on focus) now removed by request:
 * focus is the input's own ring (`legalFieldInputClass`) and nothing about
 * the group chrome itself changes when a field inside it is focused.
 */
export function LegalFieldGroup({
  label,
  helper,
  required,
  fullWidth,
  children,
}: {
  label: string;
  /** One line shown under the label, e.g. "Shown as the page heading." */
  helper?: string;
  required?: boolean;
  /** Sections only — label+helper stack above the field instead of sharing
   *  a row with it, so the accordion gets the full card width. */
  fullWidth?: boolean;
  children: ReactNode;
}) {
  const labelBlock = (
    <div>
      <span className="text-xs font-semibold uppercase tracking-wide text-legal-label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {helper && <p className="mt-1 text-[12.5px] text-legal-helper">{helper}</p>}
    </div>
  );

  if (fullWidth) {
    return (
      <div>
        {labelBlock}
        <div className="mt-3">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:gap-8">
      <div className="lg:w-[220px] lg:shrink-0">{labelBlock}</div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** The counter row under a text field: "{n} characters left" (red at 0) +
 *  "English (US)" — English-only UI per the task's constraints, so this is
 *  always "English (US)", not a live locale. */
export function LegalFieldCounter({ charsLeft }: { charsLeft: number }) {
  return (
    <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-muted">
      <span className={charsLeft <= 0 ? "font-semibold text-danger" : undefined}>
        {charsLeft.toLocaleString()} characters left
      </span>
      <span>English (US)</span>
    </div>
  );
}

export const legalFieldInputClass =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm text-dash-ink outline-none transition-shadow focus:border-[#a5b4fc] focus:ring-[3px] focus:ring-[#eef0ff]";

export const legalFieldTextareaClass = `${legalFieldInputClass} resize-none`;
