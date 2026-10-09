import type { ManagedAccount } from "@/lib/mock/users-roles";
import { avatarColorFor, ROLE_LABELS } from "@/lib/mock/users-roles";
import { ClockIcon } from "@/components/layout/icons";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { RoleBadge } from "./RoleBadge";
import { StatusBadge } from "./StatusBadge";
import { DropdownMenuItem, DropdownMenuSeparator, RowActions } from "@/components/ui/dropdown-menu";
import { Eye, Trash2, UserCheck, UserX } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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
    <div className="overflow-hidden rounded-xl border border-surface-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Login</TableHead>
            <TableHead className="w-12 text-right"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account, index) => (
            <TableRow key={account.id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    avatarUrl={account.avatarUrl}
                    initials={initialsOf(account.name)}
                    name={account.name}
                    className="size-8 text-xs"
                    style={{ backgroundColor: avatarColorFor(index) }}
                  />
                  <div className="min-w-0">
                    {/* The name opens the details panel — the commonest action,
                        kept one click away now the buttons are in the menu. */}
                    <button
                      type="button"
                      onClick={() => onOpen(account)}
                      className="truncate text-left font-medium text-foreground underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {account.name}
                    </button>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[account.role]}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{account.email}</TableCell>
              <TableCell>
                {/* Every role this account holds (ADR-016), not just the
                    highest — an account with more than one shows all of them,
                    since showing only the effective role hid that fact
                    entirely. */}
                <div className="flex flex-wrap gap-1">
                  {account.roles.map((role) => (
                    <RoleBadge key={role} role={role} />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={account.status} />
              </TableCell>
              <TableCell>
                <div className="flex items-start gap-1.5">
                  <ClockIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-foreground">{account.lastLogin}</p>
                    <p className="text-xs text-muted-foreground">{account.ipAddress}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="w-12 text-right">
                {/* One "⋯" menu per row (ADR-104 r2.10) instead of three
                    buttons: the row reads as a person first, and Delete is a
                    deliberate step away instead of beside Details. */}
                <RowActions label={`Actions for ${account.name}`}>
                  <DropdownMenuItem onSelect={() => onOpen(account)}>
                    <Eye /> View details
                  </DropdownMenuItem>
                  {account.status !== "deactivated" ? (
                    <DropdownMenuItem onSelect={() => onDeactivate(account)}>
                      <UserX /> Deactivate
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onSelect={() => onReactivate(account)}>
                      <UserCheck /> Reactivate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => onDelete(account)}>
                    <Trash2 /> Delete permanently
                  </DropdownMenuItem>
                </RowActions>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}