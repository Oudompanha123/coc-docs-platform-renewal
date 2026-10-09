"use client";

import { Modal, ModalFooter } from "@/components/users-roles/Modal";
import { Spinner } from "@/components/layout/Spinner";
import { Button } from "@/components/ui/button";

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
      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        {/* The Button primitive, not hand-written: its `text-white` on
            `bg-primary` drew white-on-white in dark mode, where the primary
            turns near-white. */}
        <Button type="button" variant={copy.danger ? "destructive" : "default"} onClick={onConfirm} disabled={busy}>
          {busy && <Spinner />}
          {copy.confirm}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
