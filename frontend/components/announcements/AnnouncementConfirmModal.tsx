"use client";

import { Modal } from "@/components/users-roles/Modal";
import { Spinner } from "@/components/layout/Spinner";

export type AnnouncementAction = "publish" | "unpublish" | "delete";

const COPY: Record<AnnouncementAction, { title: string; body: string; confirm: string; danger: boolean }> = {
  publish: {
    title: "Publish announcement?",
    body: "Every active member will see it on the user site and get a notification in their bell.",
    confirm: "Publish",
    danger: false,
  },
  unpublish: {
    title: "Unpublish announcement?",
    body: "It disappears from the user site and from everyone's notification bell. You can publish it again later.",
    confirm: "Unpublish",
    danger: false,
  },
  delete: {
    title: "Delete announcement?",
    body: "It is removed for good, including from everyone's notification bell. This cannot be undone — unpublish it instead if you might want it back.",
    confirm: "Delete",
    danger: true,
  },
};

/**
 * One confirmation for the three list actions that change what readers see
 * (ADR-098). Each says plainly what happens to the bell, since that is the
 * part an admin cannot see from the admin page.
 */
export function AnnouncementConfirmModal({
  action,
  title,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  action: AnnouncementAction;
  /** The announcement's title, quoted so a misaimed click shows the wrong row. */
  title: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const copy = COPY[action];
  return (
    <Modal title={copy.title} onClose={busy ? () => {} : onClose}>
      <p className="rounded-xl border border-surface-border bg-muted-surface px-3 py-2.5 text-sm font-semibold text-foreground">
        {title}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{copy.body}</p>
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-control border border-surface-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${
            copy.danger ? "bg-danger" : "bg-primary"
          }`}
        >
          {busy && <Spinner />}
          {copy.confirm}
        </button>
      </div>
    </Modal>
  );
}
