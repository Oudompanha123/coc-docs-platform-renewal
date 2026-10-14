import type { WorkspaceSummary } from "@/lib/mock/overview";
import { AVATAR_GRADIENTS } from "./tone";

const STATUS_DOT: Record<WorkspaceSummary["statusTone"], string> = {
  green: "bg-[#1f9d6b]",
  amber: "bg-[#e0873c]",
};

export function WorkspaceCard({ data }: { data: WorkspaceSummary }) {
  return (
    <div className="rounded-xl border border-surface-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{data.name}</p>
        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[data.statusTone]}`} aria-hidden="true" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {data.documentCount} documents · {data.memberCount} members
      </p>
      <div className="mt-3 flex -space-x-2">
        {data.members.map((member, i) => {
          const avatar = AVATAR_GRADIENTS[member.tone];
          return (
            <div
              key={`${data.id}-${member.initials}-${i}`}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold text-white ${avatar}`}
            >
              {member.initials}
            </div>
          );
        })}
      </div>
    </div>
  );
}
