import { avatarSrc } from "@/lib/account/avatarSrc";
import { useState } from "react";
import { CheckCircleIcon, RingIcon } from "@/components/layout/icons";
import type { ActivityEntry } from "@/lib/docs/activity-api";
import { formatActivityEntry, formatRelativeTime, toneForEmail, type ActivityStatus } from "@/lib/docs/activity-format";
import { TONE_STYLES } from "./tone";

const STATUS_STYLE: Record<ActivityStatus, { icon: typeof CheckCircleIcon; className: string }> = {
  signIn: { icon: CheckCircleIcon, className: "text-emerald-600 dark:text-emerald-400" },
  signOut: { icon: RingIcon, className: "text-amber-600 dark:text-amber-400" },
  roleChange: { icon: CheckCircleIcon, className: "text-sky-600 dark:text-sky-400" },
  other: { icon: RingIcon, className: "text-muted-foreground" },
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
        src={avatarSrc(avatarUrl) ?? undefined}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${tone.bg} ${tone.fg}`}
    >
      {email.charAt(0).toUpperCase()}
    </div>
  );
}

export function ActivityRow({ data }: { data: ActivityEntry }) {
  const { description, status } = formatActivityEntry(data);
  const StatusIcon = STATUS_STYLE[status].icon;

  return (
    // Two lines, not three (ADR-104 r2.10): what happened, then who and when.
    // The actor's email used to lead the row in bold, above the event itself —
    // the least interesting fact on the line was the loudest.
    <div className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-accent">
      <ActorAvatar email={data.actorEmail} avatarUrl={data.actorAvatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{description}</p>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <StatusIcon aria-hidden="true" className={`size-3.5 shrink-0 ${STATUS_STYLE[status].className}`} />
          <span className="truncate">{data.actorEmail}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0 whitespace-nowrap">{formatRelativeTime(data.occurredAt)}</span>
        </p>
      </div>
    </div>
  );
}
