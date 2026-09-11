import type { AccountStatus } from "@/lib/mock/users-roles";

/** Deactivated is neutral, not alarming red — it's a reversible state, not a punishment. */
export function StatusBadge({ status }: { status: AccountStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e1f5ec] px-2.5 py-1 text-xs font-semibold text-[#1f9d6b]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden="true" />
      Deactivated
    </span>
  );
}
