/**
 * The picture shown for someone who has none — a password registration has no
 * identity provider to take one from, and a Google picture can stop loading.
 * A neutral person silhouette on a soft brand tint: plainly a placeholder, not
 * anybody's face.
 */
export function DefaultAvatar({ className = "h-11 w-11", label }: { className?: string; label?: string }) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-secondary to-secondary ring-1 ring-ring/20 ${className}`}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
        <circle cx="20" cy="15.5" r="6.5" className="fill-brand-purple/45" />
        <path d="M7.5 36c1.4-7 6.5-11 12.5-11s11.1 4 12.5 11" className="fill-brand-purple/45" />
      </svg>
    </span>
  );
}
