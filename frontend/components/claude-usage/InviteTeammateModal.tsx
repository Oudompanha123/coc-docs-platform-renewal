"use client";

import { emailViolations, isEmailAcceptable } from "@/lib/auth/emailPolicy";
import { useState } from "react";
import { Modal, ModalFooter } from "@/components/users-roles/Modal";
import type { TeamRole } from "@/lib/admin/claudeUsage";
import { inputBaseClass } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function InviteTeammateModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  /** Throws on failure (a duplicate email, a network error) — the form shows it and stays open. */
  onInvite: (email: string, role: TeamRole) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (sentTo) {
    return (
      <Modal title="Invite added" onClose={onClose}>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{sentTo}</span> now shows as invited on this
          dashboard. Once they run the reporter it becomes active automatically — nothing else to send
          them by hand. If they need help setting it up, point them at{" "}
          <span className="font-medium text-foreground">Claude Code Usage → Download push-usage.mjs</span>{" "}
          (or their own Home page): it downloads a script already filled in with their identity and a
          personal token, so there is no shared secret to hand over.
        </p>
        <ModalFooter>
          <Button
            type="button"
            onClick={onClose}
          >
            Done
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal title="Invite teammate" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const trimmed = email.trim();
          // Previously only "not empty", so a typo reached the backend and came
          // back as a validation error with no field attached (ADR-088).
          if (!isEmailAcceptable(trimmed)) {
            setError(emailViolations(trimmed).join(" "));
            return;
          }
          setError(null);
          setBusy(true);
          try {
            await onInvite(trimmed, role);
            setSentTo(trimmed);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't add that teammate.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-xs font-medium text-muted-foreground" htmlFor="invite-email">
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@cocdocs.example"
          className={`${inputBaseClass} mt-1.5 w-full`}
        />

        <label className="mt-4 block text-xs font-medium text-muted-foreground" htmlFor="invite-role">
          Role
        </label>
        <SimpleSelect
          id="invite-role"
          value={role}
          onValueChange={(v) => setRole(v as TeamRole)}
          options={[
            { value: "member", label: "Member" },
            { value: "admin", label: "Admin" },
          ]}
          className="mt-1.5 w-full"
        />

        <p className="mt-3 rounded-lg bg-muted-surface px-3 py-2 text-xs text-muted-foreground">
          This only adds them to this dashboard&apos;s tracking list. It doesn&apos;t change their
          Claude Code access or force their machine to start reporting usage — that stays their choice.
        </p>

        {error && (
          <Alert variant="destructive" className="mt-3">
            {error}
          </Alert>
        )}

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy}
          >
            {busy ? "Sending…" : "Send invite"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
