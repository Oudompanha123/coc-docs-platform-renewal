"use client";

import { avatarSrc } from "@/lib/account/avatarSrc";
import { useState, type ReactNode } from "react";

/**
 * The signed-in user's picture, falling back to their initials.
 *
 * <p>Three states, not two. There is the picture, the initials when no
 * picture exists — a password-registered account has no identity provider to
 * get one from — and the initials again when a picture was supplied but will
 * not load. That third case is the one worth handling: Google's avatar URLs
 * expire and get rotated, so a stored URL that worked at sign-in can be a
 * broken image a week later, and a broken image in a header looks like a bug
 * in the page rather than a stale link.
 *
 * <p>A plain `img`, not `next/image`. The host is whatever the identity
 * provider chose, so it cannot be declared in `next.config.ts` ahead of time,
 * and optimising someone else's 96px avatar through our own server buys
 * nothing.
 *
 * <p>`referrerPolicy="no-referrer"` because Google serves avatars from
 * lh3.googleusercontent.com and rejects some requests that carry a referrer,
 * which shows up as an avatar that loads for you and not for a colleague.
 *
 * <p>`fallback` replaces the initials, for a caller that wants a default
 * picture instead (the Pending queue's {@code DefaultAvatar}). It is shown in
 * both no-picture states: none supplied, and one that would not load.
 */
export function UserAvatar({
  avatarUrl,
  initials,
  name,
  className = "",
  style,
  fallback,
}: {
  avatarUrl: string | null;
  initials: string;
  name: string;
  /** Gradient and sizing classes from the caller, so the shape stays theirs. */
  className?: string;
  /**
   * Inline style for the initials fallback only — for a caller like the
   * Users & Roles table that assigns each row a distinct solid color at
   * runtime, which a static Tailwind class can't express.
   */
  style?: React.CSSProperties;
  /** Shown instead of the initials when there is no usable picture. */
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (avatarUrl && !failed) {
    // A plain img: the host is whichever one the identity provider picked, so
    // it cannot be declared in next.config.ts ahead of time, and routing
    // someone else's 96px avatar through our optimiser buys nothing.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarSrc(avatarUrl) ?? undefined}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  if (fallback) return <>{fallback}</>;

  return (
    <span
      // aria-hidden: the initials are a decorative stand-in for a picture, and
      // the accessible name is already on the control that contains this.
      aria-hidden="true"
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${className}`}
    >
      {initials}
    </span>
  );
}
