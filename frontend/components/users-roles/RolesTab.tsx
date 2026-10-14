"use client";

import type { RoleDetail } from "@/lib/admin/accounts";
import { Alert } from "@/components/ui/alert";
import { RoleBadge } from "./RoleBadge";

/**
 * The role catalogue: what each role grants, and how many people hold it.
 *
 * <p>No create or edit. Roles are the four `app_role` values and their
 * permissions are seeded by migration (ADR-016) — adding one is a schema
 * change, and a builder here would imply otherwise. What this fixes is that
 * "Admin" was previously just a word on a badge, with no way to find out what
 * it actually permits without reading the database.
 *
 * <p>Permission keys are shown as they are stored (`content.publish`) rather
 * than prettified. They are the vocabulary the backend checks against and the
 * audit log records, so an administrator comparing this screen to a log entry
 * should see the same string in both.
 */

/** Groups by the part before the first dot — `content`, `account`. */
function areaOf(permission: string): string {
  const dot = permission.indexOf(".");
  return dot === -1 ? permission : permission.slice(0, dot);
}

export function RolesTab({
  roles,
  loading,
  error,
}: {
  roles: RoleDetail[];
  loading: boolean;
  error: string | null;
}) {
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

  return (
    <div className="animate-entrance space-y-3 p-5">
      <p className="text-sm text-muted-foreground">
        Roles are fixed and their permissions are set by migration — there is no custom-role builder.
        Each role grants everything the one below it does.
      </p>

      {roles.map((role) => {
        const areas = [...new Set(role.permissions.map(areaOf))].sort();

        return (
          <div key={role.key} className="rounded-xl border border-surface-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <RoleBadge role={role.key === "guest" ? "user" : role.key} />
                <span className="text-sm font-medium text-foreground">{role.description}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {role.accountCount === 1 ? "1 account" : `${role.accountCount} accounts`}
              </span>
            </div>

            {role.permissions.length === 0 ? (
              // guest holds nothing. Said explicitly rather than shown as an
              // empty space, which reads as a rendering bug.
              <p className="mt-3 text-xs text-muted-foreground">Grants nothing.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {areas.map((area) => (
                  <div key={area} className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {area}
                    </span>
                    {role.permissions
                      .filter((p) => areaOf(p) === area)
                      .map((permission) => (
                        <code
                          key={permission}
                          className="rounded-md bg-muted-surface px-2 py-0.5 text-xs text-foreground"
                        >
                          {permission}
                        </code>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
