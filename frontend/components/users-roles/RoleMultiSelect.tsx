import { ROLE_ORDER, ROLE_HINTS, ROLE_LABELS, highestEnforcedRole, type AccountRole } from "@/lib/mock/users-roles";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Checkbox list for all five roles, every one of them real and
 * backend-enforced (ADR-039). An account can genuinely hold more than one at
 * once (ADR-016) — the footer note says whether that's what will happen here,
 * since account *creation* still only takes a single `role`
 * (`collapseToHighest`) while editing an existing account sends the whole
 * checked set. Extracted rather than duplicated because AddAccountModal and
 * AccountDetailModal both need the identical list and hint text.
 */
export function RoleMultiSelect({
  idPrefix,
  selected,
  onChange,
  collapseToHighest = false,
}: {
  idPrefix: string;
  selected: AccountRole[];
  onChange: (roles: AccountRole[]) => void;
  /** True for account creation, which still saves only the highest-ranked role checked. */
  collapseToHighest?: boolean;
}) {
  function toggle(role: AccountRole, checked: boolean) {
    if (checked) {
      onChange(selected.includes(role) ? selected : [...selected, role]);
    } else {
      onChange(selected.filter((r) => r !== role));
    }
  }

  return (
    <div>
      <div className="space-y-2 rounded-xl border border-surface-border p-3">
        {ROLE_ORDER.map((role) => {
          const id = `${idPrefix}-${role}`;
          return (
            <label key={role} htmlFor={id} className="flex items-start gap-2.5">
              {/* Was carrying `inputBaseClass` — a text field's pill, 40px
                  tall and full width, applied to a 16px checkbox. The sweep
                  that pointed every field at the primitive matched on the
                  class string rather than the input's type and caught this
                  one by mistake. */}
              <Checkbox
                id={id}
                aria-label={ROLE_LABELS[role]}
                checked={selected.includes(role)}
                onChange={(e) => toggle(role, e.target.checked)}
                className="mt-0.5"
              />
              <span className="min-w-0">
                <span className="text-sm font-medium text-foreground">{ROLE_LABELS[role]}</span>
                <span className="block text-xs text-muted-foreground">{ROLE_HINTS[role]}</span>
              </span>
            </label>
          );
        })}
      </div>
      {collapseToHighest && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {selected.length <= 1
            ? `Saves as ${ROLE_LABELS[highestEnforcedRole(selected)]}.`
            : `Saves as ${ROLE_LABELS[highestEnforcedRole(selected)]} (creating an account only takes the highest of the roles checked above).`}
        </p>
      )}
    </div>
  );
}
