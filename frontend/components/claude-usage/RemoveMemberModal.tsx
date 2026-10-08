"use client";

import { Modal } from "@/components/users-roles/Modal";
import type { ClaudeUsageMember } from "@/lib/admin/claudeUsage";

export function RemoveMemberModal({
  member,
  onClose,
  onConfirm,
}: {
  member: ClaudeUsageMember;
  onClose: () => void;
  onConfirm: (member: ClaudeUsageMember) => void;
}) {
  return (
    <Modal title="Disable usage tracking?" onClose={onClose}>
      <p className="text-sm text-muted">
        <span className="font-semibold text-dash-ink">{member.displayName}</span> will stop appearing in
        this dashboard&apos;s per-user usage and charts.
      </p>
      <p className="mt-3 rounded-[10px] bg-page px-3 py-2 text-xs text-muted">
        This only stops dashboard tracking. It doesn&apos;t revoke their Claude Code access, their
        account, or anything running on their own machine. You can enable them again at any time.
      </p>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-page"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(member)}
          className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger/90"
        >
          Disable
        </button>
      </div>
    </Modal>
  );
}
