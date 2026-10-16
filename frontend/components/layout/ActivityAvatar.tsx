"use client";

import { useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { avatarSrc } from "@/lib/account/avatarSrc";
import { actorInitials } from "@/lib/notify/activity";
import type { ActivityItem } from "@/lib/notify/useActivityFeed";

const AVATAR_TONES = ["purple", "green", "orange", "pink"] as const;

/**
 * A stable avatar colour for one person.
 *
 * Derived from the address rather than the list position, so somebody keeps
 * the same colour as items arrive and push them down the feed — a bubble that
 * changes colour on every poll reads as a different person. The hash only has
 * to be deterministic and spread four ways; it is not security-relevant.
 */
function toneFor(actorEmail: string | null): (typeof AVATAR_TONES)[number] {
  if (!actorEmail) return "pink";
  let hash = 0;
  for (let i = 0; i < actorEmail.length; i++) {
    hash = (hash * 31 + actorEmail.charCodeAt(i)) | 0;
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]!;
}

/**
 * The Activity row's own avatar — a real picture when the actor has one,
 * the same per-actor coloured-initials bubble as before otherwise.
 *
 * <p>Not {@link ApplicantAvatar}: that component's fallback is a fixed
 * brand-gradient bubble, which would flatten every actor without a picture
 * to the same look and lose the reason {@link toneFor} exists — telling
 * several people in the same short list apart at a glance. This keeps that
 * fallback and only adds the picture on top of it.
 *
 * <p>Shared by the admin Topbar and the member-facing home header so both
 * activity feeds show the same thing for the same row.
 */
export function ActivityAvatar({ item }: { item: ActivityItem }) {
  const [failed, setFailed] = useState(false);

  if (item.actorAvatarUrl && !failed) {
    return (
      // A plain <img>, same reasoning ApplicantAvatar gives: next/image wants
      // every host configured up front, and this can be whichever identity
      // provider the actor signed in with.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarSrc(item.actorAvatarUrl) ?? undefined}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
        className="h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_GRADIENTS[toneFor(item.actorEmail)]}`}
    >
      {actorInitials(item)}
    </span>
  );
}
