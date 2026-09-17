"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UsersIcon } from "@/components/layout/icons";
import { AccountsTable } from "@/components/users-roles/AccountsTable";
import { AddAccountModal } from "@/components/users-roles/AddAccountModal";
import { DeactivateModal } from "@/components/users-roles/DeactivateModal";
import { DeleteModal } from "@/components/users-roles/DeleteModal";
import { FilterBar, type RoleFilter, type StatusFilter } from "@/components/users-roles/FilterBar";
import { Pagination } from "@/components/users-roles/Pagination";
import { AccountDetailModal } from "@/components/users-roles/AccountDetailModal";
import { PendingTab } from "@/components/users-roles/PendingTab";
import { RolesTab } from "@/components/users-roles/RolesTab";
import {
  createAccount,
  listAccounts,
  approveAccount,
  listPending,
  listRoles,
  rejectAccount,
  updateAccount,
  deleteAccount,
  type AccountRole as AdminRole,
  type AdminAccount,
  type PendingAccount,
  type RoleDetail,
} from "@/lib/admin/accounts";
import { accountStatus, downloadUsersXlsx } from "@/lib/admin/export-users";
import { type AccountRole, type ManagedAccount } from "@/lib/mock/users-roles";
import { me } from "@/lib/auth/api";

/**
 * The API speaks in accounts; this table speaks in rows. One place to translate
 * between them, so a change to either shape has a single point of contact.
 *
 * `ipAddress` is a dash because the backend does not report it here. It is
 * recorded per session for incident response, not per account, and inventing a
 * value to fill a column would be worse than admitting the column is empty.
 */
function toRow(account: AdminAccount): ManagedAccount {
  return {
    id: account.id,
    name: account.displayName,
    email: account.email,
    role: account.role === "guest" ? "user" : account.role,
    // The rule itself lives in lib/admin/export-users, so this table and the
    // spreadsheet it exports cannot come to disagree about who is "Pending".
    // It is a login state rather than the backend's own `active` flag — see
    // accountStatus for why.
    status: accountStatus(account),
    lastLogin: formatLastLogin(account.lastSignInAt),
    ipAddress: "—",
    avatarUrl: account.avatarUrl,
  };
}

/**
 * "Never" is the honest answer for two different situations: someone who has
 * genuinely never signed in, and someone whose last session has been purged
 * (kept one TTL past expiry). Both mean "not recently", which is what the
 * column is for.
 */
function formatLastLogin(iso: string | null): string {
  if (!iso) return "Never";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "Never";

  const dayMs = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - when.getTime();
  const time = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (elapsed < dayMs && when.getDate() === new Date().getDate()) return `Today, ${time}`;
  if (elapsed < 2 * dayMs) return `Yesterday, ${time}`;
  return when.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

type PageTab = "users" | "pending" | "roles";

/**
 * Users & Roles — backed by AdminAccountController: GET list (with last
 * sign-in), POST create, PATCH role/active. Every call needs `super_admin`,
 * enforced by the filter chain rather than by this page; the page only decides
 * what to show.
 *
 * Search, role and status filtering stay client-side over the loaded list,
 * which is right while the team is small enough to fit one page. Export is
 * client-side for the same reason and one more: it writes the records this
 * page already holds, so it discloses nothing the screen does not and adds no
 * route to guard. The cost is that a copy of the account list leaves no trace
 * in `audit_log` — see lib/admin/export-users.
 */
export default function UsersRolesPage() {
  const [tab, setTab] = useState<PageTab>("users");
  // The API records, kept as they arrived. `rows` below is the table's view of
  // them; the detail modal needs the full record, so throwing it away at load
  // would mean fetching the same account again to open it.
  const [records, setRecords] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<ManagedAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedAccount | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  // The signed-in account id, read from the session the server already
  // resolved.
  //
  // This was CURRENT_ACCOUNT_ID, the literal "1" in lib/mock/users-roles, and
  // real ids are UUIDs — so every "is this me?" check on this page was false.
  // The page offered to deactivate your own account and the backend then
  // refused it, which reads as the feature being broken rather than as the
  // guard doing its job.
  //
  // Not useSession(): SessionProvider is mounted inside AppShell, which this
  // page renders, so a hook call up here sits outside the provider. It
  // typechecks and passes in the browser, then fails the production build
  // during prerendering with "useSession must be used inside
  // <SessionProvider>". One request to the endpoint the provider would have
  // called anyway.
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void me()
      .then((session) => {
        if (!cancelled) setCurrentAccountId(session.id);
      })
      .catch(() => {
        // Leave it null. Every "is this me?" check then reads false, which
        // shows the action and lets the server refuse it — the behaviour
        // before this fix, and an acceptable floor if /auth/me is unreachable.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [pending, setPending] = useState<PendingAccount[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const [roles, setRoles] = useState<RoleDetail[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setRecords(await listAccounts());
      setError(null);
    } catch (err) {
      // Including the 403 an `admin` gets. The route is reachable — the shell
      // guard only checks for a session — but everything on it needs
      // `super_admin`, and saying so beats an empty table.
      setError(err instanceof Error ? err.message : "Couldn't load accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadPending = useCallback(async () => {
    try {
      setPending(await listPending());
      setPendingError(null);
    } catch (err) {
      setPendingError(err instanceof Error ? err.message : "Couldn't load applications.");
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    void reloadPending();
  }, [reload, reloadPending]);

  // Roles load once with the page rather than when the tab is first opened:
  // it is one small request, and paying for it up front means the tab renders
  // immediately instead of flashing a spinner the first time it is clicked.
  useEffect(() => {
    listRoles()
      .then((fetched) => setRoles(fetched))
      .catch((err) => setRolesError(err instanceof Error ? err.message : "Couldn't load roles."))
      .finally(() => setRolesLoading(false));
  }, []);

  const accounts = useMemo(() => records.map(toRow), [records]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Back to the first page whenever the result set changes underneath. Without
  // this, filtering a list down to three rows while on page 4 shows an empty
  // table and no obvious reason why.
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const visible = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  /**
   * What Export writes: every row the filters currently match, across all
   * pages — not `visible`, which is one page of ten.
   *
   * Filtered rather than the whole table because the button sits beside the
   * search and filter controls, and a file that ignored them would be a
   * surprise the moment anyone searched first. The API records are recovered
   * from `filtered` by id: the export needs real timestamps, and `accounts`
   * has already flattened those to "Today, 2:03 PM".
   */
  const exportable = useMemo(() => {
    const ids = new Set(filtered.map((row) => row.id));
    return records.filter((record) => ids.has(record.id));
  }, [filtered, records]);

  const detail = detailId ? (records.find((r) => r.id === detailId) ?? null) : null;

  async function handleSaveDetail(changes: {
    role?: AdminRole;
    active?: boolean;
    displayName?: string;
  }) {
    if (!detail) return;
    const updated = await updateAccount(detail.id, changes);
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setError(null);
  }

  // "Active" here means the backend's `active` flag — pending counts, since a
  // pending account can still sign in and act. Only `deactivated` is out.
  function isLastActiveSuperAdmin(account: ManagedAccount): boolean {
    if (account.role !== "super_admin" || account.status === "deactivated") return false;
    const otherActiveSuperAdmins = accounts.filter(
      (a) => a.id !== account.id && a.role === "super_admin" && a.status !== "deactivated",
    );
    return otherActiveSuperAdmins.length === 0;
  }

  async function handleApprove(id: string, role: AdminRole) {
    await approveAccount(id, role);
    // Both lists move: they leave the queue and appear in Users. Refetching
    // rather than splicing, because approval sets a role and a status the
    // server decides, and guessing them here is how the two views drift.
    await Promise.all([reloadPending(), reload()]);
  }

  async function handleReject(id: string) {
    await rejectAccount(id);
    // Only the queue: a refused application stays an account row, so the
    // Users list is unchanged.
    await reloadPending();
  }

  // Left to throw on failure rather than caught here: AddAccountModal is a
  // full-screen overlay, so an error set on this page's own `error` state
  // would render directly behind it, completely hidden from view — a failed
  // create would look identical to the button doing nothing. The modal
  // awaits this call itself and shows the reason in place; the modal only
  // stays open on that path, which is also what we want — a duplicate
  // address is something the person can correct without retyping everything.
  async function handleAdd(email: string, role: AccountRole) {
    const created = await createAccount(email, role);
    setRecords((prev) => [...prev, created]);
    setAddOpen(false);
    // A temporary password was just emailed to this address (revision of
    // ADR-017) — the plaintext itself never reaches this response, so this
    // banner is the only confirmation the admin gets that it went out.
    setAddedMessage(
      `Account created successfully. A temporary password has been sent to ${created.email}.`,
    );
  }

  async function handleConfirmDeactivate() {
    if (!deactivateTarget) return;
    const target = deactivateTarget;
    setDeactivateTarget(null);
    try {
      const updated = await updateAccount(target.id, { active: false });
      setRecords((prev) => prev.map((r) => (r.id === target.id ? updated : r)));
      setError(null);
    } catch (err) {
      // Refusals reach here with the backend's own wording — "this is the only
      // active super admin; promote someone else before demoting them". The
      // row is left as it was, because the server did not change it.
      setError(err instanceof Error ? err.message : "Couldn't deactivate that account.");
    }
  }


  /**
   * Lets a deactivated account back in.
   *
   * No confirmation dialog: restoring access is reversible by the same button
   * that undid it, and a prompt for every reversible action trains people to
   * dismiss prompts without reading them — which is what makes the one on
   * Delete worth stopping for.
   */
  async function handleReactivate(target: ManagedAccount) {
    try {
      const updated = await updateAccount(target.id, { active: true });
      setRecords((prev) => prev.map((r) => (r.id === target.id ? updated : r)));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reactivate that account.");
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteAccount(target.id);
      // Dropped from the list rather than reloaded: there is nothing to fetch,
      // and a refetch would leave the row on screen until it returned.
      setRecords((prev) => prev.filter((r) => r.id !== target.id));
      if (detailId === target.id) setDetailId(null);
      setError(null);
      setAddedMessage(`${target.email} has been deleted.`);
    } catch (err) {
      // "you cannot delete your own account", or "this is the only active
      // super admin; promote someone else before deleting ...". The row stays
      // because the server kept it.
      setError(err instanceof Error ? err.message : "Couldn't delete that account.");
    }
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
            aria-selected={tab === "pending"}
            onClick={() => setTab("pending")}
            className={`relative flex items-center gap-2 pb-3 text-sm transition-colors focus-visible:outline-none ${
              tab === "pending" ? "font-bold text-dash-ink" : "font-medium text-muted hover:text-dash-ink"
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7.5V12l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Pending
            {/* The badge is how a super admin finds out at all: there is no
                email or notification anywhere in the backend. It only reaches
                someone already signed in, which is the trade-off that was
                chosen deliberately over adding a mail dependency. */}
            {pending.length > 0 && (
              <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-purple px-1.5 py-0.5 text-[11px] font-bold text-white">
                {pending.length}
              </span>
            )}
            {tab === "pending" && (
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
                  onClick={() => downloadUsersXlsx(exportable)}
                  disabled={exportable.length === 0}
                  title={
                    exportable.length === 0
                      ? "Nothing to export — no accounts match the current filters"
                      : `Download ${exportable.length} account${exportable.length === 1 ? "" : "s"} as an Excel file`
                  }
                  className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M12 15V3M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddedMessage(null);
                    setAddOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                  Add user
                </button>
              </div>
            </div>

            {addedMessage && (
              <div className="mx-6 mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {addedMessage}
              </div>
            )}

            {error && (
              <div className="mx-6 mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="px-6 pb-6">
              {!loading && (
                <div className="animate-entrance">
                  <AccountsTable
                    accounts={visible}
                    onDeactivate={setDeactivateTarget}
                    onReactivate={handleReactivate}
                    onDelete={setDeleteTarget}
                    onOpen={(account) => setDetailId(account.id)}
                  />
                </div>
              )}
            </div>
            <Pagination
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        ) : tab === "pending" ? (
          <PendingTab
            pending={pending}
            loading={pendingLoading}
            error={pendingError}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ) : (
          <RolesTab roles={roles} loading={rolesLoading} error={rolesError} />
        )}
      </div>

      {addOpen && <AddAccountModal onClose={() => setAddOpen(false)} onAdd={handleAdd} />}

      {detail && (
        <AccountDetailModal
          account={detail}
          isSelf={detail.id === currentAccountId}
          isLastActiveSuperAdmin={
            detail.role === "super_admin" &&
            detail.active &&
            records.filter((r) => r.role === "super_admin" && r.active).length === 1
          }
          onClose={() => setDetailId(null)}
          onSave={handleSaveDetail}
        />
      )}

      {deactivateTarget && (
        <DeactivateModal
          account={deactivateTarget}
          isLastActiveSuperAdmin={isLastActiveSuperAdmin(deactivateTarget)}
          isSelf={deactivateTarget.id === currentAccountId}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleConfirmDeactivate}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          account={deleteTarget}
          isLastActiveSuperAdmin={isLastActiveSuperAdmin(deleteTarget)}
          isSelf={deleteTarget.id === currentAccountId}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </AppShell>
  );
}
