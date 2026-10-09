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
        <span className="font-semibold text-dash-ink">{member.displayName}</span> will stop being tracked.
        Their reporter&apos;s usage uploads, scan check-ins and scan logs will be refused, and they will be
        hidden from this dashboard — the per-user table, the chart, token and cost totals, Active Users and
        Near Limit. They move to <span className="font-semibold text-dash-ink">Disabled members</span> at the
        bottom of the page.
      </p>
      <ul className="mt-3 list-disc space-y-1 rounded-[10px] bg-page py-2 pl-7 pr-3 text-xs text-muted">
        <li>Usage collected before now is kept. Nothing is deleted.</li>
        <li>Usage from while they are disabled is not recorded — not even after you enable them again.</li>
        <li>A new report never enables them again — only an admin can.</li>
        <li>
          It doesn&apos;t revoke their Claude Code access or their account. Their reporter will show that
          tracking is disabled.
        </li>
        <li>
          Enable them any time to show their earlier history again. New usage is recorded from the day after
          you enable them.
        </li>
      </ul>

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
