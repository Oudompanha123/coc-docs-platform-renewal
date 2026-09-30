import type { MeResponse } from "@/lib/auth/api";
import type { AxRenewalProject } from "./api";

/**
 * What the signed-in caller may do in the AX Renewal workspace — one place,
 * because the page and the Assistant panel both need it and a copy in each
 * would drift. Presentation only: the backend decides every one of these
 * again per request (`SecurityConfig` for the role, `AxRenewalService` for
 * membership). These exist so a button that could only be refused is not
 * offered in the first place.
 *
 * Two axes, multiplied (ADR-069):
 *   - **role** decides *what* — Admin drafts, exactly Developer (or Super
 *     Admin) confirms and builds;
 *   - **membership** decides *where* — only on projects the caller is on.
 *     A Super Admin may act on any project, member or not.
 */
export interface AxRenewalPermissions {
  /** On this project's team, or a Super Admin (who may act on any project). */
  onProject: boolean;
  /** Start a new project. Role only — there is no project yet to be a member of. */
  canCreate: boolean;
  /** Draft the plan, attach, analyse, set the destination, delete, manage members. */
  canEdit: boolean;
  /** Confirm/reopen sections, start/approve/revert builds, Run Locally. */
  canConfirm: boolean;
}

type Caller = Pick<MeResponse, "role" | "roles"> | null | undefined;

export function axRenewalPermissions(user: Caller, project: Pick<AxRenewalProject, "member"> | null): AxRenewalPermissions {
  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;
  // Exact membership of the Developer role, not rank: an Admin does not pass
  // this just by out-ranking Developer (AppRole.exactAuthority(), ADR-039/062).
  const holdsDeveloper = user?.roles?.includes("developer") ?? false;
  const onProject = isSuperAdmin || (project?.member ?? false);

  return {
    onProject,
    canCreate: isAdmin,
    canEdit: isAdmin && onProject,
    canConfirm: (isSuperAdmin || holdsDeveloper) && onProject,
  };
}
