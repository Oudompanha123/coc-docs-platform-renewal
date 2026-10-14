"use client";

import { ConfirmDialog } from "@/components/ui/confirm";
import type { ClaudeUsageMember } from "@/lib/admin/claudeUsage";

/** Confirms turning off usage tracking for one member — an alert dialog (ADR-104 r2.16). */
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
    <ConfirmDialog
      title="Disable usage tracking?"
      description={
        <>
          <span className="font-medium text-foreground">{member.displayName}</span> will stop being tracked. Their
          reporter&apos;s usage uploads, scan check-ins and scan logs will be refused, and they will be hidden from this
          dashboard — the per-user table, the chart, token and cost totals, Active Users and Near Limit. They move to{" "}
          <span className="font-medium text-foreground">Disabled members</span> at the bottom of the page.
        </>
      }
      confirmLabel="Disable"
      destructive
      onConfirm={() => onConfirm(member)}
      onCancel={onClose}
    >
      <ul className="list-disc space-y-1 rounded-lg bg-muted-surface py-2 pl-7 pr-3 text-xs text-muted-foreground">
        <li>Usage collected before now is kept. Nothing is deleted.</li>
        <li>Usage from while they are disabled is not recorded — not even after you enable them again.</li>
        <li>A new report never enables them again — only an admin can.</li>
        <li>It doesn&apos;t revoke their Claude Code access or their account. Their reporter will show that tracking is disabled.</li>
        <li>Enable them any time to show their earlier history again. New usage is recorded from the day after you enable them.</li>
      </ul>
    </ConfirmDialog>
  );
}
