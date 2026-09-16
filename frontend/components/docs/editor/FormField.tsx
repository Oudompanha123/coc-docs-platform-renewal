import type { ReactNode } from "react";

/** Label + input wrapper, matching the field styling already used in
 *  components/users-roles/AddAccountModal.tsx / claude-usage's
 *  InviteTeammateModal.tsx — reused here rather than restyled. */
export function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const fieldInputClass =
  "w-full rounded-xl border border-border px-3 py-2 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple";

export const fieldTextareaClass = `${fieldInputClass} h-[120px] resize-none`;
