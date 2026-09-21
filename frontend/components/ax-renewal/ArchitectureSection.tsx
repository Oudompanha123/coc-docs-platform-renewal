"use client";

import { useState } from "react";
import { ConfirmationBar } from "./ConfirmationBar";
import type { AxRenewalArchitecture, AxRenewalConfirmation } from "@/lib/ax-renewal/api";

export function ArchitectureSection({
  architecture,
  confirmation,
  canEdit,
  canConfirm,
  onSave,
  onConfirm,
  onReopen,
}: {
  architecture: AxRenewalArchitecture | null;
  confirmation: AxRenewalConfirmation | undefined;
  canEdit: boolean;
  canConfirm: boolean;
  onSave: (summary: string) => Promise<void>;
  onConfirm: () => void;
  onReopen: () => void;
}) {
  const [summary, setSummary] = useState(architecture?.summary ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the architecture.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setConfirmBusy(true);
    try {
      onConfirm();
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-dash-ink">Architecture</h3>
      <p className="mt-1 text-xs text-muted">
        Describe the resulting <strong>layered design</strong> once the <strong>stack move</strong> above is decided — what talks to what, and why
        it is shaped this way.
      </p>

      <textarea
        value={summary}
        disabled={!canEdit}
        onChange={(e) => setSummary(e.target.value)}
        rows={8}
        placeholder="e.g. Browser → API layer (controllers only) → Service layer (business rules) → Data access, against the existing schema…"
        className="mt-4 w-full resize-y rounded-xl border border-border px-3 py-2 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
      />

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      {canEdit && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save architecture"}
          </button>
        </div>
      )}

      <ConfirmationBar
        section="architecture"
        confirmation={confirmation}
        canConfirm={canConfirm}
        busy={confirmBusy}
        onConfirm={() => void handleConfirm()}
        onReopen={onReopen}
      />
    </div>
  );
}
