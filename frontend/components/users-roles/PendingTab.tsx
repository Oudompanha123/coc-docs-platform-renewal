"use client";

import { useState } from "react";
import type { AccountRole, PendingAccount } from "@/lib/admin/accounts";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Spinner } from "@/components/layout/Spinner";
import { Check, Shield } from "lucide-react";
import { ROLE_HINTS, ROLE_LABELS, ROLE_ORDER } from "@/lib/mock/users-roles";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
      <div className="p-5">
        <Alert variant="destructive">{error}</Alert>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="animate-entrance p-5">
        <div
          role="status"
          className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-muted-surface/50 px-6 py-10 text-center"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            <Check className="size-5" aria-hidden="true" />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-foreground">Nobody is waiting</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            New registrations — by email or with Google — appear here until you approve them.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-entrance space-y-3 p-5">
      <p className="text-sm text-muted-foreground">
        Oldest first. Approving grants the role you pick; refusing keeps the record, so the trail
        still answers who applied and who decided.
      </p>

      <ul className="space-y-2">
        {pending.map((account) => {
          const role = roles[account.id] ?? "user";
          const working = busy?.id === account.id;

          return (
            <li
              key={account.id}
              className="flex flex-col gap-3 rounded-xl border border-surface-border bg-card px-4 py-3 transition-colors hover:bg-muted-surface/40 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar
                  avatarUrl={account.avatarUrl}
                  initials={initialsOf(account.displayName)}
                  name={account.displayName}
                  className="size-8 text-xs"
                  fallback={<DefaultAvatar className="size-8" label={`${account.displayName} (no profile picture)`} />}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{account.displayName}</p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                      <span className="size-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                      Awaiting approval
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{account.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                <span className="text-xs font-medium text-muted-foreground">Approve as</span>
                <FilterDropdown<AccountRole>
                  label={`Role for ${account.email}`}
                  icon={<Shield className="size-4" aria-hidden="true" />}
                  value={role}
                  options={ROLE_CHOICES}
                  onChange={(next) => setRoles((prev) => ({ ...prev, [account.id]: next }))}
                  variant="select"
                  align="right"
                  disabled={working}
                  className="w-44"
                />

                <Button
                  type="button"
                  disabled={working}
                  onClick={() => void act(account.id, "approve", () => onApprove(account.id, role))}
                  className="gap-1.5"
                >
                  {working && busy?.action === "approve" ? (
                    <Spinner className="size-3.5 border-2" />
                  ) : (
                    <Check className="size-4" aria-hidden="true" />
                  )}
                  {working && busy?.action === "approve" ? "Approving…" : "Approve"}
                </Button>

                <Button
                  type="button"
                  variant="destructiveOutline"
                  disabled={working}
                  onClick={() => void act(account.id, "refuse", () => onReject(account.id))}
                >
                  {working && busy?.action === "refuse" ? "Refusing…" : "Refuse"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
