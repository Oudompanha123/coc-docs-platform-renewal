"use client";

import { avatarSrc } from "@/lib/account/avatarSrc";
import { useState } from "react";

/**
 * An applicant's face, or their initials.
 *
 * <p>Google sign-in brings a picture; a password registration does not, and
 * there is nowhere honest to get one. Initials on the brand gradient rather
 * than a generic silhouette: a stand-in face among real people reads as a real
 * person you do not recognise, while initials are obviously a placeholder and
 * still say who it is.
 *
 * <p><b>A broken image falls back to the same initials.</b> Google avatar URLs
 * expire, are rate-limited, and are blocked outright by some networks and
 * extensions. Without this the row shows the browser's broken-image glyph,
 * which looks like the application is broken rather than like a picture that
 * did not load.
 */
export function ApplicantAvatar({
  name,
  avatarUrl,
  className = "h-9 w-9 text-xs",
}: {
  name: string;
  avatarUrl: string | null;
  /** Size and text size; the shape and colours are fixed. */
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  if (avatarUrl && !failed) {
    return (
      // A plain <img>: next/image wants every avatar host configured up front,
      // and these come from whichever provider the person used.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarSrc(avatarUrl) ?? undefined}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        referrerPolicy="no-referrer"
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue font-semibold text-white`}
    >
      {initials}
    </span>
  );
}
