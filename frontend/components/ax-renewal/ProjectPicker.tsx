"use client";

import { ConfirmDialog } from "@/components/ui/confirm";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { DocumentIcon, PlusIcon, TrashIcon } from "@/components/layout/icons";
import { ProjectSwitcher } from "@/components/ax-renewal/ProjectSwitcher";
import { createProject, deleteProject, updateProject, type AxRenewalProject } from "@/lib/ax-renewal/api";
import { writeSourcePathOverride } from "@/lib/ax-renewal/engine-preference";
import { inputBaseClass } from "@/components/ui/input";
import { textareaBaseClass } from "@/components/ui/textarea";

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
   * May delete — or rename (ADR-076) — the active project: role *and*
   * membership (ADR-069). Kept separate from `canEdit` because an Admin who
   * is not on a project can still start a new one of their own.
   */
  canDelete?: boolean;
  onSelect: (id: string) => void;
  onCreated: (project: AxRenewalProject) => void;
  /** Called once the project is actually gone server-side — the caller re-fetches the list and moves off it. */
  onDeleted: () => void;
  /** Called with the project as the server now has it, after a rename (ADR-076). */
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
    <div className="rounded-xl border border-surface-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="ax-project" className="text-xs font-semibold text-muted-foreground">
          Project
        </label>
        <ProjectSwitcher projects={projects} projectId={projectId} onSelect={onSelect} />

        {canEdit && !creating && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCreating(true)}
            className="text-muted-foreground"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New project
          </Button>
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
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{active.description}</p>
      )}

      {creating && (
        <form onSubmit={(e) => void handleCreate(e)} className="mt-3 flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            required
            className={inputBaseClass}
          />
          <Button
            type="submit"
            disabled={busy}
          >
            {busy ? "Creating…" : "Create"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCreating(false)}
          >
            Cancel
          </Button>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p>}
      {deletedMessage && (
        <Alert variant="success" className="mt-2">
          {deletedMessage}
        </Alert>
      )}
    </div>
  );
}

/**
 * A real popup, not the in-place panel this used to be — the same
 * `bg-black/40` overlay / `rounded-xl border-surface-border bg-card shadow-xl`
 * card and solid `bg-danger` confirm button `DeleteModal` (Users & Roles)
 * uses for its own irreversible delete, since this is that same class of
 * action: every finding, plan section, comment and implementation run this
 * project has go with it (ADR-051).
 */
function DeleteProjectControl({ project, onDeleted }: { project: AxRenewalProject; onDeleted: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await deleteProject(project.id);
      // The one thing this browser kept for the project on its own: the
      // source path typed into AI engine. Gone with it (ADR-072) — clearing
      // an empty value is exactly how that setting is removed.
      writeSourcePathOverride(project.id, "");
      // Close first: an open alert dialog hides the rest of the page from
      // assistive technology, and the success message lives out there.
      setBusy(false);
      setConfirming(false);
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        className="text-muted-foreground hover:bg-danger/10 hover:text-danger"
      >
        <TrashIcon className="h-3.5 w-3.5" />
        Delete project
      </Button>

      {/* An alert dialog (ADR-104 r2.16): Esc or Cancel backs out; an outside
          click doesn't, since it isn't an answer. Held open while deleting. */}
      {confirming && (
        <ConfirmDialog
          icon={<TrashIcon />}
          title="Delete project?"
          description={
            <>
              Delete &ldquo;{project.name}&rdquo;? Its findings, plan, comments, and implementation history all go with it —{" "}
              <strong className="font-semibold text-foreground">this can&rsquo;t be undone.</strong>
            </>
          }
          confirmLabel={busy ? "Deleting…" : "Yes, delete"}
          destructive
          busy={busy}
          error={error}
          onConfirm={() => void handleConfirm()}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

/**
 * Rename a project, or set its description (ADR-076). The same popup as
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        className="text-muted-foreground"
      >
        <DocumentIcon className="h-3.5 w-3.5" />
        Edit details
      </Button>

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
            className="w-full max-w-md rounded-xl border border-surface-border bg-card p-5 shadow-xl"
          >
            <h2 className="text-base font-semibold text-foreground">Edit project details</h2>

            <label htmlFor="ax-project-name" className="mt-4 block text-xs font-semibold text-muted-foreground">
              Name
            </label>
            <input
              id="ax-project-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`${inputBaseClass} mt-1 w-full`}
            />

            <label htmlFor="ax-project-description" className="mt-3 block text-xs font-semibold text-muted-foreground">
              Description <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="ax-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${textareaBaseClass} mt-1 w-full`}
            />

            {error && <p role="alert" className="mt-3 text-xs font-medium text-danger">{error}</p>}

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                aria-busy={busy}
              >
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
