import type { DisplayRole } from "@/lib/mock/users-roles";
import { ROLE_LABELS } from "@/lib/mock/users-roles";

/** Visual hierarchy: User is plain, Admin is a solid tint, Super Admin is the
 *  brand gradient — the same treatment this app already uses for its most
 *  prominent chips (NEW-style badges, primary buttons), so it reads as
 *  clearly the highest tier without inventing a new visual language.
 *  Developer/Reviewer/Lead sit between User and Admin (ADR-039) and get
 *  their own solid tints, distinct from Admin's, so they don't read as if
 *  they carry Admin's real authority. */
export function RoleBadge({ role }: { role: DisplayRole }) {
  if (role === "super_admin") {
    return (
      <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
        {ROLE_LABELS[role]}
      </span>
    );
  }
  if (role === "admin") {
    return (
      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-foreground">
        {ROLE_LABELS[role]}
      </span>
    );
  }
  if (role === "developer") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-600/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
        {ROLE_LABELS[role]}
      </span>
    );
  }
  if (role === "lead") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        {ROLE_LABELS[role]}
      </span>
    );
  }
  if (role === "reviewer") {
    return (
      <span className="inline-flex items-center rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-400">
        {ROLE_LABELS[role]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-muted-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
      {ROLE_LABELS[role]}
    </span>
  );
}
