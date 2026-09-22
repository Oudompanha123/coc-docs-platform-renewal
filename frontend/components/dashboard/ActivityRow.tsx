import { useState } from "react";
import { CheckCircleIcon, RingIcon } from "@/components/layout/icons";
import type { ActivityEntry } from "@/lib/docs/activity-api";
import { formatActivityEntry, formatRelativeTime, toneForEmail, type ActivityStatus } from "@/lib/docs/activity-format";
import { TONE_STYLES } from "./tone";

const STATUS_STYLE: Record<ActivityStatus, { icon: typeof CheckCircleIcon; className: string }> = {
  signIn: { icon: CheckCircleIcon, className: "text-[#1f9d6b]" },
  signOut: { icon: RingIcon, className: "text-[#e0873c]" },
  roleChange: { icon: CheckCircleIcon, className: "text-[#3b6fe0]" },
  other: { icon: RingIcon, className: "text-muted" },
};

/**
 * A real picture when the actor has one, the same coloured-initial-letter
 * bubble as before otherwise — the same fallback shape Topbar's own
 * `ActivityAvatar` already uses for this same `audit_log`-backed data, just
 * never wired up here (`ApiDtos.ActivityEntryResponse` dropped `actorAvatarUrl`
 * on the way out until now).
 */
function ActorAvatar({ email, avatarUrl }: { email: string; avatarUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const tone = TONE_STYLES[toneForEmail(email)];

  if (avatarUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${tone.bg} ${tone.fg}`}
    >
      {email.charAt(0).toUpperCase()}
    </div>
  );
}

export function ActivityRow({ data }: { data: ActivityEntry }) {
  const { description, status } = formatActivityEntry(data);
  const StatusIcon = STATUS_STYLE[status].icon;

  return (
    <div className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-3 transition-colors duration-150 hover:bg-page">
      <ActorAvatar email={data.actorEmail} avatarUrl={data.actorAvatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-dash-ink">{data.actorEmail}</p>
        <p className="text-sm text-dash-ink/80">{description}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${STATUS_STYLE[status].className}`} />
          {formatRelativeTime(data.occurredAt)}
        </p>
      </div>
    </div>
  );
}
