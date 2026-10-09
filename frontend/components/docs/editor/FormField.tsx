import type { ReactNode } from "react";
import { textareaBaseClass } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
        {required && <span className="text-destructive"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

/** Multi-line: the textarea surface (soft corners, not a pill) at the
 *  editor's fixed 120px. Merged through `cn` so the height replaces the
 *  base rather than sitting beside it. The editor's `<Textarea>`s pass the
 *  same `h-[120px] resize-none` directly. */
export const fieldTextareaClass = cn(textareaBaseClass, "h-[120px] resize-none");
