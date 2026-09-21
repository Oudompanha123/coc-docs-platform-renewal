/** The app's one spinner design — a bordered ring with Tailwind's
 *  `animate-spin` — extracted from the login page's full-panel "redirecting"
 *  indicator so button-level busy states (Login, Logout, nav links) can
 *  reuse the same look instead of a second design. Colored via `currentColor`
 *  (`border-current`) so it reads correctly in white-on-gradient buttons and
 *  plain-text contexts alike — wrap it in a text-color class to tint it. */
export function Spinner({ className = "h-4 w-4 border-2" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 animate-spin rounded-full border-current/25 border-t-current ${className}`}
    />
  );
}
