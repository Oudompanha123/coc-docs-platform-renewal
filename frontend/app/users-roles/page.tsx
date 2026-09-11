"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UsersIcon } from "@/components/layout/icons";
import { AccountsTable } from "@/components/users-roles/AccountsTable";
import { AddAccountModal } from "@/components/users-roles/AddAccountModal";
import { DeactivateModal } from "@/components/users-roles/DeactivateModal";
import { FilterBar, type RoleFilter, type StatusFilter } from "@/components/users-roles/FilterBar";
import { Pagination } from "@/components/users-roles/Pagination";
import {
  CURRENT_ACCOUNT_ID,
  MANAGED_ACCOUNTS,
  type AccountRole,
  type ManagedAccount,
} from "@/lib/mock/users-roles";

type PageTab = "users" | "roles";

/**
 * Users & Roles — ADR-013-adjacent scope note: unlike Settings, this page has
 * a real backend behind it (AdminAccountController: GET list, PATCH role/
 * active). This page stays mock-only anyway, matching every other page in
 * this frontend today (zero real fetch calls exist anywhere yet). The one
 * place mock and reality diverge: "Add account" has no real endpoint to call
 * (accounts self-provision on first Google sign-in); everything else here
 * (list, role badges, deactivate, last-super-admin guard) mirrors real,
 * already-implemented backend rules.
 *
 * Search/role/status filtering is real (client-side over the mock array),
 * not decorative. Export is a UI stub — no export capability exists yet.
 */
export default function UsersRolesPage() {
  const [tab, setTab] = useState<PageTab>("users");
  const [accounts, setAccounts] = useState<ManagedAccount[]>(MANAGED_ACCOUNTS);
  const [addOpen, setAddOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<ManagedAccount | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      const matchesQuery =
        q.length === 0 ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.role.includes(q);
      const matchesRole = roleFilter === "all" || a.role === roleFilter;
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [accounts, search, roleFilter, statusFilter]);

  function isLastActiveSuperAdmin(account: ManagedAccount): boolean {
    if (account.role !== "super_admin" || account.status !== "active") return false;
    const otherActiveSuperAdmins = accounts.filter(
      (a) => a.id !== account.id && a.role === "super_admin" && a.status === "active",
    );
    return otherActiveSuperAdmins.length === 0;
  }

  function handleAdd(email: string, role: AccountRole) {
    const name = email.split("@")[0] ?? email;
    setAccounts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        status: "active",
        lastLogin: "Never",
        ipAddress: "—",
      },
    ]);
    setAddOpen(false);
  }

  function handleConfirmDeactivate() {
    if (!deactivateTarget) return;
    setAccounts((prev) =>
      prev.map((a) => (a.id === deactivateTarget.id ? { ...a, status: "deactivated" } : a)),
    );
    setDeactivateTarget(null);
  }

  return (
    <AppShell
      pageTitle="Users & Roles"
      pageSubtitle="Manage who has access to Coc Docs Platform and what they can do"
      titleIcon={<UsersIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div role="tablist" className="flex gap-6 border-b border-border px-6 pt-5">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "users"}
            onClick={() => setTab("users")}
            className={`relative flex items-center gap-2 pb-3 text-sm transition-colors focus-visible:outline-none ${
              tab === "users" ? "font-bold text-dash-ink" : "font-medium text-muted hover:text-dash-ink"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
            </svg>
            Users
            {tab === "users" && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "roles"}
            onClick={() => setTab("roles")}
            className={`relative flex items-center gap-2 pb-3 text-sm transition-colors focus-visible:outline-none ${
              tab === "roles" ? "font-bold text-dash-ink" : "font-medium text-muted hover:text-dash-ink"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3.5 5 6v6c0 4.5 3 7.5 7 8.5 4-1 7-4 7-8.5V6l-7-2.5Z" strokeLinejoin="round" />
            </svg>
            Roles
            {tab === "roles" && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />
            )}
          </button>
        </div>

        {tab === "users" ? (
          <>
            <div className="flex flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <FilterBar
                  search={search}
                  onSearchChange={setSearch}
                  role={roleFilter}
                  onRoleChange={setRoleFilter}
                  status={statusFilter}
                  onStatusChange={setStatusFilter}
                />
              </div>

              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  Add user
                </button>
              </div>
            </div>

            <div className="px-6 pb-6">
              <AccountsTable accounts={filtered} onDeactivate={setDeactivateTarget} />
            </div>
            <Pagination shown={filtered.length} />
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm font-semibold text-dash-ink">Role management</p>
            <p className="mt-1 text-sm text-muted">
              Coc Docs Platform&apos;s roles are fixed (User, Admin, Super Admin) — there&apos;s no custom-role builder here.
            </p>
          </div>
        )}
      </div>

      {addOpen && <AddAccountModal onClose={() => setAddOpen(false)} onAdd={handleAdd} />}

      {deactivateTarget && (
        <DeactivateModal
          account={deactivateTarget}
          isLastActiveSuperAdmin={isLastActiveSuperAdmin(deactivateTarget)}
          isSelf={deactivateTarget.id === CURRENT_ACCOUNT_ID}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleConfirmDeactivate}
        />
      )}
    </AppShell>
  );
}
