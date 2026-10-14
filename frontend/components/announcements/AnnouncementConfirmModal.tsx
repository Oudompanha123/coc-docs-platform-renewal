"use client";

import { ConfirmDialog } from "@/components/ui/confirm";

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
 * part an admin cannot see from the admin page. An alert dialog (ADR-104
 * r2.16): held open while the request runs, its error shown inside it.
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
    <ConfirmDialog
      title={copy.title}
      description={copy.body}
      confirmLabel={copy.confirm}
      destructive={copy.danger}
      busy={busy}
      error={error}
      onConfirm={onConfirm}
      onCancel={onClose}
    >
      <p className="rounded-xl border border-surface-border bg-muted-surface px-3 py-2.5 text-sm font-semibold text-foreground">{title}</p>
    </ConfirmDialog>
  );
}
