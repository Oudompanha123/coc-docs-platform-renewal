import {
  DISPLAY_ROLE_ORDER,
  ROLE_HINTS,
  ROLE_LABELS,
  UNENFORCED_ROLES,
  highestEnforcedRole,
  type DisplayRole,
} from "@/lib/mock/users-roles";

/**
 * Checkbox list for all six roles. An account can hold more than one, but the
 * live backend only accepts a single `role` on create/update — so this also
 * shows, plainly, which one of the checked roles is the one that will
 * actually be saved (the highest-ranked among User/Admin/Super Admin), and
 * flags Developer/Lead/Reviewer as not yet enforced rather than pretending
 * they save. Extracted rather than duplicated because AddAccountModal and
 * AccountDetailModal both need the identical list, hint text and note.
 */
export function RoleMultiSelect({
  idPrefix,
  selected,
  onChange,
}: {
  idPrefix: string;
  selected: DisplayRole[];
  onChange: (roles: DisplayRole[]) => void;
}) {
  function toggle(role: DisplayRole, checked: boolean) {
    if (checked) {
      onChange(selected.includes(role) ? selected : [...selected, role]);
    } else {
      onChange(selected.filter((r) => r !== role));
    }
  }

  const effective = highestEnforcedRole(selected);

  return (
    <div>
      <div className="space-y-2 rounded-xl border border-border p-3">
        {DISPLAY_ROLE_ORDER.map((role) => {
          const unenforced = UNENFORCED_ROLES.includes(role);
          const id = `${idPrefix}-${role}`;
          return (
            <label key={role} htmlFor={id} className="flex items-start gap-2.5">
              <input
                id={id}
                type="checkbox"
                aria-label={ROLE_LABELS[role]}
                checked={selected.includes(role)}
                onChange={(e) => toggle(role, e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple"
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-dash-ink">{ROLE_LABELS[role]}</span>
                  {unenforced && (
                    <span className="rounded-full bg-page px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Not enabled yet
                    </span>
                  )}
                </span>
                <span className="block text-xs text-muted">{ROLE_HINTS[role]}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-muted">
        {selected.length === 0
          ? `No role checked — saves as ${ROLE_LABELS.user}.`
          : `Saves as ${ROLE_LABELS[effective]}${
              selected.length > 1 ? " (the highest of the roles checked above that the backend enforces)." : "."
            }`}
      </p>
    </div>
  );
}
