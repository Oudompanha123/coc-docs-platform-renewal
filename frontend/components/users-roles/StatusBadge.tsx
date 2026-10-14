import type { AccountStatus } from "@/lib/mock/users-roles";

/** Deactivated is neutral, not alarming red — it's a reversible state, not a punishment. */
export function StatusBadge({ status }: { status: AccountStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1f9d6b]/10 px-2 py-0.5 text-xs font-medium text-[#1f9d6b]">
        <span className="size-1.5 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
        Active
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted-surface px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground" aria-hidden="true" />
      Deactivated
    </span>
  );
}
