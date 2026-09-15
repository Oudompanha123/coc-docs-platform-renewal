import type { ManagedAccount } from "@/lib/mock/users-roles";
import { avatarColorFor } from "@/lib/mock/users-roles";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

export function AccountsTable({
  accounts,
  onDeactivate,
  onReactivate,
  onDelete,
  onOpen,
}: {
  accounts: ManagedAccount[];
  onDeactivate: (account: ManagedAccount) => void;
  /** Lets a deactivated account back in. The row used to end at a dead
   *  "Deactivated" label, so the only way back was a database edit — even
   *  though the backend has supported reactivation all along. */
  onReactivate: (account: ManagedAccount) => void;
  /** Removes the account for good (ADR-023). Confirmed in a dialog first. */
  onDelete: (account: ManagedAccount) => void;
  /** Opens the detail panel. A button rather than a whole clickable row: a row
   *  that navigates is invisible to a keyboard and to a screen reader. */
  onOpen: (account: ManagedAccount) => void;
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last Login</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {accounts.map((account, index) => (
            <tr key={account.id} className="transition-colors hover:bg-[#f8fafc]">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
                    style={{ backgroundColor: avatarColorFor(index) }}
                  >
                    {account.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-dash-ink">{account.name}</p>
                    <p className="text-xs text-muted">{RoleLabelText(account.role)}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-muted">{account.email}</td>
              <td className="px-4 py-4">
                <RoleBadge role={account.role} />
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={account.status} />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-start gap-1.5">
                  <ClockIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                  <div>
                    <p className="text-dash-ink">{account.lastLogin}</p>
                    <p className="text-xs text-muted">{account.ipAddress}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  type="button"
                  onClick={() => onOpen(account)}
                  className="mr-2 rounded-full border border-border px-4 py-1.5 text-sm font-semibold text-dash-ink transition-colors hover:border-brand-purple hover:text-brand-purple"
                >
                  Details
                </button>
                {account.status !== "deactivated" ? (
                  <button
                    type="button"
                    onClick={() => onDeactivate(account)}
                    className="mr-2 inline-flex items-center rounded-full bg-danger/10 px-4 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReactivate(account)}
                    className="mr-2 inline-flex items-center rounded-full bg-[#1f9d6b]/10 px-4 py-1.5 text-sm font-semibold text-[#1f9d6b] transition-colors hover:bg-[#1f9d6b]/20"
                  >
                    Reactivate
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(account)}
                  aria-label={`Delete ${account.name}`}
                  title="Delete permanently"
                  className="inline-flex items-center rounded-full border border-danger/30 px-3 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleLabelText(role: ManagedAccount["role"]): string {
  return role === "super_admin" ? "Super Admin" : role === "admin" ? "Admin" : "User";
}
