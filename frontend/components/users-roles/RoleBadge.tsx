import type { AccountRole } from "@/lib/mock/users-roles";
import { ROLE_LABELS } from "@/lib/mock/users-roles";

/** Visual hierarchy: User is plain, Admin is a solid tint, Super Admin is the
 *  brand gradient — the same treatment this app already uses for its most
 *  prominent chips (NEW-style badges, primary buttons), so it reads as
 *  clearly the highest tier without inventing a new visual language. */
export function RoleBadge({ role }: { role: AccountRole }) {
  if (role === "super_admin") {
    return (
      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-2.5 py-1 text-xs font-semibold text-white">
        {ROLE_LABELS[role]}
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="inline-flex items-center rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-semibold text-brand-blue">
        {ROLE_LABELS[role]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-muted">
      {ROLE_LABELS[role]}
    </span>
  );
}
