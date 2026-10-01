"use client";

import { useEffect, useRef, useState } from "react";
import { DocumentIcon, PlusIcon, TrashIcon } from "@/components/layout/icons";
import { ProjectSwitcher } from "@/components/ax-renewal/ProjectSwitcher";
import { createProject, deleteProject, updateProject, type AxRenewalProject } from "@/lib/ax-renewal/api";
import { writeSourcePathOverride } from "@/lib/ax-renewal/engine-preference";

/** How long "Project deleted successfully" stays up before clearing itself — same window `TopProgressBar` uses for its own auto-hide. */
const DELETED_MESSAGE_MS = 4000;

/**
 * One picker, two placements — inside the landing card with no project open,
 * above the workspace as a switcher once one is (see `app/ax-renewal/page.tsx`).
 * Create and Delete are siblings here for the same reason: both are the
 * project's own lifecycle, not something any one Plan section owns.
 */
export function ProjectPicker({
  projects,
  projectId,
  canEdit,
  canDelete = canEdit,
  onSelect,
  onCreated,
  onDeleted,
  onUpdated = () => {},
}: {
  projects: AxRenewalProject[] | null;
  projectId: string | null;
  /** May create a project — a role question only, there is no project yet to be on. */
  canEdit: boolean;
  /**
   * May delete — or rename (ADR-075) — the active project: role *and*
   * membership (ADR-069). Kept separate from `canEdit` because an Admin who
   * is not on a project can still start a new one of their own.
   */
  canDelete?: boolean;
  onSelect: (id: string) => void;
  onCreated: (project: AxRenewalProject) => void;
  /** Called once the project is actually gone server-side — the caller re-fetches the list and moves off it. */
  onDeleted: () => void;
  /** Called with the project as the server now has it, after a rename (ADR-075). */
  onUpdated?: (project: AxRenewalProject) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedMessage, setDeletedMessage] = useState<string | null>(null);
  const deletedMessageTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = (projects ?? []).find((p) => p.id === projectId) ?? null;

  // Not held on DeleteProjectControl's own state: that component (and its
  // modal) unmounts the moment `active` goes away, which is the very next
  // render once the parent's `onDeleted` below has refreshed the list — a
  // message living there would vanish before anyone read it.
  useEffect(
    () => () => {
      if (deletedMessageTimeout.current) clearTimeout(deletedMessageTimeout.current);
    },
    [],
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createProject(name.trim(), null);
      onCreated(created);
      setName("");
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that project.");
    } finally {
      setBusy(false);
    }
  }

  function handleProjectDeleted() {
    setDeletedMessage("Project deleted successfully");
    if (deletedMessageTimeout.current) clearTimeout(deletedMessageTimeout.current);
    deletedMessageTimeout.current = setTimeout(() => setDeletedMessage(null), DELETED_MESSAGE_MS);
    onDeleted();
  }

  return (
    <div className="rounded-[10px] border border-border bg-page p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="ax-project" className="text-xs font-semibold text-muted">
          Project
        </label>
        <ProjectSwitcher projects={projects} projectId={projectId} onSelect={onSelect} />

        {canEdit && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-[10px] border border-transparent px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-purple/30 hover:text-brand-purple"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New project
          </button>
        )}

        {/* key={active.id}, not just a prop -- once a delete succeeds, the
            parent re-fetches the project list and clears the `project=`
            query param, which can land on a *different* remaining project
            rather than none at all. Without the key, React would keep
            reusing this same component instance for that new project,
            stale `busy`/`confirming` state and all: the popup would stay
            stuck showing "Deleting…" forever, now for the wrong project,
            with Cancel disabled right along with it. The key makes "which
            project is active" changing look like an unmount+remount to
            React, which resets that state the same way it already resets
            cleanly when active becomes null entirely. */}
        {canDelete && active && (
          <EditProjectDetailsControl key={`edit-${active.id}`} project={active} onUpdated={onUpdated} />
        )}
        {canDelete && active && (
          <DeleteProjectControl key={active.id} project={active} onDeleted={handleProjectDeleted} />
        )}
      </div>

      {active?.description && (
        <p className="mt-2 text-xs leading-relaxed text-muted">{active.description}</p>
      )}

      {creating && (
        <form onSubmit={(e) => void handleCreate(e)} className="mt-3 flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            required
            className="rounded-xl border border-border px-3 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-[10px] bg-gradient-to-r from-brand-purple to-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="rounded-[10px] border border-border px-3.5 py-1.5 text-xs font-semibold text-dash-ink hover:bg-page"
          >
            Cancel
          </button>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p>}
      {deletedMessage && (
        <p
          role="status"
          className="mt-2 rounded-r-md border-l-4 border-emerald-500 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
        >
          {deletedMessage}
        </p>
      )}
    </div>
  );
}

/**
 * A real popup, not the in-place panel this used to be — the same
 * `bg-black/40` overlay / `rounded-[10px] border-border bg-white shadow-xl`
 * card and solid `bg-danger` confirm button `DeleteModal` (Users & Roles)
 * uses for its own irreversible delete, since this is that same class of
 * action: every finding, plan section, comment and implementation run this
 * project has go with it (ADR-051).
 */
function DeleteProjectControl({ project, onDeleted }: { project: AxRenewalProject; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!confirming) return;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirming]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteProject(project.id);
      // The one thing this browser kept for the project on its own: the
      // source path typed into AI engine. Gone with it (ADR-072) — clearing
      // an empty value is exactly how that setting is removed.
      writeSourcePathOverride(project.id, "");
      // This component (and this modal) is about to unmount as a direct
      // consequence — `onDeleted` refreshes the project list one level up,
      // which is what makes `active` in the parent stop matching this
      // project. Nothing after this line touches this component's state.
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this project.");
      setBusy(false);
    }
  }

  function handleCancel() {
    if (busy) return;
    setConfirming(false);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 rounded-[10px] border border-transparent px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-danger/30 hover:text-danger"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        Delete project
      </button>

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete project"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleCancel}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[10px] border border-border bg-white p-5 shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
              <TrashIcon className="h-6 w-6" />
            </div>
            <h2 className="mt-3 text-lg font-bold text-dash-ink">Delete project?</h2>
            <p className="mt-2 text-sm text-muted">
              Delete &ldquo;{project.name}&rdquo;? Its findings, plan, comments, and implementation history all go
              with it — <strong className="font-semibold text-dash-ink">this can&rsquo;t be undone.</strong>
            </p>

            {error && <p role="alert" className="mt-3 text-xs font-medium text-danger">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={busy}
                aria-busy={busy}
                className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Rename a project, or set its description (ADR-075). The same popup as
 * {@link DeleteProjectControl} — overlay, card, Escape or a click outside
 * backs out — and keyed by project in the parent for the same reason: a
 * half-typed name must never carry over to the next project that becomes
 * active.
 */
function EditProjectDetailsControl({
  project,
  onUpdated,
}: {
  project: AxRenewalProject;
  onUpdated: (project: AxRenewalProject) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function handleOpen() {
    // Start from the project as it is now, not from an earlier abandoned edit.
    setName(project.name);
    setDescription(project.description ?? "");
    setError(null);
    setEditing(true);
  }

  function handleCancel() {
    if (busy) return;
    setEditing(false);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("A project needs a name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateProject(project.id, name.trim(), description.trim() || null);
      onUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the project's details.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-[10px] border border-transparent px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-purple/30 hover:text-brand-purple"
      >
        <DocumentIcon className="h-3.5 w-3.5" />
        Edit details
      </button>

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit project details"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={handleCancel}
        >
          <form
            onSubmit={(e) => void handleSave(e)}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[10px] border border-border bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-bold text-dash-ink">Edit project details</h2>

            <label htmlFor="ax-project-name" className="mt-4 block text-xs font-semibold text-muted">
              Name
            </label>
            <input
              id="ax-project-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-border px-3 py-1.5 text-sm text-dash-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
            />

            <label htmlFor="ax-project-description" className="mt-3 block text-xs font-semibold text-muted">
              Description <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="ax-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-border px-3 py-1.5 text-sm text-dash-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
            />

            {error && <p role="alert" className="mt-3 text-xs font-medium text-danger">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={busy}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
