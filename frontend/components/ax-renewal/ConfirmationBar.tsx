"use client";

import { CheckCircleIcon, ReopenIcon } from "@/components/layout/icons";
import type { AxRenewalConfirmation, PlanSection } from "@/lib/ax-renewal/api";

/**
 * The confirm/reopen control shared by all four plan sections (ADR-037,
 * roles revised by ADR-039). Identical in every section: a section is
 * confirmed by holding either the Super Admin or the Developer role,
 * enforced server-side — this component only reflects the current state and
 * lets the caller try.
 */
export function ConfirmationBar({
  section,
  confirmation,
  canConfirm,
  busy,
  onConfirm,
  onReopen,
}: {
  section: PlanSection;
  confirmation: AxRenewalConfirmation | undefined;
  /** Whether the signed-in caller's role makes an attempt worth showing as enabled — the server decides for real. */
  canConfirm: boolean;
  busy: boolean;
  onConfirm: () => void;
  onReopen: () => void;
}) {
  const confirmed = confirmation != null;

  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm">
        {confirmed ? (
          <>
            <CheckCircleIcon className="h-4 w-4 shrink-0 text-brand-purple" />
            <span className="text-dash-ink">
              Confirmed {new Date(confirmation.confirmedAt).toLocaleString()}
              {confirmation.confirmedVia === "developer_role" ? " · via Developer role" : ""}
            </span>
          </>
        ) : (
          <span className="text-muted">Not confirmed yet.</span>
        )}
      </div>
      {confirmed ? (
        <button
          type="button"
          onClick={onReopen}
          disabled={busy || !canConfirm}
          title={canConfirm ? undefined : "Only a Super Admin or an account with the Developer role may reopen this"}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ReopenIcon className="h-3.5 w-3.5" />
          Reopen
        </button>
      ) : (
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy || !canConfirm}
          title={canConfirm ? undefined : "Only a Super Admin or an account with the Developer role may confirm this"}
          className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-1.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Confirming…" : `Confirm ${sectionLabel(section)}`}
        </button>
      )}
    </div>
  );
}

function sectionLabel(section: PlanSection): string {
  switch (section) {
    case "stack_move":
      return "Stack Move";
    case "architecture":
      return "Architecture";
    case "pages":
      return "Pages";
    case "database":
      return "Database";
  }
}
