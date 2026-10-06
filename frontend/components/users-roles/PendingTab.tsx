"use client";

import { useState } from "react";
import type { AccountRole, PendingAccount } from "@/lib/admin/accounts";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Spinner } from "@/components/layout/Spinner";
import { ROLE_HINTS, ROLE_LABELS, ROLE_ORDER } from "@/lib/mock/users-roles";
import { DefaultAvatar } from "./DefaultAvatar";
import { FilterDropdown, type FilterOption } from "./FilterDropdown";

/**
 * The approval queue (ADR-017).
 *
 * <p>Signing in with Google no longer means being let in: a first-time
 * signer-in becomes an application, and this is where somebody decides. The
 * mechanism has existed since ADR-014 but was unreachable — both sign-up paths
 * hardcoded `active`, so the queue was permanently empty and the approve
 * endpoint had never had a row to act on.
 *
 * <p>Approve carries the role. "Should this person be in, and as what" is one
 * thought; splitting it across two screens leaves a window in which someone is
 * inside at a role nobody chose.
 *
 * <p>Every assignable role is offered — User, Developer, Reviewer, Lead,
 * Admin, Super Admin — in the same order and with the same descriptions as
 * the role checklist in Account details. The backend accepts any of them
 * except `guest` (`AccountService.approve`).
 *
 * <p>Each applicant shows their picture: Google's, when they signed up that
 * way, or a default picture for an email registration, which has none.
 */

const ROLE_CHOICES: FilterOption<AccountRole>[] = ROLE_ORDER.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
  hint: ROLE_HINTS[role],
}));

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.charAt(0) ?? "?") + (parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "")).toUpperCase();
}

function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Z" strokeLinejoin="round" />
    </svg>
  );
}

export function PendingTab({
  pending,
  loading,
  error,
  onApprove,
  onReject,
}: {
  pending: PendingAccount[];
  loading: boolean;
  error: string | null;
  onApprove: (id: string, role: AccountRole) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  // Per row, so choosing a role for one application does not change another.
  const [roles, setRoles] = useState<Record<string, AccountRole>>({});
  const [busy, setBusy] = useState<{ id: string; action: "approve" | "refuse" } | null>(null);

  async function act(id: string, action: "approve" | "refuse", run: () => Promise<void>) {
    setBusy({ id, action });
    try {
      await run();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="animate-entrance p-6">
        <div
          role="status"
          className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-[#f8fafc] px-6 py-14 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
            <CheckGlyph className="h-7 w-7" />
          </span>
          <h3 className="mt-4 text-base font-bold text-dash-ink">Nobody is waiting</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            New registrations — by email or with Google — appear here until you approve them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-entrance space-y-4 p-6">
      <p className="text-sm text-muted">
        Oldest first. Approving grants the role you pick; refusing keeps the record, so the trail
        still answers who applied and who decided.
      </p>

      <ul className="space-y-3">
        {pending.map((account) => {
          const role = roles[account.id] ?? "user";
          const working = busy?.id === account.id;

          return (
            <li
              key={account.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3.5">
                <UserAvatar
                  avatarUrl={account.avatarUrl}
                  initials={initialsOf(account.displayName)}
                  name={account.displayName}
                  className="h-11 w-11 shadow-sm"
                  fallback={<DefaultAvatar className="h-11 w-11" label={`${account.displayName} (no profile picture)`} />}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-dash-ink">{account.displayName}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                      Awaiting approval
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted">{account.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <span className="text-xs font-semibold text-muted">Approve as</span>
                <FilterDropdown<AccountRole>
                  label={`Role for ${account.email}`}
                  icon={<RoleGlyph className="h-4 w-4" />}
                  value={role}
                  options={ROLE_CHOICES}
                  onChange={(next) => setRoles((prev) => ({ ...prev, [account.id]: next }))}
                  variant="select"
                  align="right"
                  disabled={working}
                  className="w-44"
                />

                <button
                  type="button"
                  disabled={working}
                  onClick={() => void act(account.id, "approve", () => onApprove(account.id, role))}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {working && busy?.action === "approve" ? (
                    <Spinner className="h-3.5 w-3.5 border-2" />
                  ) : (
                    <CheckGlyph className="h-4 w-4" />
                  )}
                  {working && busy?.action === "approve" ? "Approving…" : "Approve"}
                </button>

                <button
                  type="button"
                  disabled={working}
                  onClick={() => void act(account.id, "refuse", () => onReject(account.id))}
                  className="rounded-xl border border-danger/40 bg-white px-4 py-2.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {working && busy?.action === "refuse" ? "Refusing…" : "Refuse"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
