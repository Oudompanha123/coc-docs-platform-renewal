"use client";

import { emailViolations, isEmailAcceptable } from "@/lib/auth/emailPolicy";
import { useState, type FormEvent } from "react";
import { ShieldIcon } from "@/components/auth/icons";
import { MailIcon, UserPlusIcon, WarningIcon, XIcon } from "@/components/layout/icons";
import { Spinner } from "@/components/layout/Spinner";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoleMultiSelect } from "./RoleMultiSelect";
import { highestEnforcedRole, type AccountRole } from "@/lib/mock/users-roles";

/**
 * Backed by the real `POST /api/v1/admin/accounts` (super_admin only). The
 * account is created immediately, active, at the chosen role — the backend
 * generates a temporary password and emails it, and the new owner is
 * required to replace it on first login (revision of ADR-017). Nothing
 * about that password ever reaches this component or its response.
 *
 * <p>Laid out like Account details: a header saying what this does, a body
 * that scrolls (email, then roles), and a footer that stays in view. A form,
 * so Enter in the email field submits too.
 */
export function AddAccountModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  /**
   * Rejects on failure — a duplicate email, an insufficient role, a network
   * error — so this modal can show the reason itself. It used to be
   * fire-and-forget: a rejection was reported on the page *behind* this
   * modal's full-screen overlay, which nobody could see, so a failed create
   * looked identical to the button doing nothing at all.
   */
  onAdd: (email: string, role: AccountRole) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<AccountRole[]>(["user"]);
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (isSubmitting) return;
    const trimmed = email.trim();
    // Advisory only, matching every other client-side check in this codebase
    // (CONST-TECH-07): the backend's @ValidEmail on CreateAccountRequest is
    // what actually decides. The local pattern this replaces was one of three
    // different shapes across the forms (ADR-088).
    if (!isEmailAcceptable(trimmed)) {
      setError(emailViolations(trimmed).join(" "));
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      await onAdd(trimmed, highestEnforcedRole(roles));
      // No further state change here on success: the parent closes this
      // modal once the account is actually in its list, which is also what
      // unmounts this component.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-surface-border bg-card shadow-xl"
      bodyClassName="flex min-h-0 flex-1 flex-col"
    >
      <form onSubmit={(e) => void submit(e)} noValidate className="flex min-h-0 flex-1 flex-col">
        {/* Header — what this does. */}
        <div className="shrink-0 border-b border-surface-border">
          <div className="flex items-start gap-3 px-5 py-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
              <UserPlusIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-foreground">Add User</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Creates the account right away and emails them a temporary password to sign in with.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close add user"
              className="-mr-1.5 -mt-1 size-8 text-muted-foreground"
            >
              <XIcon className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body — scrolls on its own. */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <label htmlFor="add-account-email" className="mb-1.5 block text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <MailIcon
                className={`pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 ${error ? "text-danger" : "text-muted-foreground"}`}
              />
              <Input
                id="add-account-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(undefined);
                }}
                placeholder="name@company.com"
                autoComplete="off"
                autoFocus
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "add-account-email-error" : "add-account-email-hint"}
                className="pl-9"
              />
            </div>
            {error ? (
              <p
                id="add-account-email-error"
                role="alert"
                className="mt-2 flex items-start gap-1.5 text-xs font-medium text-danger"
              >
                <WarningIcon className="mt-px size-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            ) : (
              <p id="add-account-email-hint" className="mt-1.5 text-xs text-muted-foreground">
                Their sign-in address — the temporary password is sent here.
              </p>
            )}
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">Roles</span>
            <RoleMultiSelect idPrefix="add-account-role" selected={roles} onChange={setRoles} collapseToHighest />
          </div>

          <p className="flex items-start gap-2 rounded-lg border border-surface-border bg-muted-surface/50 px-3 py-2.5 text-xs leading-relaxed text-foreground">
            <ShieldIcon className="mt-px size-3.5 shrink-0 text-muted-foreground" />
            <span>
              The password is generated for them and never shown here. They&apos;ll be asked to set
              their own the first time they sign in.
            </span>
          </p>
        </div>

        {/* Footer — always in view. */}
        <div className="flex shrink-0 justify-end gap-2 border-t border-surface-border bg-muted-surface/50 px-5 py-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting && <Spinner className="size-3.5 border-2" />}
            {isSubmitting ? "Adding…" : "Add Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
