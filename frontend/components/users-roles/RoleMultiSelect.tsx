"use client";

import { ROLE_ORDER, ROLE_HINTS, ROLE_LABELS, highestEnforcedRole, type AccountRole } from "@/lib/mock/users-roles";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * The roles an account holds, as a row of compact pills (ADR-104 r2.10).
 *
 * Each role is a small checkable pill — the checkbox and the role's name —
 * with its one-line description in a tooltip on hover or focus, at the
 * product owner's request: six descriptions printed under six checkboxes made
 * the picker the tallest thing in the dialog. The description stays in each
 * checkbox's accessible description (`aria-describedby`), so a screen reader
 * still hears what the role allows without opening anything.
 *
 * The whole pill is the label, so it toggles from anywhere on it; a checked
 * role takes the app's selection style (stronger border, light fill). Still a
 * real checkbox underneath — keyboard, forms and `getByRole("checkbox")` are
 * unchanged.
 *
 * Every role here is real and backend-enforced (ADR-039), and an account can
 * genuinely hold more than one at once (ADR-016). Editing an existing account
 * sends the whole checked set; account *creation* still takes a single
 * `role`, so with `collapseToHighest` the note under the pills says which one
 * will be saved. Shared rather than duplicated because AddAccountModal and
 * AccountDetailModal both need the identical list and hint text.
 *
 * // req: ADR-016
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
      <TooltipProvider>
        <div className="flex flex-wrap gap-2">
          {ROLE_ORDER.map((role) => {
            const id = `${idPrefix}-${role}`;
            const hintId = `${id}-hint`;
            const checked = selected.includes(role);
            return (
              <Tooltip key={role}>
                <TooltipTrigger asChild>
                  <label
                    htmlFor={id}
                    className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border pl-3 pr-3.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                      checked
                        ? "border-foreground/40 bg-muted-surface/60 font-medium text-foreground"
                        : "border-surface-border text-muted-foreground hover:border-foreground/20 hover:bg-accent/50 hover:text-foreground"
                    }`}
                  >
                    <Checkbox
                      id={id}
                      aria-label={ROLE_LABELS[role]}
                      aria-describedby={hintId}
                      checked={checked}
                      onChange={(e) => toggle(role, e.target.checked)}
                    />
                    {ROLE_LABELS[role]}
                    <span id={hintId} className="sr-only">
                      {ROLE_HINTS[role]}
                    </span>
                  </label>
                </TooltipTrigger>
                <TooltipContent>{ROLE_HINTS[role]}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      {collapseToHighest && (
        <p className="mt-2 text-xs text-muted-foreground">
          {selected.length <= 1
            ? `Saves as ${ROLE_LABELS[highestEnforcedRole(selected)]}.`
            : `Saves as ${ROLE_LABELS[highestEnforcedRole(selected)]} (creating an account only takes the highest of the roles checked above).`}
        </p>
      )}
    </div>
  );
}
