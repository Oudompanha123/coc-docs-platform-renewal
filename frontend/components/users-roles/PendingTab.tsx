"use client";

import { useState } from "react";
import type { AccountRole, PendingAccount } from "@/lib/admin/accounts";

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
 */

const ROLE_CHOICES: { value: AccountRole; label: string; hint: string }[] = [
  { value: "user", label: "User", hint: "Reads published content." },
  { value: "admin", label: "Admin", hint: "Authors, validates and publishes." },
  { value: "super_admin", label: "Super Admin", hint: "Also decides who gets in." },
];

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
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, run: () => Promise<void>) {
    setBusy(id);
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
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="animate-entrance p-8 text-center">
        <p className="text-sm font-semibold text-dash-ink">Nobody is waiting</p>
        <p className="mt-1 text-sm text-muted">
          Anyone who signs in with Google for the first time appears here until you let them in.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-entrance space-y-3 p-6">
      <p className="text-sm text-muted">
        Oldest first. Approving grants the role you pick; refusing keeps the record, so the trail
        still answers who applied and who decided.
      </p>

      {pending.map((account) => {
        const role = roles[account.id] ?? "user";
        const working = busy === account.id;

        return (
          <div
            key={account.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dash-ink">{account.displayName}</p>
              <p className="truncate text-xs text-muted">{account.email}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`role-${account.id}`}>
                Role for {account.email}
              </label>
              <div className="relative">
                <select
                  id={`role-${account.id}`}
                  value={role}
                  disabled={working}
                  onChange={(e) =>
                    setRoles((prev) => ({ ...prev, [account.id]: e.target.value as AccountRole }))
                  }
                  className="appearance-none rounded-xl border border-border bg-white px-3 py-2 pr-9 text-sm font-medium text-dash-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
                >
                  {ROLE_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label} — {choice.hint}
                    </option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 24 24"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <button
                type="button"
                disabled={working}
                onClick={() => void act(account.id, () => onApprove(account.id, role))}
                className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {working ? "Working…" : "Approve"}
              </button>

              <button
                type="button"
                disabled={working}
                onClick={() => void act(account.id, () => onReject(account.id))}
                className="rounded-full border border-danger/40 px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Refuse
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
