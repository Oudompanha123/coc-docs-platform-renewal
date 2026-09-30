"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/layout/icons";
import { ConfirmationBar } from "./ConfirmationBar";
import type { AxRenewalConfirmation, AxRenewalDbChange, AxRenewalDbConnection } from "@/lib/ax-renewal/api";

type ChangeRow = { changeType: "add_column" | "add_index"; tableName: string; rationale: string };

function toRows(changes: AxRenewalDbChange[]): ChangeRow[] {
  return changes.map((c) => ({ changeType: c.changeType, tableName: c.tableName, rationale: c.rationale ?? "" }));
}

type CleanedChangeRow = { changeType: string; tableName: string; rationale: string | null };

/** What `rows` would actually persist if Save planned changes were pressed right now — a row with no table name is dropped, same as `handleSaveChanges` already does. */
function cleanChangeRows(rows: ChangeRow[]): CleanedChangeRow[] {
  return rows
    .filter((r) => r.tableName.trim())
    .map((r) => ({ changeType: r.changeType, tableName: r.tableName.trim(), rationale: r.rationale.trim() || null }));
}

/**
 * Whether what Save planned changes would persist right now already matches
 * what is actually on the server. Confirming this section records a sign-off
 * on the *persisted* changes, not on whatever is currently typed in these
 * rows — same reasoning Stack move's and Pages' own Confirm guards use.
 */
export function sameCleanedChangeRows(a: CleanedChangeRow[], b: CleanedChangeRow[]): boolean {
  return (
    a.length === b.length &&
    a.every((r, i) => r.changeType === b[i]?.changeType && r.tableName === b[i]?.tableName && r.rationale === b[i]?.rationale)
  );
}

export function DatabaseSection({
  connection,
  changes,
  confirmation,
  canEdit,
  canConfirm,
  onConnect,
  onSaveChanges,
  onConfirm,
  onReopen,
}: {
  connection: AxRenewalDbConnection | null;
  changes: AxRenewalDbChange[];
  confirmation: AxRenewalConfirmation | undefined;
  canEdit: boolean;
  canConfirm: boolean;
  onConnect: (input: {
    engine: string | null;
    host: string | null;
    port: number | null;
    databaseName: string | null;
    schemaName: string | null;
  }) => Promise<void>;
  onSaveChanges: (
    rows: { changeType: string; tableName: string; detail: unknown; rationale: string | null }[],
  ) => Promise<void>;
  onConfirm: () => void;
  onReopen: () => void;
}) {
  const [engine, setEngine] = useState(connection?.engine ?? "");
  const [host, setHost] = useState(connection?.host ?? "");
  const [port, setPort] = useState(connection?.port != null ? String(connection.port) : "");
  const [databaseName, setDatabaseName] = useState(connection?.databaseName ?? "");
  const [schemaName, setSchemaName] = useState(connection?.schemaName ?? "");
  const [connecting, setConnecting] = useState(false);

  const [rows, setRows] = useState<ChangeRow[]>(() => toRows(changes));
  const [savingChanges, setSavingChanges] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [changesError, setChangesError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  async function handleConnect() {
    setConnecting(true);
    setConnectError(null);
    try {
      await onConnect({
        engine: engine.trim() || null,
        host: host.trim() || null,
        port: port.trim() ? Number(port.trim()) : null,
        databaseName: databaseName.trim() || null,
        schemaName: schemaName.trim() || null,
      });
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Couldn't record the database connection.");
    } finally {
      setConnecting(false);
    }
  }

  function updateRow(index: number, field: keyof ChangeRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)) as ChangeRow[]);
  }

  function addRow() {
    setRows((prev) => [...prev, { changeType: "add_column", tableName: "", rationale: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const cleanedChangeRows = cleanChangeRows(rows);
  const persistedCleanedChanges: CleanedChangeRow[] = changes.map((c) => ({
    changeType: c.changeType,
    tableName: c.tableName,
    rationale: c.rationale,
  }));
  const connectionHasUnsavedChanges =
    engine !== (connection?.engine ?? "") ||
    host !== (connection?.host ?? "") ||
    port !== (connection?.port != null ? String(connection.port) : "") ||
    databaseName !== (connection?.databaseName ?? "") ||
    schemaName !== (connection?.schemaName ?? "");
  const changesHaveUnsavedEdits = !sameCleanedChangeRows(cleanedChangeRows, persistedCleanedChanges);
  const hasUnsavedChanges = connectionHasUnsavedChanges || changesHaveUnsavedEdits;

  async function handleSaveChanges() {
    setSavingChanges(true);
    setChangesError(null);
    try {
      await onSaveChanges(cleanedChangeRows.map((r) => ({ ...r, detail: {} })));
    } catch (err) {
      setChangesError(err instanceof Error ? err.message : "Couldn't save the database plan.");
    } finally {
      setSavingChanges(false);
    }
  }

  async function handleConfirm() {
    if (hasUnsavedChanges) {
      setConfirmError(
        connectionHasUnsavedChanges && changesHaveUnsavedEdits
          ? "Save connection metadata and planned changes first — neither has been saved yet, so confirming now would sign off on the previous version of both."
          : connectionHasUnsavedChanges
            ? "Save connection metadata first — it hasn't been saved yet, so confirming now would sign off on the previous connection details."
            : "Save planned changes first — they haven't been saved yet, so confirming now would sign off on the previous plan.",
      );
      return;
    }
    setConfirmBusy(true);
    setConfirmError(null);
    try {
      onConfirm();
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Every card below is header-strip + body, the same two-tier structure
          CodeRenewalPlatform.html's own `.pn > h3` (a distinct background,
          border-bottom, its own padding) and `.pb` (the body's own separate
          padding) give every one of its panels — this section's own cards
          previously skipped that split in favor of a plain bold heading
          inline with the body. */}
      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">Connect to your existing database</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted">
            The renewal records what this project&apos;s existing database looks like —{" "}
            <strong>no credential is stored, and this never opens a live connection.</strong> Planned changes below
            are additive only: <strong>indexes</strong> and <strong>columns</strong>, never a table created or
            dropped.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Engine</label>
              <input
                value={engine}
                disabled={!canEdit}
                onChange={(e) => setEngine(e.target.value)}
                placeholder="e.g. PostgreSQL 15"
                className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Host</label>
              <input
                value={host}
                disabled={!canEdit}
                onChange={(e) => setHost(e.target.value)}
                className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Port</label>
              <input
                value={port}
                disabled={!canEdit}
                onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink">Database name</label>
              <input
                value={databaseName}
                disabled={!canEdit}
                onChange={(e) => setDatabaseName(e.target.value)}
                className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink">Schema name</label>
              <input
                value={schemaName}
                disabled={!canEdit}
                onChange={(e) => setSchemaName(e.target.value)}
                className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
              />
            </div>
          </div>

          {canEdit && (
            <div className="mt-3 flex items-center justify-between gap-3">
              {connectionHasUnsavedChanges ? (
                <p className="text-xs font-medium text-amber-700">Unsaved changes — save before confirming.</p>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => void handleConnect()}
                disabled={connecting}
                className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
              >
                {connecting ? "Saving…" : "Save connection metadata"}
              </button>
            </div>
          )}

          {connectError && (
            <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
              {connectError}
            </p>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">What this is used for</h3>
        </div>
        <div className="p-5">
          <ul className="list-disc space-y-2 pl-4 text-sm text-dash-ink">
            <li>Naming the engine, host, database and schema this project&apos;s plan is written against.</li>
            <li>Giving the rest of Plan a real fact to reference for the data layer, instead of a guess.</li>
            <li>Nothing here opens a live connection or stores a credential — this phase never reads real data.</li>
          </ul>
        </div>
      </div>

      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">Planned changes</h3>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted">
            Additive only — <strong>indexes</strong> and <strong>columns</strong>, never a table created or dropped.
          </p>

          <div className="mt-3 space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded-xl border border-border p-3 sm:grid-cols-[140px_1fr_1.4fr_auto]">
                <select
                  value={row.changeType}
                  disabled={!canEdit}
                  onChange={(e) => updateRow(i, "changeType", e.target.value)}
                  className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-dash-ink focus:outline-none disabled:bg-page"
                >
                  <option value="add_column">Add column</option>
                  <option value="add_index">Add index</option>
                </select>
                <input
                  value={row.tableName}
                  disabled={!canEdit}
                  onChange={(e) => updateRow(i, "tableName", e.target.value)}
                  placeholder="Table name"
                  className="rounded-lg border border-border px-2 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
                />
                <input
                  value={row.rationale}
                  disabled={!canEdit}
                  onChange={(e) => updateRow(i, "rationale", e.target.value)}
                  placeholder="Why"
                  className="rounded-lg border border-border px-2 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page"
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Remove change"
                    className="flex items-center justify-center rounded-[5px] border border-border p-2 text-muted transition-colors hover:bg-page hover:text-danger"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 rounded-[5px] border border-dashed border-border px-3 py-2 text-xs font-semibold text-muted transition-colors hover:border-brand-purple hover:text-brand-purple"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Add change
            </button>
          )}

          {canEdit && (
            <div className="mt-3 flex items-center justify-between gap-3">
              {changesHaveUnsavedEdits ? (
                <p className="text-xs font-medium text-amber-700">Unsaved changes — save before confirming.</p>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => void handleSaveChanges()}
                disabled={savingChanges}
                className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingChanges ? "Saving…" : "Save planned changes"}
              </button>
            </div>
          )}

          {changesError && (
            <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
              {changesError}
            </p>
          )}

          {!connection && changes.length === 0 && confirmation == null && (
            <p className="mt-4 rounded-xl border border-border bg-page px-3 py-2 text-xs text-muted">
              If this renewal doesn&apos;t use a database at all, you don&apos;t need to fill anything in above —
              confirm this section as-is to record <strong>No database required</strong>, rather than leaving it
              pending.
            </p>
          )}
          {!connection && changes.length === 0 && confirmation != null && (
            <p className="mt-4 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-3 py-2 text-xs text-dash-ink">
              Confirmed as <strong>No database required</strong> — this renewal doesn&apos;t use a database.
            </p>
          )}

          {confirmError && (
            <p role="alert" className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
              {confirmError}
            </p>
          )}

          <ConfirmationBar
            section="database"
            confirmation={confirmation}
            canConfirm={canConfirm}
            busy={confirmBusy}
            onConfirm={() => void handleConfirm()}
            onReopen={onReopen}
          />
        </div>
      </div>
    </div>
  );
}
