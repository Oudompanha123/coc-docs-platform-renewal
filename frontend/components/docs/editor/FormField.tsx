import type { ReactNode } from "react";
import { inputBaseClass } from "@/components/ui/input";

/** Label + input wrapper, matching the field styling already used in
 *  components/users-roles/AddAccountModal.tsx — reused here rather than
 *  restyled. (It also matched claude-usage's InviteTeammateModal, until that
 *  modal went with the invite feature.) */
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
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

/**
 * The editor's field styling, now the shared primitive's (ADR-104 r2.0).
 *
 * This used to describe a field of its own — `rounded-xl`, a visible border,
 * a brand-purple focus ring — which made it the fifth text-field style in the
 * product, across roughly thirty call sites in this directory. It is the
 * primitive's class string now, so those thirty repaint with everything else
 * and there is one definition left rather than five.
 *
 * It stays as a named export rather than each call site importing `<Input>`
 * because several of them compose it (`${fieldInputClass} font-mono`,
 * `min-w-0 flex-1`); swapping the elements is a mechanical follow-up, and
 * doing it in the same change as the repaint would have mixed a visual
 * diff with a structural one.
 */
export const fieldInputClass = inputBaseClass;

export const fieldTextareaClass = `${inputBaseClass} h-[120px] resize-none rounded-2xl py-2.5`;
